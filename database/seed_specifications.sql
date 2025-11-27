-- Create product_specifications table and seed with comprehensive data
-- Each product will have 15-25 detailed specifications like eBay

-- =====================================================
-- 1. CREATE PRODUCT_SPECIFICATIONS TABLE
-- =====================================================

DROP TABLE IF EXISTS product_specifications;

CREATE TABLE product_specifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_group VARCHAR(100) NOT NULL,
    spec_name VARCHAR(150) NOT NULL,
    spec_value TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_specs_product ON product_specifications(product_id);
CREATE INDEX idx_product_specs_group ON product_specifications(spec_group);

-- =====================================================
-- 2. SEED SPECIFICATIONS FOR ALL PRODUCTS
-- =====================================================

DO $$
DECLARE
    prod RECORD;
    cat_name TEXT;
    spec_count INTEGER;
BEGIN
    -- Loop through all products
    FOR prod IN SELECT p.id, p.title, p.brand, p.model, p.condition, c.name as category_name
                FROM products p
                JOIN categories c ON p.category_id = c.id
    LOOP
        cat_name := LOWER(prod.category_name);

        -- =====================================================
        -- ELECTRONICS SPECIFICATIONS
        -- =====================================================
        IF cat_name ILIKE '%electronic%' OR cat_name ILIKE '%computer%' OR cat_name ILIKE '%phone%'
           OR prod.title ILIKE '%iphone%' OR prod.title ILIKE '%macbook%' OR prod.title ILIKE '%samsung%'
           OR prod.title ILIKE '%laptop%' OR prod.title ILIKE '%tablet%' OR prod.title ILIKE '%tv%'
           OR prod.title ILIKE '%playstation%' OR prod.title ILIKE '%xbox%' OR prod.title ILIKE '%nintendo%'
        THEN
            -- Item Specifics
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, 'Apple'), 1),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, 'Latest Model'), 2),
            (prod.id, 'Item Specifics', 'Type', 'Consumer Electronics', 3),
            (prod.id, 'Item Specifics', 'MPN', 'MPN-' || UPPER(LEFT(MD5(prod.id::text), 10)), 4),
            (prod.id, 'Item Specifics', 'UPC', '0' || LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'), 5),
            (prod.id, 'Item Specifics', 'EAN', '0' || LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'), 6),
            (prod.id, 'Item Specifics', 'Country/Region of Manufacture', CASE (RANDOM()*3)::INT WHEN 0 THEN 'China' WHEN 1 THEN 'Vietnam' WHEN 2 THEN 'Taiwan' ELSE 'South Korea' END, 7),

            -- Technical Specifications
            (prod.id, 'Technical Specifications', 'Processor', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Apple M3 Pro' WHEN 1 THEN 'Intel Core i9-13900K' WHEN 2 THEN 'AMD Ryzen 9 7950X' WHEN 3 THEN 'Qualcomm Snapdragon 8 Gen 3' ELSE 'Apple A17 Pro' END, 10),
            (prod.id, 'Technical Specifications', 'RAM', CASE (RANDOM()*4)::INT WHEN 0 THEN '8GB' WHEN 1 THEN '16GB' WHEN 2 THEN '32GB' WHEN 3 THEN '64GB' ELSE '12GB' END, 11),
            (prod.id, 'Technical Specifications', 'Storage Capacity', CASE (RANDOM()*4)::INT WHEN 0 THEN '256GB SSD' WHEN 1 THEN '512GB SSD' WHEN 2 THEN '1TB SSD' WHEN 3 THEN '2TB SSD' ELSE '128GB' END, 12),
            (prod.id, 'Technical Specifications', 'Screen Size', CASE (RANDOM()*5)::INT WHEN 0 THEN '6.1 inches' WHEN 1 THEN '6.7 inches' WHEN 2 THEN '13.3 inches' WHEN 3 THEN '15.6 inches' WHEN 4 THEN '27 inches' ELSE '14.2 inches' END, 13),
            (prod.id, 'Technical Specifications', 'Resolution', CASE (RANDOM()*3)::INT WHEN 0 THEN '2532 x 1170 pixels' WHEN 1 THEN '2796 x 1290 pixels' WHEN 2 THEN '3024 x 1964 pixels' ELSE '3840 x 2160 (4K UHD)' END, 14),
            (prod.id, 'Technical Specifications', 'Refresh Rate', CASE (RANDOM()*3)::INT WHEN 0 THEN '60Hz' WHEN 1 THEN '120Hz ProMotion' WHEN 2 THEN '144Hz' ELSE '240Hz' END, 15),
            (prod.id, 'Technical Specifications', 'Battery Life', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Up to 20 hours' WHEN 1 THEN 'Up to 29 hours' WHEN 2 THEN 'Up to 12 hours' ELSE 'Up to 18 hours' END, 16),
            (prod.id, 'Technical Specifications', 'Operating System', CASE (RANDOM()*4)::INT WHEN 0 THEN 'iOS 17' WHEN 1 THEN 'macOS Sonoma' WHEN 2 THEN 'Windows 11 Pro' WHEN 3 THEN 'Android 14' ELSE 'iPadOS 17' END, 17),

            -- Connectivity
            (prod.id, 'Connectivity', 'Wireless Technology', '5G, Wi-Fi 6E (802.11ax), Bluetooth 5.3, NFC', 20),
            (prod.id, 'Connectivity', 'Ports', CASE (RANDOM()*2)::INT WHEN 0 THEN 'USB-C (Thunderbolt 4), MagSafe 3, HDMI 2.1, SDXC' WHEN 1 THEN 'Lightning, USB-C' ELSE 'USB-C x3, USB-A x2, HDMI' END, 21),
            (prod.id, 'Connectivity', 'SIM Card Slot', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Dual eSIM support' WHEN 1 THEN 'Nano-SIM and eSIM' ELSE 'Single SIM' END, 22),

            -- Camera (if applicable)
            (prod.id, 'Camera', 'Main Camera', CASE (RANDOM()*3)::INT WHEN 0 THEN '48MP Main + 12MP Ultra Wide + 12MP Telephoto' WHEN 1 THEN '200MP Main + 12MP Ultra Wide' WHEN 2 THEN '50MP Main + 48MP Ultra Wide' ELSE '12MP Wide' END, 25),
            (prod.id, 'Camera', 'Front Camera', CASE (RANDOM()*2)::INT WHEN 0 THEN '12MP TrueDepth with Face ID' WHEN 1 THEN '12MP Ultra Wide' ELSE '10MP' END, 26),
            (prod.id, 'Camera', 'Video Recording', '4K at 24/25/30/60 fps, 1080p at 25/30/60/120/240 fps, ProRes, Cinematic mode', 27),

            -- Physical
            (prod.id, 'Physical', 'Color', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Space Black' WHEN 1 THEN 'Silver' WHEN 2 THEN 'Gold' WHEN 3 THEN 'Deep Purple' WHEN 4 THEN 'Blue Titanium' ELSE 'Natural Titanium' END, 30),
            (prod.id, 'Physical', 'Weight', ROUND((RANDOM() * 2 + 0.15)::NUMERIC, 2)::TEXT || ' kg', 31),
            (prod.id, 'Physical', 'Dimensions', ROUND((RANDOM() * 20 + 10)::NUMERIC, 1)::TEXT || ' x ' || ROUND((RANDOM() * 15 + 5)::NUMERIC, 1)::TEXT || ' x ' || ROUND((RANDOM() * 2 + 0.5)::NUMERIC, 2)::TEXT || ' cm', 32),
            (prod.id, 'Physical', 'Material', 'Aerospace-grade Titanium with Ceramic Shield front', 33),

            -- Additional Features
            (prod.id, 'Additional Features', 'Water Resistance', 'IP68 (6 meters for 30 minutes)', 35),
            (prod.id, 'Additional Features', 'Biometric Security', 'Face ID / Touch ID with Secure Enclave', 36),
            (prod.id, 'Additional Features', 'Audio', 'Spatial Audio with dynamic head tracking, Dolby Atmos', 37),
            (prod.id, 'Additional Features', 'Sensors', 'Accelerometer, Gyroscope, Proximity, Ambient Light, Barometer, LiDAR Scanner', 38);

        -- =====================================================
        -- FASHION/CLOTHING SPECIFICATIONS
        -- =====================================================
        ELSIF cat_name ILIKE '%fashion%' OR cat_name ILIKE '%cloth%' OR cat_name ILIKE '%apparel%'
              OR prod.title ILIKE '%shirt%' OR prod.title ILIKE '%dress%' OR prod.title ILIKE '%jacket%'
              OR prod.title ILIKE '%gucci%' OR prod.title ILIKE '%nike%' OR prod.title ILIKE '%adidas%'
        THEN
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, CASE (RANDOM()*5)::INT WHEN 0 THEN 'Gucci' WHEN 1 THEN 'Louis Vuitton' WHEN 2 THEN 'Nike' WHEN 3 THEN 'Ralph Lauren' ELSE 'Zara' END), 1),
            (prod.id, 'Item Specifics', 'Style', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Casual' WHEN 1 THEN 'Formal' WHEN 2 THEN 'Athletic' WHEN 3 THEN 'Streetwear' ELSE 'Business Casual' END, 2),
            (prod.id, 'Item Specifics', 'Department', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Men' WHEN 1 THEN 'Women' ELSE 'Unisex' END, 3),
            (prod.id, 'Item Specifics', 'Type', 'Designer Apparel', 4),
            (prod.id, 'Item Specifics', 'Season', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Fall/Winter 2024' WHEN 1 THEN 'Spring/Summer 2024' WHEN 2 THEN 'Resort 2024' ELSE 'All Season' END, 5),
            (prod.id, 'Item Specifics', 'Collection', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Main Collection' WHEN 1 THEN 'Limited Edition' WHEN 2 THEN 'Collaboration Series' ELSE 'Classic Line' END, 6),

            -- Size & Fit
            (prod.id, 'Size & Fit', 'Size', CASE (RANDOM()*6)::INT WHEN 0 THEN 'XS' WHEN 1 THEN 'S' WHEN 2 THEN 'M' WHEN 3 THEN 'L' WHEN 4 THEN 'XL' ELSE 'XXL' END, 10),
            (prod.id, 'Size & Fit', 'Size Type', 'Regular', 11),
            (prod.id, 'Size & Fit', 'Fit', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Slim Fit' WHEN 1 THEN 'Regular Fit' WHEN 2 THEN 'Relaxed Fit' ELSE 'Oversized' END, 12),
            (prod.id, 'Size & Fit', 'Length', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Regular' WHEN 1 THEN 'Long' WHEN 2 THEN 'Cropped' ELSE 'Standard' END, 13),
            (prod.id, 'Size & Fit', 'Chest', ROUND((RANDOM() * 20 + 90)::NUMERIC, 0)::TEXT || ' cm', 14),
            (prod.id, 'Size & Fit', 'Waist', ROUND((RANDOM() * 20 + 70)::NUMERIC, 0)::TEXT || ' cm', 15),

            -- Material & Care
            (prod.id, 'Material & Care', 'Material', CASE (RANDOM()*5)::INT WHEN 0 THEN '100% Italian Merino Wool' WHEN 1 THEN '95% Egyptian Cotton, 5% Elastane' WHEN 2 THEN '100% Silk' WHEN 3 THEN '70% Cashmere, 30% Silk' ELSE '100% Organic Cotton' END, 20),
            (prod.id, 'Material & Care', 'Fabric Type', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Knit' WHEN 1 THEN 'Woven' WHEN 2 THEN 'Jersey' ELSE 'Twill' END, 21),
            (prod.id, 'Material & Care', 'Lining', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Fully Lined - 100% Cupro' WHEN 1 THEN 'Partially Lined' ELSE 'Unlined' END, 22),
            (prod.id, 'Material & Care', 'Care Instructions', 'Dry clean only. Do not bleach. Iron on low heat. Store in garment bag.', 23),
            (prod.id, 'Material & Care', 'Fabric Weight', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Lightweight (150 GSM)' WHEN 1 THEN 'Medium Weight (250 GSM)' WHEN 2 THEN 'Heavyweight (350 GSM)' ELSE 'Ultra-Light (100 GSM)' END, 24),

            -- Design Details
            (prod.id, 'Design Details', 'Color', CASE (RANDOM()*6)::INT WHEN 0 THEN 'Navy Blue' WHEN 1 THEN 'Charcoal Grey' WHEN 2 THEN 'Burgundy' WHEN 3 THEN 'Cream' WHEN 4 THEN 'Forest Green' ELSE 'Black' END, 30),
            (prod.id, 'Design Details', 'Pattern', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Solid' WHEN 1 THEN 'Striped' WHEN 2 THEN 'Plaid' WHEN 3 THEN 'GG Monogram' ELSE 'Geometric' END, 31),
            (prod.id, 'Design Details', 'Closure', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Button Front' WHEN 1 THEN 'Zipper' WHEN 2 THEN 'Pull Over' ELSE 'Hook & Eye' END, 32),
            (prod.id, 'Design Details', 'Neckline', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Crew Neck' WHEN 1 THEN 'V-Neck' WHEN 2 THEN 'Turtleneck' ELSE 'Collar' END, 33),
            (prod.id, 'Design Details', 'Sleeve Length', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Long Sleeve' WHEN 1 THEN 'Short Sleeve' WHEN 2 THEN '3/4 Sleeve' ELSE 'Sleeveless' END, 34),

            -- Authenticity
            (prod.id, 'Authenticity', 'Authenticity', '100% Authentic - Guaranteed', 40),
            (prod.id, 'Authenticity', 'Serial Number', 'Included with original tags', 41),
            (prod.id, 'Authenticity', 'Country of Origin', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Made in Italy' WHEN 1 THEN 'Made in France' WHEN 2 THEN 'Made in Portugal' ELSE 'Made in Japan' END, 42),
            (prod.id, 'Authenticity', 'Retail Price', '$' || ROUND((RANDOM() * 2000 + 500)::NUMERIC, 0)::TEXT, 43);

        -- =====================================================
        -- HOME & GARDEN SPECIFICATIONS
        -- =====================================================
        ELSIF cat_name ILIKE '%home%' OR cat_name ILIKE '%garden%' OR cat_name ILIKE '%furniture%'
              OR prod.title ILIKE '%sofa%' OR prod.title ILIKE '%table%' OR prod.title ILIKE '%chair%'
              OR prod.title ILIKE '%grill%' OR prod.title ILIKE '%dyson%' OR prod.title ILIKE '%kitchen%'
        THEN
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, CASE (RANDOM()*4)::INT WHEN 0 THEN 'West Elm' WHEN 1 THEN 'Pottery Barn' WHEN 2 THEN 'IKEA' ELSE 'Crate & Barrel' END), 1),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, 'Premium Series'), 2),
            (prod.id, 'Item Specifics', 'Room', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Living Room' WHEN 1 THEN 'Bedroom' WHEN 2 THEN 'Kitchen' WHEN 3 THEN 'Dining Room' ELSE 'Outdoor/Patio' END, 3),
            (prod.id, 'Item Specifics', 'Style', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Modern' WHEN 1 THEN 'Contemporary' WHEN 2 THEN 'Mid-Century Modern' WHEN 3 THEN 'Industrial' ELSE 'Farmhouse' END, 4),
            (prod.id, 'Item Specifics', 'Type', 'Home Furnishing', 5),

            -- Dimensions
            (prod.id, 'Dimensions', 'Overall Height', ROUND((RANDOM() * 100 + 30)::NUMERIC, 1)::TEXT || ' inches', 10),
            (prod.id, 'Dimensions', 'Overall Width', ROUND((RANDOM() * 80 + 20)::NUMERIC, 1)::TEXT || ' inches', 11),
            (prod.id, 'Dimensions', 'Overall Depth', ROUND((RANDOM() * 40 + 15)::NUMERIC, 1)::TEXT || ' inches', 12),
            (prod.id, 'Dimensions', 'Seat Height', ROUND((RANDOM() * 10 + 16)::NUMERIC, 1)::TEXT || ' inches', 13),
            (prod.id, 'Dimensions', 'Weight Capacity', ROUND((RANDOM() * 200 + 250)::NUMERIC, 0)::TEXT || ' lbs', 14),
            (prod.id, 'Dimensions', 'Item Weight', ROUND((RANDOM() * 100 + 20)::NUMERIC, 1)::TEXT || ' lbs', 15),

            -- Materials & Construction
            (prod.id, 'Materials & Construction', 'Frame Material', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Solid Oak Wood' WHEN 1 THEN 'Kiln-Dried Hardwood' WHEN 2 THEN 'Steel Frame' ELSE 'Engineered Wood' END, 20),
            (prod.id, 'Materials & Construction', 'Upholstery Material', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Top-Grain Leather' WHEN 1 THEN 'Performance Velvet' WHEN 2 THEN 'Linen Blend' ELSE 'Sunbrella Fabric' END, 21),
            (prod.id, 'Materials & Construction', 'Fill Material', CASE (RANDOM()*3)::INT WHEN 0 THEN 'High-Density Foam with Down Wrap' WHEN 1 THEN 'Memory Foam' ELSE 'Polyester Fiber Fill' END, 22),
            (prod.id, 'Materials & Construction', 'Leg Material', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Solid Walnut' WHEN 1 THEN 'Brushed Brass' WHEN 2 THEN 'Matte Black Metal' ELSE 'Chrome' END, 23),
            (prod.id, 'Materials & Construction', 'Finish', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Natural Oil Finish' WHEN 1 THEN 'Lacquered' WHEN 2 THEN 'Hand-Rubbed Stain' ELSE 'Powder Coated' END, 24),

            -- Features
            (prod.id, 'Features', 'Assembly Required', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Yes - Tools included, 30 min assembly' WHEN 1 THEN 'Minimal Assembly Required' ELSE 'No Assembly Required - White Glove Delivery' END, 30),
            (prod.id, 'Features', 'Number of Pieces', CASE (RANDOM()*4)::INT WHEN 0 THEN '1' WHEN 1 THEN '2' WHEN 2 THEN '3' ELSE '5-Piece Set' END, 31),
            (prod.id, 'Features', 'Adjustable', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Yes - Multiple positions' WHEN 1 THEN 'Height Adjustable' ELSE 'Fixed' END, 32),
            (prod.id, 'Features', 'Storage Included', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Yes - Hidden storage compartment' WHEN 1 THEN 'Drawers included' ELSE 'No' END, 33),
            (prod.id, 'Features', 'Removable Cushions', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Yes - Machine washable covers' ELSE 'No' END, 34),

            -- Care & Warranty
            (prod.id, 'Care & Warranty', 'Care Instructions', 'Vacuum regularly. Spot clean with mild soap. Professional cleaning recommended annually.', 40),
            (prod.id, 'Care & Warranty', 'Warranty', CASE (RANDOM()*3)::INT WHEN 0 THEN '5-Year Limited Warranty' WHEN 1 THEN 'Lifetime Frame Warranty' WHEN 2 THEN '10-Year Manufacturer Warranty' ELSE '2-Year Full Warranty' END, 41),
            (prod.id, 'Care & Warranty', 'Indoor/Outdoor', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Indoor Use Only' WHEN 1 THEN 'Indoor/Outdoor' ELSE 'Outdoor with Cover' END, 42),
            (prod.id, 'Care & Warranty', 'UV Protection', CASE (RANDOM()*2)::INT WHEN 0 THEN 'UV-Resistant Fabric' ELSE 'Standard' END, 43);

        -- =====================================================
        -- SPORTS & FITNESS SPECIFICATIONS
        -- =====================================================
        ELSIF cat_name ILIKE '%sport%' OR cat_name ILIKE '%fitness%' OR cat_name ILIKE '%outdoor%'
              OR prod.title ILIKE '%golf%' OR prod.title ILIKE '%bike%' OR prod.title ILIKE '%running%'
              OR prod.title ILIKE '%tennis%' OR prod.title ILIKE '%yoga%'
        THEN
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, CASE (RANDOM()*5)::INT WHEN 0 THEN 'Titleist' WHEN 1 THEN 'Callaway' WHEN 2 THEN 'TaylorMade' WHEN 3 THEN 'Nike' ELSE 'Under Armour' END), 1),
            (prod.id, 'Item Specifics', 'Sport/Activity', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Golf' WHEN 1 THEN 'Running' WHEN 2 THEN 'Tennis' WHEN 3 THEN 'Fitness/Gym' ELSE 'Cycling' END, 2),
            (prod.id, 'Item Specifics', 'Type', 'Professional Grade Equipment', 3),
            (prod.id, 'Item Specifics', 'Skill Level', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Beginner' WHEN 1 THEN 'Intermediate' WHEN 2 THEN 'Advanced/Professional' ELSE 'All Levels' END, 4),
            (prod.id, 'Item Specifics', 'Gender', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Men''s' WHEN 1 THEN 'Women''s' ELSE 'Unisex' END, 5),

            -- Technical Specs
            (prod.id, 'Technical Specifications', 'Material', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Carbon Fiber Composite' WHEN 1 THEN 'Titanium Alloy' WHEN 2 THEN 'Forged Steel' ELSE 'Graphite' END, 10),
            (prod.id, 'Technical Specifications', 'Weight', ROUND((RANDOM() * 5 + 0.5)::NUMERIC, 2)::TEXT || ' lbs', 11),
            (prod.id, 'Technical Specifications', 'Loft Angle', CASE (RANDOM()*4)::INT WHEN 0 THEN '9.5°' WHEN 1 THEN '10.5°' WHEN 2 THEN '12°' ELSE 'Adjustable 8°-12°' END, 12),
            (prod.id, 'Technical Specifications', 'Shaft Flex', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Regular' WHEN 1 THEN 'Stiff' WHEN 2 THEN 'Extra Stiff' ELSE 'Senior' END, 13),
            (prod.id, 'Technical Specifications', 'Grip', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Golf Pride Tour Velvet' WHEN 1 THEN 'SuperStroke S-Tech' ELSE 'Lamkin Crossline' END, 14),
            (prod.id, 'Technical Specifications', 'Length', ROUND((RANDOM() * 10 + 40)::NUMERIC, 1)::TEXT || ' inches', 15),

            -- Performance Features
            (prod.id, 'Performance Features', 'Forgiveness', 'High - Oversized sweet spot technology', 16),
            (prod.id, 'Performance Features', 'Launch', 'Mid-High launch with low spin', 17),
            (prod.id, 'Performance Features', 'Ball Speed', 'Optimized COR for maximum distance', 18),
            (prod.id, 'Performance Features', 'Sound/Feel', 'Solid, muted impact sound', 19),
            (prod.id, 'Performance Features', 'Adjustability', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Adjustable hosel - 4 settings' WHEN 1 THEN 'Moveable weights' ELSE 'Fixed' END, 20),

            -- What''s Included
            (prod.id, 'What''s Included', 'Headcover', 'Premium leather headcover included', 25),
            (prod.id, 'What''s Included', 'Wrench/Tool', 'Adjustment wrench included', 26),
            (prod.id, 'What''s Included', 'Manual', 'User guide and fitting chart', 27),
            (prod.id, 'What''s Included', 'Warranty Card', 'Product registration card', 28),

            -- Certifications
            (prod.id, 'Certifications', 'Conforming', 'USGA and R&A Conforming', 30),
            (prod.id, 'Certifications', 'Tour Played', 'Used by PGA Tour professionals', 31),
            (prod.id, 'Certifications', 'Awards', '2024 Golf Digest Hot List - Gold', 32);

        -- =====================================================
        -- COLLECTIBLES/VINTAGE SPECIFICATIONS
        -- =====================================================
        ELSIF cat_name ILIKE '%collect%' OR cat_name ILIKE '%antique%' OR cat_name ILIKE '%vintage%'
              OR prod.title ILIKE '%vintage%' OR prod.title ILIKE '%rare%' OR prod.title ILIKE '%antique%'
        THEN
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Era/Period', CASE (RANDOM()*5)::INT WHEN 0 THEN '1950s' WHEN 1 THEN '1960s' WHEN 2 THEN '1970s' WHEN 3 THEN 'Art Deco (1920-1940)' ELSE 'Mid-Century Modern' END, 1),
            (prod.id, 'Item Specifics', 'Maker/Brand', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Original Manufacturer Unknown' WHEN 1 THEN 'Signed by Artist' WHEN 2 THEN 'Estate Find' ELSE 'Verified Maker Mark' END, 2),
            (prod.id, 'Item Specifics', 'Origin', CASE (RANDOM()*4)::INT WHEN 0 THEN 'United States' WHEN 1 THEN 'France' WHEN 2 THEN 'Japan' ELSE 'Italy' END, 3),
            (prod.id, 'Item Specifics', 'Type', 'Vintage Collectible', 4),
            (prod.id, 'Item Specifics', 'Rarity', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Extremely Rare - Less than 100 known' WHEN 1 THEN 'Rare - Limited Production' WHEN 2 THEN 'Uncommon' ELSE 'Scarce' END, 5),

            -- Condition Details
            (prod.id, 'Condition Details', 'Overall Condition', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Excellent - Museum Quality' WHEN 1 THEN 'Very Good - Minor wear' WHEN 2 THEN 'Good - Age appropriate patina' ELSE 'Fair - Visible wear' END, 10),
            (prod.id, 'Condition Details', 'Original Parts', CASE (RANDOM()*2)::INT WHEN 0 THEN '100% Original - No replacements' WHEN 1 THEN 'Mostly original with documented restoration' ELSE 'Period-correct replacement parts' END, 11),
            (prod.id, 'Condition Details', 'Patina', 'Beautiful natural patina consistent with age', 12),
            (prod.id, 'Condition Details', 'Repairs', CASE (RANDOM()*2)::INT WHEN 0 THEN 'No repairs - All original' WHEN 1 THEN 'Professional restoration documented' ELSE 'Minor period repairs' END, 13),
            (prod.id, 'Condition Details', 'Functionality', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Fully functional' WHEN 1 THEN 'Display piece only' ELSE 'Working condition' END, 14),

            -- Provenance
            (prod.id, 'Provenance', 'Previous Ownership', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Single owner estate' WHEN 1 THEN 'Private collection' WHEN 2 THEN 'Gallery deaccession' ELSE 'Documented chain of ownership' END, 20),
            (prod.id, 'Provenance', 'Documentation', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Original paperwork included' WHEN 1 THEN 'Certificate of Authenticity included' WHEN 2 THEN 'Appraisal document available' ELSE 'Provenance letter' END, 21),
            (prod.id, 'Provenance', 'Exhibition History', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Previously exhibited' WHEN 1 THEN 'Private collection, never exhibited' ELSE 'N/A' END, 22),
            (prod.id, 'Provenance', 'Publication', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Featured in collector''s guide' ELSE 'Unpublished' END, 23),

            -- Dimensions & Materials
            (prod.id, 'Dimensions & Materials', 'Height', ROUND((RANDOM() * 30 + 5)::NUMERIC, 1)::TEXT || ' inches', 30),
            (prod.id, 'Dimensions & Materials', 'Width', ROUND((RANDOM() * 20 + 3)::NUMERIC, 1)::TEXT || ' inches', 31),
            (prod.id, 'Dimensions & Materials', 'Depth', ROUND((RANDOM() * 15 + 2)::NUMERIC, 1)::TEXT || ' inches', 32),
            (prod.id, 'Dimensions & Materials', 'Material', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Sterling Silver' WHEN 1 THEN 'Solid Brass' WHEN 2 THEN 'Porcelain' ELSE 'Crystal' END, 33),
            (prod.id, 'Dimensions & Materials', 'Weight', ROUND((RANDOM() * 10 + 0.5)::NUMERIC, 2)::TEXT || ' lbs', 34),

            -- Value
            (prod.id, 'Value', 'Estimated Value', '$' || ROUND((RANDOM() * 5000 + 500)::NUMERIC, 0)::TEXT || ' - $' || ROUND((RANDOM() * 10000 + 6000)::NUMERIC, 0)::TEXT, 40),
            (prod.id, 'Value', 'Insurance Value', '$' || ROUND((RANDOM() * 15000 + 2000)::NUMERIC, 0)::TEXT, 41),
            (prod.id, 'Value', 'Last Auction Price', 'Similar items sold for $' || ROUND((RANDOM() * 8000 + 1000)::NUMERIC, 0)::TEXT, 42);

        -- =====================================================
        -- DEFAULT/GENERAL SPECIFICATIONS (for all other products)
        -- =====================================================
        ELSE
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, 'Unbranded'), 1),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, 'Standard'), 2),
            (prod.id, 'Item Specifics', 'Type', 'General Merchandise', 3),
            (prod.id, 'Item Specifics', 'MPN', 'MPN-' || UPPER(LEFT(MD5(prod.id::text), 8)), 4),
            (prod.id, 'Item Specifics', 'UPC', 'Does not apply', 5),
            (prod.id, 'Item Specifics', 'Country/Region of Manufacture', 'United States', 6),
            (prod.id, 'Item Specifics', 'Condition', prod.condition, 7),

            -- Physical Specifications
            (prod.id, 'Physical Specifications', 'Color', CASE (RANDOM()*5)::INT WHEN 0 THEN 'Black' WHEN 1 THEN 'White' WHEN 2 THEN 'Blue' WHEN 3 THEN 'Red' ELSE 'Gray' END, 10),
            (prod.id, 'Physical Specifications', 'Size', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Small' WHEN 1 THEN 'Medium' WHEN 2 THEN 'Large' ELSE 'Standard' END, 11),
            (prod.id, 'Physical Specifications', 'Material', CASE (RANDOM()*4)::INT WHEN 0 THEN 'Plastic' WHEN 1 THEN 'Metal' WHEN 2 THEN 'Wood' ELSE 'Composite' END, 12),
            (prod.id, 'Physical Specifications', 'Weight', ROUND((RANDOM() * 10 + 0.5)::NUMERIC, 2)::TEXT || ' lbs', 13),
            (prod.id, 'Physical Specifications', 'Dimensions', ROUND((RANDOM() * 20 + 5)::NUMERIC, 1)::TEXT || ' x ' || ROUND((RANDOM() * 15 + 3)::NUMERIC, 1)::TEXT || ' x ' || ROUND((RANDOM() * 10 + 2)::NUMERIC, 1)::TEXT || ' inches', 14),

            -- Product Details
            (prod.id, 'Product Details', 'Package Quantity', '1', 20),
            (prod.id, 'Product Details', 'Features', 'High quality construction, Durable materials', 21),
            (prod.id, 'Product Details', 'Included Accessories', 'User manual, Warranty card', 22),
            (prod.id, 'Product Details', 'Power Source', CASE (RANDOM()*3)::INT WHEN 0 THEN 'Battery Powered' WHEN 1 THEN 'AC Power' WHEN 2 THEN 'USB Rechargeable' ELSE 'Manual/No Power' END, 23),
            (prod.id, 'Product Details', 'Usage', CASE (RANDOM()*2)::INT WHEN 0 THEN 'Indoor' WHEN 1 THEN 'Outdoor' ELSE 'Indoor/Outdoor' END, 24),

            -- Warranty & Support
            (prod.id, 'Warranty & Support', 'Warranty', CASE (RANDOM()*3)::INT WHEN 0 THEN '1 Year Limited Warranty' WHEN 1 THEN '90-Day Warranty' WHEN 2 THEN '2 Year Manufacturer Warranty' ELSE 'No Warranty' END, 30),
            (prod.id, 'Warranty & Support', 'Return Policy', '30-Day Money Back Guarantee', 31),
            (prod.id, 'Warranty & Support', 'Customer Support', 'Email and phone support available', 32);
        END IF;

    END LOOP;

    RAISE NOTICE 'Product specifications generated successfully!';
END $$;

-- =====================================================
-- 3. SUMMARY REPORT
-- =====================================================

SELECT '=== PRODUCT SPECIFICATIONS SUMMARY ===' as report;

SELECT
    COUNT(DISTINCT product_id) as products_with_specs,
    COUNT(*) as total_specifications,
    ROUND(AVG(spec_count), 1) as avg_specs_per_product,
    MIN(spec_count) as min_specs,
    MAX(spec_count) as max_specs
FROM (
    SELECT product_id, COUNT(*) as spec_count
    FROM product_specifications
    GROUP BY product_id
) counts;

SELECT '=== SPECS BY GROUP ===' as report;
SELECT spec_group, COUNT(*) as count
FROM product_specifications
GROUP BY spec_group
ORDER BY count DESC
LIMIT 10;

SELECT '=== SAMPLE PRODUCT SPECS ===' as report;
SELECT p.title, ps.spec_group, ps.spec_name, ps.spec_value
FROM product_specifications ps
JOIN products p ON ps.product_id = p.id
WHERE p.title ILIKE '%iphone%' OR p.title ILIKE '%macbook%'
ORDER BY p.title, ps.display_order
LIMIT 20;
