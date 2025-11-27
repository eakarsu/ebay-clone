-- Rich seed data for products (descriptions, specifications) and bids
-- This adds eBay-like detailed data

-- =====================================================
-- 1. UPDATE PRODUCTS WITH RICH DESCRIPTIONS & SPECS
-- =====================================================

-- Update Electronics products
UPDATE products SET
    description = E'**Product Overview**\n\nExperience cutting-edge technology with this premium device. Featuring the latest innovations and top-tier performance, this product delivers exceptional value.\n\n**Key Features:**\n- Industry-leading performance\n- Premium build quality\n- Advanced technology\n- Energy efficient design\n- Comprehensive warranty included\n\n**What''s in the Box:**\n- Main unit\n- Charging cable\n- User manual\n- Quick start guide\n- Warranty card\n\n**Compatibility:**\nWorks with all major platforms and accessories. Full compatibility list available upon request.\n\n**Seller Notes:**\nShips within 24 hours. All items carefully inspected and tested before shipping.',
    condition_description = 'Brand new, factory sealed. Never opened or used. Full manufacturer warranty applies.',
    model = CASE
        WHEN title ILIKE '%iphone%' THEN 'A2894'
        WHEN title ILIKE '%samsung%' THEN 'SM-S928U'
        WHEN title ILIKE '%macbook%' THEN 'MRW13LL/A'
        WHEN title ILIKE '%ipad%' THEN 'MU7J3LL/A'
        WHEN title ILIKE '%airpods%' THEN 'MQD83AM/A'
        WHEN title ILIKE '%playstation%' THEN 'CFI-1215A'
        WHEN title ILIKE '%xbox%' THEN 'RRT-00001'
        ELSE 'PRO-' || LEFT(MD5(title), 6)
    END,
    sku = 'SKU-' || UPPER(LEFT(MD5(id::text), 8)),
    upc = '0' || LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'),
    weight = ROUND((RANDOM() * 5 + 0.5)::NUMERIC, 2),
    dimensions = CONCAT(
        ROUND((RANDOM() * 15 + 5)::NUMERIC, 1), '" x ',
        ROUND((RANDOM() * 10 + 3)::NUMERIC, 1), '" x ',
        ROUND((RANDOM() * 5 + 1)::NUMERIC, 1), '"'
    ),
    color = CASE (RANDOM() * 5)::INT
        WHEN 0 THEN 'Space Black'
        WHEN 1 THEN 'Silver'
        WHEN 2 THEN 'Gold'
        WHEN 3 THEN 'White'
        ELSE 'Graphite'
    END,
    material = 'Aluminum, Glass',
    view_count = (RANDOM() * 5000 + 100)::INT,
    watch_count = (RANDOM() * 200 + 10)::INT
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%electronic%' OR name ILIKE '%computer%' OR name ILIKE '%phone%');

-- Update Fashion products
UPDATE products SET
    description = E'**Style & Elegance**\n\nElevate your wardrobe with this stunning piece. Crafted with attention to detail and premium materials for lasting comfort and style.\n\n**Product Details:**\n- Premium quality fabric\n- Modern, versatile design\n- Comfortable fit\n- Easy care instructions\n- Timeless style\n\n**Care Instructions:**\n- Machine wash cold\n- Tumble dry low\n- Do not bleach\n- Iron on low heat if needed\n\n**Sizing:**\nPlease refer to our size chart. Model is 5''10" wearing size Medium. Measurements available upon request.\n\n**Returns:**\n30-day hassle-free returns. Item must be unworn with tags attached.',
    condition_description = 'Brand new with original tags. Never worn. Stored in smoke-free, pet-free environment.',
    model = 'FW-2024-' || LEFT(MD5(title), 4),
    sku = 'FASH-' || UPPER(LEFT(MD5(id::text), 8)),
    weight = ROUND((RANDOM() * 2 + 0.2)::NUMERIC, 2),
    dimensions = 'Varies by size',
    color = CASE (RANDOM() * 7)::INT
        WHEN 0 THEN 'Navy Blue'
        WHEN 1 THEN 'Charcoal'
        WHEN 2 THEN 'Burgundy'
        WHEN 3 THEN 'Olive Green'
        WHEN 4 THEN 'Cream'
        WHEN 5 THEN 'Black'
        ELSE 'White'
    END,
    size = CASE (RANDOM() * 5)::INT
        WHEN 0 THEN 'XS'
        WHEN 1 THEN 'S'
        WHEN 2 THEN 'M'
        WHEN 3 THEN 'L'
        ELSE 'XL'
    END,
    material = CASE (RANDOM() * 4)::INT
        WHEN 0 THEN '100% Cotton'
        WHEN 1 THEN '95% Cotton, 5% Spandex'
        WHEN 2 THEN 'Premium Wool Blend'
        ELSE 'Organic Cotton'
    END,
    view_count = (RANDOM() * 3000 + 50)::INT,
    watch_count = (RANDOM() * 150 + 5)::INT
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%fashion%' OR name ILIKE '%cloth%' OR name ILIKE '%apparel%');

