-- eBay Clone - Complete User Activity Seed Data (v2 - corrected)
-- This creates realistic purchase history, bids, sales for all users

-- =====================================================
-- CLEAR OLD DATA SAFELY
-- =====================================================
DELETE FROM payment_transactions;
DELETE FROM order_items;
DELETE FROM orders;

-- =====================================================
-- CREATE ADDRESSES FIRST (orders reference them)
-- =====================================================
DO $$
DECLARE
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;
    artcollector_id UUID;
BEGIN
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';
    SELECT id INTO artcollector_id FROM users WHERE username = 'artcollector';

    -- Delete old addresses
    DELETE FROM addresses WHERE user_id IN (buyer_bob_id, buyer_jane_id, bookworm_id, gamezone_id, artcollector_id);

    -- Create addresses
    INSERT INTO addresses (user_id, address_type, is_default, full_name, street_address, city, state, postal_code, country, phone) VALUES
    (buyer_bob_id, 'shipping', true, 'Bob Smith', '123 Main Street', 'New York', 'NY', '10001', 'United States', '212-555-0101'),
    (buyer_jane_id, 'shipping', true, 'Jane Doe', '456 Oak Avenue', 'Los Angeles', 'CA', '90001', 'United States', '310-555-0102'),
    (bookworm_id, 'shipping', true, 'Alex Reader', '789 Elm Street', 'Chicago', 'IL', '60601', 'United States', '312-555-0103'),
    (gamezone_id, 'shipping', true, 'Mike Gamer', '321 Pine Road', 'Houston', 'TX', '77001', 'United States', '713-555-0104'),
    (artcollector_id, 'shipping', true, 'Sarah Artist', '555 Art Boulevard', 'Miami', 'FL', '33101', 'United States', '305-555-0105');

    RAISE NOTICE 'Addresses created!';
