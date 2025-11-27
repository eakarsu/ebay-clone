-- eBay Clone - Additional Seed Data for New Features
-- Run this after schema_additions.sql

-- =====================================================
-- MAKE FIRST USER AN ADMIN
-- =====================================================
UPDATE users SET is_admin = true WHERE username = 'johndoe';
UPDATE users SET email_verified = true WHERE id IN (SELECT id FROM users LIMIT 5);

-- =====================================================
-- ADD MORE PRODUCTS (50+ products across categories)
-- =====================================================

-- Get category and user IDs
DO $$
DECLARE
    electronics_id UUID;
    fashion_id UUID;
    home_id UUID;
    sports_id UUID;
    collectibles_id UUID;
    motors_id UUID;
    seller1_id UUID;
    seller2_id UUID;
    seller3_id UUID;
    buyer1_id UUID;
    buyer2_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO electronics_id FROM categories WHERE slug = 'electronics' LIMIT 1;
    SELECT id INTO fashion_id FROM categories WHERE slug = 'fashion' LIMIT 1;
    SELECT id INTO home_id FROM categories WHERE slug = 'home-garden' LIMIT 1;
    SELECT id INTO sports_id FROM categories WHERE slug = 'sporting-goods' LIMIT 1;
    SELECT id INTO collectibles_id FROM categories WHERE slug = 'collectibles' LIMIT 1;
    SELECT id INTO motors_id FROM categories WHERE slug = 'motors' LIMIT 1;

    -- Get user IDs
    SELECT id INTO seller1_id FROM users WHERE username = 'johndoe' LIMIT 1;
    SELECT id INTO seller2_id FROM users WHERE username = 'janesmith' LIMIT 1;
    SELECT id INTO seller3_id FROM users WHERE username = 'techseller' LIMIT 1;
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'collector99' LIMIT 1;

    -- Electronics Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status) VALUES
    (seller1_id, electronics_id, 'Samsung Galaxy S24 Ultra 512GB', 'samsung-galaxy-s24-ultra-512gb', 'Brand new Samsung Galaxy S24 Ultra with 512GB storage. Titanium Black color. Includes original charger and case.', 'new', 'buy_now', 1199.99, 1199.99, 5, true, 'Samsung', 'active'),
    (seller1_id, electronics_id, 'Apple MacBook Pro 16" M3 Max', 'apple-macbook-pro-16-m3-max', 'Latest MacBook Pro with M3 Max chip, 36GB RAM, 1TB SSD. Space Black. AppleCare+ included.', 'new', 'buy_now', 3499.00, 3499.00, 3, true, 'Apple', 'active'),
    (seller2_id, electronics_id, 'Sony PlayStation 5 Digital Edition', 'sony-ps5-digital-edition', 'PS5 Digital Edition console. Like new condition, barely used. Includes controller and HDMI cable.', 'like_new', 'both', 350.00, 425.00, 1, false, 'Sony', 'active'),
    (seller2_id, electronics_id, 'Nintendo Switch OLED Model', 'nintendo-switch-oled-model', 'Nintendo Switch OLED with white Joy-Cons. Excellent condition with screen protector installed.', 'very_good', 'auction', 275.00, NULL, 1, false, 'Nintendo', 'active'),
    (seller3_id, electronics_id, 'DJI Mini 4 Pro Drone Fly More Combo', 'dji-mini-4-pro-fly-more', 'Complete DJI Mini 4 Pro kit with 3 batteries, charging hub, and carrying case. 4K HDR video.', 'new', 'buy_now', 1099.00, 1099.00, 8, true, 'DJI', 'active'),
    (seller1_id, electronics_id, 'Bose QuietComfort Ultra Headphones', 'bose-qc-ultra-headphones', 'Premium noise cancelling headphones. Black color. Includes case and cables.', 'new', 'buy_now', 379.00, 379.00, 12, true, 'Bose', 'active'),
    (seller2_id, electronics_id, 'LG C3 65" OLED 4K Smart TV', 'lg-c3-65-oled-tv', 'Stunning OLED display with perfect blacks. Gaming features included. Wall mount ready.', 'new', 'buy_now', 1496.99, 1496.99, 4, false, 'LG', 'active'),
    (seller3_id, electronics_id, 'Canon EOS R6 Mark II Body', 'canon-eos-r6-mark-ii', 'Professional mirrorless camera body. 24.2MP full-frame sensor. Excellent for video and photos.', 'new', 'buy_now', 2299.00, 2299.00, 2, true, 'Canon', 'active'),
    (seller1_id, electronics_id, 'Apple iPad Pro 12.9" M2 256GB', 'apple-ipad-pro-12-9-m2', 'iPad Pro with M2 chip, 256GB, WiFi + Cellular. Space Gray. Includes Apple Pencil 2.', 'like_new', 'both', 899.00, 999.00, 1, true, 'Apple', 'active'),
    (seller2_id, electronics_id, 'Vintage Sony Walkman WM-F10', 'vintage-sony-walkman-wm-f10', 'Rare 1983 Sony Walkman in working condition. Collectors item. Original case included.', 'good', 'auction', 150.00, NULL, 1, false, 'Sony', 'active');

    -- Fashion Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status) VALUES
    (seller2_id, fashion_id, 'Gucci GG Marmont Shoulder Bag', 'gucci-gg-marmont-bag', 'Authentic Gucci matelassé leather bag in dusty pink. Includes dust bag and authenticity card.', 'like_new', 'buy_now', 1850.00, 1850.00, 1, true, 'Gucci', 'active'),
    (seller2_id, fashion_id, 'Louis Vuitton Neverfull MM', 'louis-vuitton-neverfull-mm', 'Classic LV Neverfull in Damier Ebene. Gently used, excellent condition. Original receipt available.', 'very_good', 'both', 1200.00, 1400.00, 1, true, 'Louis Vuitton', 'active'),
    (seller1_id, fashion_id, 'Nike Air Jordan 1 Retro High OG', 'nike-jordan-1-retro-high', 'Brand new Air Jordan 1 Chicago colorway. Size 10. Deadstock with original box.', 'new', 'auction', 350.00, NULL, 1, false, 'Nike', 'active'),
    (seller3_id, fashion_id, 'Rolex Submariner Date 126610LN', 'rolex-submariner-126610ln', 'Authentic Rolex Submariner. 2023 model with black dial. Complete box and papers.', 'like_new', 'buy_now', 13500.00, 13500.00, 1, true, 'Rolex', 'active'),
    (seller1_id, fashion_id, 'Canada Goose Expedition Parka', 'canada-goose-expedition-parka', 'Extreme weather parka in black. Size Large. Perfect for cold winters.', 'new', 'buy_now', 1295.00, 1295.00, 3, true, 'Canada Goose', 'active'),
    (seller2_id, fashion_id, 'Ray-Ban Aviator Classic Gold', 'ray-ban-aviator-classic-gold', 'Classic aviator sunglasses with green G-15 lenses. Includes case and cleaning cloth.', 'new', 'buy_now', 154.00, 154.00, 20, true, 'Ray-Ban', 'active'),
    (seller3_id, fashion_id, 'Vintage Levi''s 501 Jeans 1980s', 'vintage-levis-501-1980s', 'Authentic 1980s Levi''s 501 jeans. W32 L34. Classic faded blue wash.', 'good', 'auction', 85.00, NULL, 1, false, 'Levi''s', 'active'),
    (seller1_id, fashion_id, 'Burberry Classic Check Scarf', 'burberry-classic-check-scarf', '100% cashmere Burberry scarf in classic check. New with tags.', 'new', 'buy_now', 470.00, 470.00, 5, true, 'Burberry', 'active');

    -- Home & Garden Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status) VALUES
    (seller1_id, home_id, 'Dyson V15 Detect Cordless Vacuum', 'dyson-v15-detect-vacuum', 'Latest Dyson vacuum with laser dust detection. Complete accessory kit included.', 'new', 'buy_now', 649.99, 649.99, 10, true, 'Dyson', 'active'),
    (seller2_id, home_id, 'KitchenAid Artisan Stand Mixer', 'kitchenaid-artisan-mixer', 'Empire Red 5-quart mixer. Includes pasta attachment and extra bowl.', 'like_new', 'buy_now', 349.00, 349.00, 2, false, 'KitchenAid', 'active'),
    (seller3_id, home_id, 'Weber Genesis E-335 Gas Grill', 'weber-genesis-e335-grill', 'Premium 3-burner propane grill with sear station. Assembly available.', 'new', 'buy_now', 1099.00, 1099.00, 3, false, 'Weber', 'active'),
    (seller1_id, home_id, 'Roomba j7+ Robot Vacuum', 'roomba-j7-plus-robot', 'Self-emptying robot vacuum with obstacle avoidance. Perfect for pet owners.', 'new', 'buy_now', 599.99, 599.99, 7, true, 'iRobot', 'active'),
    (seller2_id, home_id, 'Le Creuset Dutch Oven 7.25 Qt', 'le-creuset-dutch-oven-725', 'Flame orange enameled cast iron. Perfect for soups and stews.', 'new', 'buy_now', 395.00, 395.00, 4, true, 'Le Creuset', 'active'),
    (seller3_id, home_id, 'Restoration Hardware Cloud Sofa', 'rh-cloud-sofa-sectional', 'Luxurious modular sofa in white linen. 4-piece sectional.', 'very_good', 'both', 4500.00, 5500.00, 1, false, 'Restoration Hardware', 'active'),
    (seller1_id, home_id, 'Breville Barista Express Espresso', 'breville-barista-express', 'Complete espresso machine with built-in grinder. Stainless steel finish.', 'new', 'buy_now', 599.95, 599.95, 6, true, 'Breville', 'active');

    -- Sports & Outdoors Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status) VALUES
    (seller1_id, sports_id, 'Peloton Bike+ With Screen', 'peloton-bike-plus-screen', 'Peloton Bike+ with rotating HD screen. Includes mat and weights.', 'like_new', 'buy_now', 1895.00, 1895.00, 1, false, 'Peloton', 'active'),
    (seller2_id, sports_id, 'TaylorMade Stealth 2 Driver', 'taylormade-stealth-2-driver', 'Latest Stealth 2 driver. 10.5 degree loft, stiff flex. Used twice.', 'like_new', 'auction', 400.00, NULL, 1, true, 'TaylorMade', 'active'),
    (seller3_id, sports_id, 'Yeti Tundra 65 Cooler', 'yeti-tundra-65-cooler', 'Heavy-duty rotomolded cooler in tan. Keeps ice for days.', 'new', 'buy_now', 375.00, 375.00, 8, false, 'YETI', 'active'),
    (seller1_id, sports_id, 'Specialized Tarmac SL7 Road Bike', 'specialized-tarmac-sl7', 'Pro-level carbon road bike. Size 56. Shimano Ultegra groupset.', 'very_good', 'both', 4200.00, 5000.00, 1, false, 'Specialized', 'active'),
    (seller2_id, sports_id, 'Garmin Fenix 7X Sapphire Solar', 'garmin-fenix-7x-sapphire', 'Ultimate multisport GPS watch with solar charging. Like new.', 'like_new', 'buy_now', 749.00, 749.00, 2, true, 'Garmin', 'active'),
    (seller3_id, sports_id, 'REI Half Dome SL 2+ Tent', 'rei-half-dome-sl-2-plus', 'Lightweight backpacking tent for 2 people. Brand new in box.', 'new', 'buy_now', 279.00, 279.00, 5, true, 'REI', 'active'),
    (seller1_id, sports_id, 'Titleist Pro V1 Golf Balls 4 Dozen', 'titleist-pro-v1-4-dozen', 'Premium golf balls. 48 balls total. New in packaging.', 'new', 'buy_now', 199.99, 199.99, 15, true, 'Titleist', 'active');

    -- Collectibles Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status) VALUES
    (seller1_id, collectibles_id, 'Pokemon Charizard 1st Edition PSA 9', 'pokemon-charizard-1st-psa9', 'Graded holographic Charizard from Base Set. PSA 9 Mint condition.', 'like_new', 'auction', 15000.00, NULL, 1, true, 'Pokemon', 'active'),
    (seller2_id, collectibles_id, 'Star Wars Boba Fett Vintage 1979', 'star-wars-boba-fett-1979', 'Original Kenner Boba Fett figure. Loose but complete. Great condition.', 'good', 'auction', 250.00, NULL, 1, true, 'Kenner', 'active'),
    (seller3_id, collectibles_id, 'LEGO Star Wars UCS Millennium Falcon', 'lego-ucs-millennium-falcon-75192', 'Ultimate Collector Series set #75192. New sealed in box.', 'new', 'buy_now', 849.99, 849.99, 2, false, 'LEGO', 'active'),
    (seller1_id, collectibles_id, 'Michael Jordan Rookie Card PSA 8', 'jordan-rookie-card-psa8', '1986 Fleer Michael Jordan rookie card. PSA 8 NM-MT.', 'very_good', 'auction', 8500.00, NULL, 1, true, 'Fleer', 'active'),
    (seller2_id, collectibles_id, 'Funko Pop Marvel Venom #373', 'funko-pop-venom-373', 'Rare Venomized Ghost Rider pop. Box in mint condition.', 'new', 'buy_now', 45.00, 45.00, 3, true, 'Funko', 'active'),
    (seller3_id, collectibles_id, 'Vintage Coca-Cola Vending Machine', 'vintage-coca-cola-vending', '1950s Coca-Cola vending machine. Restored and working. Local pickup only.', 'good', 'auction', 2500.00, NULL, 1, false, 'Coca-Cola', 'active'),
    (seller1_id, collectibles_id, 'Comic Book Amazing Spider-Man #300', 'amazing-spider-man-300', 'First appearance of Venom! CGC 9.4. McFarlane cover art.', 'very_good', 'buy_now', 650.00, 650.00, 1, true, 'Marvel', 'active');

    -- Motors & Automotive
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status) VALUES
    (seller1_id, motors_id, 'Tesla Model S Plaid 2023', 'tesla-model-s-plaid-2023', '2023 Tesla Model S Plaid. 5,000 miles. Pearl White. Full self-driving.', 'like_new', 'buy_now', 89999.00, 89999.00, 1, false, 'Tesla', 'active'),
    (seller2_id, motors_id, 'Harley-Davidson Iron 883 2022', 'harley-iron-883-2022', 'Sportster Iron 883 in Vivid Black. Only 2,500 miles. Like new.', 'like_new', 'both', 8500.00, 9500.00, 1, false, 'Harley-Davidson', 'active'),
    (seller3_id, motors_id, 'BBS RS Wheels 18x8.5 5x120', 'bbs-rs-wheels-18-5x120', 'Classic BBS RS wheels. Refinished in gold centers. Set of 4.', 'very_good', 'buy_now', 2800.00, 2800.00, 1, false, 'BBS', 'active'),
    (seller1_id, motors_id, 'Porsche 911 Carrera Engine 3.2L', 'porsche-911-engine-32l', 'Complete running 3.2L engine from 1987 911. 85k miles. Compression tested.', 'good', 'auction', 12000.00, NULL, 1, false, 'Porsche', 'active');