-- Update Home & Garden products
UPDATE products SET
    description = E'**Transform Your Space**\n\nBring style and functionality to your home with this exceptional piece. Designed for modern living with quality craftsmanship.\n\n**Features:**\n- Premium construction\n- Elegant design\n- Durable materials\n- Easy assembly (if required)\n- Versatile use\n\n**Specifications:**\n- High-quality materials\n- Modern aesthetic\n- Built to last\n- Easy maintenance\n\n**Assembly:**\nSome assembly may be required. Tools and hardware included. Clear instructions provided.\n\n**Shipping:**\nCarefully packaged to prevent damage. Ships via ground freight for larger items.',
    condition_description = 'Brand new in original packaging. Factory sealed. Full warranty included.',
    model = 'HOME-' || LEFT(MD5(title), 6),
    sku = 'HG-' || UPPER(LEFT(MD5(id::text), 8)),
    weight = ROUND((RANDOM() * 50 + 2)::NUMERIC, 2),
    dimensions = CONCAT(
        ROUND((RANDOM() * 40 + 10)::NUMERIC, 0), '" x ',
        ROUND((RANDOM() * 30 + 10)::NUMERIC, 0), '" x ',
        ROUND((RANDOM() * 20 + 5)::NUMERIC, 0), '"'
    ),
    color = CASE (RANDOM() * 5)::INT
        WHEN 0 THEN 'Espresso'
        WHEN 1 THEN 'Oak'
        WHEN 2 THEN 'White'
        WHEN 3 THEN 'Gray'
        ELSE 'Natural'
    END,
    material = CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'Solid Wood'
        WHEN 1 THEN 'Steel Frame'
        WHEN 2 THEN 'Engineered Wood'
        ELSE 'Bamboo'
    END,
    view_count = (RANDOM() * 2000 + 30)::INT,
    watch_count = (RANDOM() * 100 + 3)::INT
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%home%' OR name ILIKE '%garden%' OR name ILIKE '%furniture%');

-- Update Collectibles/Vintage products
UPDATE products SET
    description = E'**Rare Collectible Item**\n\nA true gem for collectors. This authentic piece represents an important part of history and is becoming increasingly rare.\n\n**Provenance:**\n- Authenticated and verified\n- Comes with certificate of authenticity (where applicable)\n- Documented history available\n\n**Condition Details:**\n- Carefully preserved\n- Shows appropriate age\n- No restoration or repairs\n- Original finish/patina\n\n**Historical Significance:**\nThis piece represents a significant era in collecting. Perfect for serious collectors or as a statement piece.\n\n**Storage:**\nHas been stored in climate-controlled environment. Handled with care.',
    condition_description = 'Excellent vintage condition. Minor wear consistent with age. No chips, cracks, or repairs. See photos for actual condition.',
    model = 'VINTAGE-' || EXTRACT(YEAR FROM NOW() - (RANDOM() * 365 * 50)::INT * INTERVAL '1 day')::TEXT,
    sku = 'COL-' || UPPER(LEFT(MD5(id::text), 8)),
    weight = ROUND((RANDOM() * 10 + 0.5)::NUMERIC, 2),
    view_count = (RANDOM() * 8000 + 200)::INT,
    watch_count = (RANDOM() * 500 + 20)::INT
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%collect%' OR name ILIKE '%antique%' OR name ILIKE '%vintage%');