END $$;

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

    -- Address IDs
    bob_addr_id UUID;
    jane_addr_id UUID;
    bookworm_addr_id UUID;
    gamezone_addr_id UUID;
    artcollector_addr_id UUID;

    -- Products
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

    -- Get address IDs
    SELECT id INTO bob_addr_id FROM addresses WHERE user_id = buyer_bob_id LIMIT 1;
    SELECT id INTO jane_addr_id FROM addresses WHERE user_id = buyer_jane_id LIMIT 1;
    SELECT id INTO bookworm_addr_id FROM addresses WHERE user_id = bookworm_id LIMIT 1;
    SELECT id INTO gamezone_addr_id FROM addresses WHERE user_id = gamezone_id LIMIT 1;
    SELECT id INTO artcollector_addr_id FROM addresses WHERE user_id = artcollector_id LIMIT 1;

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
    -- BUYER_BOB's ORDERS (5 orders - various statuses)
    -- =====================================================

    -- Order 1: Samsung Galaxy - DELIVERED (30 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-2024-1001', 1199.99, 0, 96.00, 1295.99,
            'delivered', 'completed', bob_addr_id, '1Z999AA10123456784',
            NOW() - INTERVAL '28 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_samsung, 1, 1199.99, 1199.99);

    -- Order 2: Bose Headphones - DELIVERED (20 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-2024-1002', 379.00, 0, 30.32, 409.32,
            'delivered', 'completed', bob_addr_id, '1Z999AA10123456785',
            NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_bose, 1, 379.00, 379.00);

    -- Order 3: Dyson Vacuum - SHIPPED (5 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, vintagetreasures_id, 'ORD-2024-1003', 649.99, 0, 52.00, 701.99,
            'shipped', 'completed', bob_addr_id, '9400111899223033005', NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_dyson, 1, 649.99, 649.99);

    -- Order 4: LEGO Set - PROCESSING (2 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, vintagetreasures_id, 'ORD-2024-1004', 849.99, 15.00, 68.00, 932.99,
            'processing', 'completed', bob_addr_id, NOW() - INTERVAL '2 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_lego, 1, 849.99, 849.99);

    -- Order 5: Yeti Cooler - PENDING (today)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, created_at)
    VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-2024-1005', 375.00, 25.00, 30.00, 430.00,
            'pending', 'pending', bob_addr_id, NOW())
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_yeti, 1, 375.00, 375.00);

    -- =====================================================
    -- BUYER_JANE's ORDERS (4 orders)
    -- =====================================================

    -- Order 1: MacBook Pro - DELIVERED (45 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, techdeals_id, 'ORD-2024-2001', 3499.00, 0, 279.92, 3778.92,
            'delivered', 'completed', jane_addr_id, '1Z999AA10123456790',
            NOW() - INTERVAL '43 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_macbook, 1, 3499.00, 3499.00);

    -- Order 2: Gucci Bag - DELIVERED (25 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, fashionista_id, 'ORD-2024-2002', 1850.00, 0, 148.00, 1998.00,
            'delivered', 'completed', jane_addr_id, '1Z999AA10123456791',
            NOW() - INTERVAL '23 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_gucci, 1, 1850.00, 1850.00);

    -- Order 3: Rolex Watch - SHIPPED (7 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, fashionista_id, 'ORD-2024-2003', 13500.00, 0, 1080.00, 14580.00,
            'shipped', 'completed', jane_addr_id, '785892346123', NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_rolex, 1, 13500.00, 13500.00);

    -- Order 4: Peloton Bike - DELIVERED (60 days ago)
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), buyer_jane_id, techdeals_id, 'ORD-2024-2004', 1895.00, 199.00, 151.60, 2245.60,
            'delivered', 'completed', jane_addr_id, 'PELOTON-DEL-2024',
            NOW() - INTERVAL '58 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '60 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_peloton, 1, 1895.00, 1895.00);

    -- =====================================================
    -- BOOKWORM's ORDERS (2 orders)
    -- =====================================================

    -- Order 1: PS5 - DELIVERED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), bookworm_id, techdeals_id, 'ORD-2024-3001', 350.00, 10.00, 28.00, 388.00,
            'delivered', 'completed', bookworm_addr_id, '1Z999AA10123456800',
            NOW() - INTERVAL '33 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_ps5, 1, 350.00, 350.00);

    -- Order 2: Pokemon Card - DELIVERED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), bookworm_id, vintagetreasures_id, 'ORD-2024-3002', 15000.00, 0, 1200.00, 16200.00,
            'delivered', 'completed', bookworm_addr_id, 'REG-INSURED-001',
            NOW() - INTERVAL '13 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_pokemon, 1, 15000.00, 15000.00);

    -- =====================================================
    -- GAMEZONE's ORDERS (1 order)
    -- =====================================================

    -- Order 1: Jordan Shoes - DELIVERED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, tracking_number,
                       shipped_at, delivered_at, created_at)
    VALUES (uuid_generate_v4(), gamezone_id, fashionista_id, 'ORD-2024-4001', 425.00, 15.00, 34.00, 474.00,
            'delivered', 'completed', gamezone_addr_id, '9400111899223033010',
            NOW() - INTERVAL '38 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '40 days')
    RETURNING id INTO order_id;

    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    VALUES (order_id, prod_jordan, 1, 425.00, 425.00);

    -- =====================================================
    -- ARTCOLLECTOR's ORDERS (1 cancelled order)
    -- =====================================================

    -- Order 1: CANCELLED
    INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                       status, payment_status, shipping_address_id, created_at)
    VALUES (uuid_generate_v4(), artcollector_id, techdeals_id, 'ORD-2024-5001', 1199.99, 0, 96.00, 1295.99,
            'cancelled', 'refunded', artcollector_addr_id, NOW() - INTERVAL '50 days');

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
BEGIN
    -- Get user IDs
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';
    SELECT id INTO artcollector_id FROM users WHERE username = 'artcollector';

    -- Delete existing bids
    DELETE FROM bids;

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
    prod_dyson UUID;
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
    SELECT id INTO prod_dyson FROM products WHERE title ILIKE '%Dyson V15%' LIMIT 1;

    -- Delete existing reviews
    DELETE FROM reviews;

    -- buyer_bob's reviews
    IF prod_samsung IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_samsung, buyer_bob_id, techdeals_id, 'product', 5, 'Amazing phone!',
                'The Samsung S24 Ultra is incredible. Camera quality is outstanding, battery lasts all day. Fast shipping from techdeals!',
                NOW() - INTERVAL '25 days');
    END IF;

    IF prod_bose IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_bose, buyer_bob_id, techdeals_id, 'product', 5, 'Best headphones ever',
                'Noise cancellation is perfect. Sound quality is crisp and clear. Worth every penny!',
                NOW() - INTERVAL '15 days');
    END IF;

    -- buyer_jane's reviews
    IF prod_macbook IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_macbook, buyer_jane_id, techdeals_id, 'product', 5, 'Perfect for work',
                'M3 Max chip is blazing fast. Screen is gorgeous. Best laptop I have ever owned.',
                NOW() - INTERVAL '40 days');
    END IF;

    IF prod_gucci IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_gucci, buyer_jane_id, fashionista_id, 'product', 5, 'Authentic and beautiful',
                'Bag was exactly as described. Came with all original packaging and dust bag. Seller was very communicative.',
                NOW() - INTERVAL '20 days');
    END IF;

    IF prod_peloton IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_peloton, buyer_jane_id, techdeals_id, 'product', 4, 'Great bike, tricky setup',
                'Love the bike and classes. Assembly was more difficult than expected but worth it in the end.',
                NOW() - INTERVAL '55 days');
    END IF;

    -- bookworm's reviews
    IF prod_ps5 IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_ps5, bookworm_id, techdeals_id, 'product', 5, 'Finally got one!',
                'Console works perfectly. Games load so fast. Thank you for the fair price!',
                NOW() - INTERVAL '30 days');
    END IF;

    IF prod_pokemon IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_pokemon, bookworm_id, vintagetreasures_id, 'product', 5, 'Grail card acquired!',
                'PSA 9 Charizard is in perfect condition. Shipped with extra protection. A+ seller!',
                NOW() - INTERVAL '10 days');
    END IF;

    -- gamezone's reviews
    IF prod_jordan IS NOT NULL THEN
        INSERT INTO reviews (product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
        VALUES (prod_jordan, gamezone_id, fashionista_id, 'product', 5, 'Fire kicks!',
                'Jordans are 100% authentic. Perfect condition, DS with original box. Will buy again!',
                NOW() - INTERVAL '35 days');
    END IF;

    -- Seller reviews from buyers
    INSERT INTO reviews (reviewer_id, reviewed_user_id, review_type, rating, title, comment, created_at)
    VALUES
    (buyer_bob_id, techdeals_id, 'seller', 5, 'Excellent seller', 'Fast shipping, great communication, exactly as described.', NOW() - INTERVAL '24 days'),
    (buyer_jane_id, techdeals_id, 'seller', 5, 'Highly recommend', 'Professional seller, items well packaged.', NOW() - INTERVAL '39 days'),
    (buyer_jane_id, fashionista_id, 'seller', 5, 'Trustworthy', 'Authentic items, great prices. Will shop again!', NOW() - INTERVAL '19 days'),
    (bookworm_id, vintagetreasures_id, 'seller', 5, 'Best collectibles seller', 'Knows their stuff. Items are always in great condition.', NOW() - INTERVAL '9 days'),
    (gamezone_id, fashionista_id, 'seller', 5, 'Legit sneakers', 'All authentic, fast shipping. My go-to for kicks.', NOW() - INTERVAL '34 days');

    -- Update seller ratings
    UPDATE users SET seller_rating = 4.9, total_sales = 8 WHERE id = techdeals_id;
    UPDATE users SET seller_rating = 5.0, total_sales = 3 WHERE id = vintagetreasures_id;
    UPDATE users SET seller_rating = 5.0, total_sales = 3 WHERE id = fashionista_id;

    RAISE NOTICE 'Reviews created successfully!';
END $$;

-- =====================================================
-- CREATE NOTIFICATIONS (using correct types)
-- =====================================================
DO $$
DECLARE
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;
BEGIN
    SELECT id INTO buyer_bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO buyer_jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';
    SELECT id INTO gamezone_id FROM users WHERE username = 'gamezone';

    -- Clear old notifications
    DELETE FROM notifications;

    -- Notifications for buyer_bob
    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
    (buyer_bob_id, 'order_update', 'Order Shipped!', 'Your order ORD-2024-1003 has been shipped via USPS.', '/orders', true, NOW() - INTERVAL '5 days'),
    (buyer_bob_id, 'order_update', 'Order Delivered', 'Your order ORD-2024-1002 has been delivered.', '/orders', true, NOW() - INTERVAL '18 days'),
    (buyer_bob_id, 'bid_outbid', 'Outbid Alert', 'You have been outbid on PlayStation 5. Current bid: $425', '/product/ps5', true, NOW() - INTERVAL '1 day'),
    (buyer_bob_id, 'price_drop', 'Price Drop!', 'An item in your watchlist has dropped in price.', '/watchlist', false, NOW() - INTERVAL '2 hours'),
    (buyer_bob_id, 'promotion', 'Special Offer', 'Use code WELCOME10 for 10% off your next purchase!', '/', false, NOW() - INTERVAL '1 hour');

    -- Notifications for buyer_jane
    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
    (buyer_jane_id, 'order_update', 'Order Shipped!', 'Your Rolex has been shipped via FedEx with insurance.', '/orders', true, NOW() - INTERVAL '7 days'),
    (buyer_jane_id, 'bid_won', 'You Won!', 'Congratulations! You won the Louis Vuitton Neverfull auction.', '/orders', true, NOW() - INTERVAL '1 day'),
    (buyer_jane_id, 'review', 'Review Reminder', 'How was your MacBook Pro? Leave a review!', '/orders', false, NOW() - INTERVAL '3 days');

    -- Notifications for bookworm
    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
    (bookworm_id, 'bid_won', 'Auction Won!', 'You won the Pokemon Charizard PSA 9 auction!', '/orders', true, NOW() - INTERVAL '14 days'),
    (bookworm_id, 'watchlist', 'Ending Soon', 'An auction in your watchlist ends in 2 hours!', '/watchlist', false, NOW() - INTERVAL '3 hours');

    -- Notifications for gamezone
    INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
    (gamezone_id, 'bid_won', 'You Won!', 'Congratulations! You won the Jordan 1 Chicago auction.', '/orders', true, NOW() - INTERVAL '39 days'),
    (gamezone_id, 'auction_ending', 'Auction Ending', 'The PS5 auction you are winning ends in 1 hour!', '/product/ps5', false, NOW() - INTERVAL '30 minutes');

    RAISE NOTICE 'Notifications created!';
END $$;

-- =====================================================
-- UPDATE WATCHLIST
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
-- CREATE PAYMENT TRANSACTIONS
-- =====================================================
INSERT INTO payment_transactions (order_id, user_id, amount, status, stripe_payment_intent_id, created_at)
SELECT o.id, o.buyer_id, o.total, 'succeeded', 'pi_' || md5(o.id::text), o.created_at
FROM orders o
WHERE o.payment_status = 'completed';

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
UNION ALL SELECT 'Addresses', COUNT(*) FROM addresses
UNION ALL SELECT 'Payments', COUNT(*) FROM payment_transactions;

-- Show user order summary
SELECT u.username,
       COUNT(DISTINCT o.id) as orders,
       COALESCE(SUM(o.total), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.buyer_id AND o.status != 'cancelled'
WHERE u.username IN ('buyer_bob', 'buyer_jane', 'bookworm', 'gamezone', 'artcollector')
GROUP BY u.username
ORDER BY total_spent DESC;
