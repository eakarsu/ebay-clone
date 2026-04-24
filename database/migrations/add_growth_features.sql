-- Batch 3 growth features: wallet credit, referrals, flash sales, group buys,
-- and abandoned-cart tracking (extra columns only — the job itself lives in code).

-- =====================================================
-- 1) Wallet / store credit
-- =====================================================
CREATE TABLE IF NOT EXISTS user_wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,           -- signed: positive credits, negative debits
    balance_after DECIMAL(10,2) NOT NULL,
    reason VARCHAR(60) NOT NULL,             -- 'credit:referral' | 'credit:refund' | 'debit:order' | etc.
    reference_id UUID,                       -- order_id / referral_id / etc.
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_user ON wallet_ledger (user_id, created_at DESC);

-- =====================================================
-- 2) Referral program
-- =====================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS referral_code VARCHAR(16) UNIQUE,
    ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event VARCHAR(24) NOT NULL,              -- 'signup' | 'first_purchase'
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (referrer_id, referred_id, event)
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards (referrer_id);

-- =====================================================
-- 3) Flash sales
-- =====================================================
CREATE TABLE IF NOT EXISTS flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    discount_pct DECIMAL(5,2) NOT NULL CHECK (discount_pct > 0 AND discount_pct < 90),
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    max_uses INTEGER,                        -- null = unlimited within window
    uses_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active
    ON flash_sales (product_id, starts_at, ends_at);

-- =====================================================
-- 4) Group buys / tiered pricing
-- =====================================================
CREATE TABLE IF NOT EXISTS group_buys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- tiers is JSON: [{min_qty:5, price:19.99}, {min_qty:10, price:17.99}]
    tiers JSONB NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',   -- 'open' | 'completed' | 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_buy_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_buy_id UUID NOT NULL REFERENCES group_buys(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_buy_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_group_buy_commit ON group_buy_commitments (group_buy_id);

-- =====================================================
-- 5) Abandoned-cart tracking
-- =====================================================
ALTER TABLE shopping_carts
    ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN IF NOT EXISTS abandoned_reminded_at TIMESTAMP;

-- Bump last_activity on any cart_items write.
CREATE OR REPLACE FUNCTION bump_cart_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE shopping_carts
       SET last_activity_at = NOW(),
           abandoned_reminded_at = NULL
     WHERE id = COALESCE(NEW.cart_id, OLD.cart_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bump_cart_activity ON cart_items;
CREATE TRIGGER trg_bump_cart_activity
AFTER INSERT OR UPDATE OR DELETE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION bump_cart_activity();