-- Update Sports products
UPDATE products SET
    description = E'**Professional Grade Equipment**\n\nTake your game to the next level with this high-performance sports equipment. Used by professionals and enthusiasts alike.\n\n**Performance Features:**\n- Competition-ready design\n- Advanced materials\n- Optimized for performance\n- Durable construction\n- Comfortable grip/fit\n\n**Technical Specifications:**\n- Professional grade\n- Meets competition standards\n- Tested for durability\n- Backed by manufacturer warranty\n\n**Ideal For:**\n- Competitive athletes\n- Fitness enthusiasts\n- Weekend warriors\n- Training and practice\n\n**Maintenance:**\nEasy to clean and maintain. Care instructions included.',
    condition_description = 'Brand new, never used. In original packaging with all accessories and documentation.',
    model = 'PRO-' || LEFT(MD5(title), 6),
    sku = 'SPT-' || UPPER(LEFT(MD5(id::text), 8)),
    weight = ROUND((RANDOM() * 15 + 0.5)::NUMERIC, 2),
    color = CASE (RANDOM() * 5)::INT
        WHEN 0 THEN 'Black/Red'
        WHEN 1 THEN 'Blue/White'
        WHEN 2 THEN 'Neon Green'
        WHEN 3 THEN 'Team Colors'
        ELSE 'Classic Black'
    END,
    material = CASE (RANDOM() * 4)::INT
        WHEN 0 THEN 'Carbon Fiber'
        WHEN 1 THEN 'Titanium Alloy'
        WHEN 2 THEN 'Composite'
        ELSE 'Premium Leather'
    END,
    view_count = (RANDOM() * 4000 + 100)::INT,
    watch_count = (RANDOM() * 250 + 15)::INT
WHERE category_id IN (SELECT id FROM categories WHERE name ILIKE '%sport%' OR name ILIKE '%fitness%' OR name ILIKE '%outdoor%');

