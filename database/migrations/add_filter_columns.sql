-- Add missing columns for filter functionality
-- Run this migration to ensure all filter-related columns exist

-- Add accepts_offers column
ALTER TABLE products ADD COLUMN IF NOT EXISTS accepts_offers BOOLEAN DEFAULT false;

-- Add free_returns column
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_returns BOOLEAN DEFAULT false;

-- Add allows_local_pickup column
ALTER TABLE products ADD COLUMN IF NOT EXISTS allows_local_pickup BOOLEAN DEFAULT false;

-- Add brand column if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);

-- Add color column if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS color VARCHAR(50);

-- Add size column if missing
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(50);

-- Create indexes for better filter performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_color ON products(color) WHERE color IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_accepts_offers ON products(accepts_offers) WHERE accepts_offers = true;
CREATE INDEX IF NOT EXISTS idx_products_free_returns ON products(free_returns) WHERE free_returns = true;
CREATE INDEX IF NOT EXISTS idx_products_local_pickup ON products(allows_local_pickup) WHERE allows_local_pickup = true;
CREATE INDEX IF NOT EXISTS idx_products_free_shipping ON products(free_shipping) WHERE free_shipping = true;
CREATE INDEX IF NOT EXISTS idx_products_condition ON products(condition);
CREATE INDEX IF NOT EXISTS idx_products_listing_type ON products(listing_type);

-- Update some products with varied data for testing filters
UPDATE products SET accepts_offers = true WHERE listing_type IN ('buy_now', 'both') AND random() < 0.6;
UPDATE products SET free_returns = true WHERE free_shipping = true AND random() < 0.7;
UPDATE products SET allows_local_pickup = true WHERE random() < 0.3;

-- Add some brand variety if brands are null
UPDATE products SET brand = CASE
    WHEN category_id IN (SELECT id FROM categories WHERE slug = 'electronics') THEN
        (ARRAY['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Microsoft'])[floor(random() * 10 + 1)]
    WHEN category_id IN (SELECT id FROM categories WHERE slug = 'fashion') THEN
        (ARRAY['Nike', 'Adidas', 'Gucci', 'Prada', 'Zara', 'H&M', 'Levis', 'Calvin Klein', 'Ralph Lauren', 'Tommy Hilfiger'])[floor(random() * 10 + 1)]
    WHEN category_id IN (SELECT id FROM categories WHERE slug = 'home-garden') THEN
        (ARRAY['IKEA', 'Wayfair', 'Williams-Sonoma', 'Crate & Barrel', 'West Elm', 'Pottery Barn', 'Bed Bath', 'Target', 'Amazon Basics', 'KitchenAid'])[floor(random() * 10 + 1)]
    WHEN category_id IN (SELECT id FROM categories WHERE slug = 'sports-outdoors') THEN
        (ARRAY['Nike', 'Adidas', 'Under Armour', 'Puma', 'Reebok', 'New Balance', 'Wilson', 'Spalding', 'Coleman', 'North Face'])[floor(random() * 10 + 1)]
    ELSE (ARRAY['Generic', 'Unbranded', 'OEM', 'Premium', 'Standard'])[floor(random() * 5 + 1)]
END
WHERE brand IS NULL OR brand = '';

-- Add some color variety
UPDATE products SET color =
    (ARRAY['Black', 'White', 'Silver', 'Gold', 'Blue', 'Red', 'Green', 'Gray', 'Pink', 'Purple', 'Orange', 'Brown', 'Navy', 'Beige'])[floor(random() * 14 + 1)]
WHERE color IS NULL OR color = '';

-- Add some size variety for fashion items
UPDATE products SET size =
    (ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'])[floor(random() * 7 + 1)]
WHERE category_id IN (SELECT id FROM categories WHERE slug = 'fashion') AND (size IS NULL OR size = '');

SELECT 'Filter columns migration completed successfully' as status;
