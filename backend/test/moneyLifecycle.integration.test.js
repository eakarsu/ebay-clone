const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, before, beforeEach, test } = require('node:test');
const { Pool } = require('pg');
const { createMoneyService, LifecycleError } = require('../src/services/moneyLifecycle');
const { consumeInventory } = require('../src/services/inventoryLifecycle');
const { dispatchBatch } = require('../src/services/outboxDispatcher');

const connectionString = process.env.TEST_DATABASE_URL;
const integration = connectionString ? test : test.skip;
const pool = connectionString ? new Pool({ connectionString }) : null;

const fixture = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), email TEXT, stripe_account_id TEXT);
CREATE TABLE products (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), seller_id UUID REFERENCES users(id), quantity INTEGER NOT NULL, quantity_sold INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'active', updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE orders (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), order_number TEXT UNIQUE NOT NULL, buyer_id UUID NOT NULL REFERENCES users(id), seller_id UUID NOT NULL REFERENCES users(id),
 total NUMERIC(12,2) NOT NULL, payment_status VARCHAR(30) DEFAULT 'pending', status VARCHAR(30) DEFAULT 'confirmed', stripe_payment_intent_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(),
 CONSTRAINT orders_payment_status_check CHECK(payment_status IN ('pending','processing','completed','failed','refunded'))
);
CREATE TABLE order_items (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),order_id UUID NOT NULL REFERENCES orders(id),product_id UUID NOT NULL REFERENCES products(id),quantity INTEGER NOT NULL,unit_price NUMERIC(12,2),total_price NUMERIC(12,2));
CREATE TABLE returns (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),order_id UUID NOT NULL REFERENCES orders(id),order_item_id UUID REFERENCES order_items(id),buyer_id UUID NOT NULL REFERENCES users(id),seller_id UUID NOT NULL REFERENCES users(id),status TEXT NOT NULL,refund_amount NUMERIC(12,2),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE payment_transactions (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),order_id UUID NOT NULL REFERENCES orders(id),user_id UUID NOT NULL REFERENCES users(id),stripe_payment_intent_id TEXT,stripe_charge_id TEXT,amount NUMERIC(12,2) NOT NULL,status TEXT NOT NULL,refund_amount NUMERIC(12,2) DEFAULT 0,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE seller_payouts (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),order_id UUID UNIQUE NOT NULL REFERENCES orders(id),seller_id UUID NOT NULL REFERENCES users(id),stripe_transfer_id TEXT NOT NULL,gross_amount NUMERIC(12,2),platform_fee NUMERIC(12,2),net_amount NUMERIC(12,2),status TEXT NOT NULL,created_at TIMESTAMPTZ DEFAULT NOW(),updated_at TIMESTAMPTZ DEFAULT NOW());
`;

async function resetSchema() {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await pool.query(fixture);
  const migration = fs.readFileSync(path.resolve(__dirname, '../../database/migrations/20260719_money_lifecycle.sql'), 'utf8');
  await pool.query(migration);
}

async function marketplaceFixture({ quantitySold = 1, paymentStatus = 'processing', transactionStatus = 'pending' } = {}) {
  const buyer = (await pool.query("INSERT INTO users(email) VALUES('buyer@test') RETURNING id")).rows[0].id;
  const seller = (await pool.query("INSERT INTO users(email) VALUES('seller@test') RETURNING id")).rows[0].id;
  const product = (await pool.query('INSERT INTO products(seller_id,quantity,quantity_sold,status) VALUES($1,1,$2,$3) RETURNING id', [seller, quantitySold, quantitySold ? 'sold' : 'active'])).rows[0].id;
  const order = (await pool.query("INSERT INTO orders(order_number,buyer_id,seller_id,total,payment_status,stripe_payment_intent_id) VALUES('ORDER-1',$1,$2,100,$3,'pi_1') RETURNING id", [buyer, seller, paymentStatus])).rows[0].id;
  const item = (await pool.query('INSERT INTO order_items(order_id,product_id,quantity,unit_price,total_price) VALUES($1,$2,1,100,100) RETURNING id', [order, product])).rows[0].id;
  await pool.query("INSERT INTO payment_transactions(order_id,user_id,stripe_payment_intent_id,stripe_charge_id,amount,status) VALUES($1,$2,'pi_1','ch_1',100,$3)", [order, buyer, transactionStatus]);
  return { buyer, seller, product, order, item };
}

if (connectionString) {
  before(async () => resetSchema());
  beforeEach(async () => {
    await pool.query('TRUNCATE reconciliation_issues,accounting_ledger,order_lifecycle_events,marketplace_outbox,provider_webhook_inbox,payment_operations,seller_payouts,payment_transactions,returns,order_items,orders,products,users RESTART IDENTITY CASCADE');
  });
  after(async () => pool.end());
}

integration('guarded inventory consumption prevents concurrent overselling', async () => {
  const seller = (await pool.query("INSERT INTO users(email) VALUES('seller@test') RETURNING id")).rows[0].id;
  const product = (await pool.query("INSERT INTO products(seller_id,quantity) VALUES($1,1) RETURNING id", [seller])).rows[0].id;
  const attempts = await Promise.allSettled([1, 2].map(async () => {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const row = await consumeInventory(client, product, 1); await client.query('COMMIT'); return row; }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }));
  assert.equal(attempts.filter((x) => x.status === 'fulfilled').length, 1);
  assert.equal(attempts.filter((x) => x.status === 'rejected').length, 1);
  assert.deepEqual((await pool.query('SELECT quantity_sold,status FROM products WHERE id=$1', [product])).rows[0], { quantity_sold: 1, status: 'sold' });
});

integration('duplicate failed webhooks release reserved inventory exactly once', async () => {
  const row = await marketplaceFixture();
  const service = createMoneyService({ pool, provider: {} });
  const event = { id: 'evt_failed_1', type: 'payment_intent.payment_failed', created: 1, data: { object: { id: 'pi_1', metadata: { orderId: row.order } } } };
  const first = await service.acceptWebhook(event);
  const duplicate = await service.acceptWebhook(event);
  assert.equal(first.duplicate, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal((await pool.query('SELECT quantity_sold FROM products WHERE id=$1', [row.product])).rows[0].quantity_sold, 0);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM provider_webhook_inbox')).rows[0].count, 1);
});

integration('a late successful payment after inventory release is held for reconciliation', async () => {
  const row = await marketplaceFixture();
  const service = createMoneyService({ pool, provider: {} });
  await service.acceptWebhook({ id: 'evt_failed_2', type: 'payment_intent.payment_failed', data: { object: { id: 'pi_1', metadata: { orderId: row.order } } } });
  await service.acceptWebhook({ id: 'evt_success_late', type: 'payment_intent.succeeded', data: { object: { id: 'pi_1', metadata: { orderId: row.order } } } });
  const order = (await pool.query('SELECT payment_status,payout_status FROM orders WHERE id=$1', [row.order])).rows[0];
  assert.deepEqual(order, { payment_status: 'completed', payout_status: 'held' });
  assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM reconciliation_issues WHERE issue_type='paid_after_inventory_release'")).rows[0].count, 1);
});

integration('partial refund is provider-idempotent and creates append-only accounting', async () => {
  const row = await marketplaceFixture({ paymentStatus: 'completed', transactionStatus: 'succeeded' });
  const returnId = (await pool.query("INSERT INTO returns(order_id,order_item_id,buyer_id,seller_id,status,refund_amount) VALUES($1,$2,$3,$4,'received',40) RETURNING id", [row.order, row.item, row.buyer, row.seller])).rows[0].id;
  let providerCalls = 0;
  const service = createMoneyService({ pool, provider: { createRefund: async () => { providerCalls += 1; return { id: 're_1', status: 'succeeded', amount: 4000 }; } } });
  const args = { returnId, actor: { id: row.seller, is_admin: false }, requestedAmount: 40, idempotencyKey: 'return-refund-order-1' };
  const first = await service.requestRefund(args);
  const duplicate = await service.requestRefund(args);
  assert.equal(first.state, 'applied');
  assert.equal(duplicate.state, 'applied');
  assert.equal(providerCalls, 1);
  assert.equal((await pool.query('SELECT payment_status FROM orders WHERE id=$1', [row.order])).rows[0].payment_status, 'partially_refunded');
  assert.deepEqual((await pool.query('SELECT quantity_sold,status FROM products WHERE id=$1', [row.product])).rows[0], { quantity_sold: 0, status: 'active' });
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM accounting_ledger')).rows[0].count, 4);
  await assert.rejects(pool.query("UPDATE accounting_ledger SET amount_cents=0"), /append-only/);
});

integration('failed provider refund is durable and retryable without changing return state early', async () => {
  const row = await marketplaceFixture({ paymentStatus: 'completed', transactionStatus: 'succeeded' });
  const returnId = (await pool.query("INSERT INTO returns(order_id,order_item_id,buyer_id,seller_id,status,refund_amount) VALUES($1,$2,$3,$4,'received',100) RETURNING id", [row.order, row.item, row.buyer, row.seller])).rows[0].id;
  let attempts = 0;
  const provider = { createRefund: async () => { attempts += 1; if (attempts === 1) throw new Error('provider unavailable'); return { id: 're_retry', status: 'succeeded', amount: 10000 }; } };
  const service = createMoneyService({ pool, provider });
  await assert.rejects(service.requestRefund({ returnId, actor: { id: row.seller }, idempotencyKey: 'refund-retry-order-1' }), LifecycleError);
  const operation = (await pool.query("SELECT * FROM payment_operations WHERE idempotency_key='refund-retry-order-1'")).rows[0];
  assert.equal(operation.state, 'retryable_failure');
  assert.equal((await pool.query('SELECT status FROM returns WHERE id=$1', [returnId])).rows[0].status, 'received');
  const recovered = await service.retryOperation(operation.id);
  assert.equal(recovered.state, 'applied');
  assert.equal((await pool.query('SELECT payment_status FROM orders WHERE id=$1', [row.order])).rows[0].payment_status, 'refunded');
});

integration('chargebacks hold payout and create a critical reconciliation issue', async () => {
  const row = await marketplaceFixture({ paymentStatus: 'completed', transactionStatus: 'succeeded' });
  const service = createMoneyService({ pool, provider: {} });
  await service.acceptWebhook({ id: 'evt_dispute_1', type: 'charge.dispute.created', data: { object: { id: 'dp_1', payment_intent: 'pi_1', amount: 10000 } } });
  assert.deepEqual((await pool.query('SELECT payment_status,payout_status FROM orders WHERE id=$1', [row.order])).rows[0], { payment_status: 'chargeback', payout_status: 'held' });
  assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM reconciliation_issues WHERE issue_type='chargeback_received' AND severity='critical'")).rows[0].count, 1);
});

integration('poison webhooks dead-letter after five auditable replay attempts', async () => {
  const service = createMoneyService({ pool, provider: {} });
  const first = await service.acceptWebhook({ id: 'evt_poison_1', type: 'payment_intent.succeeded', data: { object: { id: 'pi_missing_metadata', metadata: {} } } });
  let webhook = first;
  for (let attempt = 1; attempt < 5; attempt += 1) webhook = await service.replayWebhook(webhook.id);
  assert.equal(webhook.state, 'dead_letter');
  assert.equal(webhook.attempts, 5);
  assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM reconciliation_issues WHERE issue_type='webhook_dead_letter'")).rows[0].count, 1);
});

integration('outbox dispatcher publishes each claimed event once', async () => {
  const row = await marketplaceFixture({ paymentStatus: 'completed', transactionStatus: 'succeeded' });
  await pool.query("INSERT INTO marketplace_outbox(aggregate_type,aggregate_id,event_type,idempotency_key,payload) VALUES('order',$1,'order.test','test:outbox',$2)", [row.order, { orderId: row.order }]);
  const published = [];
  assert.equal(await dispatchBatch({ pool, publish: async (event) => published.push(event) }), 1);
  assert.equal(await dispatchBatch({ pool, publish: async (event) => published.push(event) }), 0);
  assert.equal(published.length, 1);
  assert.equal((await pool.query('SELECT state FROM marketplace_outbox')).rows[0].state, 'published');
});
