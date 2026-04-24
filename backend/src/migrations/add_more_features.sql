-- Second extension features migration.
-- Anti-snipe tracking, store credit, wishlist sharing.

-- ===== Anti-snipe =====
ALTER TABLE products ADD COLUMN IF NOT EXISTS extensions_count INTEGER DEFAULT 0;

-- ===== Gift cards / store credit =====
CREATE TABLE IF NOT EXISTS gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,
  amount NUMERIC(12, 2) NOT NULL,
  purchased_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMP,
  recipient_email VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemed_by ON gift_cards(redeemed_by);

CREATE TABLE IF NOT EXISTS user_credit (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL, -- positive = credit added, negative = spent
  reason VARCHAR(60) NOT NULL,    -- 'gift_card_redeem', 'purchase', 'refund', 'manual'
  gift_card_id UUID REFERENCES gift_cards(id),
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

-- ===== Wishlist sharing =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS wishlist_share_token VARCHAR(32);
ALTER TABLE users ADD COLUMN IF NOT EXISTS wishlist_public BOOLEAN DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wishlist_token
  ON users(wishlist_share_token) WHERE wishlist_share_token IS NOT NULL;
