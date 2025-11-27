-- eBay Clone - Fixed Seed Data
-- Run this after schema_additions.sql

-- Make first user an admin
UPDATE users SET is_admin = true WHERE username = 'techdeals';
UPDATE users SET email_verified = true;

-- =====================================================
-- ADD MORE PRODUCTS
-- =====================================================
DO $$
DECLARE
    electronics_id UUID;
    fashion_id UUID;
    home_id UUID;
    sports_id UUID;
    collectibles_id UUID;
    seller1_id UUID;
    seller2_id UUID;
    seller3_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO electronics_id FROM categories WHERE slug = 'electronics' LIMIT 1;
    SELECT id INTO fashion_id FROM categories WHERE slug = 'fashion' LIMIT 1;
    SELECT id INTO home_id FROM categories WHERE slug = 'home-garden' LIMIT 1;
    SELECT id INTO sports_id FROM categories WHERE slug = 'sporting-goods' LIMIT 1;
    SELECT id INTO collectibles_id FROM categories WHERE slug = 'collectibles' LIMIT 1;

    -- Get seller IDs (existing users)
    SELECT id INTO seller1_id FROM users WHERE username = 'techdeals' LIMIT 1;
    SELECT id INTO seller2_id FROM users WHERE username = 'vintagetreasures' LIMIT 1;
    SELECT id INTO seller3_id FROM users WHERE username = 'fashionista' LIMIT 1;

    -- Skip if no sellers found
    IF seller1_id IS NULL THEN
        RAISE NOTICE 'No sellers found, skipping product insert';
        RETURN;
    END IF;

    -- Electronics Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status)
    SELECT seller1_id, electronics_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active'
    FROM (VALUES
        ('Samsung Galaxy S24 Ultra 512GB', 'samsung-galaxy-s24-ultra-512gb-new', 'Brand new Samsung Galaxy S24 Ultra with 512GB storage.', 'new', 'buy_now', 1199.99, 1199.99, 5, true, 'Samsung'),
        ('Apple MacBook Pro 16" M3 Max', 'apple-macbook-pro-16-m3-max-new', 'Latest MacBook Pro with M3 Max chip, 36GB RAM.', 'new', 'buy_now', 3499.00, 3499.00, 3, true, 'Apple'),
        ('Sony PlayStation 5 Digital', 'sony-ps5-digital-2024', 'PS5 Digital Edition console. Like new.', 'like_new', 'both', 350.00, 425.00, 1, false, 'Sony'),
        ('DJI Mini 4 Pro Drone', 'dji-mini-4-pro-combo', 'Complete DJI Mini 4 Pro kit with 3 batteries.', 'new', 'buy_now', 1099.00, 1099.00, 8, true, 'DJI'),
        ('Bose QuietComfort Ultra', 'bose-qc-ultra-2024', 'Premium noise cancelling headphones.', 'new', 'buy_now', 379.00, 379.00, 12, true, 'Bose'),
        ('LG C3 65" OLED TV', 'lg-c3-65-oled-2024', 'Stunning OLED display with perfect blacks.', 'new', 'buy_now', 1496.99, 1496.99, 4, false, 'LG'),
        ('Canon EOS R6 Mark II', 'canon-eos-r6-ii-body', 'Professional mirrorless camera body.', 'new', 'buy_now', 2299.00, 2299.00, 2, true, 'Canon')
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand)
    WHERE electronics_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Fashion Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status)
    SELECT seller3_id, fashion_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active'
    FROM (VALUES
        ('Gucci GG Marmont Bag', 'gucci-gg-marmont-pink', 'Authentic Gucci matelassé leather bag.', 'like_new', 'buy_now', 1850.00, 1850.00, 1, true, 'Gucci'),
        ('Louis Vuitton Neverfull MM', 'lv-neverfull-mm-damier', 'Classic LV Neverfull in Damier Ebene.', 'very_good', 'both', 1200.00, 1400.00, 1, true, 'Louis Vuitton'),
        ('Nike Air Jordan 1 Chicago', 'nike-jordan-1-chicago-2024', 'Brand new Air Jordan 1 Chicago. Size 10.', 'new', 'auction', 350.00, NULL, 1, false, 'Nike'),
        ('Rolex Submariner Date', 'rolex-submariner-126610ln', 'Authentic 2023 Rolex Submariner.', 'like_new', 'buy_now', 13500.00, 13500.00, 1, true, 'Rolex'),
        ('Canada Goose Expedition Parka', 'canada-goose-expedition-black', 'Extreme weather parka. Size Large.', 'new', 'buy_now', 1295.00, 1295.00, 3, true, 'Canada Goose'),
        ('Ray-Ban Aviator Classic', 'ray-ban-aviator-gold-2024', 'Classic aviator sunglasses with G-15 lenses.', 'new', 'buy_now', 154.00, 154.00, 20, true, 'Ray-Ban')
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand)
    WHERE fashion_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Home & Garden Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status)
    SELECT seller2_id, home_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active'
    FROM (VALUES
        ('Dyson V15 Detect Vacuum', 'dyson-v15-detect-2024', 'Latest Dyson vacuum with laser dust detection.', 'new', 'buy_now', 649.99, 649.99, 10, true, 'Dyson'),
        ('KitchenAid Artisan Mixer', 'kitchenaid-artisan-red', 'Empire Red 5-quart stand mixer.', 'like_new', 'buy_now', 349.00, 349.00, 2, false, 'KitchenAid'),
        ('Weber Genesis E-335 Grill', 'weber-genesis-e335-2024', 'Premium 3-burner propane grill.', 'new', 'buy_now', 1099.00, 1099.00, 3, false, 'Weber'),
        ('Roomba j7+ Robot Vacuum', 'roomba-j7-plus-2024', 'Self-emptying robot vacuum.', 'new', 'buy_now', 599.99, 599.99, 7, true, 'iRobot'),
        ('Le Creuset Dutch Oven', 'le-creuset-flame-725qt', 'Flame orange enameled cast iron.', 'new', 'buy_now', 395.00, 395.00, 4, true, 'Le Creuset'),
        ('Breville Barista Express', 'breville-barista-express-2024', 'Espresso machine with built-in grinder.', 'new', 'buy_now', 599.95, 599.95, 6, true, 'Breville')
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand)
    WHERE home_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Sports Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status)
    SELECT seller1_id, sports_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active'
    FROM (VALUES
        ('Peloton Bike+ Complete', 'peloton-bike-plus-2024', 'Peloton Bike+ with rotating HD screen.', 'like_new', 'buy_now', 1895.00, 1895.00, 1, false, 'Peloton'),
        ('TaylorMade Stealth 2 Driver', 'taylormade-stealth-2-driver', 'Latest Stealth 2 driver. 10.5 degree.', 'like_new', 'auction', 400.00, NULL, 1, true, 'TaylorMade'),
        ('Yeti Tundra 65 Cooler', 'yeti-tundra-65-tan', 'Heavy-duty rotomolded cooler.', 'new', 'buy_now', 375.00, 375.00, 8, false, 'YETI'),
        ('Garmin Fenix 7X Sapphire', 'garmin-fenix-7x-2024', 'Ultimate multisport GPS watch.', 'like_new', 'buy_now', 749.00, 749.00, 2, true, 'Garmin'),
        ('REI Half Dome Tent', 'rei-half-dome-sl-2plus', 'Lightweight backpacking tent.', 'new', 'buy_now', 279.00, 279.00, 5, true, 'REI'),
        ('Titleist Pro V1 Golf Balls', 'titleist-prov1-4dozen', 'Premium golf balls. 48 balls total.', 'new', 'buy_now', 199.99, 199.99, 15, true, 'Titleist')
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand)
    WHERE sports_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    -- Collectibles Products
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status)
    SELECT seller2_id, collectibles_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active'
    FROM (VALUES
        ('Pokemon Charizard PSA 9', 'pokemon-charizard-1st-psa9', 'Graded holographic Charizard from Base Set.', 'like_new', 'auction', 15000.00, NULL, 1, true, 'Pokemon'),
        ('Star Wars Boba Fett 1979', 'star-wars-boba-fett-vintage', 'Original Kenner Boba Fett figure.', 'good', 'auction', 250.00, NULL, 1, true, 'Kenner'),
        ('LEGO UCS Millennium Falcon', 'lego-ucs-falcon-75192', 'Ultimate Collector Series set.', 'new', 'buy_now', 849.99, 849.99, 2, false, 'LEGO'),
        ('Jordan Rookie Card PSA 8', 'jordan-86-fleer-psa8', '1986 Fleer Michael Jordan rookie.', 'very_good', 'auction', 8500.00, NULL, 1, true, 'Fleer'),
        ('Funko Pop Venom #373', 'funko-venom-ghostrider-373', 'Rare Venomized Ghost Rider pop.', 'new', 'buy_now', 45.00, 45.00, 3, true, 'Funko'),
        ('Amazing Spider-Man #300', 'asm-300-cgc-94', 'First appearance of Venom! CGC 9.4.', 'very_good', 'buy_now', 650.00, 650.00, 1, true, 'Marvel')
    ) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand)
    WHERE collectibles_id IS NOT NULL
    ON CONFLICT DO NOTHING;

