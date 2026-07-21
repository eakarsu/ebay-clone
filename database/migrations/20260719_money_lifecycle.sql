CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check CHECK (
  payment_status IN ('pending','processing','completed','failed','partially_refunded','refunded','chargeback')
);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lifecycle_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payout_status VARCHAR(24) NOT NULL DEFAULT 'not_ready'
  CHECK (payout_status IN ('not_ready','eligible','processing','paid','held','reversed'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMPTZ;
ALTER TABLE returns ADD COLUMN IF NOT EXISTS inventory_restocked_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_quantity_sold_bounds') THEN
    ALTER TABLE products ADD CONSTRAINT products_quantity_sold_bounds
      CHECK (quantity_sold >= 0 AND quantity_sold <= quantity) NOT VALID;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS payment_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  return_id UUID REFERENCES returns(id),
  operation_type VARCHAR(24) NOT NULL CHECK (operation_type IN ('payment_intent','capture','refund','payout','chargeback')),
  idempotency_key VARCHAR(180) UNIQUE NOT NULL,
  requested_amount_cents BIGINT NOT NULL CHECK (requested_amount_cents >= 0),
  seller_amount_cents BIGINT NOT NULL DEFAULT 0,
  platform_amount_cents BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'usd',
  state VARCHAR(30) NOT NULL DEFAULT 'pending_provider'
    CHECK (state IN ('pending_provider','provider_succeeded','applied','retryable_failure','permanent_failure','needs_reconciliation')),
  provider VARCHAR(30) NOT NULL DEFAULT 'stripe',
  provider_object_id VARCHAR(255),
  provider_request JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payment_operations_recovery_idx ON payment_operations(state,next_attempt_at);
CREATE UNIQUE INDEX IF NOT EXISTS payment_operations_order_intent_idx
  ON payment_operations(order_id) WHERE operation_type='payment_intent' AND state<>'permanent_failure';
CREATE UNIQUE INDEX IF NOT EXISTS payment_operations_order_payout_idx
  ON payment_operations(order_id) WHERE operation_type='payout' AND state<>'permanent_failure';
CREATE UNIQUE INDEX IF NOT EXISTS payment_transactions_intent_unique
  ON payment_transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
DROP INDEX IF EXISTS payment_operations_return_refund_idx;
CREATE INDEX payment_operations_return_refund_idx
  ON payment_operations(return_id,created_at) WHERE operation_type='refund';

CREATE TABLE IF NOT EXISTS provider_webhook_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(30) NOT NULL,
  provider_event_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  provider_created_at TIMESTAMPTZ,
  payload JSONB NOT NULL,
  state VARCHAR(24) NOT NULL DEFAULT 'received' CHECK (state IN ('received','processing','processed','retryable_failure','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE(provider,provider_event_id)
);

CREATE TABLE IF NOT EXISTS marketplace_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aggregate_type VARCHAR(40) NOT NULL,
  aggregate_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  idempotency_key VARCHAR(180) UNIQUE NOT NULL,
  payload JSONB NOT NULL,
  state VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','processing','published','failed','dead_letter')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  available_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_lifecycle_events (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  operation_id UUID REFERENCES payment_operations(id),
  source VARCHAR(40) NOT NULL,
  source_event_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  from_state VARCHAR(40),
  to_state VARCHAR(40),
  amount_cents BIGINT,
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source,source_event_id,event_type)
);

CREATE TABLE IF NOT EXISTS accounting_ledger (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id),
  operation_id UUID NOT NULL REFERENCES payment_operations(id),
  account VARCHAR(40) NOT NULL CHECK (account IN ('buyer_refund','seller_payable','platform_revenue','seller_recovery','processor_clearing')),
  amount_cents BIGINT NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'usd',
  entry_key VARCHAR(200) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reconciliation_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  operation_id UUID REFERENCES payment_operations(id),
  issue_type VARCHAR(80) NOT NULL,
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','ignored')),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

CREATE OR REPLACE FUNCTION deny_marketplace_history_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'marketplace financial history is append-only'; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS order_lifecycle_events_no_mutation ON order_lifecycle_events;
CREATE TRIGGER order_lifecycle_events_no_mutation BEFORE UPDATE OR DELETE ON order_lifecycle_events
FOR EACH ROW EXECUTE FUNCTION deny_marketplace_history_mutation();
DROP TRIGGER IF EXISTS accounting_ledger_no_mutation ON accounting_ledger;
CREATE TRIGGER accounting_ledger_no_mutation BEFORE UPDATE OR DELETE ON accounting_ledger
FOR EACH ROW EXECUTE FUNCTION deny_marketplace_history_mutation();