END $$;

-- =====================================================
-- ADD PRODUCT IMAGES
-- =====================================================
INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, sort_order)
SELECT p.id,
       '/uploads/images/product_' || p.id || '.webp',
       '/uploads/thumbnails/product_' || p.id || '_thumb.webp',
       true, 0
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

-- =====================================================
-- ADD SAMPLE ORDERS
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    buyer2_id UUID;
    seller1_id UUID;
    product1_id UUID;
    product2_id UUID;
    order1_id UUID;
    order2_id UUID;
    order3_id UUID;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'collector99' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'johndoe' LIMIT 1;
    SELECT id INTO product1_id FROM products WHERE title LIKE '%Samsung Galaxy%' LIMIT 1;
    SELECT id INTO product2_id FROM products WHERE title LIKE '%Dyson%' LIMIT 1;

    -- Create orders
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country)
    VALUES
    (uuid_generate_v4(), buyer1_id, seller1_id, 'ORD-2024-001', 1199.99, 0, 96.00, 1295.99, 'delivered', 'completed', 'John Buyer', '123 Main St', 'New York', 'NY', '10001', 'USA')
    RETURNING id INTO order1_id;

    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country)
    VALUES
    (uuid_generate_v4(), buyer2_id, seller1_id, 'ORD-2024-002', 649.99, 0, 52.00, 701.99, 'shipped', 'completed', 'Jane Collector', '456 Oak Ave', 'Los Angeles', 'CA', '90001', 'USA')
    RETURNING id INTO order2_id;

    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status, shipping_name, shipping_address, shipping_city, shipping_state, shipping_zip, shipping_country)
    VALUES
    (uuid_generate_v4(), buyer1_id, seller1_id, 'ORD-2024-003', 379.00, 0, 30.32, 409.32, 'pending', 'pending', 'John Buyer', '123 Main St', 'New York', 'NY', '10001', 'USA')
    RETURNING id INTO order3_id;

    -- Add order items
    INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price)
    VALUES
    (order1_id, product1_id, seller1_id, 1, 1199.99, 1199.99),
    (order2_id, product2_id, seller1_id, 1, 649.99, 649.99);
