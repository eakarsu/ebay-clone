-- Price history table + trigger to capture buy_now_price / current_price changes.
-- Consumed by the product detail chart and price-drop detection.

CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price_type VARCHAR(20) NOT NULL,    -- 'buy_now' | 'current' (auction)
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_history_product
    ON product_price_history (product_id, changed_at DESC);

-- Trigger: on UPDATE, insert a row for each price column that changed.
CREATE OR REPLACE FUNCTION record_product_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.buy_now_price IS DISTINCT FROM OLD.buy_now_price THEN
        INSERT INTO product_price_history (product_id, price_type, old_price, new_price)
        VALUES (NEW.id, 'buy_now', OLD.buy_now_price, NEW.buy_now_price);
    END IF;

    IF NEW.current_price IS DISTINCT FROM OLD.current_price THEN
        INSERT INTO product_price_history (product_id, price_type, old_price, new_price)
        VALUES (NEW.id, 'current', OLD.current_price, NEW.current_price);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_product_price_change ON products;
CREATE TRIGGER trg_record_product_price_change
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION record_product_price_change();

-- Seed initial price so the chart isn't empty for existing products.
INSERT INTO product_price_history (product_id, price_type, old_price, new_price, changed_at)
SELECT id, 'buy_now', NULL, buy_now_price, created_at
  FROM products
 WHERE buy_now_price IS NOT NULL
   AND NOT EXISTS (
       SELECT 1 FROM product_price_history h
        WHERE h.product_id = products.id AND h.price_type = 'buy_now'
   );