END $$;

-- =====================================================
-- ADD PRODUCT IMAGES FOR NEW PRODUCTS
-- =====================================================
INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, sort_order)
SELECT p.id,
       'https://picsum.photos/seed/' || p.id || '/800/600',
       'https://picsum.photos/seed/' || p.id || '/300/200',
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
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'buyer_jane' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'techdeals' LIMIT 1;
    SELECT id INTO product1_id FROM products WHERE title LIKE '%Samsung%' AND seller_id = seller1_id LIMIT 1;
    SELECT id INTO product2_id FROM products WHERE title LIKE '%Dyson%' LIMIT 1;

    IF buyer1_id IS NULL OR seller1_id IS NULL THEN
        RAISE NOTICE 'Required users not found, skipping orders';
        RETURN;
    END IF;

    -- Create orders
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status)
    VALUES (uuid_generate_v4(), buyer1_id, seller1_id, 'ORD-2024-0001', 1199.99, 0, 96.00, 1295.99, 'delivered', 'completed')
    RETURNING id INTO order1_id;

    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status)
    VALUES (uuid_generate_v4(), buyer2_id, seller1_id, 'ORD-2024-0002', 649.99, 0, 52.00, 701.99, 'shipped', 'completed')
    RETURNING id INTO order2_id;

    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total, status, payment_status)
    VALUES (uuid_generate_v4(), buyer1_id, seller1_id, 'ORD-2024-0003', 379.00, 0, 30.32, 409.32, 'pending', 'pending')
    RETURNING id INTO order3_id;

    -- Add order items (no seller_id column in order_items)
    IF product1_id IS NOT NULL THEN
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order1_id, product1_id, 1, 1199.99, 1199.99);
    END IF;

    IF product2_id IS NOT NULL THEN
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order2_id, product2_id, 1, 649.99, 649.99);
    END IF;
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
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'buyer_jane' LIMIT 1;

    IF buyer1_id IS NULL THEN
        RETURN;
    END IF;

    FOR product_id IN SELECT id FROM products LIMIT 15 LOOP
        INSERT INTO reviews (product_id, reviewer_id, review_type, rating, title, comment)
        VALUES
        (product_id, buyer1_id, 'product', 5, 'Excellent product!', 'Exactly as described. Fast shipping!'),
        (product_id, buyer2_id, 'product', 4, 'Great quality', 'Very happy with my purchase.')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- =====================================================
