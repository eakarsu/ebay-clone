-- Low-stock alert threshold on products.
-- Sellers set a per-listing threshold; when quantity drops to/below it,
-- the system fires a notification (and optional email) to the seller.

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS low_stock_alerted_at TIMESTAMP;

-- Index so the digest job can scan quickly for tripped thresholds.
CREATE INDEX IF NOT EXISTS idx_products_low_stock
    ON products (seller_id)
    WHERE low_stock_threshold > 0;

COMMENT ON COLUMN products.low_stock_threshold IS
    'Seller-set quantity threshold. 0 disables the alert. When effective quantity (quantity - quantity_sold) <= threshold, notify seller.';
COMMENT ON COLUMN products.low_stock_alerted_at IS
    'Timestamp of the last low-stock notification fired; cleared when stock is replenished above the threshold.';
