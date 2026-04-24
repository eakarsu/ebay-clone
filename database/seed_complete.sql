-- eBay Clone - Complete Seed Data (15+ items per feature)
-- Matches actual database schema
-- ============================================

-- =====================================================
-- USERS (20 users with proper columns)
-- =====================================================
INSERT INTO users (username, email, password_hash, first_name, last_name, is_seller, is_admin, seller_rating, total_sales, email_verified)
VALUES
    ('buyer1', 'buyer@ebay.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'John', 'Buyer', false, false, 0, 0, true),
    ('seller1', 'seller@ebay.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Sarah', 'Seller', true, false, 4.9, 15000, true),
    ('admin1', 'admin@ebay.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Admin', 'User', true, true, 5.0, 0, true),
    ('techdeals', 'techdeals@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Tech', 'Deals', true, false, 4.8, 25000, true),
    ('vintagetreasures', 'vintage@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Vintage', 'Finds', true, false, 4.7, 8000, true),
    ('fashionista', 'fashion@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Fashion', 'Forward', true, false, 4.9, 32000, true),
    ('sportsgear', 'sports@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Sports', 'Gear', true, false, 4.6, 12000, true),
    ('homeessentials', 'home@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Home', 'Essentials', true, false, 4.8, 9500, true),
    ('buyer_jane', 'jane@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Jane', 'Doe', false, false, 0, 0, true),
    ('buyer_bob', 'bob@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Bob', 'Smith', false, false, 0, 0, true),
    ('emily_seller', 'emily@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Emily', 'Johnson', true, false, 4.5, 4500, true),
    ('david_seller', 'david@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'David', 'Brown', true, false, 4.4, 3200, true),
    ('lisa_buyer', 'lisa@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Lisa', 'Wilson', false, false, 0, 0, true),
    ('chris_seller', 'chris@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Chris', 'Taylor', true, false, 4.7, 7800, true),
    ('amanda_buyer', 'amanda@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Amanda', 'Davis', false, false, 0, 0, true),
    ('robert_seller', 'robert@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Robert', 'Miller', true, false, 4.3, 2900, true),
    ('jennifer_buyer', 'jennifer@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Jennifer', 'Garcia', false, false, 0, 0, true),
    ('william_seller', 'william@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'William', 'Martinez', true, false, 4.6, 5600, true),
    ('jessica_buyer', 'jessica@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Jessica', 'Anderson', false, false, 0, 0, true),
    ('daniel_seller', 'daniel@example.com', '$2a$10$K3..35ffWXRZC3ZYQbdqUO6Y6NRWKMlLALCMck0BxuK3jdlgrmFwe', 'Daniel', 'Thomas', true, false, 4.8, 8900, true)
ON CONFLICT (username) DO UPDATE SET email_verified = true;

-- =====================================================
-- CATEGORIES (15 categories)
-- =====================================================
INSERT INTO categories (name, slug, description, image_url)
VALUES
    ('Electronics', 'electronics', 'Computers, phones, tablets, and more', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400'),
    ('Fashion', 'fashion', 'Clothing, shoes, and accessories', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400'),
    ('Home & Garden', 'home-garden', 'Furniture, decor, and outdoor items', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400'),
    ('Sporting Goods', 'sporting-goods', 'Sports equipment and athletic wear', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400'),
    ('Toys & Games', 'toys-games', 'Toys, games, and collectibles', 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400'),
    ('Motors', 'motors', 'Cars, motorcycles, and parts', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400'),
    ('Collectibles', 'collectibles', 'Antiques, art, and rare items', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'),
    ('Books & Media', 'books-media', 'Books, movies, music, and games', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'),
    ('Health & Beauty', 'health-beauty', 'Skincare, makeup, and wellness', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400'),
    ('Jewelry & Watches', 'jewelry-watches', 'Fine jewelry and timepieces', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400'),
    ('Baby & Kids', 'baby-kids', 'Baby gear and children items', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400'),
    ('Pet Supplies', 'pet-supplies', 'Everything for your pets', 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400'),
    ('Business & Industrial', 'business-industrial', 'Office and industrial equipment', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400'),
    ('Musical Instruments', 'musical-instruments', 'Instruments and audio equipment', 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400'),
    ('Crafts & DIY', 'crafts-diy', 'Art supplies and craft materials', 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=400')
ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description;

-- =====================================================
-- PRODUCTS (75 products using DO block)
-- =====================================================
DO $$
DECLARE
    v_electronics_id UUID;
    v_fashion_id UUID;
    v_home_id UUID;
    v_sports_id UUID;
    v_collectibles_id UUID;
    v_seller1_id UUID;
    v_seller2_id UUID;
    v_seller3_id UUID;
    v_seller4_id UUID;
    v_seller5_id UUID;
    v_main_seller_id UUID;
BEGIN
    SELECT id INTO v_electronics_id FROM categories WHERE slug = 'electronics' LIMIT 1;
    SELECT id INTO v_fashion_id FROM categories WHERE slug = 'fashion' LIMIT 1;
    SELECT id INTO v_home_id FROM categories WHERE slug = 'home-garden' LIMIT 1;
    SELECT id INTO v_sports_id FROM categories WHERE slug = 'sporting-goods' LIMIT 1;
    SELECT id INTO v_collectibles_id FROM categories WHERE slug = 'collectibles' LIMIT 1;

    SELECT id INTO v_seller1_id FROM users WHERE username = 'techdeals' LIMIT 1;
    SELECT id INTO v_seller2_id FROM users WHERE username = 'vintagetreasures' LIMIT 1;
    SELECT id INTO v_seller3_id FROM users WHERE username = 'fashionista' LIMIT 1;
    SELECT id INTO v_seller4_id FROM users WHERE username = 'sportsgear' LIMIT 1;
    SELECT id INTO v_seller5_id FROM users WHERE username = 'homeessentials' LIMIT 1;
    SELECT id INTO v_main_seller_id FROM users WHERE username = 'seller1' LIMIT 1;

    IF v_seller1_id IS NULL THEN
        RAISE NOTICE 'Sellers not found, skipping products';
        RETURN;
    END IF;

    -- Electronics (15 products)
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers)
    SELECT v_seller1_id, v_electronics_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', accepts_offers
    FROM (VALUES
        ('iPhone 15 Pro Max 256GB Titanium Blue', 'iphone-15-pro-max-256gb', 'Brand new Apple iPhone 15 Pro Max with A17 Pro chip', 'new', 'buy_now', 1199.99, 1199.99, 5, true, 'Apple', true),
        ('MacBook Pro 16 M3 Max Space Black', 'macbook-pro-16-m3-max', 'Apple MacBook Pro with M3 Max chip 36GB RAM', 'new', 'buy_now', 3499.00, 3499.00, 3, true, 'Apple', true),
        ('Sony PlayStation 5 Console Bundle', 'ps5-console-bundle', 'PS5 with extra controller and 3 games', 'new', 'buy_now', 549.99, 549.99, 8, false, 'Sony', false),
        ('Samsung 65 OLED 4K Smart TV', 'samsung-65-oled-4k', 'Samsung S95C OLED TV Neural Quantum Processor', 'new', 'buy_now', 1799.99, 1799.99, 4, false, 'Samsung', true),
        ('Apple Watch Ultra 2 Titanium', 'apple-watch-ultra-2', 'Rugged smartwatch 36hr battery GPS 100m water', 'new', 'buy_now', 799.00, 799.00, 12, true, 'Apple', true),
        ('DJI Mini 4 Pro Drone', 'dji-mini-4-pro', 'Compact drone 4K/60fps 48MP 34min flight', 'new', 'buy_now', 759.00, 759.00, 6, true, 'DJI', true),
        ('Nintendo Switch OLED Model', 'nintendo-switch-oled', 'Enhanced Switch 7-inch OLED screen', 'new', 'buy_now', 349.99, 349.99, 15, false, 'Nintendo', false),
        ('Bose QuietComfort Ultra Headphones', 'bose-qc-ultra', 'Premium noise-canceling spatial audio 24hr', 'new', 'buy_now', 429.00, 429.00, 20, true, 'Bose', true),
        ('iPad Pro 12.9 M2 256GB', 'ipad-pro-12-m2', 'Powerful tablet Liquid Retina XDR display', 'new', 'buy_now', 1099.00, 1099.00, 7, true, 'Apple', true),
        ('Canon EOS R6 Mark II Camera', 'canon-eos-r6-ii', 'Full-frame mirrorless 24.2MP 40fps', 'new', 'buy_now', 2499.00, 2499.00, 3, true, 'Canon', true),
        ('Samsung Galaxy S24 Ultra 512GB', 'samsung-s24-ultra-512', 'Latest Samsung flagship 512GB storage', 'new', 'buy_now', 1299.99, 1299.99, 10, true, 'Samsung', true),
        ('Sony WH-1000XM5 Headphones', 'sony-wh1000xm5', 'Industry leading noise cancellation', 'new', 'buy_now', 348.00, 348.00, 25, true, 'Sony', true),
        ('LG C3 65 OLED evo TV', 'lg-c3-65-oled', 'Perfect blacks infinite contrast', 'new', 'buy_now', 1496.99, 1496.99, 5, false, 'LG', true),
        ('GoPro HERO12 Black', 'gopro-hero12-black', 'Ultimate action camera 5.3K60 HyperSmooth', 'new', 'buy_now', 399.99, 399.99, 18, true, 'GoPro', false),
        ('Meta Quest 3 128GB', 'meta-quest-3-128', 'Mixed reality VR headset breakthrough', 'new', 'buy_now', 499.99, 499.99, 12, true, 'Meta', true)
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, accepts_offers)
    WHERE v_electronics_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE slug = t.slug);

    -- Fashion (15 products)
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers)
    SELECT v_seller3_id, v_fashion_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', accepts_offers
    FROM (VALUES
        ('Nike Air Jordan 1 Retro High OG', 'nike-jordan-1-retro', 'Classic basketball sneaker Chicago colorway', 'new', 'buy_now', 180.00, 180.00, 25, true, 'Nike', true),
        ('Gucci GG Marmont Leather Bag', 'gucci-gg-marmont', 'Authentic Gucci handbag signature GG hardware', 'new', 'buy_now', 2350.00, 2350.00, 2, true, 'Gucci', true),
        ('Ray-Ban Aviator Classic Sunglasses', 'rayban-aviator-classic', 'Iconic gold frame aviators G-15 lenses', 'new', 'buy_now', 163.00, 163.00, 30, true, 'Ray-Ban', false),
        ('Levis 501 Original Fit Jeans', 'levis-501-original', 'Classic straight leg medium stonewash', 'new', 'buy_now', 69.50, 69.50, 50, false, 'Levis', false),
        ('Canada Goose Expedition Parka', 'canada-goose-expedition', 'Extreme weather down parka rated -30C', 'new', 'buy_now', 1295.00, 1295.00, 5, true, 'Canada Goose', true),
        ('Rolex Submariner Watch Pre-owned', 'rolex-submariner-preowned', 'Authentic Rolex Submariner Date 116610LN', 'like_new', 'buy_now', 12500.00, 12500.00, 1, true, 'Rolex', true),
        ('Adidas Ultraboost 22 Running', 'adidas-ultraboost-22', 'Premium running shoes Boost cushioning', 'new', 'buy_now', 190.00, 190.00, 40, true, 'Adidas', true),
        ('Vintage Levis Denim Jacket 1980s', 'vintage-levis-denim-80s', 'Authentic vintage Type III trucker', 'good', 'buy_now', 145.00, 145.00, 1, false, 'Levis', true),
        ('Louis Vuitton Neverfull MM Tote', 'lv-neverfull-mm', 'Classic LV monogram tote everyday use', 'new', 'buy_now', 1960.00, 1960.00, 3, true, 'Louis Vuitton', true),
        ('Burberry Classic Check Scarf', 'burberry-check-scarf', 'Iconic cashmere scarf heritage check', 'new', 'buy_now', 470.00, 470.00, 8, true, 'Burberry', true),
        ('Omega Seamaster Diver 300M', 'omega-seamaster-300', 'Professional dive watch ceramic bezel', 'like_new', 'buy_now', 5200.00, 5200.00, 2, true, 'Omega', true),
        ('Prada Re-Nylon Backpack', 'prada-renylon-backpack', 'Sustainable luxury backpack', 'new', 'buy_now', 1490.00, 1490.00, 4, true, 'Prada', true),
        ('Nike Dunk Low Panda', 'nike-dunk-low-panda', 'Most popular colorway black white', 'new', 'buy_now', 110.00, 110.00, 35, true, 'Nike', false),
        ('Cartier Love Bracelet Rose Gold', 'cartier-love-bracelet', 'Iconic love bracelet 18k rose gold', 'new', 'buy_now', 6900.00, 6900.00, 1, true, 'Cartier', true),
        ('Hermes Silk Scarf Carre', 'hermes-silk-carre', 'Hand-rolled edges French artisanship', 'new', 'buy_now', 435.00, 435.00, 6, true, 'Hermes', true)
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, accepts_offers)
    WHERE v_fashion_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE slug = t.slug);

    -- Home & Garden (15 products)
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers)
    SELECT v_seller5_id, v_home_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', accepts_offers
    FROM (VALUES
        ('Dyson V15 Detect Cordless Vacuum', 'dyson-v15-detect', 'Most powerful Dyson laser dust detection', 'new', 'buy_now', 749.99, 749.99, 10, true, 'Dyson', true),
        ('KitchenAid Artisan Stand Mixer', 'kitchenaid-artisan', 'Iconic 5-quart stand mixer Empire Red', 'new', 'buy_now', 449.99, 449.99, 12, false, 'KitchenAid', true),
        ('Weber Genesis E-335 Gas Grill', 'weber-genesis-e335', 'Premium 3-burner gas grill sear station', 'new', 'buy_now', 1149.00, 1149.00, 4, false, 'Weber', true),
        ('Casper Original Mattress Queen', 'casper-original-queen', 'Award-winning foam mattress 100-night trial', 'new', 'buy_now', 1095.00, 1095.00, 6, true, 'Casper', true),
        ('Nespresso Vertuo Next Coffee', 'nespresso-vertuo-next', 'Single-serve centrifusion technology', 'new', 'buy_now', 179.00, 179.00, 20, true, 'Nespresso', false),
        ('iRobot Roomba j7 Robot Vacuum', 'irobot-roomba-j7plus', 'Smart robot auto dirt disposal obstacle avoid', 'new', 'buy_now', 799.99, 799.99, 8, true, 'iRobot', true),
        ('Herman Miller Aeron Chair Size B', 'herman-miller-aeron-b', 'Ergonomic office chair PostureFit SL', 'new', 'buy_now', 1395.00, 1395.00, 3, false, 'Herman Miller', true),
        ('Le Creuset Dutch Oven 5.5 Qt', 'le-creuset-dutch-oven', 'Enameled cast iron Flame Orange lifetime', 'new', 'buy_now', 380.00, 380.00, 15, true, 'Le Creuset', true),
        ('Vitamix A3500 Blender', 'vitamix-a3500', 'Smart blender touchscreen self-cleaning', 'new', 'buy_now', 649.95, 649.95, 7, true, 'Vitamix', true),
        ('Breville Barista Express', 'breville-barista-express', 'Espresso machine built-in grinder', 'new', 'buy_now', 599.95, 599.95, 9, true, 'Breville', true),
        ('Tempur-Pedic ProAdapt Pillow', 'tempurpedic-proadapt', 'Premium memory foam support pillow', 'new', 'buy_now', 149.00, 149.00, 30, true, 'Tempur-Pedic', false),
        ('Philips Hue Starter Kit', 'philips-hue-starter', 'Smart lighting bridge and 4 bulbs', 'new', 'buy_now', 199.99, 199.99, 18, true, 'Philips', true),
        ('All-Clad D5 Cookware Set 10pc', 'allclad-d5-10pc', 'Stainless steel professional grade', 'new', 'buy_now', 899.95, 899.95, 5, true, 'All-Clad', true),
        ('Nest Learning Thermostat', 'nest-learning-thermo', 'Smart thermostat auto-schedule energy save', 'new', 'buy_now', 249.00, 249.00, 22, true, 'Google', true),
        ('Crate and Barrel Lounge Sofa', 'cratebarrel-lounge', '93 inch modern sectional deep seating', 'new', 'buy_now', 2499.00, 2499.00, 2, false, 'Crate Barrel', true)
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, accepts_offers)
    WHERE v_home_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE slug = t.slug);

    -- Sports (15 products)
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers)
    SELECT v_seller4_id, v_sports_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', accepts_offers
    FROM (VALUES
        ('Peloton Bike Plus Indoor Cycling', 'peloton-bike-plus', 'Premium indoor bike rotating 23.8 HD screen', 'new', 'buy_now', 2495.00, 2495.00, 2, false, 'Peloton', true),
        ('TaylorMade Stealth 2 Driver', 'taylormade-stealth-2', 'Next-gen carbon face 60X Carbon Twist', 'new', 'buy_now', 599.99, 599.99, 6, true, 'TaylorMade', true),
        ('Yeti Hopper M30 Soft Cooler', 'yeti-hopper-m30', 'Portable MagShield Access magnetic', 'new', 'buy_now', 325.00, 325.00, 10, true, 'YETI', true),
        ('Bowflex SelectTech 552 Dumbbells', 'bowflex-selecttech-552', 'Adjustable 5-52.5 lbs each space-saving', 'new', 'buy_now', 429.00, 429.00, 8, false, 'Bowflex', true),
        ('Garmin Fenix 7X Solar GPS', 'garmin-fenix-7x-solar', 'Ultimate multisport GPS solar charging', 'new', 'buy_now', 899.99, 899.99, 5, true, 'Garmin', true),
        ('Burton Custom Flying V Snowboard', 'burton-custom-flying-v', '158cm all-mountain freestyle Flying V rocker', 'new', 'buy_now', 549.95, 549.95, 4, false, 'Burton', true),
        ('Wilson Pro Staff RF97 Tennis', 'wilson-prostaff-rf97', 'Roger Federer signature 97 sq in 340g', 'new', 'buy_now', 269.00, 269.00, 7, true, 'Wilson', true),
        ('Callaway Paradym Driver', 'callaway-paradym-driver', 'AI-designed jailbreak batwing', 'new', 'buy_now', 549.99, 549.99, 5, true, 'Callaway', true),
        ('NordicTrack Commercial 1750', 'nordictrack-1750', 'Treadmill 22 HD touchscreen iFit', 'new', 'buy_now', 1999.00, 1999.00, 3, false, 'NordicTrack', true),
        ('Theragun PRO Massage', 'theragun-pro', 'Professional percussive therapy device', 'new', 'buy_now', 599.00, 599.00, 12, true, 'Therabody', true),
        ('Specialized Tarmac SL7 Frame', 'specialized-tarmac-sl7', 'Pro-level carbon road bike frameset', 'new', 'buy_now', 3500.00, 3500.00, 2, false, 'Specialized', true),
        ('REI Half Dome Tent 2-Person', 'rei-halfdome-2person', 'Lightweight backpacking 3-season', 'new', 'buy_now', 279.00, 279.00, 15, true, 'REI', true),
        ('Hydrow Rowing Machine', 'hydrow-rowing-machine', 'Connected rower 22 HD screen live', 'new', 'buy_now', 2495.00, 2495.00, 2, false, 'Hydrow', true),
        ('Titleist Pro V1 Golf Balls 4dz', 'titleist-prov1-4dozen', 'Premium tour balls 48 total', 'new', 'buy_now', 199.99, 199.99, 20, true, 'Titleist', false),
        ('Osprey Atmos AG 65 Backpack', 'osprey-atmos-ag-65', 'Anti-Gravity suspension system', 'new', 'buy_now', 300.00, 300.00, 10, true, 'Osprey', true)
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, accepts_offers)
    WHERE v_sports_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE slug = t.slug);

    -- Collectibles (15 products - including auction items)
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, starting_price, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers, auction_end)
    SELECT v_seller2_id, v_collectibles_id, title, slug, description, condition, listing_type, starting_price, current_price, buy_now_price, quantity, free_shipping, brand, 'active', accepts_offers, auction_end
    FROM (VALUES
        ('Pokemon Charizard PSA 9 1st Ed', 'pokemon-charizard-psa9', 'Graded holographic Charizard Base Set', 'like_new', 'auction', 7000.00, 8500.00, NULL::numeric, 1, true, 'Pokemon', true, NOW() + INTERVAL '3 days'),
        ('Star Wars Boba Fett 1979 Kenner', 'star-wars-boba-fett-79', 'Original Kenner Boba Fett figure', 'good', 'auction', 800.00, 1200.00, NULL::numeric, 1, true, 'Kenner', true, NOW() + INTERVAL '5 days'),
        ('LEGO UCS Millennium Falcon 75192', 'lego-ucs-falcon-75192', 'Ultimate Collector Series 7541 pieces', 'new', 'buy_now', NULL::numeric, 849.99, 849.99, 2, false, 'LEGO', true, NULL),
        ('Michael Jordan Fleer Rookie PSA 8', 'jordan-fleer-rookie-psa8', '1986 Fleer Michael Jordan rookie card', 'very_good', 'auction', 6000.00, 8500.00, NULL::numeric, 1, true, 'Fleer', true, NOW() + INTERVAL '4 days'),
        ('Amazing Spider-Man 300 CGC 9.4', 'asm-300-cgc-94', 'First appearance of Venom graded', 'very_good', 'buy_now', NULL::numeric, 650.00, 650.00, 1, true, 'Marvel', true, NULL),
        ('1963 Corvette Stingray Model', 'corvette-stingray-63-model', 'Die-cast 1:18 scale precision', 'new', 'buy_now', NULL::numeric, 189.99, 189.99, 5, true, 'Franklin Mint', false, NULL),
        ('Vintage Coca-Cola Sign 1950s', 'vintage-coke-sign-50s', 'Original porcelain advertising sign', 'good', 'auction', 500.00, 950.00, NULL::numeric, 1, true, 'Coca-Cola', true, NOW() + INTERVAL '6 days'),
        ('1967 Rolex Daytona Ref 6239', 'rolex-daytona-6239-67', 'Vintage Paul Newman exotic dial', 'good', 'auction', 150000.00, 185000.00, NULL::numeric, 1, true, 'Rolex', true, NOW() + INTERVAL '7 days'),
        ('Harry Potter First Edition Set', 'harry-potter-1st-ed-set', 'Complete UK first edition hardcover', 'very_good', 'auction', 18000.00, 25000.00, NULL::numeric, 1, true, 'Bloomsbury', true, NOW() + INTERVAL '4 days'),
        ('Funko Pop Venom Ghost Rider 373', 'funko-venom-ghostrider', 'Rare Venomized Ghost Rider exclusive', 'new', 'buy_now', NULL::numeric, 45.00, 45.00, 3, true, 'Funko', false, NULL),
        ('Antique Tiffany Lamp 1910', 'antique-tiffany-lamp', 'Authentic Tiffany Studios dragonfly', 'good', 'auction', 8000.00, 12500.00, NULL::numeric, 1, true, 'Tiffany', true, NOW() + INTERVAL '5 days'),
        ('Beatles White Album Mono UK', 'beatles-white-album-mono', 'Original 1968 UK mono pressing', 'very_good', 'buy_now', NULL::numeric, 2500.00, 2500.00, 1, true, 'Apple Records', true, NULL),
        ('Nintendo Game Boy Original CIB', 'gameboy-original-cib', 'Complete in box DMG-01 tested', 'very_good', 'buy_now', NULL::numeric, 299.99, 299.99, 1, true, 'Nintendo', true, NULL),
        ('Mickey Mouse Watch 1933 Ingersoll', 'mickey-mouse-watch-33', 'Original Depression era collectible', 'good', 'auction', 3000.00, 4500.00, NULL::numeric, 1, true, 'Ingersoll', true, NOW() + INTERVAL '3 days'),
        ('1952 Topps Mickey Mantle PSA 5', 'topps-mantle-52-psa5', 'Iconic rookie card graded', 'good', 'auction', 50000.00, 75000.00, NULL::numeric, 1, true, 'Topps', true, NOW() + INTERVAL '7 days')
    ) AS t(title, slug, description, condition, listing_type, starting_price, current_price, buy_now_price, quantity, free_shipping, brand, accepts_offers, auction_end)
    WHERE v_collectibles_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE slug = t.slug);

    -- Products for main seller account (seller@ebay.com)
    IF v_main_seller_id IS NOT NULL AND v_electronics_id IS NOT NULL THEN
        INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers)
        SELECT v_main_seller_id, v_electronics_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', accepts_offers
        FROM (VALUES
            ('Dell XPS 15 Laptop', 'dell-xps-15-seller1', 'Premium 15.6 inch laptop Intel i7 32GB RAM', 'new', 'buy_now', 1799.99, 1799.99, 4, true, 'Dell', true),
            ('AirPods Pro 2nd Gen', 'airpods-pro-2-seller1', 'Active noise cancellation USB-C charging', 'new', 'buy_now', 249.99, 249.99, 15, true, 'Apple', false),
            ('Sony A7 IV Camera Body', 'sony-a7iv-seller1', 'Full-frame mirrorless 33MP sensor', 'new', 'buy_now', 2498.00, 2498.00, 2, true, 'Sony', true),
            ('iPad Air 5th Gen 256GB', 'ipad-air-5-seller1', 'M1 chip 10.9 inch Liquid Retina', 'new', 'buy_now', 749.00, 749.00, 8, true, 'Apple', true),
            ('Samsung Galaxy Watch 6', 'galaxy-watch-6-seller1', 'Advanced health monitoring BioActive', 'new', 'buy_now', 329.99, 329.99, 12, true, 'Samsung', true),
            ('LG Gram 17 Laptop', 'lg-gram-17-seller1', 'Ultra-lightweight 17 inch 1.35kg', 'new', 'buy_now', 1499.99, 1499.99, 3, true, 'LG', true),
            ('Kindle Paperwhite Signature', 'kindle-signature-seller1', 'Wireless charging 32GB ad-free', 'new', 'buy_now', 189.99, 189.99, 20, true, 'Amazon', false),
            ('Logitech MX Master 3S Mouse', 'mx-master-3s-seller1', 'Quiet clicks 8K DPI ergonomic', 'new', 'buy_now', 99.99, 99.99, 30, true, 'Logitech', false),
            ('JBL Charge 5 Speaker', 'jbl-charge-5-seller1', 'Portable waterproof 20hr battery', 'new', 'buy_now', 179.95, 179.95, 18, true, 'JBL', true),
            ('Anker PowerCore 26800', 'anker-powercore-seller1', 'Portable charger 26800mAh 3 ports', 'new', 'buy_now', 59.99, 59.99, 50, true, 'Anker', false),
            ('Vintage Sony Walkman WM-DD', 'sony-walkman-dd-seller1', 'Classic 80s Walkman excellent condition', 'good', 'buy_now', 350.00, 350.00, 1, true, 'Sony', true),
            ('Retro Nintendo NES Console', 'nes-console-seller1', 'Original Nintendo Entertainment System', 'good', 'buy_now', 220.00, 220.00, 1, false, 'Nintendo', true),
            ('Apple HomePod Mini', 'homepod-mini-seller1', 'Smart speaker Siri integration', 'new', 'buy_now', 99.00, 99.00, 10, true, 'Apple', false),
            ('Samsung T7 SSD 2TB', 'samsung-t7-2tb-seller1', 'Portable SSD USB 3.2 1050MB/s', 'new', 'buy_now', 179.99, 179.99, 15, true, 'Samsung', true),
            ('Razer BlackWidow V4 Keyboard', 'razer-blackwidow-v4-seller1', 'Mechanical RGB gaming keyboard', 'new', 'buy_now', 169.99, 169.99, 8, true, 'Razer', true)
        ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, accepts_offers)
        WHERE NOT EXISTS (SELECT 1 FROM products WHERE slug = t.slug);
    END IF;

END $$;

-- =====================================================
-- ADD PRODUCT IMAGES
-- =====================================================
INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, sort_order)
SELECT p.id,
       'https://picsum.photos/seed/' || LEFT(p.id::text, 8) || '/800/600',
       'https://picsum.photos/seed/' || LEFT(p.id::text, 8) || '/300/200',
       true, 0
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

-- =====================================================
-- ADDRESSES (for all users)
-- =====================================================
DO $$
DECLARE
    v_user RECORD;
BEGIN
    FOR v_user IN SELECT id, first_name, last_name FROM users LOOP
        INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
        VALUES (
            v_user.id,
            v_user.first_name || ' ' || v_user.last_name,
            (100 + floor(random() * 900)::int)::text || ' ' ||
            (ARRAY['Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Park', 'Lake'])[floor(random() * 8 + 1)::int] || ' ' ||
            (ARRAY['Street', 'Avenue', 'Boulevard', 'Drive', 'Lane', 'Road'])[floor(random() * 6 + 1)::int],
            (ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin'])[floor(random() * 10 + 1)::int],
            (ARRAY['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'TX'])[floor(random() * 10 + 1)::int],
            LPAD(floor(random() * 90000 + 10000)::text, 5, '0'),
            'United States',
            true
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- ORDERS AND ORDER ITEMS (20+ orders)
-- =====================================================
DO $$
DECLARE
    v_buyer_id UUID;
    v_prod RECORD;
    v_order_id UUID;
    v_addr_id UUID;
    v_counter INTEGER := 1;
    v_statuses TEXT[] := ARRAY['delivered', 'delivered', 'delivered', 'shipped', 'shipped', 'processing', 'pending'];
BEGIN
    SELECT id INTO v_buyer_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO v_addr_id FROM addresses WHERE user_id = v_buyer_id LIMIT 1;

    IF v_buyer_id IS NOT NULL AND v_addr_id IS NOT NULL THEN
        FOR v_prod IN
            SELECT p.id, p.seller_id, COALESCE(p.current_price, p.buy_now_price, 99.99) as price
            FROM products p WHERE p.status = 'active' AND p.seller_id != v_buyer_id
            ORDER BY RANDOM() LIMIT 10
        LOOP
            INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_address_id)
            VALUES (
                v_buyer_id, v_prod.seller_id,
                'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(v_counter::text, 5, '0'),
                v_prod.price, CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END, v_prod.price * 0.08,
                v_prod.price * 1.08 + CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END,
                v_statuses[LEAST(v_counter, 7)],
                CASE WHEN v_counter <= 5 THEN 'completed' ELSE 'pending' END,
                v_addr_id
            ) RETURNING id INTO v_order_id;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (v_order_id, v_prod.id, 1, v_prod.price, v_prod.price);

            v_counter := v_counter + 1;
        END LOOP;
    END IF;

    -- Orders for buyer1 (buyer@ebay.com - main test account)
    v_counter := 1;
    SELECT id INTO v_buyer_id FROM users WHERE username = 'buyer1';
    SELECT id INTO v_addr_id FROM addresses WHERE user_id = v_buyer_id LIMIT 1;

    IF v_buyer_id IS NOT NULL AND v_addr_id IS NOT NULL THEN
        FOR v_prod IN
            SELECT p.id, p.seller_id, COALESCE(p.current_price, p.buy_now_price, 99.99) as price
            FROM products p WHERE p.status = 'active' AND p.seller_id != v_buyer_id
            ORDER BY RANDOM() LIMIT 10
        LOOP
            INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_address_id)
            VALUES (
                v_buyer_id, v_prod.seller_id,
                'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-M' || LPAD(v_counter::text, 5, '0'),
                v_prod.price, CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END, v_prod.price * 0.08,
                v_prod.price * 1.08 + CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END,
                v_statuses[LEAST(v_counter, 7)],
                CASE WHEN v_counter <= 5 THEN 'completed' ELSE 'pending' END,
                v_addr_id
            ) RETURNING id INTO v_order_id;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (v_order_id, v_prod.id, 1, v_prod.price, v_prod.price);

            v_counter := v_counter + 1;
        END LOOP;
    END IF;

    v_counter := 1;
    SELECT id INTO v_buyer_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO v_addr_id FROM addresses WHERE user_id = v_buyer_id LIMIT 1;

    IF v_buyer_id IS NOT NULL AND v_addr_id IS NOT NULL THEN
        FOR v_prod IN
            SELECT p.id, p.seller_id, COALESCE(p.current_price, p.buy_now_price, 99.99) as price
            FROM products p WHERE p.status = 'active' AND p.seller_id != v_buyer_id
            ORDER BY RANDOM() LIMIT 10
        LOOP
            INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_address_id)
            VALUES (
                v_buyer_id, v_prod.seller_id,
                'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-B' || LPAD(v_counter::text, 5, '0'),
                v_prod.price, CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END, v_prod.price * 0.08,
                v_prod.price * 1.08 + CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END,
                v_statuses[LEAST(v_counter, 7)],
                CASE WHEN v_counter <= 5 THEN 'completed' ELSE 'pending' END,
                v_addr_id
            ) RETURNING id INTO v_order_id;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (v_order_id, v_prod.id, 1, v_prod.price, v_prod.price);

            v_counter := v_counter + 1;
        END LOOP;
    END IF;

    -- Orders for seller1 (seller@ebay.com - also can act as buyer)
    v_counter := 1;
    SELECT id INTO v_buyer_id FROM users WHERE username = 'seller1';
    SELECT id INTO v_addr_id FROM addresses WHERE user_id = v_buyer_id LIMIT 1;

    IF v_buyer_id IS NOT NULL AND v_addr_id IS NOT NULL THEN
        FOR v_prod IN
            SELECT p.id, p.seller_id, COALESCE(p.current_price, p.buy_now_price, 99.99) as price
            FROM products p WHERE p.status = 'active' AND p.seller_id != v_buyer_id
            ORDER BY RANDOM() LIMIT 5
        LOOP
            INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_address_id)
            VALUES (
                v_buyer_id, v_prod.seller_id,
                'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-S' || LPAD(v_counter::text, 5, '0'),
                v_prod.price, CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END, v_prod.price * 0.08,
                v_prod.price * 1.08 + CASE WHEN random() > 0.5 THEN 0 ELSE 9.99 END,
                v_statuses[LEAST(v_counter, 7)],
                CASE WHEN v_counter <= 3 THEN 'completed' ELSE 'pending' END,
                v_addr_id
            ) RETURNING id INTO v_order_id;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (v_order_id, v_prod.id, 1, v_prod.price, v_prod.price);

            v_counter := v_counter + 1;
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- REVIEWS (20 reviews)
-- =====================================================
DO $$
DECLARE
    v_order RECORD;
    v_review_texts TEXT[] := ARRAY[
        'Excellent product! Exactly as described.',
        'Great quality, would buy again.',
        'Perfect condition, quick delivery.',
        'Amazing value for money.',
        'Product exceeded expectations.',
        'Good item, shipping took longer.',
        'As described, good communication.',
        'Love it! Will shop here again.'
    ];
BEGIN
    FOR v_order IN
        SELECT o.id, o.buyer_id, o.seller_id, oi.product_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        LIMIT 20
    LOOP
        INSERT INTO reviews (reviewer_id, reviewed_user_id, product_id, order_id, rating, title, comment, review_type)
        VALUES (
            v_order.buyer_id,
            v_order.seller_id,
            v_order.product_id,
            v_order.id,
            4 + floor(random() * 2)::int,
            'Great Purchase!',
            v_review_texts[floor(random() * 8 + 1)::int],
            'seller'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- BIDS (20 bids on auction items)
-- =====================================================
DO $$
DECLARE
    v_auction RECORD;
    v_bidder_id UUID;
    v_bid_amount NUMERIC;
BEGIN
    FOR v_auction IN
        SELECT id, seller_id, starting_price, current_price
        FROM products
        WHERE listing_type = 'auction' AND status = 'active'
        LIMIT 10
    LOOP
        FOR i IN 1..3 LOOP
            SELECT id INTO v_bidder_id FROM users
            WHERE id != v_auction.seller_id AND is_seller = false
            ORDER BY RANDOM() LIMIT 1;

            IF v_bidder_id IS NOT NULL THEN
                v_bid_amount := COALESCE(v_auction.current_price, v_auction.starting_price) + (i * 100) + floor(random() * 50);

                INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning)
                VALUES (v_auction.id, v_bidder_id, v_bid_amount, i = 3)
                ON CONFLICT DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- WATCHLIST (for all users including sellers)
-- =====================================================
INSERT INTO watchlist (user_id, product_id)
SELECT u.id, p.id
FROM users u
CROSS JOIN LATERAL (
    SELECT id FROM products WHERE status = 'active' AND seller_id != u.id ORDER BY RANDOM() LIMIT 3
) p
ON CONFLICT DO NOTHING;

-- =====================================================
-- MESSAGES (20 messages)
-- =====================================================
DO $$
DECLARE
    v_prod RECORD;
    v_buyer_id UUID;
    v_messages TEXT[] := ARRAY[
        'Hi, is this item still available?',
        'Can you tell me more about the condition?',
        'Would you consider a lower price?',
        'How soon can you ship?',
        'Does this come with original packaging?',
        'Is this authentic/genuine?',
        'Can you provide more photos?',
        'What is your return policy?'
    ];
BEGIN
    FOR v_prod IN SELECT id, seller_id, title FROM products WHERE status = 'active' LIMIT 20 LOOP
        SELECT id INTO v_buyer_id FROM users WHERE id != v_prod.seller_id ORDER BY RANDOM() LIMIT 1;

        IF v_buyer_id IS NOT NULL THEN
            INSERT INTO messages (sender_id, recipient_id, product_id, subject, body, is_read)
            VALUES (
                v_buyer_id,
                v_prod.seller_id,
                v_prod.id,
                'Question about: ' || LEFT(v_prod.title, 50),
                v_messages[floor(random() * 8 + 1)::int],
                random() > 0.3
            )
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- NOTIFICATIONS (20 notifications)
-- =====================================================
DO $$
DECLARE
    v_user_id UUID;
    v_types TEXT[] := ARRAY['order_update', 'bid_outbid', 'message', 'price_drop', 'item_sold', 'watchlist'];
    v_titles TEXT[] := ARRAY['Order Update', 'Outbid Alert', 'New Message', 'Price Drop', 'Item Sold!', 'Watchlist Alert'];
    v_msgs TEXT[] := ARRAY[
        'Your order has been shipped',
        'Someone placed a higher bid',
        'You have a new message',
        'Price drop on watchlist item',
        'Your item has sold',
        'Item on watchlist updated'
    ];
BEGIN
    FOR v_user_id IN SELECT id FROM users LOOP
        FOR i IN 1..2 LOOP
            INSERT INTO notifications (user_id, type, title, message, is_read)
            VALUES (
                v_user_id,
                v_types[floor(random() * 6 + 1)::int],
                v_titles[floor(random() * 6 + 1)::int],
                v_msgs[floor(random() * 6 + 1)::int],
                random() > 0.5
            );
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- OFFERS (20 offers)
-- =====================================================
INSERT INTO offers (product_id, buyer_id, seller_id, offer_amount, message, status, expires_at)
SELECT
    p.id,
    (SELECT id FROM users WHERE id != p.seller_id AND is_seller = false ORDER BY RANDOM() LIMIT 1),
    p.seller_id,
    p.buy_now_price * (0.70 + random() * 0.25),
    (ARRAY['Would you accept this offer?', 'My best offer, ready to pay now', 'Interested, can we negotiate?', 'Hoping to make a deal'])[floor(random() * 4 + 1)::int],
    (ARRAY['pending', 'accepted', 'declined', 'countered', 'expired'])[floor(random() * 5 + 1)::int],
    NOW() + (random() * 96)::int * INTERVAL '1 hour'
FROM products p
WHERE p.accepts_offers = true AND p.buy_now_price IS NOT NULL
LIMIT 20
ON CONFLICT DO NOTHING;

-- =====================================================
-- COUPONS (20 coupons)
-- =====================================================
INSERT INTO coupons (code, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, usage_count, is_active, start_date, end_date)
VALUES
    ('WELCOME10', 'percentage', 10, 50, 100, 1000, 450, true, NOW() - INTERVAL '60 days', NOW() + INTERVAL '30 days'),
    ('SUMMER25', 'percentage', 25, 100, 250, 500, 234, true, NOW() - INTERVAL '30 days', NOW() + INTERVAL '60 days'),
    ('FREESHIP', 'free_shipping', 0, 75, 15, 2000, 1567, true, NOW() - INTERVAL '90 days', NOW() + INTERVAL '90 days'),
    ('TECH20', 'percentage', 20, 200, 500, 300, 189, true, NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days'),
    ('FASHION15', 'percentage', 15, 50, 150, 400, 267, true, NOW() - INTERVAL '20 days', NOW() + INTERVAL '40 days'),
    ('FLAT50', 'fixed_amount', 50, 500, 50, 200, 78, true, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days'),
    ('LOYALTY5', 'fixed_amount', 5, 25, 5, 5000, 3456, true, NOW() - INTERVAL '120 days', NOW() + INTERVAL '120 days'),
    ('WEEKEND30', 'percentage', 30, 150, 300, 100, 45, true, NOW() - INTERVAL '3 days', NOW() + INTERVAL '4 days'),
    ('SPORTS10', 'percentage', 10, 100, 200, 250, 123, true, NOW() - INTERVAL '25 days', NOW() + INTERVAL '35 days'),
    ('HOME15', 'percentage', 15, 75, 175, 350, 198, true, NOW() - INTERVAL '18 days', NOW() + INTERVAL '42 days'),
    ('NEWUSER20', 'percentage', 20, 0, 100, 10000, 5678, true, NOW() - INTERVAL '180 days', NOW() + INTERVAL '180 days'),
    ('HOLIDAY25', 'percentage', 25, 100, 250, 1000, 0, true, NOW() + INTERVAL '30 days', NOW() + INTERVAL '45 days'),
    ('COLLECT10', 'percentage', 10, 50, 500, 200, 89, true, NOW() - INTERVAL '22 days', NOW() + INTERVAL '38 days'),
    ('VIP30', 'percentage', 30, 250, 500, 100, 34, true, NOW() - INTERVAL '14 days', NOW() + INTERVAL '46 days'),
    ('SAVE100', 'fixed_amount', 100, 1000, 100, 150, 67, true, NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days'),
    ('BONUS15', 'percentage', 15, 80, 120, 300, 156, true, NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days'),
    ('EARLY20', 'percentage', 20, 100, 200, 200, 0, true, NOW() + INTERVAL '7 days', NOW() + INTERVAL '14 days'),
    ('BUNDLE10', 'percentage', 10, 150, 100, 500, 234, true, NOW() - INTERVAL '45 days', NOW() + INTERVAL '45 days'),
    ('FLASH40', 'percentage', 40, 200, 400, 50, 50, false, NOW() - INTERVAL '7 days', NOW() - INTERVAL '1 day'),
    ('CLEARANCE', 'percentage', 50, 50, 500, 75, 75, false, NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- SAVED SEARCHES (20 saved searches)
-- =====================================================
DO $$
DECLARE
    v_user RECORD;
    v_names TEXT[] := ARRAY['iPhone Deals', 'MacBook Pro', 'Rolex Watches', 'Designer Bags', 'Gaming Consoles', 'Sports Equipment', 'Vintage Items', 'Camera Gear'];
    v_queries TEXT[] := ARRAY['iphone 15', 'macbook m3', 'rolex', 'gucci bag', 'playstation 5', 'golf clubs', 'vintage', 'canon camera'];
BEGIN
    FOR v_user IN SELECT id FROM users WHERE is_seller = false LOOP
        FOR i IN 1..3 LOOP
            INSERT INTO saved_searches (user_id, name, search_query, max_price, email_alerts)
            VALUES (
                v_user.id,
                v_names[floor(random() * 8 + 1)::int],
                v_queries[floor(random() * 8 + 1)::int],
                floor(random() * 5000 + 500)::numeric,
                random() > 0.3
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- =====================================================
-- PRICE ALERTS (20 price alerts)
-- =====================================================
INSERT INTO price_alerts (user_id, product_id, target_price, is_active)
SELECT
    w.user_id,
    w.product_id,
    p.current_price * (0.7 + random() * 0.2),
    true
FROM watchlist w
JOIN products p ON p.id = w.product_id
WHERE p.current_price IS NOT NULL
LIMIT 20
ON CONFLICT DO NOTHING;

-- =====================================================
-- COLLECTIONS (20 collections)
-- =====================================================
INSERT INTO collections (user_id, name, description, is_public)
SELECT
    u.id,
    (ARRAY['Tech Wishlist', 'Fashion Favorites', 'Gift Ideas', 'Home Office', 'Sports Gear', 'Holiday Gifts'])[floor(random() * 6 + 1)::int] || ' ' || u.first_name,
    'My curated collection of favorite items',
    random() > 0.3
FROM users u
LIMIT 20
ON CONFLICT DO NOTHING;

-- =====================================================
-- SHOPPING CARTS (15 cart items)
-- =====================================================
INSERT INTO shopping_carts (user_id)
SELECT id FROM users WHERE is_seller = false
ON CONFLICT DO NOTHING;

INSERT INTO cart_items (cart_id, product_id, quantity)
SELECT
    sc.id,
    p.id,
    1
FROM shopping_carts sc
CROSS JOIN LATERAL (
    SELECT id FROM products WHERE status = 'active' ORDER BY RANDOM() LIMIT 2
) p
ON CONFLICT DO NOTHING;

-- =====================================================
-- RETURNS (for buyer1 and other buyers)
-- =====================================================
DO $$
DECLARE
    v_order RECORD;
    v_reasons TEXT[] := ARRAY['changed_mind', 'defective', 'not_as_described', 'wrong_item', 'arrived_late'];
    v_statuses TEXT[] := ARRAY['requested', 'approved', 'shipped', 'received', 'refunded'];
BEGIN
    FOR v_order IN
        SELECT o.id as order_id, oi.id as item_id, o.buyer_id, o.seller_id, o.total
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        LIMIT 15
    LOOP
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason, return_details, status, refund_amount, refund_type)
        VALUES (
            v_order.order_id,
            v_order.item_id,
            v_order.buyer_id,
            v_order.seller_id,
            v_reasons[floor(random() * 5 + 1)::int],
            'I would like to return this item',
            v_statuses[floor(random() * 5 + 1)::int],
            v_order.total * (0.5 + random() * 0.5),
            'full'
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- DISPUTES (for buyer1 and other buyers)
-- =====================================================
DO $$
DECLARE
    v_order RECORD;
    v_types TEXT[] := ARRAY['item_not_received', 'item_not_as_described', 'unauthorized_purchase', 'other'];
    v_statuses TEXT[] := ARRAY['open', 'pending_seller_response', 'under_review', 'resolved', 'closed'];
    v_resolutions TEXT[] := ARRAY['full_refund', 'partial_refund', 'replacement', 'other'];
BEGIN
    FOR v_order IN
        SELECT o.id as order_id, oi.id as item_id, o.buyer_id, o.seller_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status IN ('delivered', 'shipped')
        LIMIT 10
    LOOP
        INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, status, reason, desired_resolution)
        VALUES (
            v_order.order_id,
            v_order.item_id,
            v_order.buyer_id,
            v_order.seller_id,
            v_types[floor(random() * 4 + 1)::int],
            v_statuses[floor(random() * 5 + 1)::int],
            'I have an issue with this order',
            v_resolutions[floor(random() * 4 + 1)::int]
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- UPDATE SELLER STATISTICS
-- =====================================================
UPDATE users u
SET total_sales = COALESCE(
    (SELECT SUM(o.total)::integer FROM orders o WHERE o.seller_id = u.id AND o.payment_status = 'completed'),
    0
)
WHERE u.is_seller = true;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'Users' as entity, COUNT(*)::text as count FROM users
UNION ALL SELECT 'Categories', COUNT(*)::text FROM categories
UNION ALL SELECT 'Products', COUNT(*)::text FROM products
UNION ALL SELECT 'Orders', COUNT(*)::text FROM orders
UNION ALL SELECT 'Reviews', COUNT(*)::text FROM reviews
UNION ALL SELECT 'Bids', COUNT(*)::text FROM bids
UNION ALL SELECT 'Watchlist', COUNT(*)::text FROM watchlist
UNION ALL SELECT 'Messages', COUNT(*)::text FROM messages
UNION ALL SELECT 'Notifications', COUNT(*)::text FROM notifications
UNION ALL SELECT 'Offers', COUNT(*)::text FROM offers
UNION ALL SELECT 'Coupons', COUNT(*)::text FROM coupons
UNION ALL SELECT 'Saved Searches', COUNT(*)::text FROM saved_searches;