-- ADD SAMPLE BIDS
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    buyer2_id UUID;
    auction_product RECORD;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'buyer_jane' LIMIT 1;

    IF buyer1_id IS NULL THEN
        RETURN;
    END IF;

    FOR auction_product IN SELECT id, current_price FROM products WHERE listing_type IN ('auction', 'both') LIMIT 8 LOOP
        INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning)
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
('WELCOME10', 'Welcome discount - 10% off', 'percentage', 10.00, 50.00, 100.00, 1000, 1, NOW(), NOW() + INTERVAL '1 year', true),
('SAVE20', 'Save $20 on $100+', 'fixed_amount', 20.00, 100.00, NULL, 500, 2, NOW(), NOW() + INTERVAL '6 months', true),
('FREESHIP', 'Free shipping on any order', 'free_shipping', 0.00, 0.00, NULL, NULL, 5, NOW(), NOW() + INTERVAL '3 months', true),
('SUMMER25', 'Summer sale - 25% off', 'percentage', 25.00, 75.00, 200.00, 200, 1, NOW(), NOW() + INTERVAL '2 months', true),
('VIP50', 'VIP exclusive - $50 off $200+', 'fixed_amount', 50.00, 200.00, NULL, 50, 1, NOW(), NOW() + INTERVAL '1 month', true)
ON CONFLICT DO NOTHING;

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
    SELECT id INTO user1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO user2_id FROM users WHERE username = 'buyer_jane' LIMIT 1;
    SELECT id INTO electronics_id FROM categories WHERE slug = 'electronics' LIMIT 1;
    SELECT id INTO fashion_id FROM categories WHERE slug = 'fashion' LIMIT 1;

    IF user1_id IS NULL THEN
        RETURN;
    END IF;

    INSERT INTO saved_searches (user_id, name, search_query, category_id, min_price, max_price, email_alerts, alert_frequency) VALUES
    (user1_id, 'iPhone Deals', 'iphone', electronics_id, NULL, 1000.00, true, 'daily'),
    (user1_id, 'Gaming Laptops', 'gaming laptop', electronics_id, 500.00, 2000.00, true, 'weekly'),
    (user2_id, 'Vintage Watches', 'vintage watch', fashion_id, 100.00, 5000.00, true, 'daily'),
    (user2_id, 'Pokemon Cards', 'pokemon psa', NULL, NULL, NULL, true, 'instant')
    ON CONFLICT DO NOTHING;
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
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'techdeals' LIMIT 1;
    SELECT id INTO order1_id FROM orders WHERE order_number = 'ORD-2024-0001' LIMIT 1;

    IF order1_id IS NOT NULL AND buyer1_id IS NOT NULL THEN
        INSERT INTO disputes (order_id, opened_by, against_user, dispute_type, status, reason, desired_resolution) VALUES
        (order1_id, buyer1_id, seller1_id, 'item_not_as_described', 'resolved', 'Minor scratches not shown in photos', 'partial_refund')
        ON CONFLICT DO NOTHING;
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
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'techdeals' LIMIT 1;
    SELECT id INTO order2_id FROM orders WHERE order_number = 'ORD-2024-0002' LIMIT 1;

    IF order2_id IS NOT NULL AND buyer1_id IS NOT NULL THEN
        INSERT INTO returns (order_id, buyer_id, seller_id, return_reason, return_details, status) VALUES
        (order2_id, buyer1_id, seller1_id, 'changed_mind', 'Found a better deal elsewhere.', 'approved')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- ADD PAYMENT TRANSACTIONS
