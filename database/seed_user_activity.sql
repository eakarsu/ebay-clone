-- eBay Clone - Complete User Activity Seed Data
-- This creates realistic purchase history, bids, sales for all users

-- =====================================================
-- CLEAR OLD TEST DATA (keep products)
-- =====================================================
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM bids;
DELETE FROM reviews WHERE comment LIKE '%Exactly as described%' OR comment LIKE '%Very happy%';

-- =====================================================
-- CREATE COMPREHENSIVE ORDERS
-- =====================================================
DO $$
DECLARE
    -- Users
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;
    artcollector_id UUID;

    -- Sellers
    techdeals_id UUID;
    vintagetreasures_id UUID;
    fashionista_id UUID;
    sportsgear_id UUID;
    homeessentials_id UUID;

    -- Products (we'll fetch some)
    prod_samsung UUID;
    prod_macbook UUID;
    prod_ps5 UUID;
    prod_dyson UUID;
    prod_bose UUID;
    prod_gucci UUID;
    prod_rolex UUID;
    prod_peloton UUID;
    prod_yeti UUID;
    prod_pokemon UUID;
    prod_lego UUID;
    prod_jordan UUID;

    -- Order IDs
    order_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';
    SELECT id INTO artcollector_id FROM users WHERE username = 'artcollector';

    SELECT id INTO techdeals_id FROM users WHERE username = 'techdeals';
    SELECT id INTO vintagetreasures_id FROM users WHERE username = 'vintagetreasures';
    SELECT id INTO fashionista_id FROM users WHERE username = 'fashionista';
    SELECT id INTO sportsgear_id FROM users WHERE username = 'sportsgear';
    SELECT id INTO homeessentials_id FROM users WHERE username = 'homeessentials';

    -- Get product IDs
    SELECT id INTO prod_samsung FROM products WHERE title ILIKE '%Samsung Galaxy S24%' LIMIT 1;
    SELECT id INTO prod_macbook FROM products WHERE title ILIKE '%MacBook Pro%' LIMIT 1;
    SELECT id INTO prod_ps5 FROM products WHERE title ILIKE '%PlayStation 5%' LIMIT 1;
    SELECT id INTO prod_dyson FROM products WHERE title ILIKE '%Dyson V15%' LIMIT 1;
    SELECT id INTO prod_bose FROM products WHERE title ILIKE '%Bose QuietComfort%' LIMIT 1;
    SELECT id INTO prod_gucci FROM products WHERE title ILIKE '%Gucci%' LIMIT 1;
    SELECT id INTO prod_rolex FROM products WHERE title ILIKE '%Rolex%' LIMIT 1;
    SELECT id INTO prod_peloton FROM products WHERE title ILIKE '%Peloton%' LIMIT 1;
    SELECT id INTO prod_yeti FROM products WHERE title ILIKE '%Yeti%' LIMIT 1;
    SELECT id INTO prod_pokemon FROM products WHERE title ILIKE '%Pokemon%' LIMIT 1;
    SELECT id INTO prod_lego FROM products WHERE title ILIKE '%LEGO%' LIMIT 1;
    SELECT id INTO prod_jordan FROM products WHERE title ILIKE '%Jordan%' LIMIT 1;

    -- =====================================================
    -- BUYER_BOB's PURCHASE HISTORY (5 orders)
    -- =====================================================

    -- Order 1: Samsung Galaxy - DELIVERED (30 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-2024-1001', 1199.99, 0, 96.00, 1295.99,
            'delivered', 'completed', '123 Main St', 'New York', 'NY', '10001',
            '1Z999AA10123456784', 'UPS', NOW() - INTERVAL '30 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_samsung, 1, 1199.99, 1199.99);

    -- Order 2: Bose Headphones - DELIVERED (20 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-2024-1002', 379.00, 0, 30.32, 409.32,
            'delivered', 'completed', '123 Main St', 'New York', 'NY', '10001',
            '1Z999AA10123456785', 'UPS', NOW() - INTERVAL '20 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_bose, 1, 379.00, 379.00);

    -- Order 3: Dyson Vacuum - SHIPPED (5 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, vintagetreasures_id, 'ORD-2024-1003', 649.99, 0, 52.00, 701.99,
            'shipped', 'completed', '123 Main St', 'New York', 'NY', '10001',
            '9400111899223033005', 'USPS', NOW() - INTERVAL '5 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_dyson, 1, 649.99, 649.99);

    -- Order 4: LEGO Set - PROCESSING (2 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, vintagetreasures_id, 'ORD-2024-1004', 849.99, 15.00, 68.00, 932.99,
            'processing', 'completed', '123 Main St', 'New York', 'NY', '10001',
            NOW() - INTERVAL '2 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_lego, 1, 849.99, 849.99);

    -- Order 5: Yeti Cooler - PENDING (today)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-2024-1005', 375.00, 25.00, 30.00, 430.00,
            'pending', 'pending', '123 Main St', 'New York', 'NY', '10001',
            NOW())
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_yeti, 1, 375.00, 375.00);

    -- =====================================================
    -- BUYER_JANE's PURCHASE HISTORY (4 orders)
    -- =====================================================

    -- Order 1: MacBook Pro - DELIVERED (45 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, techdeals_id, 'ORD-2024-2001', 3499.00, 0, 279.92, 3778.92,
            'delivered', 'completed', '456 Oak Ave', 'Los Angeles', 'CA', '90001',
            '1Z999AA10123456790', 'UPS', NOW() - INTERVAL '45 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_macbook, 1, 3499.00, 3499.00);

    -- Order 2: Gucci Bag - DELIVERED (25 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, fashionista_id, 'ORD-2024-2002', 1850.00, 0, 148.00, 1998.00,
            'delivered', 'completed', '456 Oak Ave', 'Los Angeles', 'CA', '90001',
            '1Z999AA10123456791', 'FedEx', NOW() - INTERVAL '25 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_gucci, 1, 1850.00, 1850.00);

    -- Order 3: Rolex Watch - SHIPPED (7 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, fashionista_id, 'ORD-2024-2003', 13500.00, 0, 1080.00, 14580.00,
            'shipped', 'completed', '456 Oak Ave', 'Los Angeles', 'CA', '90001',
            '785892346123', 'FedEx', NOW() - INTERVAL '7 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_rolex, 1, 13500.00, 13500.00);

    -- Order 4: Peloton Bike - DELIVERED (60 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, techdeals_id, 'ORD-2024-2004', 1895.00, 199.00, 151.60, 2245.60,
            'delivered', 'completed', '456 Oak Ave', 'Los Angeles', 'CA', '90001',
            'PELOTON-DEL-2024', NOW() - INTERVAL '60 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_peloton, 1, 1895.00, 1895.00);

    -- =====================================================
    -- BOOKWORM's PURCHASE HISTORY (3 orders)
    -- =====================================================

    -- Order 1: PS5 - DELIVERED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, shipping_carrier, created_at)
    VALUES (uuid_generate_v4(), bookworm_id, techdeals_id, 'ORD-2024-3001', 350.00, 10.00, 28.00, 388.00,
            'delivered', 'completed', '789 Elm St', 'Chicago', 'IL', '60601',
            '1Z999AA10123456800', 'UPS', NOW() - INTERVAL '35 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_ps5, 1, 350.00, 350.00);

    -- Order 2: Pokemon Card - DELIVERED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, created_at)
    VALUES (uuid_generate_v4(), bookworm_id, vintagetreasures_id, 'ORD-2024-3002', 15000.00, 0, 1200.00, 16200.00,
            'delivered', 'completed', '789 Elm St', 'Chicago', 'IL', '60601',
            'REG-INSURED-001', NOW() - INTERVAL '15 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_pokemon, 1, 15000.00, 15000.00);

    -- =====================================================
    -- GAMEZONE's PURCHASE HISTORY (2 orders)
    -- =====================================================

    -- Order 1: Jordan Shoes (won auction) - DELIVERED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       tracking_number, created_at)
    VALUES (uuid_generate_v4(), gamezone_id, fashionista_id, 'ORD-2024-4001', 425.00, 15.00, 34.00, 474.00,
            'delivered', 'completed', '321 Pine Rd', 'Houston', 'TX', '77001',
            '9400111899223033010', NOW() - INTERVAL '40 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_jordan, 1, 425.00, 425.00);

    -- =====================================================
    -- ARTCOLLECTOR's PURCHASE HISTORY (2 orders)
    -- =====================================================

    -- Order 1: Samsung Phone - CANCELLED/REFUNDED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address, shipping_city, shipping_state, shipping_zip,
                       created_at)
    VALUES (uuid_generate_v4(), artcollector_id, techdeals_id, 'ORD-2024-5001', 1199.99, 0, 96.00, 1295.99,
            'cancelled', 'refunded', '555 Art Blvd', 'Miami', 'FL', '33101',
            NOW() - INTERVAL '50 days');

    RAISE NOTICE 'Orders created successfully!';
END $$;

-- =====================================================
-- CREATE BIDS ON AUCTION ITEMS
-- =====================================================
DO $$
DECLARE
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;
    artcollector_id UUID;

    prod_ps5 UUID;
    prod_jordan UUID;
    prod_pokemon UUID;
    prod_golf UUID;
    prod_lv UUID;

    auction_prod RECORD;
BEGIN
    -- Get user IDs
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';
    SELECT id INTO artcollector_id FROM users WHERE username = 'artcollector';

    -- Get auction products
    SELECT id INTO prod_ps5 FROM products WHERE title ILIKE '%PlayStation%' AND listing_type IN ('auction', 'both') LIMIT 1;
    SELECT id INTO prod_jordan FROM products WHERE title ILIKE '%Jordan%' AND listing_type IN ('auction', 'both') LIMIT 1;
    SELECT id INTO prod_pokemon FROM products WHERE title ILIKE '%Pokemon%' AND listing_type IN ('auction', 'both') LIMIT 1;
    SELECT id INTO prod_golf FROM products WHERE title ILIKE '%TaylorMade%' AND listing_type IN ('auction', 'both') LIMIT 1;
    SELECT id INTO prod_lv FROM products WHERE title ILIKE '%Louis Vuitton%' AND listing_type IN ('auction', 'both') LIMIT 1;

    -- Bids on PS5 (multiple bidders)
    IF prod_ps5 IS NOT NULL THEN
        INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning, created_at)
        VALUES
        (prod_ps5, buyer_bob_id, 360.00, false, NOW() - INTERVAL '3 days'),
        (prod_ps5, gamezone_id, 375.00, false, NOW() - INTERVAL '2 days' - INTERVAL '5 hours'),
        (prod_ps5, buyer_bob_id, 390.00, false, NOW() - INTERVAL '2 days'),
        (prod_ps5, bookworm_id, 410.00, false, NOW() - INTERVAL '1 day' - INTERVAL '12 hours'),
        (prod_ps5, gamezone_id, 425.00, true, NOW() - INTERVAL '1 day');

        UPDATE products SET current_price = 425.00, bid_count = 5 WHERE id = prod_ps5;
    END IF;

    -- Bids on Jordan shoes
    IF prod_jordan IS NOT NULL THEN
        INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning, created_at)
        VALUES
        (prod_jordan, buyer_jane_id, 360.00, false, NOW() - INTERVAL '5 days'),
        (prod_jordan, artcollector_id, 380.00, false, NOW() - INTERVAL '4 days'),
        (prod_jordan, gamezone_id, 400.00, false, NOW() - INTERVAL '3 days'),
        (prod_jordan, buyer_jane_id, 420.00, false, NOW() - INTERVAL '2 days'),
        (prod_jordan, gamezone_id, 450.00, true, NOW() - INTERVAL '1 day');

        UPDATE products SET current_price = 450.00, bid_count = 5 WHERE id = prod_jordan;
    END IF;

    -- Bids on Pokemon Card (high value auction)
    IF prod_pokemon IS NOT NULL THEN
        INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning, created_at)
        VALUES
        (prod_pokemon, buyer_bob_id, 15100.00, false, NOW() - INTERVAL '6 days'),
        (prod_pokemon, artcollector_id, 15500.00, false, NOW() - INTERVAL '5 days'),
        (prod_pokemon, bookworm_id, 16000.00, false, NOW() - INTERVAL '4 days'),
        (prod_pokemon, buyer_bob_id, 16500.00, false, NOW() - INTERVAL '3 days'),
        (prod_pokemon, artcollector_id, 17000.00, false, NOW() - INTERVAL '2 days'),
        (prod_pokemon, bookworm_id, 17500.00, true, NOW() - INTERVAL '1 day');

        UPDATE products SET current_price = 17500.00, bid_count = 6 WHERE id = prod_pokemon;
    END IF;

    -- Bids on Golf Driver
    IF prod_golf IS NOT NULL THEN
        INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning, created_at)
        VALUES
        (prod_golf, buyer_bob_id, 410.00, false, NOW() - INTERVAL '4 days'),
        (prod_golf, buyer_jane_id, 430.00, false, NOW() - INTERVAL '3 days'),
        (prod_golf, buyer_bob_id, 455.00, true, NOW() - INTERVAL '2 days');

        UPDATE products SET current_price = 455.00, bid_count = 3 WHERE id = prod_golf;
    END IF;

    -- Bids on LV Bag
    IF prod_lv IS NOT NULL THEN
        INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning, created_at)
        VALUES
        (prod_lv, buyer_jane_id, 1250.00, false, NOW() - INTERVAL '2 days'),
        (prod_lv, artcollector_id, 1300.00, false, NOW() - INTERVAL '1 day' - INTERVAL '6 hours'),
        (prod_lv, buyer_jane_id, 1350.00, true, NOW() - INTERVAL '1 day');

        UPDATE products SET current_price = 1350.00, bid_count = 3 WHERE id = prod_lv;
    END IF;

    RAISE NOTICE 'Bids created successfully!';
END $$;

-- =====================================================
-- CREATE REVIEWS FOR COMPLETED ORDERS
-- =====================================================
DO $$
DECLARE
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;

    techdeals_id UUID;
    vintagetreasures_id UUID;
    fashionista_id UUID;

    prod_samsung UUID;
    prod_bose UUID;
    prod_macbook UUID;
    prod_gucci UUID;
    prod_ps5 UUID;
    prod_pokemon UUID;
    prod_jordan UUID;
    prod_peloton UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';

    SELECT id INTO techdeals_id FROM users WHERE username = 'techdeals';
    SELECT id INTO vintagetreasures_id FROM users WHERE username = 'vintagetreasures';
    SELECT id INTO fashionista_id FROM users WHERE username = 'fashionista';

    -- Get product IDs
    SELECT id INTO prod_samsung FROM products WHERE title ILIKE '%Samsung Galaxy S24%' LIMIT 1;
    SELECT id INTO prod_bose FROM products WHERE title ILIKE '%Bose QuietComfort%' LIMIT 1;
    SELECT id INTO prod_macbook FROM products WHERE title ILIKE '%MacBook Pro%' LIMIT 1;
    SELECT id INTO prod_gucci FROM products WHERE title ILIKE '%Gucci%' LIMIT 1;
    SELECT id INTO prod_ps5 FROM products WHERE title ILIKE '%PlayStation%' LIMIT 1;
    SELECT id INTO prod_pokemon FROM products WHERE title ILIKE '%Pokemon%' LIMIT 1;
    SELECT id INTO prod_jordan FROM products WHERE title ILIKE '%Jordan%' LIMIT 1;
    SELECT id INTO prod_peloton FROM products WHERE title ILIKE '%Peloton%' LIMIT 1;

    -- buyer_bob's reviews
    IF prod_samsung IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_samsung, buyer_bob_id, techdeals_id, 'product', 5, 'Amazing phone!',
                'The Samsung S24 Ultra is incredible. Camera quality is outstanding, battery lasts all day. Fast shipping from techdeals!',
                NOW() - INTERVAL '25 days')
        ON CONFLICT DO NOTHING;
    END IF;

    IF prod_bose IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_bose, buyer_bob_id, techdeals_id, 'product', 5, 'Best headphones ever',
                'Noise cancellation is perfect. Sound quality is crisp and clear. Worth every penny!',
                NOW() - INTERVAL '15 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- buyer_jane's reviews
    IF prod_macbook IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_macbook, buyer_jane_id, techdeals_id, 'product', 5, 'Perfect for work',
                'M3 Max chip is blazing fast. Screen is gorgeous. Best laptop I have ever owned.',
                NOW() - INTERVAL '40 days')
        ON CONFLICT DO NOTHING;
    END IF;

    IF prod_gucci IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_gucci, buyer_jane_id, fashionista_id, 'product', 5, 'Authentic and beautiful',
                'Bag was exactly as described. Came with all original packaging and dust bag. Seller was very communicative.',
                NOW() - INTERVAL '20 days')
        ON CONFLICT DO NOTHING;
    END IF;

    IF prod_peloton IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_peloton, buyer_jane_id, techdeals_id, 'product', 4, 'Great bike, tricky setup',
                'Love the bike and classes. Assembly was more difficult than expected but worth it in the end.',
                NOW() - INTERVAL '55 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- bookworm's reviews
    IF prod_ps5 IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_ps5, bookworm_id, techdeals_id, 'product', 5, 'Finally got one!',
                'Console works perfectly. Games load so fast. Thank you for the fair price!',
                NOW() - INTERVAL '30 days')
        ON CONFLICT DO NOTHING;
    END IF;

    IF prod_pokemon IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_pokemon, bookworm_id, vintagetreasures_id, 'product', 5, 'Grail card acquired!',
                'PSA 9 Charizard is in perfect condition. Shipped with extra protection. A+ seller!',
                NOW() - INTERVAL '10 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- gamezone's reviews
    IF prod_jordan IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_jordan, gamezone_id, fashionista_id, 'product', 5, 'Fire kicks!',
                'Jordans are 100% authentic. Perfect condition, DS with original box. Will buy again!',
                NOW() - INTERVAL '35 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Update seller ratings
    UPDATE users SET seller_rating = 4.9, total_sales = 8 WHERE id = techdeals_id;
    UPDATE users SET seller_rating = 5.0, total_sales = 3 WHERE id = vintagetreasures_id;
    UPDATE users SET seller_rating = 5.0, total_sales = 3 WHERE id = fashionista_id;

    RAISE NOTICE 'Reviews created successfully!';
