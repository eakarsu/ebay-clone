-- Migration: add Stripe Connect payout support and GDPR stripe_account_id column
-- Run this once against your PostgreSQL database.

-- 1. Add stripe_account_id to users so sellers can receive Connect payouts
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255);

-- 2. Seller payouts table — records each Stripe Connect transfer to a seller
CREATE TABLE IF NOT EXISTS seller_payouts (
    id                 UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id           UUID        NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    seller_id          UUID        NOT NULL REFERENCES users(id)  ON DELETE RESTRICT,
    stripe_transfer_id VARCHAR(255) NOT NULL,
    gross_amount       DECIMAL(10,2) NOT NULL,
    platform_fee       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount         DECIMAL(10,2) NOT NULL,
    status             VARCHAR(50)  NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'succeeded', 'failed')),
    created_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_seller_payouts_order UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller  ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_order   ON seller_payouts(order_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_created ON seller_payouts(created_at DESC);
