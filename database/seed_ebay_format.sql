-- =====================================================
-- EBAY-STYLE PRODUCT DATA FOR ALL PRODUCTS
-- This creates the exact structure like real eBay listings
-- =====================================================

-- Clear existing specifications
TRUNCATE product_specifications;

-- =====================================================
-- 1. SEED ALL PRODUCTS WITH EBAY-STYLE SPECIFICATIONS
-- =====================================================

DO $$
DECLARE
    prod RECORD;
    cat_name TEXT;
    year_made TEXT;
BEGIN
    -- Loop through all products
    FOR prod IN
        SELECT p.id, p.title, p.brand, p.model, p.condition, p.color, p.sku,
               c.name as category_name, p.created_at
        FROM products p
        JOIN categories c ON p.category_id = c.id
    LOOP
        cat_name := LOWER(prod.category_name);
        year_made := EXTRACT(YEAR FROM prod.created_at)::TEXT;

        -- =====================================================
        -- ELECTRONICS (TVs, Phones, Laptops, Gaming)
        -- =====================================================
        IF cat_name ILIKE '%electronic%' OR cat_name ILIKE '%computer%' OR cat_name ILIKE '%phone%'
           OR prod.title ILIKE '%tv%' OR prod.title ILIKE '%iphone%' OR prod.title ILIKE '%macbook%'
           OR prod.title ILIKE '%samsung%' OR prod.title ILIKE '%laptop%' OR prod.title ILIKE '%tablet%'
           OR prod.title ILIKE '%playstation%' OR prod.title ILIKE '%xbox%' OR prod.title ILIKE '%nintendo%'
           OR prod.title ILIKE '%oled%' OR prod.title ILIKE '%monitor%' OR prod.title ILIKE '%airpods%'
        THEN
            -- ITEM SPECIFICS (Two-column eBay style)
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Condition', CASE prod.condition
                WHEN 'new' THEN 'New: A brand-new, unused, unopened, undamaged item in its original packaging (where packaging is applicable). Packaging should be the same as what is found in a retail store.'
                WHEN 'like_new' THEN 'Open Box: An item in excellent, new condition with no functional defects. May have been opened for inspection.'
                WHEN 'very_good' THEN 'Certified Refurbished: Professionally inspected, cleaned, and repaired to meet manufacturer specifications.'
                WHEN 'good' THEN 'Seller Refurbished: Item has been restored to working order by the seller. Shows some wear.'
                ELSE 'Used: An item that has been used previously. May have cosmetic wear.'
            END, 1),
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand,
                CASE
                    WHEN prod.title ILIKE '%lg%' THEN 'LG'
                    WHEN prod.title ILIKE '%samsung%' THEN 'Samsung'
                    WHEN prod.title ILIKE '%sony%' THEN 'Sony'
                    WHEN prod.title ILIKE '%apple%' OR prod.title ILIKE '%iphone%' OR prod.title ILIKE '%macbook%' OR prod.title ILIKE '%ipad%' THEN 'Apple'
                    WHEN prod.title ILIKE '%dell%' THEN 'Dell'
                    WHEN prod.title ILIKE '%hp%' THEN 'HP'
                    WHEN prod.title ILIKE '%playstation%' THEN 'Sony'
                    WHEN prod.title ILIKE '%xbox%' THEN 'Microsoft'
                    WHEN prod.title ILIKE '%nintendo%' THEN 'Nintendo'
                    ELSE 'Premium Brand'
                END), 2),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, UPPER(LEFT(MD5(prod.title), 10))), 3),
            (prod.id, 'Item Specifics', 'MPN', 'MPN-' || UPPER(LEFT(MD5(prod.id::text), 12)), 4),
            (prod.id, 'Item Specifics', 'UPC', LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'), 5),
            (prod.id, 'Item Specifics', 'EAN', LPAD((RANDOM() * 9999999999999)::BIGINT::TEXT, 13, '0'), 6),
            (prod.id, 'Item Specifics', 'Type', CASE
                WHEN prod.title ILIKE '%tv%' OR prod.title ILIKE '%oled%' THEN 'Smart TV'
                WHEN prod.title ILIKE '%phone%' OR prod.title ILIKE '%iphone%' THEN 'Smartphone'
                WHEN prod.title ILIKE '%laptop%' OR prod.title ILIKE '%macbook%' THEN 'Laptop'
                WHEN prod.title ILIKE '%tablet%' OR prod.title ILIKE '%ipad%' THEN 'Tablet'
                WHEN prod.title ILIKE '%playstation%' OR prod.title ILIKE '%xbox%' THEN 'Gaming Console'
                WHEN prod.title ILIKE '%airpods%' OR prod.title ILIKE '%headphone%' THEN 'Headphones'
                ELSE 'Consumer Electronics'
            END, 7),
            (prod.id, 'Item Specifics', 'Year Manufactured', year_made, 8),
            (prod.id, 'Item Specifics', 'Color', COALESCE(prod.color, CASE (RANDOM()*5)::INT
                WHEN 0 THEN 'Black' WHEN 1 THEN 'Silver' WHEN 2 THEN 'Space Gray'
                WHEN 3 THEN 'White' ELSE 'Graphite' END), 9),
            (prod.id, 'Item Specifics', 'Connectivity', 'Wi-Fi, Bluetooth, USB, HDMI', 10),
            (prod.id, 'Item Specifics', 'Features', 'Smart Features, Voice Control, HDR Support, Remote Included, Energy Star Certified', 11),
            (prod.id, 'Item Specifics', 'Country/Region of Manufacture', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'China' WHEN 1 THEN 'South Korea' WHEN 2 THEN 'Vietnam' ELSE 'Taiwan' END, 12),
            (prod.id, 'Item Specifics', 'Item Height', ROUND((RANDOM() * 30 + 5)::NUMERIC, 1)::TEXT || ' inches', 13),
            (prod.id, 'Item Specifics', 'Item Width', ROUND((RANDOM() * 50 + 10)::NUMERIC, 1)::TEXT || ' inches', 14),
            (prod.id, 'Item Specifics', 'Item Weight', ROUND((RANDOM() * 40 + 1)::NUMERIC, 1)::TEXT || ' lbs', 15);

            -- KEY FEATURES (Bullet points like eBay)
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Key Features', 'Premium Display Technology', 'Crystal-clear picture quality with vibrant colors and deep blacks for an immersive viewing experience.', 20),
            (prod.id, 'Key Features', 'Smart Platform', 'Built-in smart features with access to thousands of apps including Netflix, YouTube, Disney+, and more.', 21),
            (prod.id, 'Key Features', 'Voice Control', 'Works with Google Assistant, Alexa, and Siri for hands-free control of your device.', 22),
            (prod.id, 'Key Features', 'Fast Processor', 'Powered by advanced AI processor for lightning-fast performance and seamless multitasking.', 23),
            (prod.id, 'Key Features', 'Premium Audio', 'Immersive sound with Dolby Atmos support and AI-enhanced audio for theater-quality experience.', 24),
            (prod.id, 'Key Features', 'Gaming Ready', 'Low input lag, variable refresh rate (VRR), and game mode for competitive gaming performance.', 25),
            (prod.id, 'Key Features', 'Multiple Connectivity', 'Multiple HDMI 2.1 ports, USB ports, Bluetooth 5.0, and Wi-Fi 6 for all your devices.', 26),
            (prod.id, 'Key Features', 'Energy Efficient', 'Energy Star certified with eco-friendly power saving modes to reduce electricity consumption.', 27),
            (prod.id, 'Key Features', 'Sleek Design', 'Ultra-slim profile with premium materials and virtually borderless display.', 28),
            (prod.id, 'Key Features', 'Easy Setup', 'Quick setup wizard and intuitive interface makes installation a breeze.', 29);

            -- SPECIFICATIONS (Technical details)
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Specifications', 'Screen Size', CASE
                WHEN prod.title ILIKE '%65%' THEN '65" (64.5" Diagonal)'
                WHEN prod.title ILIKE '%55%' THEN '55" (54.6" Diagonal)'
                WHEN prod.title ILIKE '%75%' THEN '75" (74.5" Diagonal)'
                WHEN prod.title ILIKE '%iphone%' THEN '6.7" Super Retina XDR'
                WHEN prod.title ILIKE '%ipad%' THEN '12.9" Liquid Retina XDR'
                WHEN prod.title ILIKE '%macbook%' THEN '16.2" Liquid Retina XDR'
                ELSE ROUND((RANDOM() * 30 + 40)::NUMERIC, 0)::TEXT || '" Display'
            END, 30),
            (prod.id, 'Specifications', 'Display Type', CASE
                WHEN prod.title ILIKE '%oled%' THEN 'OLED evo'
                WHEN prod.title ILIKE '%qled%' THEN 'QLED'
                ELSE 'LED/LCD with HDR'
            END, 31),
            (prod.id, 'Specifications', 'Resolution', CASE
                WHEN prod.title ILIKE '%8k%' THEN '8K Ultra HD (7680 x 4320)'
                WHEN prod.title ILIKE '%iphone%' THEN '2796 x 1290 pixels at 460 ppi'
                ELSE '4K Ultra HD (3840 x 2160)'
            END, 32),
            (prod.id, 'Specifications', 'Refresh Rate', CASE (RANDOM()*2)::INT
                WHEN 0 THEN '120Hz Native (up to 144Hz with VRR)'
                WHEN 1 THEN '120Hz ProMotion'
                ELSE '60Hz'
            END, 33),
            (prod.id, 'Specifications', 'Processor', CASE
                WHEN prod.title ILIKE '%lg%' THEN 'α9 AI Processor 4K Gen8'
                WHEN prod.title ILIKE '%samsung%' THEN 'Neural Quantum Processor 4K'
                WHEN prod.title ILIKE '%apple%' OR prod.title ILIKE '%iphone%' THEN 'A17 Pro chip with 6-core CPU'
                WHEN prod.title ILIKE '%macbook%' THEN 'Apple M3 Max chip'
                ELSE 'Quad-Core AI Processor'
            END, 34),
            (prod.id, 'Specifications', 'HDR Support', 'Dolby Vision IQ, HDR10, HDR10+, HLG', 35),
            (prod.id, 'Specifications', 'Smart Platform', CASE
                WHEN prod.title ILIKE '%lg%' THEN 'webOS 24'
                WHEN prod.title ILIKE '%samsung%' THEN 'Tizen OS'
                WHEN prod.title ILIKE '%apple%' THEN 'iOS 17 / macOS Sonoma'
                ELSE 'Smart TV OS'
            END, 36),
            (prod.id, 'Specifications', 'Voice Control', 'Built-in Alexa, Google Assistant, Apple HomeKit, Matter compatible', 37),
            (prod.id, 'Specifications', 'Audio', '2.2 Channel | 40W | Dolby Atmos | AI Sound Pro (Virtual 11.1.2 up-mix)', 38),
            (prod.id, 'Specifications', 'HDMI', '4x HDMI 2.1 (Supports 4K 120Hz, eARC, VRR, ALLM)', 39),
            (prod.id, 'Specifications', 'USB', '3x USB 2.0', 40),
            (prod.id, 'Specifications', 'Wi-Fi', 'Wi-Fi 6E (802.11ax)', 41),
            (prod.id, 'Specifications', 'Bluetooth', 'Bluetooth 5.3', 42),
            (prod.id, 'Specifications', 'Gaming Features', 'G-Sync Compatible, FreeSync Premium, Game Optimizer, HGiG, ALLM, 0.1ms Response Time', 43),
            (prod.id, 'Specifications', 'Dimensions (without stand)', '56.7" x 32.5" x 1.8"', 44),
            (prod.id, 'Specifications', 'Dimensions (with stand)', '56.7" x 34.6" x 9.1"', 45),
            (prod.id, 'Specifications', 'Weight (without stand)', ROUND((RANDOM() * 30 + 20)::NUMERIC, 1)::TEXT || ' lbs', 46),
            (prod.id, 'Specifications', 'Weight (with stand)', ROUND((RANDOM() * 35 + 25)::NUMERIC, 1)::TEXT || ' lbs', 47),
            (prod.id, 'Specifications', 'Power Consumption', ROUND((RANDOM() * 150 + 100)::NUMERIC, 0)::TEXT || 'W (Typical)', 48),
            (prod.id, 'Specifications', 'Warranty', '1-Year Manufacturer Warranty', 49);

        -- =====================================================
        -- FASHION & CLOTHING
        -- =====================================================
        ELSIF cat_name ILIKE '%fashion%' OR cat_name ILIKE '%cloth%' OR cat_name ILIKE '%apparel%'
              OR prod.title ILIKE '%shirt%' OR prod.title ILIKE '%dress%' OR prod.title ILIKE '%jacket%'
              OR prod.title ILIKE '%gucci%' OR prod.title ILIKE '%nike%' OR prod.title ILIKE '%sweater%'
              OR prod.title ILIKE '%pants%' OR prod.title ILIKE '%shoe%'
        THEN
            -- ITEM SPECIFICS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Condition', CASE prod.condition
                WHEN 'new' THEN 'New with tags: A brand-new, unused, and unworn item with all original tags attached.'
                WHEN 'like_new' THEN 'New without tags: A brand-new, unused item without original tags.'
                ELSE 'Pre-owned: An item that has been worn or used previously.'
            END, 1),
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, CASE
                WHEN prod.title ILIKE '%gucci%' THEN 'Gucci'
                WHEN prod.title ILIKE '%nike%' THEN 'Nike'
                WHEN prod.title ILIKE '%adidas%' THEN 'Adidas'
                WHEN prod.title ILIKE '%louis vuitton%' THEN 'Louis Vuitton'
                WHEN prod.title ILIKE '%prada%' THEN 'Prada'
                ELSE 'Designer Brand'
            END), 2),
            (prod.id, 'Item Specifics', 'Size', CASE (RANDOM()*5)::INT
                WHEN 0 THEN 'S' WHEN 1 THEN 'M' WHEN 2 THEN 'L' WHEN 3 THEN 'XL' ELSE 'XXL' END, 3),
            (prod.id, 'Item Specifics', 'Size Type', 'Regular', 4),
            (prod.id, 'Item Specifics', 'Color', COALESCE(prod.color, CASE (RANDOM()*6)::INT
                WHEN 0 THEN 'Black' WHEN 1 THEN 'Navy Blue' WHEN 2 THEN 'White'
                WHEN 3 THEN 'Gray' WHEN 4 THEN 'Burgundy' ELSE 'Cream' END), 5),
            (prod.id, 'Item Specifics', 'Material', CASE (RANDOM()*4)::INT
                WHEN 0 THEN '100% Italian Wool' WHEN 1 THEN '95% Cotton, 5% Elastane'
                WHEN 2 THEN '100% Silk' ELSE '70% Cashmere, 30% Wool' END, 6),
            (prod.id, 'Item Specifics', 'Style', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Casual' WHEN 1 THEN 'Formal' WHEN 2 THEN 'Athletic' ELSE 'Streetwear' END, 7),
            (prod.id, 'Item Specifics', 'Department', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Men' WHEN 1 THEN 'Women' ELSE 'Unisex' END, 8),
            (prod.id, 'Item Specifics', 'Season', 'Fall/Winter ' || year_made, 9),
            (prod.id, 'Item Specifics', 'Pattern', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Solid' WHEN 1 THEN 'Striped' WHEN 2 THEN 'Plaid' ELSE 'Logo/Monogram' END, 10),
            (prod.id, 'Item Specifics', 'Closure', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Button' WHEN 1 THEN 'Zipper' ELSE 'Pull Over' END, 11),
            (prod.id, 'Item Specifics', 'Country/Region of Manufacture', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Italy' WHEN 1 THEN 'France' WHEN 2 THEN 'Portugal' ELSE 'Japan' END, 12),
            (prod.id, 'Item Specifics', 'Authenticity', '100% Authentic - Certificate Included', 13);

            -- KEY FEATURES
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Key Features', 'Premium Materials', 'Crafted from the finest materials sourced from renowned mills for exceptional quality and comfort.', 20),
            (prod.id, 'Key Features', 'Expert Craftsmanship', 'Meticulously constructed by skilled artisans with attention to every detail and stitch.', 21),
            (prod.id, 'Key Features', 'Timeless Design', 'Classic silhouette that transcends seasonal trends for lasting style and versatility.', 22),
            (prod.id, 'Key Features', 'Perfect Fit', 'Tailored cut designed to flatter while providing comfort and ease of movement.', 23),
            (prod.id, 'Key Features', 'Luxury Details', 'Premium hardware, signature branding, and refined finishing touches throughout.', 24),
            (prod.id, 'Key Features', 'Versatile Styling', 'Easily transitions from casual to formal occasions for maximum wardrobe flexibility.', 25),
            (prod.id, 'Key Features', 'Sustainable Fashion', 'Responsibly sourced materials and ethical manufacturing practices.', 26),
            (prod.id, 'Key Features', 'Easy Care', 'Durable construction designed to maintain its beauty through proper care and cleaning.', 27);

            -- SPECIFICATIONS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Specifications', 'Fabric Weight', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Lightweight (150-200 GSM)' WHEN 1 THEN 'Medium Weight (250-350 GSM)'
                ELSE 'Heavyweight (400+ GSM)' END, 30),
            (prod.id, 'Specifications', 'Fit Type', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Slim Fit' WHEN 1 THEN 'Regular Fit' WHEN 2 THEN 'Relaxed Fit' ELSE 'Oversized' END, 31),
            (prod.id, 'Specifications', 'Sleeve Length', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Long Sleeve' WHEN 1 THEN 'Short Sleeve' ELSE '3/4 Sleeve' END, 32),
            (prod.id, 'Specifications', 'Neckline', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Crew Neck' WHEN 1 THEN 'V-Neck' WHEN 2 THEN 'Turtleneck' ELSE 'Collar' END, 33),
            (prod.id, 'Specifications', 'Length', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Regular Length' WHEN 1 THEN 'Long' ELSE 'Cropped' END, 34),
            (prod.id, 'Specifications', 'Lining', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Fully Lined - 100% Cupro' WHEN 1 THEN 'Partially Lined' ELSE 'Unlined' END, 35),
            (prod.id, 'Specifications', 'Care Instructions', 'Dry clean only. Do not bleach. Iron on low heat. Store in garment bag.', 36),
            (prod.id, 'Specifications', 'Chest Measurement', ROUND((RANDOM() * 20 + 38)::NUMERIC, 0)::TEXT || ' inches', 37),
            (prod.id, 'Specifications', 'Waist Measurement', ROUND((RANDOM() * 16 + 30)::NUMERIC, 0)::TEXT || ' inches', 38),
            (prod.id, 'Specifications', 'Hip Measurement', ROUND((RANDOM() * 16 + 36)::NUMERIC, 0)::TEXT || ' inches', 39),
            (prod.id, 'Specifications', 'Inseam', ROUND((RANDOM() * 6 + 30)::NUMERIC, 0)::TEXT || ' inches', 40),
            (prod.id, 'Specifications', 'Model Height', '6''1" / 185 cm (wearing size M)', 41),
            (prod.id, 'Specifications', 'Retail Price', '$' || ROUND((RANDOM() * 2000 + 500)::NUMERIC, 0)::TEXT, 42);

        -- =====================================================
        -- HOME & GARDEN / FURNITURE
        -- =====================================================
        ELSIF cat_name ILIKE '%home%' OR cat_name ILIKE '%garden%' OR cat_name ILIKE '%furniture%'
              OR prod.title ILIKE '%sofa%' OR prod.title ILIKE '%table%' OR prod.title ILIKE '%chair%'
              OR prod.title ILIKE '%grill%' OR prod.title ILIKE '%dyson%' OR prod.title ILIKE '%kitchen%'
              OR prod.title ILIKE '%vacuum%' OR prod.title ILIKE '%bed%'
        THEN
            -- ITEM SPECIFICS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Condition', CASE prod.condition
                WHEN 'new' THEN 'New: A brand-new, unused item in its original packaging.'
                WHEN 'like_new' THEN 'Open Box: Item is in perfect condition, packaging may have been opened.'
                ELSE 'Pre-owned: An item that has been used previously.'
            END, 1),
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, CASE
                WHEN prod.title ILIKE '%dyson%' THEN 'Dyson'
                WHEN prod.title ILIKE '%weber%' THEN 'Weber'
                WHEN prod.title ILIKE '%kitchenaid%' THEN 'KitchenAid'
                ELSE 'Premium Home Brand'
            END), 2),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, 'PRO-' || UPPER(LEFT(MD5(prod.title), 8))), 3),
            (prod.id, 'Item Specifics', 'MPN', 'MPN-' || UPPER(LEFT(MD5(prod.id::text), 10)), 4),
            (prod.id, 'Item Specifics', 'UPC', LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'), 5),
            (prod.id, 'Item Specifics', 'Type', CASE
                WHEN prod.title ILIKE '%vacuum%' OR prod.title ILIKE '%dyson%' THEN 'Vacuum Cleaner'
                WHEN prod.title ILIKE '%grill%' THEN 'Gas Grill'
                WHEN prod.title ILIKE '%sofa%' THEN 'Sofa'
                WHEN prod.title ILIKE '%table%' THEN 'Table'
                ELSE 'Home Appliance'
            END, 6),
            (prod.id, 'Item Specifics', 'Room', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Living Room' WHEN 1 THEN 'Kitchen' WHEN 2 THEN 'Bedroom'
                WHEN 3 THEN 'Outdoor/Patio' ELSE 'Multi-Room' END, 7),
            (prod.id, 'Item Specifics', 'Style', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Modern' WHEN 1 THEN 'Contemporary' WHEN 2 THEN 'Mid-Century Modern'
                ELSE 'Industrial' END, 8),
            (prod.id, 'Item Specifics', 'Color', COALESCE(prod.color, CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Black' WHEN 1 THEN 'Stainless Steel' WHEN 2 THEN 'White' ELSE 'Gray' END), 9),
            (prod.id, 'Item Specifics', 'Material', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Solid Wood' WHEN 1 THEN 'Stainless Steel' WHEN 2 THEN 'Premium Plastic'
                ELSE 'Metal & Glass' END, 10),
            (prod.id, 'Item Specifics', 'Power Source', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Electric (120V)' WHEN 1 THEN 'Battery Powered' WHEN 2 THEN 'Propane Gas'
                ELSE 'Cordless Rechargeable' END, 11),
            (prod.id, 'Item Specifics', 'Features', 'Smart Home Compatible, Energy Star Certified, Easy Assembly', 12),
            (prod.id, 'Item Specifics', 'Country/Region of Manufacture', 'United States', 13);

            -- KEY FEATURES
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Key Features', 'Powerful Performance', 'Industry-leading suction power and efficiency for exceptional cleaning or cooking results.', 20),
            (prod.id, 'Key Features', 'Smart Technology', 'Intelligent sensors automatically adjust settings for optimal performance in any situation.', 21),
            (prod.id, 'Key Features', 'Premium Build Quality', 'Constructed with durable materials designed to last for years of reliable use.', 22),
            (prod.id, 'Key Features', 'Easy Maintenance', 'Tool-free access to filters and components for simple cleaning and maintenance.', 23),
            (prod.id, 'Key Features', 'Quiet Operation', 'Advanced noise reduction technology for peaceful operation without disturbing your home.', 24),
            (prod.id, 'Key Features', 'Energy Efficient', 'Optimized power consumption saves energy while delivering maximum performance.', 25),
            (prod.id, 'Key Features', 'Versatile Design', 'Multiple attachments and modes adapt to various surfaces and cleaning needs.', 26),
            (prod.id, 'Key Features', 'Sleek Aesthetics', 'Modern design complements any home décor while taking up minimal space.', 27);

            -- SPECIFICATIONS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Specifications', 'Overall Dimensions', ROUND((RANDOM() * 30 + 20)::NUMERIC, 1)::TEXT || '" x ' ||
                ROUND((RANDOM() * 20 + 15)::NUMERIC, 1)::TEXT || '" x ' ||
                ROUND((RANDOM() * 15 + 10)::NUMERIC, 1)::TEXT || '"', 30),
            (prod.id, 'Specifications', 'Weight', ROUND((RANDOM() * 50 + 10)::NUMERIC, 1)::TEXT || ' lbs', 31),
            (prod.id, 'Specifications', 'Capacity', CASE (RANDOM()*3)::INT
                WHEN 0 THEN '2.0 L / 0.5 gal' WHEN 1 THEN '4.0 L / 1.0 gal' ELSE 'N/A' END, 32),
            (prod.id, 'Specifications', 'Power', ROUND((RANDOM() * 1500 + 500)::NUMERIC, 0)::TEXT || ' Watts', 33),
            (prod.id, 'Specifications', 'Voltage', '120V / 60Hz', 34),
            (prod.id, 'Specifications', 'Cord Length', ROUND((RANDOM() * 20 + 15)::NUMERIC, 0)::TEXT || ' feet', 35),
            (prod.id, 'Specifications', 'Battery Life', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Up to 60 minutes' WHEN 1 THEN 'Up to 40 minutes' ELSE 'N/A - Corded' END, 36),
            (prod.id, 'Specifications', 'Noise Level', ROUND((RANDOM() * 20 + 60)::NUMERIC, 0)::TEXT || ' dB', 37),
            (prod.id, 'Specifications', 'Filtration', 'HEPA H13 - Captures 99.97% of particles', 38),
            (prod.id, 'Specifications', 'Warranty', '2-Year Full Manufacturer Warranty', 39),
            (prod.id, 'Specifications', 'Certifications', 'UL Listed, Energy Star, FCC Certified', 40),
            (prod.id, 'Specifications', 'Assembly Required', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Yes - Tools Included (30 min)' ELSE 'No - Ready to Use' END, 41);

        -- =====================================================
        -- SPORTS & OUTDOORS
        -- =====================================================
        ELSIF cat_name ILIKE '%sport%' OR cat_name ILIKE '%fitness%' OR cat_name ILIKE '%outdoor%'
              OR prod.title ILIKE '%golf%' OR prod.title ILIKE '%bike%' OR prod.title ILIKE '%running%'
              OR prod.title ILIKE '%tennis%' OR prod.title ILIKE '%yoga%' OR prod.title ILIKE '%bag%'
        THEN
            -- ITEM SPECIFICS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Condition', CASE prod.condition
                WHEN 'new' THEN 'New: A brand-new, unused item with all original packaging and tags.'
                ELSE 'Pre-owned: Item has been previously used. See description for condition details.'
            END, 1),
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, CASE (RANDOM()*5)::INT
                WHEN 0 THEN 'Titleist' WHEN 1 THEN 'Callaway' WHEN 2 THEN 'TaylorMade'
                WHEN 3 THEN 'Nike' ELSE 'Under Armour' END), 2),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, 'PRO-' || UPPER(LEFT(MD5(prod.title), 6))), 3),
            (prod.id, 'Item Specifics', 'Sport/Activity', CASE
                WHEN prod.title ILIKE '%golf%' THEN 'Golf'
                WHEN prod.title ILIKE '%tennis%' THEN 'Tennis'
                WHEN prod.title ILIKE '%running%' THEN 'Running'
                WHEN prod.title ILIKE '%yoga%' THEN 'Yoga/Fitness'
                ELSE 'Multi-Sport'
            END, 4),
            (prod.id, 'Item Specifics', 'Skill Level', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Beginner' WHEN 1 THEN 'Intermediate' ELSE 'Advanced/Professional' END, 5),
            (prod.id, 'Item Specifics', 'Gender', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Men''s' WHEN 1 THEN 'Women''s' ELSE 'Unisex' END, 6),
            (prod.id, 'Item Specifics', 'Color', COALESCE(prod.color, CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Black' WHEN 1 THEN 'Blue' WHEN 2 THEN 'Red' ELSE 'Multi-Color' END), 7),
            (prod.id, 'Item Specifics', 'Material', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Carbon Fiber' WHEN 1 THEN 'Titanium' WHEN 2 THEN 'Graphite'
                ELSE 'Premium Leather' END, 8),
            (prod.id, 'Item Specifics', 'Hand Orientation', 'Right-Handed', 9),
            (prod.id, 'Item Specifics', 'MPN', 'MPN-' || UPPER(LEFT(MD5(prod.id::text), 10)), 10),
            (prod.id, 'Item Specifics', 'UPC', LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'), 11);

            -- KEY FEATURES
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Key Features', 'Professional Grade', 'Used by touring professionals and serious athletes for competitive performance.', 20),
            (prod.id, 'Key Features', 'Advanced Technology', 'Cutting-edge materials and design for maximum performance and durability.', 21),
            (prod.id, 'Key Features', 'Optimized Performance', 'Engineered for perfect balance, feel, and consistency in every use.', 22),
            (prod.id, 'Key Features', 'Premium Construction', 'Built with aerospace-grade materials for lightweight strength.', 23),
            (prod.id, 'Key Features', 'Enhanced Control', 'Precision-engineered for superior accuracy and shot shaping ability.', 24),
            (prod.id, 'Key Features', 'Maximum Forgiveness', 'Larger sweet spot design reduces the impact of off-center contact.', 25),
            (prod.id, 'Key Features', 'Custom Fitting', 'Multiple shaft, loft, and lie options available for personalized setup.', 26),
            (prod.id, 'Key Features', 'Tour Validated', 'Tested and approved by professional athletes worldwide.', 27);

            -- SPECIFICATIONS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Specifications', 'Length', ROUND((RANDOM() * 5 + 43)::NUMERIC, 1)::TEXT || ' inches', 30),
            (prod.id, 'Specifications', 'Weight', ROUND((RANDOM() * 100 + 200)::NUMERIC, 0)::TEXT || ' grams', 31),
            (prod.id, 'Specifications', 'Loft', ROUND((RANDOM() * 5 + 9)::NUMERIC, 1)::TEXT || '°', 32),
            (prod.id, 'Specifications', 'Lie Angle', ROUND((RANDOM() * 4 + 56)::NUMERIC, 1)::TEXT || '°', 33),
            (prod.id, 'Specifications', 'Shaft Flex', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Regular' WHEN 1 THEN 'Stiff' WHEN 2 THEN 'Extra Stiff' ELSE 'Senior' END, 34),
            (prod.id, 'Specifications', 'Shaft Material', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Graphite' ELSE 'Steel' END, 35),
            (prod.id, 'Specifications', 'Grip', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Golf Pride Tour Velvet' WHEN 1 THEN 'SuperStroke S-Tech'
                ELSE 'Lamkin Crossline' END, 36),
            (prod.id, 'Specifications', 'Head Material', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Titanium' ELSE 'Stainless Steel' END, 37),
            (prod.id, 'Specifications', 'Adjustable', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Yes - Loft/Lie/Face Angle' ELSE 'Fixed' END, 38),
            (prod.id, 'Specifications', 'Headcover Included', 'Yes', 39),
            (prod.id, 'Specifications', 'Conforming', 'USGA and R&A Conforming', 40),
            (prod.id, 'Specifications', 'Warranty', '2-Year Manufacturer Warranty', 41);

        -- =====================================================
        -- COLLECTIBLES & VINTAGE
        -- =====================================================
        ELSIF cat_name ILIKE '%collect%' OR cat_name ILIKE '%antique%' OR cat_name ILIKE '%vintage%'
              OR prod.title ILIKE '%vintage%' OR prod.title ILIKE '%rare%' OR prod.title ILIKE '%antique%'
              OR prod.title ILIKE '%collectible%'
        THEN
            -- ITEM SPECIFICS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Condition', CASE prod.condition
                WHEN 'new' THEN 'Mint: Item is in perfect condition with no signs of wear or age.'
                WHEN 'like_new' THEN 'Excellent: Item shows minimal signs of age, no damage or repairs.'
                WHEN 'very_good' THEN 'Very Good: Light wear consistent with age, well preserved.'
                WHEN 'good' THEN 'Good: Normal wear for age, no major damage, fully functional.'
                ELSE 'Fair: Shows wear and age, may have minor damage, great for display.'
            END, 1),
            (prod.id, 'Item Specifics', 'Era/Year', CASE (RANDOM()*5)::INT
                WHEN 0 THEN '1950s' WHEN 1 THEN '1960s' WHEN 2 THEN '1970s'
                WHEN 3 THEN '1980s' ELSE 'Pre-1950 (Antique)' END, 2),
            (prod.id, 'Item Specifics', 'Type', 'Vintage Collectible', 3),
            (prod.id, 'Item Specifics', 'Origin', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'United States' WHEN 1 THEN 'Japan' WHEN 2 THEN 'Germany'
                ELSE 'United Kingdom' END, 4),
            (prod.id, 'Item Specifics', 'Maker/Brand', CASE (RANDOM()*2)::INT
                WHEN 0 THEN 'Signed by Original Maker' ELSE 'Maker Unknown - Period Authentic' END, 5),
            (prod.id, 'Item Specifics', 'Material', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Sterling Silver' WHEN 1 THEN 'Solid Brass' WHEN 2 THEN 'Porcelain'
                ELSE 'Crystal/Glass' END, 6),
            (prod.id, 'Item Specifics', 'Color', COALESCE(prod.color, 'Original Patina'), 7),
            (prod.id, 'Item Specifics', 'Rarity', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Extremely Rare - Less than 100 known'
                WHEN 1 THEN 'Rare - Limited Production Run'
                ELSE 'Uncommon - Sought After by Collectors' END, 8),
            (prod.id, 'Item Specifics', 'Original Parts', CASE (RANDOM()*2)::INT
                WHEN 0 THEN '100% Original - No Repairs or Replacements'
                ELSE 'Mostly Original - See Description' END, 9),
            (prod.id, 'Item Specifics', 'Provenance', 'Certificate of Authenticity Included', 10),
            (prod.id, 'Item Specifics', 'Previous Owner', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Single Owner Estate' WHEN 1 THEN 'Private Collection'
                ELSE 'Gallery Deaccession' END, 11);

            -- KEY FEATURES
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Key Features', 'Authentic Vintage', 'Genuine period piece with verified authenticity and documented history.', 20),
            (prod.id, 'Key Features', 'Investment Quality', 'Appreciating collectible with strong market demand and value retention.', 21),
            (prod.id, 'Key Features', 'Museum Quality', 'Exhibition-ready condition suitable for display in professional settings.', 22),
            (prod.id, 'Key Features', 'Rare Find', 'Increasingly difficult to find in this condition at this price point.', 23),
            (prod.id, 'Key Features', 'Historical Significance', 'Represents an important era in design, craftsmanship, or cultural history.', 24),
            (prod.id, 'Key Features', 'Original Patina', 'Beautiful natural aging that collectors prize over restoration.', 25),
            (prod.id, 'Key Features', 'Complete Set', 'Includes all original components, accessories, and documentation.', 26),
            (prod.id, 'Key Features', 'Expert Authenticated', 'Verified by recognized experts in the field of collectibles.', 27);

            -- SPECIFICATIONS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Specifications', 'Height', ROUND((RANDOM() * 20 + 5)::NUMERIC, 1)::TEXT || ' inches', 30),
            (prod.id, 'Specifications', 'Width', ROUND((RANDOM() * 15 + 3)::NUMERIC, 1)::TEXT || ' inches', 31),
            (prod.id, 'Specifications', 'Depth', ROUND((RANDOM() * 10 + 2)::NUMERIC, 1)::TEXT || ' inches', 32),
            (prod.id, 'Specifications', 'Weight', ROUND((RANDOM() * 10 + 0.5)::NUMERIC, 2)::TEXT || ' lbs', 33),
            (prod.id, 'Specifications', 'Estimated Value', '$' || ROUND((RANDOM() * 5000 + 500)::NUMERIC, 0)::TEXT ||
                ' - $' || ROUND((RANDOM() * 10000 + 6000)::NUMERIC, 0)::TEXT, 34),
            (prod.id, 'Specifications', 'Insurance Value', '$' || ROUND((RANDOM() * 15000 + 2000)::NUMERIC, 0)::TEXT, 35),
            (prod.id, 'Specifications', 'Last Auction Result', '$' || ROUND((RANDOM() * 8000 + 1000)::NUMERIC, 0)::TEXT ||
                ' (Similar Item)', 36),
            (prod.id, 'Specifications', 'Storage Recommendation', 'Climate-controlled environment, away from direct sunlight', 37),
            (prod.id, 'Specifications', 'Shipping', 'Professional packing with insurance included', 38);

        -- =====================================================
        -- DEFAULT / OTHER CATEGORIES
        -- =====================================================
        ELSE
            -- ITEM SPECIFICS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Item Specifics', 'Condition', CASE prod.condition
                WHEN 'new' THEN 'New: A brand-new, unused item in its original packaging.'
                WHEN 'like_new' THEN 'Like New: Item appears unused with minimal to no wear.'
                WHEN 'very_good' THEN 'Very Good: Item is in great condition with minor cosmetic wear.'
                WHEN 'good' THEN 'Good: Item shows normal wear from use but functions perfectly.'
                ELSE 'Acceptable: Item is functional but shows significant wear.'
            END, 1),
            (prod.id, 'Item Specifics', 'Brand', COALESCE(prod.brand, 'Unbranded/Generic'), 2),
            (prod.id, 'Item Specifics', 'Model', COALESCE(prod.model, 'Standard Model'), 3),
            (prod.id, 'Item Specifics', 'MPN', 'MPN-' || UPPER(LEFT(MD5(prod.id::text), 10)), 4),
            (prod.id, 'Item Specifics', 'UPC', LPAD((RANDOM() * 999999999999)::BIGINT::TEXT, 12, '0'), 5),
            (prod.id, 'Item Specifics', 'Type', 'General Merchandise', 6),
            (prod.id, 'Item Specifics', 'Color', COALESCE(prod.color, CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Black' WHEN 1 THEN 'White' WHEN 2 THEN 'Blue' ELSE 'Gray' END), 7),
            (prod.id, 'Item Specifics', 'Material', CASE (RANDOM()*4)::INT
                WHEN 0 THEN 'Plastic' WHEN 1 THEN 'Metal' WHEN 2 THEN 'Wood' ELSE 'Mixed Materials' END, 8),
            (prod.id, 'Item Specifics', 'Country/Region of Manufacture', 'China', 9),
            (prod.id, 'Item Specifics', 'Features', 'High Quality, Durable Construction, Easy to Use', 10);

            -- KEY FEATURES
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Key Features', 'Quality Construction', 'Built with durable materials for long-lasting performance and reliability.', 20),
            (prod.id, 'Key Features', 'Easy to Use', 'Intuitive design requires no special skills or training to operate.', 21),
            (prod.id, 'Key Features', 'Versatile', 'Multiple uses and applications for maximum value and convenience.', 22),
            (prod.id, 'Key Features', 'Great Value', 'Premium quality at an affordable price point.', 23),
            (prod.id, 'Key Features', 'Fast Shipping', 'Ships same or next business day for quick delivery.', 24),
            (prod.id, 'Key Features', 'Satisfaction Guaranteed', '30-day money-back guarantee if not completely satisfied.', 25);

            -- SPECIFICATIONS
            INSERT INTO product_specifications (product_id, spec_group, spec_name, spec_value, display_order) VALUES
            (prod.id, 'Specifications', 'Dimensions', ROUND((RANDOM() * 15 + 5)::NUMERIC, 1)::TEXT || '" x ' ||
                ROUND((RANDOM() * 12 + 3)::NUMERIC, 1)::TEXT || '" x ' ||
                ROUND((RANDOM() * 8 + 2)::NUMERIC, 1)::TEXT || '"', 30),
            (prod.id, 'Specifications', 'Weight', ROUND((RANDOM() * 10 + 0.5)::NUMERIC, 2)::TEXT || ' lbs', 31),
            (prod.id, 'Specifications', 'Package Contents', 'Main item, User manual, Warranty card', 32),
            (prod.id, 'Specifications', 'Power Source', CASE (RANDOM()*3)::INT
                WHEN 0 THEN 'Battery Powered' WHEN 1 THEN 'AC Adapter' ELSE 'No Power Required' END, 33),
            (prod.id, 'Specifications', 'Warranty', '1-Year Limited Warranty', 34),
            (prod.id, 'Specifications', 'Return Policy', '30-Day Money Back Guarantee', 35);
        END IF;

    END LOOP;

    RAISE NOTICE 'eBay-style specifications generated for all products!';
END $$;

-- =====================================================
-- 2. SUMMARY REPORT
-- =====================================================

SELECT '=== EBAY FORMAT SPECIFICATIONS SUMMARY ===' as report;

SELECT
    COUNT(DISTINCT product_id) as products_with_specs,
    COUNT(*) as total_specifications,
    ROUND(COUNT(*)::NUMERIC / COUNT(DISTINCT product_id), 1) as avg_specs_per_product
FROM product_specifications;

SELECT '=== SPECS BY GROUP ===' as report;
SELECT spec_group, COUNT(*) as count
FROM product_specifications
GROUP BY spec_group
ORDER BY
    CASE spec_group
        WHEN 'Item Specifics' THEN 1
        WHEN 'Key Features' THEN 2
        WHEN 'Specifications' THEN 3
    END;

SELECT '=== SAMPLE PRODUCT ===' as report;
SELECT p.title, ps.spec_group, ps.spec_name, LEFT(ps.spec_value, 80) as spec_value
FROM product_specifications ps
JOIN products p ON ps.product_id = p.id
ORDER BY RANDOM()
LIMIT 1;