END $$;

-- =====================================================
-- ADD SAMPLE REVIEWS
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    buyer2_id UUID;
    product_id UUID;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'collector99' LIMIT 1;

    FOR product_id IN SELECT id FROM products LIMIT 20 LOOP
        INSERT INTO reviews (product_id, user_id, rating, title, comment)
        VALUES
        (product_id, buyer1_id, 5, 'Excellent product!', 'Exactly as described. Fast shipping. Would buy again!'),
        (product_id, buyer2_id, 4, 'Great quality', 'Very happy with my purchase. Minor packaging issue but item was perfect.')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- ADD SAMPLE BIDS (for auction items)
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    buyer2_id UUID;
    auction_product RECORD;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'collector99' LIMIT 1;

    FOR auction_product IN SELECT id, current_price FROM products WHERE listing_type IN ('auction', 'both') LIMIT 10 LOOP
        INSERT INTO bids (product_id, user_id, amount, is_winning)
        VALUES
        (auction_product.id, buyer1_id, auction_product.current_price + 10, false),
        (auction_product.id, buyer2_id, auction_product.current_price + 25, true);

        UPDATE products SET current_price = auction_product.current_price + 25, bid_count = 2 WHERE id = auction_product.id;
    END LOOP;
END $$;

-- =====================================================
-- ADD SAMPLE COUPONS
-- =====================================================
INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, per_user_limit, start_date, end_date, is_active) VALUES
('WELCOME10', 'Welcome discount - 10% off your first order', 'percentage', 10.00, 50.00, 100.00, 1000, 1, NOW(), NOW() + INTERVAL '1 year', true),
('SAVE20', 'Save $20 on orders over $100', 'fixed_amount', 20.00, 100.00, NULL, 500, 2, NOW(), NOW() + INTERVAL '6 months', true),
('FREESHIP', 'Free shipping on any order', 'free_shipping', 0.00, 0.00, NULL, NULL, 5, NOW(), NOW() + INTERVAL '3 months', true),
('SUMMER25', 'Summer sale - 25% off', 'percentage', 25.00, 75.00, 200.00, 200, 1, NOW(), NOW() + INTERVAL '2 months', true),
('VIP50', 'VIP exclusive - $50 off $200+', 'fixed_amount', 50.00, 200.00, NULL, 50, 1, NOW(), NOW() + INTERVAL '1 month', true);