END $$;

-- =====================================================
-- UPDATE WATCHLIST WITH MORE ITEMS
-- =====================================================
DO $$
DECLARE
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;
    artcollector_id UUID;
    prod RECORD;
    counter INT := 0;
BEGIN
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';
    SELECT id INTO artcollector_id FROM users WHERE username = 'artcollector';

    -- Clear existing watchlist
    DELETE FROM watchlist;

    -- Add items to each user's watchlist
    FOR prod IN SELECT id FROM products WHERE status = 'active' ORDER BY RANDOM() LIMIT 30 LOOP
        counter := counter + 1;
        IF counter <= 6 THEN
            INSERT INTO watchlist (user_id, product_id) VALUES (buyer_bob_id, prod.id) ON CONFLICT DO NOTHING;
        ELSIF counter <= 12 THEN
            INSERT INTO watchlist (user_id, product_id) VALUES (buyer_jane_id, prod.id) ON CONFLICT DO NOTHING;
        ELSIF counter <= 18 THEN
            INSERT INTO watchlist (user_id, product_id) VALUES (bookworm_id, prod.id) ON CONFLICT DO NOTHING;
        ELSIF counter <= 24 THEN
            INSERT INTO watchlist (user_id, product_id) VALUES (gamezone_id, prod.id) ON CONFLICT DO NOTHING;
        ELSE
            INSERT INTO watchlist (user_id, product_id) VALUES (artcollector_id, prod.id) ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RAISE NOTICE 'Watchlist updated!';
