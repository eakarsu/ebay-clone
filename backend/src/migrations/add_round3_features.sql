-- Round 3 feature migration: bundle discounts, cart reservations,
-- feedback reminders tracking, category follows.

-- ===== Bundle discounts =====
-- Rules the seller defines. A cart matches the best rule whose conditions are met.
CREATE TABLE IF NOT EXISTS bundle_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  min_items INTEGER NOT NULL DEFAULT 2,
  discount_percent NUMERIC(5, 2) NOT NULL, -- 0-100
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bundle_discounts_seller
  ON bundle_discounts(seller_id, is_active, min_items DESC);

-- ===== Cart stock reservations =====
-- When a buyer adds to cart, we reserve quantity for 10 minutes so another buyer
-- can't claim the last unit while they're still deciding. Expired rows are cleaned
-- up by a background interval; available_quantity is computed as
-- products.quantity - sum(active reservations by other users).
CREATE TABLE IF NOT EXISTS cart_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_expires ON cart_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_cart_reservations_product ON cart_reservations(product_id);

-- ===== Feedback reminders =====
-- Track whether we've already nudged the buyer for a given order so we don't spam.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_reminder_sent_at TIMESTAMP;

-- ===== Category follows =====
CREATE TABLE IF NOT EXISTS category_follows (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, category_id)
);
CREATE INDEX IF NOT EXISTS idx_category_follows_user ON category_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_category_follows_category ON category_follows(category_id);