-- =====================================================
-- ADD SAMPLE SAVED SEARCHES
-- =====================================================
DO $$
DECLARE
    user1_id UUID;
    user2_id UUID;
    electronics_id UUID;
    fashion_id UUID;
BEGIN
    SELECT id INTO user1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO user2_id FROM users WHERE username = 'collector99' LIMIT 1;
    SELECT id INTO electronics_id FROM categories WHERE slug = 'electronics' LIMIT 1;
    SELECT id INTO fashion_id FROM categories WHERE slug = 'fashion' LIMIT 1;

    INSERT INTO saved_searches (user_id, name, search_query, category_id, min_price, max_price, email_alerts, alert_frequency) VALUES
    (user1_id, 'iPhone Deals', 'iphone', electronics_id, NULL, 1000.00, true, 'daily'),
    (user1_id, 'Gaming Laptops', 'gaming laptop', electronics_id, 500.00, 2000.00, true, 'weekly'),
    (user2_id, 'Vintage Watches', 'vintage watch', fashion_id, 100.00, 5000.00, true, 'daily'),
    (user2_id, 'Pokemon Cards', 'pokemon psa', NULL, NULL, NULL, true, 'instant');
END $$;

-- =====================================================
-- ADD SAMPLE DISPUTES
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    seller1_id UUID;
    order1_id UUID;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'johndoe' LIMIT 1;
    SELECT id INTO order1_id FROM orders WHERE order_number = 'ORD-2024-001' LIMIT 1;

    IF order1_id IS NOT NULL THEN
        INSERT INTO disputes (order_id, opened_by, against_user, dispute_type, status, reason, desired_resolution) VALUES
        (order1_id, buyer1_id, seller1_id, 'item_not_as_described', 'resolved', 'Item received has minor scratches not shown in photos', 'partial_refund');
    END IF;
