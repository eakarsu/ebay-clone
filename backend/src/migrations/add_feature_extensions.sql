-- Extension features migration
-- 1. Listing Templates: sellers save reusable listing drafts
-- 2. Seller Vacation Mode: users.vacation_* columns
-- 3. Watchlist Price Drop tracking: watchlist.price_at_watch

-- ===== Listing Templates =====
CREATE TABLE IF NOT EXISTS listing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  title VARCHAR(255),
  description TEXT,
  condition VARCHAR(50),
  listing_type VARCHAR(20),
  starting_price NUMERIC(12, 2),
  buy_now_price NUMERIC(12, 2),
  shipping_cost NUMERIC(10, 2),
  free_shipping BOOLEAN DEFAULT false,
  brand VARCHAR(100),
  duration_days INTEGER,
  item_specifics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_listing_templates_seller ON listing_templates(seller_id, created_at DESC);

-- ===== Seller Vacation Mode =====
ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_mode BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_return_date DATE;
CREATE INDEX IF NOT EXISTS idx_users_vacation ON users(vacation_mode) WHERE vacation_mode = true;

-- ===== Watchlist Price Drop =====
ALTER TABLE watchlist ADD COLUMN IF NOT EXISTS price_at_watch NUMERIC(12, 2);
-- Backfill existing rows from current product price
UPDATE watchlist w
SET price_at_watch = COALESCE(p.current_price, p.buy_now_price, p.starting_price)
FROM products p
WHERE w.product_id = p.id AND w.price_at_watch IS NULL;