END $$;

-- =====================================================
-- CREATE ADDRESSES FOR USERS
-- =====================================================
INSERT INTO addresses (user_id, address_type, is_default, full_name, address_line1, city, state, postal_code, country, phone)
SELECT id, 'shipping', true,
       CASE username
           WHEN 'buyer_bob' THEN 'Bob Smith'
           WHEN 'buyer_jane' THEN 'Jane Doe'
           WHEN 'bookworm' THEN 'Alex Reader'
           WHEN 'gamezone' THEN 'Mike Gamer'
           WHEN 'artcollector' THEN 'Sarah Artist'
       END,
       CASE username
           WHEN 'buyer_bob' THEN '123 Main Street'
           WHEN 'buyer_jane' THEN '456 Oak Avenue'
           WHEN 'bookworm' THEN '789 Elm Street'
           WHEN 'gamezone' THEN '321 Pine Road'
           WHEN 'artcollector' THEN '555 Art Boulevard'
       END,
       CASE username
           WHEN 'buyer_bob' THEN 'New York'
           WHEN 'buyer_jane' THEN 'Los Angeles'
           WHEN 'bookworm' THEN 'Chicago'
           WHEN 'gamezone' THEN 'Houston'
           WHEN 'artcollector' THEN 'Miami'
       END,
       CASE username
           WHEN 'buyer_bob' THEN 'NY'
           WHEN 'buyer_jane' THEN 'CA'
           WHEN 'bookworm' THEN 'IL'
           WHEN 'gamezone' THEN 'TX'
           WHEN 'artcollector' THEN 'FL'
       END,
       CASE username
           WHEN 'buyer_bob' THEN '10001'
           WHEN 'buyer_jane' THEN '90001'
           WHEN 'bookworm' THEN '60601'
           WHEN 'gamezone' THEN '77001'
           WHEN 'artcollector' THEN '33101'
       END,
       'US',
       CASE username
           WHEN 'buyer_bob' THEN '212-555-0101'
           WHEN 'buyer_jane' THEN '310-555-0102'
           WHEN 'bookworm' THEN '312-555-0103'
           WHEN 'gamezone' THEN '713-555-0104'
           WHEN 'artcollector' THEN '305-555-0105'
       END