END $$;

-- =====================================================
-- ADD SAMPLE RETURNS
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    seller1_id UUID;
    order2_id UUID;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'johndoe' LIMIT 1;
    SELECT id INTO order2_id FROM orders WHERE order_number = 'ORD-2024-002' LIMIT 1;

    IF order2_id IS NOT NULL THEN
        INSERT INTO returns (order_id, buyer_id, seller_id, return_reason, return_details, status) VALUES
        (order2_id, buyer1_id, seller1_id, 'changed_mind', 'Found a better deal elsewhere. Item is unopened.', 'approved');
    END IF;
END $$;

-- =====================================================
-- ADD SAMPLE PAYMENT TRANSACTIONS
-- =====================================================
DO $$
DECLARE
    order_rec RECORD;
BEGIN
    FOR order_rec IN SELECT id, buyer_id, total FROM orders WHERE payment_status = 'completed' LOOP
        INSERT INTO payment_transactions (order_id, user_id, amount, status, stripe_payment_intent_id)
        VALUES (order_rec.id, order_rec.buyer_id, order_rec.total, 'succeeded', 'pi_' || md5(random()::text))
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- ADD SAMPLE WATCHLIST ITEMS
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    buyer2_id UUID;
    product_id UUID;
    counter INT := 0;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'collector99' LIMIT 1;

    FOR product_id IN SELECT id FROM products WHERE status = 'active' ORDER BY RANDOM() LIMIT 15 LOOP
        IF counter < 8 THEN
            INSERT INTO watchlist (user_id, product_id) VALUES (buyer1_id, product_id) ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO watchlist (user_id, product_id) VALUES (buyer2_id, product_id) ON CONFLICT DO NOTHING;
        END IF;
        counter := counter + 1;
    END LOOP;
