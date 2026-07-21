const crypto = require('node:crypto');
const defaultProvider = require('./stripeProvider');
const { releaseOrderInventory, restockReturnInventory } = require('./inventoryLifecycle');

class LifecycleError extends Error { constructor(message, status = 400, details) { super(message); this.status = status; this.details = details; } }
const cents = (value) => Math.round(Number(value) * 100);
const jsonDigest = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

function createMoneyService({ pool, provider = defaultProvider, platformFeeRate = Number(process.env.PLATFORM_FEE_RATE || 0.10) }) {
  async function transaction(work) {
    const client = await pool.connect();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
  async function lifecycleEvent(client, { orderId, operationId = null, source, sourceEventId = null, eventType, fromState = null, toState = null, amountCents = null, detail = {} }) {
    await client.query(
      `INSERT INTO order_lifecycle_events(order_id,operation_id,source,source_event_id,event_type,from_state,to_state,amount_cents,detail)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(source,source_event_id,event_type) DO NOTHING`,
      [orderId, operationId, source, sourceEventId, eventType, fromState, toState, amountCents, detail],
    );
  }
  async function outbox(client, { orderId, eventType, key, payload }) {
    await client.query(
      `INSERT INTO marketplace_outbox(aggregate_type,aggregate_id,event_type,idempotency_key,payload)
       VALUES('order',$1,$2,$3,$4) ON CONFLICT(idempotency_key) DO NOTHING`, [orderId, eventType, key, payload],
    );
  }
  async function prepareRefund({ returnId, actor, requestedAmount, idempotencyKey }) {
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 180) throw new LifecycleError('A stable idempotency key is required', 400);
    return transaction(async (client) => {
      const existing = (await client.query('SELECT * FROM payment_operations WHERE idempotency_key=$1 FOR UPDATE', [idempotencyKey])).rows[0];
      if (existing) {
        if (existing.return_id !== returnId || (requestedAmount != null && Number(existing.requested_amount_cents) !== cents(requestedAmount))) {
          throw new LifecycleError('Idempotency key conflicts with an earlier refund request', 409);
        }
        return existing;
      }
      const row = (await client.query(
        `SELECT r.*,o.total,o.payment_status,o.stripe_payment_intent_id,o.seller_id,
                pt.stripe_charge_id,pt.amount AS paid_amount,COALESCE(pt.refund_amount,0) AS already_refunded
         FROM returns r JOIN orders o ON o.id=r.order_id
         JOIN payment_transactions pt ON pt.order_id=o.id AND pt.status IN ('succeeded','partially_refunded','refunded')
         WHERE r.id=$1 FOR UPDATE OF r,o,pt`, [returnId],
      )).rows[0];
      if (!row) throw new LifecycleError('Return or settled payment not found', 404);
      if (!actor.is_admin && row.seller_id !== actor.id) throw new LifecycleError('Not authorized to refund this return', 403);
      if (row.status !== 'received') throw new LifecycleError('Item must be received before refund', 409);
      const paid = cents(row.paid_amount);
      const already = cents(row.already_refunded);
      const requested = requestedAmount == null ? cents(row.refund_amount || row.paid_amount) : cents(requestedAmount);
      if (requested <= 0 || requested > paid - already) throw new LifecycleError('Refund exceeds the remaining settled amount', 422, { remainingAmountCents: paid - already });
      const platform = Math.round(requested * platformFeeRate);
      const seller = requested - platform;
      return (await client.query(
        `INSERT INTO payment_operations(order_id,return_id,operation_type,idempotency_key,requested_amount_cents,seller_amount_cents,platform_amount_cents,state,provider_request,created_by)
         VALUES($1,$2,'refund',$3,$4,$5,$6,'pending_provider',$7,$8) RETURNING *`,
        [row.order_id, row.id, idempotencyKey, requested, seller, platform, { paymentIntentId: row.stripe_payment_intent_id, chargeId: row.stripe_charge_id }, actor.id],
      )).rows[0];
    });
  }
  async function applyRefund(operationId, providerRefund) {
    return transaction(async (client) => {
      const op = (await client.query('SELECT * FROM payment_operations WHERE id=$1 FOR UPDATE', [operationId])).rows[0];
      if (!op) throw new LifecycleError('Refund operation not found', 404);
      if (op.state === 'applied') return op;
      if (!['provider_succeeded','pending_provider','retryable_failure'].includes(op.state)) throw new LifecycleError('Refund operation cannot be applied', 409);
      const order = (await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [op.order_id])).rows[0];
      const transactionRow = (await client.query("SELECT * FROM payment_transactions WHERE order_id=$1 AND status IN ('succeeded','partially_refunded','refunded') ORDER BY created_at DESC LIMIT 1 FOR UPDATE", [op.order_id])).rows[0];
      if (!transactionRow) throw new LifecycleError('Settled payment transaction not found', 409);
      const cumulative = cents(transactionRow.refund_amount || 0) + Number(op.requested_amount_cents);
      const paid = cents(transactionRow.amount);
      const full = cumulative >= paid;
      await client.query(`UPDATE payment_transactions SET refund_amount=$1,status=$2,updated_at=NOW() WHERE id=$3`, [cumulative / 100, full ? 'refunded' : 'partially_refunded', transactionRow.id]);
      await client.query(`UPDATE orders SET payment_status=$1,status=CASE WHEN $2 THEN 'returned' ELSE status END,lifecycle_version=lifecycle_version+1,updated_at=NOW() WHERE id=$3`, [full ? 'refunded' : 'partially_refunded', full, order.id]);
      await restockReturnInventory(client, op.return_id);
      await client.query(`UPDATE returns SET status='refunded',updated_at=NOW() WHERE id=$1`, [op.return_id]);
      await client.query(`UPDATE payment_operations SET state='applied',provider_object_id=$1,provider_response=$2,attempts=attempts+1,last_error=NULL,updated_at=NOW() WHERE id=$3`, [providerRefund.id, providerRefund, op.id]);
      const entries = [
        ['buyer_refund', Number(op.requested_amount_cents), `${op.id}:buyer`],
        ['seller_payable', -Number(op.seller_amount_cents), `${op.id}:seller`],
        ['platform_revenue', -Number(op.platform_amount_cents), `${op.id}:platform`],
        ['processor_clearing', -Number(op.requested_amount_cents), `${op.id}:processor`],
      ];
      for (const [account, amount, key] of entries) await client.query(
        `INSERT INTO accounting_ledger(order_id,operation_id,account,amount_cents,entry_key) VALUES($1,$2,$3,$4,$5) ON CONFLICT(entry_key) DO NOTHING`,
        [order.id, op.id, account, amount, key],
      );
      const paidPayout = (await client.query("SELECT id FROM seller_payouts WHERE order_id=$1 AND status='succeeded'", [order.id])).rows[0];
      if (paidPayout) await client.query(
        `INSERT INTO reconciliation_issues(order_id,operation_id,issue_type,severity,detail) VALUES($1,$2,'seller_recovery_required','high',$3)`,
        [order.id, op.id, { sellerAmountCents: Number(op.seller_amount_cents), payoutId: paidPayout.id }],
      );
      await lifecycleEvent(client, { orderId: order.id, operationId: op.id, source: 'refund', sourceEventId: providerRefund.id, eventType: 'refund.applied', fromState: order.payment_status, toState: full ? 'refunded' : 'partially_refunded', amountCents: Number(op.requested_amount_cents) });
      await outbox(client, { orderId: order.id, eventType: 'refund.applied', key: `refund:${op.id}:applied`, payload: { operationId: op.id, returnId: op.return_id, amountCents: Number(op.requested_amount_cents), full } });
      return { ...op, state: 'applied', provider_object_id: providerRefund.id };
    });
  }
  async function executeRefund(operation) {
    if (operation.state === 'applied') return operation;
    try {
      const request = operation.provider_request || {};
      const refund = await provider.createRefund({ paymentIntentId: request.paymentIntentId, chargeId: request.chargeId, amountCents: Number(operation.requested_amount_cents), idempotencyKey: operation.idempotency_key });
      await pool.query(`UPDATE payment_operations SET state='provider_succeeded',provider_object_id=$1,provider_response=$2,updated_at=NOW() WHERE id=$3 AND state<>'applied'`, [refund.id, refund, operation.id]);
      return applyRefund(operation.id, refund);
    } catch (error) {
      if (error instanceof LifecycleError) throw error;
      const retryable = error.retryable !== false;
      await transaction(async (client) => {
        await client.query(`UPDATE payment_operations SET state=$1::varchar,attempts=attempts+1,last_error=$2,next_attempt_at=CASE WHEN $1::varchar='retryable_failure' THEN NOW()+INTERVAL '5 minutes' END,updated_at=NOW() WHERE id=$3`, [retryable ? 'retryable_failure' : 'permanent_failure', String(error.message).slice(0, 2000), operation.id]);
        await client.query(`INSERT INTO reconciliation_issues(order_id,operation_id,issue_type,severity,detail) VALUES($1,$2,'provider_refund_failure',$3,$4)`, [operation.order_id, operation.id, retryable ? 'high' : 'critical', { retryable, error: String(error.message).slice(0, 500) }]);
      });
      throw new LifecycleError('Refund provider call failed; durable recovery is pending', 502, { operationId: operation.id, retryable });
    }
  }
  async function requestRefund(args) { const operation = await prepareRefund(args); return executeRefund(operation); }
  async function retryOperation(operationId) {
    const operation = (await pool.query(`SELECT * FROM payment_operations WHERE id=$1 AND operation_type='refund' AND state IN ('retryable_failure','provider_succeeded','pending_provider')`, [operationId])).rows[0];
    if (!operation) throw new LifecycleError('Recoverable operation not found', 404);
    return operation.state === 'provider_succeeded' ? applyRefund(operation.id, operation.provider_response) : executeRefund(operation);
  }
  async function recordWebhook(event) {
    return transaction(async (client) => {
      const created = event.created ? new Date(event.created * 1000) : null;
      const result = await client.query(
        `INSERT INTO provider_webhook_inbox(provider,provider_event_id,event_type,provider_created_at,payload)
         VALUES('stripe',$1,$2,$3,$4) ON CONFLICT(provider,provider_event_id) DO NOTHING RETURNING *`,
        [event.id, event.type, created, event],
      );
      if (result.rows[0]) return { inbox: result.rows[0], duplicate: false };
      return { inbox: (await client.query('SELECT * FROM provider_webhook_inbox WHERE provider=$1 AND provider_event_id=$2', ['stripe', event.id])).rows[0], duplicate: true };
    });
  }
  async function processWebhook(inboxId) {
    return transaction(async (client) => {
      const inbox = (await client.query('SELECT * FROM provider_webhook_inbox WHERE id=$1 FOR UPDATE', [inboxId])).rows[0];
      if (!inbox || inbox.state === 'processed') return inbox;
      const event = inbox.payload; const object = event.data?.object || {};
      try {
        if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
          const orderId = object.metadata?.orderId;
          if (!orderId) throw new LifecycleError('Payment webhook lacks order metadata', 422);
          const order = (await client.query('SELECT * FROM orders WHERE id=$1 FOR UPDATE', [orderId])).rows[0];
          if (!order) throw new LifecycleError('Webhook order not found', 404);
          const success = event.type === 'payment_intent.succeeded';
          if (success && order.inventory_released_at) {
            await client.query("UPDATE orders SET payment_status='completed',payout_status='held',lifecycle_version=lifecycle_version+1,updated_at=NOW() WHERE id=$1", [order.id]);
            await client.query(`INSERT INTO reconciliation_issues(order_id,issue_type,severity,detail) VALUES($1,'paid_after_inventory_release','critical',$2)`, [order.id, { eventId: event.id, paymentIntentId: object.id }]);
            await lifecycleEvent(client, { orderId: order.id, source: 'stripe_webhook', sourceEventId: event.id, eventType: 'payment.succeeded_after_inventory_release', fromState: order.payment_status, toState: 'completed_held' });
          } else if (success || !['completed','partially_refunded','refunded','chargeback'].includes(order.payment_status)) {
            await client.query(`UPDATE orders SET payment_status=$1,payout_status=$2,
              status=CASE WHEN $1::varchar='failed' AND status IN ('pending','confirmed','processing') THEN 'cancelled' ELSE status END,
              lifecycle_version=lifecycle_version+1,updated_at=NOW() WHERE id=$3`, [success ? 'completed' : 'failed', success ? 'eligible' : 'not_ready', order.id]);
            await client.query('UPDATE payment_transactions SET status=$1,updated_at=NOW() WHERE stripe_payment_intent_id=$2', [success ? 'succeeded' : 'failed', object.id]);
            if (!success) await releaseOrderInventory(client, order.id);
            await lifecycleEvent(client, { orderId: order.id, source: 'stripe_webhook', sourceEventId: event.id, eventType: event.type, fromState: order.payment_status, toState: success ? 'completed' : 'failed' });
          }
        } else if (event.type === 'charge.dispute.created') {
          const intentId = object.payment_intent;
          const order = (await client.query('SELECT * FROM orders WHERE stripe_payment_intent_id=$1 FOR UPDATE', [intentId])).rows[0];
          if (order) {
            await client.query("UPDATE orders SET payment_status='chargeback',payout_status='held',lifecycle_version=lifecycle_version+1,updated_at=NOW() WHERE id=$1", [order.id]);
            await client.query(`INSERT INTO reconciliation_issues(order_id,issue_type,severity,detail) VALUES($1,'chargeback_received','critical',$2)`, [order.id, { disputeId: object.id, amount: object.amount }]);
            await lifecycleEvent(client, { orderId: order.id, source: 'stripe_webhook', sourceEventId: event.id, eventType: event.type, fromState: order.payment_status, toState: 'chargeback', amountCents: object.amount });
          }
        }
        await client.query("UPDATE provider_webhook_inbox SET state='processed',attempts=attempts+1,processed_at=NOW(),last_error=NULL WHERE id=$1", [inbox.id]);
      } catch (error) {
        const attempts = Number(inbox.attempts) + 1;
        await client.query('UPDATE provider_webhook_inbox SET state=$1,attempts=$2,last_error=$3 WHERE id=$4', [attempts >= 5 ? 'dead_letter' : 'retryable_failure', attempts, String(error.message).slice(0, 2000), inbox.id]);
        if (attempts >= 5) await client.query(`INSERT INTO reconciliation_issues(issue_type,severity,detail) VALUES('webhook_dead_letter','critical',$1)`, [{ inboxId: inbox.id, eventId: inbox.provider_event_id, error: error.message }]);
      }
      return (await client.query('SELECT * FROM provider_webhook_inbox WHERE id=$1', [inbox.id])).rows[0];
    });
  }
  async function acceptWebhook(event) {
    const { inbox, duplicate } = await recordWebhook(event);
    const processed = await processWebhook(inbox.id);
    return { ...processed, duplicate };
  }
  async function replayWebhook(inboxId) {
    const inbox = (await pool.query("UPDATE provider_webhook_inbox SET state='received',last_error=NULL WHERE id=$1 AND state IN ('retryable_failure','dead_letter') RETURNING *", [inboxId])).rows[0];
    if (!inbox) throw new LifecycleError('Replayable webhook not found', 404);
    return processWebhook(inbox.id);
  }
  async function dashboard() {
    const [operations, inbox, issues, outboxRows] = await Promise.all([
      pool.query('SELECT state,COUNT(*)::int AS count,COALESCE(SUM(requested_amount_cents),0)::bigint AS amount_cents FROM payment_operations GROUP BY state ORDER BY state'),
      pool.query('SELECT state,COUNT(*)::int AS count FROM provider_webhook_inbox GROUP BY state ORDER BY state'),
      pool.query("SELECT * FROM reconciliation_issues WHERE status IN ('open','investigating') ORDER BY created_at DESC LIMIT 200"),
      pool.query("SELECT state,COUNT(*)::int AS count FROM marketplace_outbox GROUP BY state ORDER BY state"),
    ]);
    return { operations: operations.rows, webhooks: inbox.rows, issues: issues.rows, outbox: outboxRows.rows };
  }
  return { acceptWebhook, applyRefund, dashboard, prepareRefund, processWebhook, replayWebhook, requestRefund, retryOperation };
}
module.exports = { createMoneyService, LifecycleError, cents, jsonDigest };