-- =====================================================
INSERT INTO payment_transactions (order_id, user_id, amount, status, stripe_payment_intent_id)
SELECT o.id, o.buyer_id, o.total, 'succeeded', 'pi_' || md5(random()::text)
FROM orders o
WHERE o.payment_status = 'completed'
AND NOT EXISTS (SELECT 1 FROM payment_transactions pt WHERE pt.order_id = o.id);

-- =====================================================
-- ADD WATCHLIST ITEMS
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    buyer2_id UUID;
    product_id UUID;
    counter INT := 0;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO buyer2_id FROM users WHERE username = 'buyer_jane' LIMIT 1;

    IF buyer1_id IS NULL THEN
        RETURN;
    END IF;

    FOR product_id IN SELECT id FROM products WHERE status = 'active' ORDER BY RANDOM() LIMIT 12 LOOP
        IF counter < 6 THEN
            INSERT INTO watchlist (user_id, product_id) VALUES (buyer1_id, product_id) ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO watchlist (user_id, product_id) VALUES (buyer2_id, product_id) ON CONFLICT DO NOTHING;
        END IF;
        counter := counter + 1;
    END LOOP;
END $$;

-- =====================================================
-- ADD MESSAGES
-- =====================================================
DO $$
DECLARE
    buyer1_id UUID;
    seller1_id UUID;
    product_id UUID;
BEGIN
    SELECT id INTO buyer1_id FROM users WHERE username = 'buyer_bob' LIMIT 1;
    SELECT id INTO seller1_id FROM users WHERE username = 'techdeals' LIMIT 1;
    SELECT id INTO product_id FROM products WHERE seller_id = seller1_id LIMIT 1;

    IF product_id IS NOT NULL AND buyer1_id IS NOT NULL THEN
        INSERT INTO messages (sender_id, recipient_id, product_id, subject, body, is_read) VALUES
        (buyer1_id, seller1_id, product_id, 'Shipping question', 'Can you ship to Canada?', true),
        (seller1_id, buyer1_id, product_id, 'RE: Shipping question', 'Yes, shipping is $25 extra.', true),
        (buyer1_id, seller1_id, product_id, 'RE: Shipping question', 'Great, I will purchase now!', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- UPDATE VIEW/WATCH COUNTS
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
    target_product UUID;
    target_user UUID;
BEGIN
    SELECT id INTO admin_id FROM users WHERE is_admin = true LIMIT 1;
    SELECT id INTO target_product FROM products LIMIT 1;
    SELECT id INTO target_user FROM users WHERE is_admin = false LIMIT 1;

    IF admin_id IS NOT NULL AND target_product IS NOT NULL THEN
        INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details) VALUES
        (admin_id, 'approve_product', 'product', target_product, '{"reason": "Product meets guidelines"}'),
        (admin_id, 'update_user', 'user', target_user, '{"action": "verified_seller"}')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

SELECT 'Additional seed data inserted successfully!' as status;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_coupons FROM coupons;