END $$;

-- =====================================================
-- ADD SAMPLE MESSAGES
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    seller1_id UUID;
    product_id UUID;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer123' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'johndoe' LIMIT 1;
    SELECT id INTO product_id FROM products WHERE seller_id = seller1_id LIMIT 1;

    IF product_id IS NOT NULL THEN
        INSERT INTO messages (sender_id, receiver_id, product_id, subject, content, is_read) VALUES
        (buyer1_id, seller1_id, product_id, 'Question about shipping', 'Hi, can you ship this item to Canada?', true),
        (seller1_id, buyer1_id, product_id, 'RE: Question about shipping', 'Yes, I can ship to Canada. Shipping cost would be $25 extra.', true),
        (buyer1_id, seller1_id, product_id, 'RE: Question about shipping', 'Great! I will purchase it now. Thank you!', false);
    END IF;
END $$;

-- =====================================================
-- ADD SAMPLE NOTIFICATIONS
-- =====================================================
DO $$
DECLARE
    user_rec RECORD;
BEGIN
    FOR user_rec IN SELECT id FROM users LIMIT 5 LOOP
        INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
        (user_rec.id, 'order', 'Order Shipped!', 'Your order has been shipped and is on its way.', false),
        (user_rec.id, 'bid', 'You''ve been outbid!', 'Someone placed a higher bid on an item you''re watching.', false),
        (user_rec.id, 'promotion', 'Flash Sale!', 'Save 25% on electronics this weekend only!', true);
    END LOOP;
END $$;

-- =====================================================
-- UPDATE PRODUCT VIEW AND WATCH COUNTS
-- =====================================================
UPDATE products SET
    view_count = floor(random() * 500 + 50)::int,
    watch_count = floor(random() * 50 + 5)::int
WHERE status = 'active';

-- =====================================================
-- ADD ADMIN ACTION LOGS
-- =====================================================
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE is_admin = true LIMIT 1;

    IF admin_id IS NOT NULL THEN
        INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details) VALUES
        (admin_id, 'approve_product', 'product', (SELECT id FROM products LIMIT 1), '{"reason": "Product meets guidelines"}'),
        (admin_id, 'resolve_dispute', 'dispute', (SELECT id FROM disputes LIMIT 1), '{"resolution": "partial_refund", "amount": 50}'),
        (admin_id, 'update_user', 'user', (SELECT id FROM users WHERE is_admin = false LIMIT 1), '{"action": "verified_seller"}');
    END IF;
END $$;

SELECT 'Seed data inserted successfully!' as status;
