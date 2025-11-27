-- Migration to add missing product listing fields
-- Run this SQL to add columns needed for the enhanced product listing form

-- Add shipping/location fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_from_zip VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS handling_time INT DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(50) DEFAULT 'usps_priority';

-- Add package dimension fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_weight DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_weight_unit VARCHAR(10) DEFAULT 'lbs';
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_length DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_width DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS package_height DECIMAL(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimension_unit VARCHAR(10) DEFAULT 'in';

-- Add local pickup field
ALTER TABLE products ADD COLUMN IF NOT EXISTS allows_local_pickup BOOLEAN DEFAULT false;

-- Add best offer fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS accepts_offers BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS minimum_offer_amount DECIMAL(10,2);

-- Add returns fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS accepts_returns BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_period INT DEFAULT 30;
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_shipping_paid_by VARCHAR(20) DEFAULT 'buyer';
ALTER TABLE products ADD COLUMN IF NOT EXISTS free_returns BOOLEAN DEFAULT false;

-- Add UPC/ISBN field
ALTER TABLE products ADD COLUMN IF NOT EXISTS upc VARCHAR(50);

-- Create indexes for commonly filtered fields
CREATE INDEX IF NOT EXISTS idx_products_allows_local_pickup ON products(allows_local_pickup);
CREATE INDEX IF NOT EXISTS idx_products_accepts_offers ON products(accepts_offers);
CREATE INDEX IF NOT EXISTS idx_products_accepts_returns ON products(accepts_returns);
CREATE INDEX IF NOT EXISTS idx_products_free_returns ON products(free_returns);
