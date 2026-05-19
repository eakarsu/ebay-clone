-- Adds:
--   1) ai_results JSONB tracking table — cross-project standard pattern
--      for persisting AI outputs (model, usage, parsed payload) per
--      (resource_type, resource_id) so the UI can surface the latest analysis
--      and we have an audit trail of LLM calls + cost.
--   2) Auction soft-extension columns on auctions — implements "Auction
--      Sniping Protection" (NEW custom feature #4 from audit).
--   3) Listing AI score columns to power the "AI listing optimizer scheduler"
--      nightly pass (NEW custom feature #1).

CREATE TABLE IF NOT EXISTS ai_results (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  resource_type   VARCHAR(64)  NOT NULL,        -- e.g. 'listing', 'auction', 'message', 'fraud'
  resource_id     VARCHAR(128) NOT NULL,        -- foreign id (string-coerced for flexibility)
  feature         VARCHAR(64)  NOT NULL,        -- 'description' | 'price' | 'fraud' | 'listing-optimize' | etc
  model           VARCHAR(128),
  prompt_tokens   INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens    INTEGER DEFAULT 0,
  payload         JSONB NOT NULL DEFAULT '{}',  -- the parsed/structured output
  raw             TEXT,                          -- raw model content for debugging (truncated upstream)
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_results_resource ON ai_results (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_user     ON ai_results (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_results_feature  ON ai_results (feature);

-- Auction sniping protection: when a bid lands within `soft_extend_window_sec`
-- of auction_end, push it out by `soft_extend_amount_sec`. Auctions live on
-- the products table here. The legacy bidController already had a soft-close,
-- but only as hardcoded constants — these per-listing columns let sellers
-- tune the protection (or disable it) and cap total extensions to prevent
-- "auctions that never end" sniping wars.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS soft_extend_enabled    BOOLEAN  NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS soft_extend_window_sec INTEGER  NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS soft_extend_amount_sec INTEGER  NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS max_extensions         INTEGER  NOT NULL DEFAULT 10;

-- Listing AI optimizer columns. Nightly scheduler writes rolling scores
-- so the seller dashboard can highlight underperformers.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS ai_listing_score        NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS ai_listing_suggestions  JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_listing_scored_at    TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_products_ai_listing_score ON products (ai_listing_score);