FROM users
WHERE username IN ('buyer_bob', 'buyer_jane', 'bookworm', 'gamezone', 'artcollector')
ON CONFLICT DO NOTHING;

-- =====================================================
-- CREATE PAYMENT TRANSACTIONS FOR COMPLETED ORDERS
-- =====================================================
INSERT INTO payment_transactions (order_id, user_id, amount, status, stripe_payment_intent_id, created_at)
SELECT o.id, o.buyer_id, o.total, 'succeeded', 'pi_' || md5(o.id::text), o.created_at
FROM orders o
WHERE o.payment_status = 'completed'
AND NOT EXISTS (SELECT 1 FROM payment_transactions pt WHERE pt.order_id = o.id);

-- =====================================================
-- CREATE NOTIFICATIONS
-- =====================================================
DO $$
DECLARE
    buyer_bob_id UUID;
    buyer_jane_id UUID;
BEGIN
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';

    -- Notifications for buyer_bob
    INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES
    (buyer_bob_id, 'order', 'Order Shipped!', 'Your order ORD-2024-1003 has been shipped via USPS.', true, NOW() - INTERVAL '5 days'),
    (buyer_bob_id, 'order', 'Order Delivered', 'Your order ORD-2024-1002 has been delivered.', true, NOW() - INTERVAL '18 days'),
    (buyer_bob_id, 'bid', 'Outbid Alert', 'You have been outbid on PlayStation 5. Current bid: $425', true, NOW() - INTERVAL '1 day'),
    (buyer_bob_id, 'watchlist', 'Price Drop!', 'An item in your watchlist has dropped in price.', false, NOW() - INTERVAL '2 hours'),
    (buyer_bob_id, 'promo', 'Special Offer', 'Use code WELCOME10 for 10% off your next purchase!', false, NOW() - INTERVAL '1 hour');

    -- Notifications for buyer_jane
    INSERT INTO notifications (user_id, type, title, message, is_read, created_at) VALUES
    (buyer_jane_id, 'order', 'Order Shipped!', 'Your Rolex has been shipped via FedEx with insurance.', true, NOW() - INTERVAL '7 days'),
    (buyer_jane_id, 'bid', 'You Won!', 'Congratulations! You won the Louis Vuitton Neverfull auction.', true, NOW() - INTERVAL '1 day'),
    (buyer_jane_id, 'review', 'Review Reminder', 'How was your MacBook Pro? Leave a review!', false, NOW() - INTERVAL '3 days');
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'User Activity Seed Complete!' as status;
SELECT 'Orders' as entity, COUNT(*) as count FROM orders
UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL SELECT 'Bids', COUNT(*) FROM bids
UNION ALL SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'Watchlist', COUNT(*) FROM watchlist
UNION ALL SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'Addresses', COUNT(*) FROM addresses;