-- Update remaining products with generic but detailed descriptions
UPDATE products SET
    description = E'**Quality Product**\n\nThis is a high-quality item that exceeds expectations. We stand behind every product we sell.\n\n**Product Highlights:**\n- Premium quality\n- Excellent value\n- Reliable performance\n- Satisfaction guaranteed\n\n**Details:**\nPlease see photos for complete details. Feel free to message with any questions.\n\n**Shipping:**\n- Fast, secure shipping\n- Tracking provided\n- Carefully packaged\n- Insurance available\n\n**Our Guarantee:**\nWe offer a 30-day satisfaction guarantee. If you''re not completely satisfied, return for full refund.',
    condition_description = CASE
        WHEN condition = 'new' THEN 'Brand new, factory sealed. Full manufacturer warranty.'
        WHEN condition = 'like_new' THEN 'Like new condition. Opened but never used. All original accessories included.'
        WHEN condition = 'very_good' THEN 'Very good condition. Minimal signs of use. Functions perfectly.'
        WHEN condition = 'good' THEN 'Good condition. Normal wear from use. Fully functional.'
        ELSE 'Acceptable condition. Shows wear but works as intended.'
    END,
    model = COALESCE(model, 'STD-' || LEFT(MD5(title), 6)),
    sku = COALESCE(sku, 'GEN-' || UPPER(LEFT(MD5(id::text), 8))),
    upc = COALESCE(upc, '0' || LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0')),
    weight = COALESCE(weight, ROUND((RANDOM() * 10 + 0.5)::NUMERIC, 2)),
    view_count = COALESCE(NULLIF(view_count, 0), (RANDOM() * 2000 + 50)::INT),
    watch_count = COALESCE(NULLIF(watch_count, 0), (RANDOM() * 100 + 5)::INT)
WHERE description IS NULL OR LENGTH(description) < 100;

-- =====================================================
-- 2. GENERATE BID HISTORY FOR AUCTIONS (15+ bids each)
-- =====================================================

-- Clear existing bids
DELETE FROM bids;

-- Generate bid history for each auction
DO $$
DECLARE
    auction RECORD;
    bidder RECORD;
    bid_amount NUMERIC(12,2);
    prev_bid NUMERIC(12,2);
    bid_time TIMESTAMP;
    bid_count INTEGER;
    num_bids INTEGER;
BEGIN
    -- Loop through each active auction
    FOR auction IN
        SELECT id, starting_price, current_price, auction_start, auction_end, seller_id
        FROM products
        WHERE listing_type = 'auction'
        AND status = 'active'
    LOOP
        prev_bid := COALESCE(auction.starting_price, 10.00);
        bid_time := COALESCE(auction.auction_start, NOW() - INTERVAL '7 days');
        num_bids := 15 + (RANDOM() * 20)::INT;  -- 15-35 bids per auction

        -- Generate bids from random bidders
        FOR bid_count IN 1..num_bids LOOP
            -- Get a random bidder (not the seller)
            SELECT id INTO bidder FROM users
            WHERE id != auction.seller_id
            ORDER BY RANDOM()
            LIMIT 1;

            -- Calculate bid amount (incremental increase)
            bid_amount := prev_bid + (RANDOM() * prev_bid * 0.15 + 1)::NUMERIC(12,2);
            bid_amount := ROUND(bid_amount, 2);

            -- Increment time
            bid_time := bid_time + (RANDOM() * INTERVAL '6 hours' + INTERVAL '5 minutes');

            -- Don't exceed auction end time
            IF bid_time > COALESCE(auction.auction_end, NOW() + INTERVAL '3 days') THEN
                bid_time := COALESCE(auction.auction_end, NOW() + INTERVAL '3 days') - INTERVAL '1 hour';
            END IF;

            -- Insert bid
            INSERT INTO bids (product_id, bidder_id, bid_amount, max_bid_amount, is_winning, is_auto_bid, created_at)
            VALUES (
                auction.id,
                bidder.id,
                bid_amount,
                bid_amount + (RANDOM() * 50 + 10)::NUMERIC(12,2),
                FALSE,
                RANDOM() > 0.7,  -- 30% are auto bids
                bid_time
            );

            prev_bid := bid_amount;
        END LOOP;

        -- Mark the highest bid as winning
        UPDATE bids SET is_winning = TRUE
        WHERE id = (
            SELECT id FROM bids
            WHERE product_id = auction.id
            ORDER BY bid_amount DESC
            LIMIT 1
        );

        -- Update product's current price and bid count
        UPDATE products SET
            current_price = prev_bid,
            bid_count = num_bids
        WHERE id = auction.id;

        RAISE NOTICE 'Generated % bids for auction %', num_bids, auction.id;
    END LOOP;
END $$;

-- =====================================================
-- 3. SUMMARY REPORT
-- =====================================================

SELECT '=== PRODUCTS WITH RICH DATA ===' as report;
SELECT
    COUNT(*) as total_products,
    COUNT(CASE WHEN LENGTH(description) > 200 THEN 1 END) as rich_descriptions,
    COUNT(CASE WHEN model IS NOT NULL THEN 1 END) as with_model,
    COUNT(CASE WHEN sku IS NOT NULL THEN 1 END) as with_sku,
    COUNT(CASE WHEN weight IS NOT NULL THEN 1 END) as with_weight,
    COUNT(CASE WHEN color IS NOT NULL THEN 1 END) as with_color
FROM products;

SELECT '=== BIDS SUMMARY ===' as report;
SELECT
    COUNT(*) as total_bids,
    COUNT(DISTINCT product_id) as auctions_with_bids,
    ROUND(AVG(bid_amount), 2) as avg_bid_amount,
    MAX(bid_amount) as highest_bid
FROM bids;

SELECT '=== BIDS PER AUCTION ===' as report;
SELECT p.title, COUNT(b.id) as bid_count, MAX(b.bid_amount) as current_bid
FROM products p
JOIN bids b ON p.id = b.product_id
GROUP BY p.id, p.title
ORDER BY bid_count DESC
LIMIT 10;
