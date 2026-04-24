-- =====================================================
-- SEARCH INDEXES & TRIGRAM FUZZY MATCHING
-- =====================================================
-- Idempotent migration. Adds a generated tsvector column on products,
-- a GIN index for fast full-text search, and a pg_trgm index on title
-- for typo-tolerant LIKE/similarity queries.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Generated search_vector column (weighted: title=A, brand/model=B, description=C).
-- Uses generated-always-as so it stays in sync automatically on insert/update.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE products
      ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(model, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'C')
      ) STORED;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_products_title_trgm
  ON products USING GIN (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING GIN (brand gin_trgm_ops);

-- Helpful B-tree indexes for common search filters
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_products_auction_end ON products(auction_end) WHERE status = 'active';

-- =====================================================
-- RECENTLY_VIEWED normalization (two competing schemas exist across migrations).
-- Ensure the columns our recommendation logic depends on are present.
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recently_viewed') THEN
    -- view_count
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recently_viewed' AND column_name = 'view_count'
    ) THEN
      ALTER TABLE recently_viewed ADD COLUMN view_count INTEGER DEFAULT 1;
    END IF;

    -- last_viewed_at
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recently_viewed' AND column_name = 'last_viewed_at'
    ) THEN
      ALTER TABLE recently_viewed ADD COLUMN last_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- first_viewed_at (optional but cheap)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'recently_viewed' AND column_name = 'first_viewed_at'
    ) THEN
      ALTER TABLE recently_viewed ADD COLUMN first_viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON recently_viewed(product_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_user_last ON recently_viewed(user_id, last_viewed_at DESC);
