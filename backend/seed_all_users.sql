-- Make all users sellers so they can have listings
UPDATE users SET is_seller = true;

-- Comprehensive seed for all users
DO $$
DECLARE
    user_rec RECORD;
    seller_rec RECORD;
    product_rec RECORD;
    order_rec RECORD;
    i INTEGER;
    new_product_id UUID;
    new_order_id UUID;
    selected_cat_id UUID;
    electronics_cat_id UUID;
    fashion_cat_id UUID;
    home_cat_id UUID;
    sports_cat_id UUID;
    toys_cat_id UUID;
    collectibles_cat_id UUID;
    jewelry_cat_id UUID;
    product_titles TEXT[] := ARRAY[
        'iPhone 15 Pro Max 256GB', 'Samsung Galaxy S24 Ultra', 'MacBook Pro M3',
        'Sony PlayStation 5', 'Xbox Series X Console', 'Nintendo Switch OLED',
        'Apple Watch Ultra 2', 'AirPods Pro 2nd Gen', 'Bose QuietComfort Headphones',
        'Dell XPS 15 Laptop', 'LG OLED 65 TV', 'Canon EOS R6 Camera',
        'Dyson V15 Vacuum', 'KitchenAid Stand Mixer', 'Instant Pot Duo',
        'Lego Star Wars Set', 'Pokemon Cards Booster Box', 'Nike Air Jordan 1',
        'Adidas Yeezy Boost 350', 'Supreme Box Logo Hoodie', 'Vintage Rolex Watch',
        'Diamond Engagement Ring', 'Louis Vuitton Bag', 'Gucci Belt Classic',
        'Ray-Ban Aviator Sunglasses', 'Oakley Prizm Goggles', 'GoPro Hero 12',
        'DJI Mini 4 Pro Drone', 'Sonos Arc Soundbar', 'Herman Miller Aeron Chair'
    ];
    prices DECIMAL[] := ARRAY[
        1199.99, 1299.99, 1999.99,
        499.99, 499.99, 349.99,
        799.99, 249.99, 349.99,
        1599.99, 1999.99, 2499.99,
        649.99, 449.99, 129.99,
        199.99, 149.99, 180.00,
        250.00, 450.00, 8500.00,
        5000.00, 2500.00, 550.00,
        175.00, 200.00, 399.99,
        759.99, 899.99, 1395.00
    ];
    dispute_types TEXT[] := ARRAY['item_not_received', 'item_not_as_described'];
    dispute_statuses TEXT[] := ARRAY['open', 'under_review', 'resolved', 'closed'];
    return_statuses TEXT[] := ARRAY['requested', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'closed'];
    return_reasons TEXT[] := ARRAY['defective', 'not_as_described', 'wrong_item', 'changed_mind', 'arrived_late'];
    slug_suffix TEXT;
BEGIN
    -- Get category IDs
    SELECT id INTO electronics_cat_id FROM categories WHERE name = 'Electronics' LIMIT 1;
    SELECT id INTO fashion_cat_id FROM categories WHERE name = 'Fashion' LIMIT 1;
    SELECT id INTO home_cat_id FROM categories WHERE name = 'Home & Garden' LIMIT 1;
    SELECT id INTO sports_cat_id FROM categories WHERE name = 'Sporting Goods' LIMIT 1;
    SELECT id INTO toys_cat_id FROM categories WHERE name = 'Toys & Games' LIMIT 1;
    SELECT id INTO collectibles_cat_id FROM categories WHERE name = 'Collectibles' LIMIT 1;
    SELECT id INTO jewelry_cat_id FROM categories WHERE name = 'Jewelry & Watches' LIMIT 1;

    -- Loop through all users to add products
    FOR user_rec IN SELECT id, username FROM users LOOP
        -- Add 30 products for each user
        FOR i IN 1..30 LOOP
            new_product_id := uuid_generate_v4();
            slug_suffix := FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000000 + RANDOM() * 1000000)::TEXT;

            -- Choose category based on index
            IF i % 7 = 0 THEN selected_cat_id := electronics_cat_id;
            ELSIF i % 7 = 1 THEN selected_cat_id := fashion_cat_id;
            ELSIF i % 7 = 2 THEN selected_cat_id := home_cat_id;
            ELSIF i % 7 = 3 THEN selected_cat_id := sports_cat_id;
            ELSIF i % 7 = 4 THEN selected_cat_id := toys_cat_id;
            ELSIF i % 7 = 5 THEN selected_cat_id := collectibles_cat_id;
            ELSE selected_cat_id := jewelry_cat_id;
            END IF;

            BEGIN
                INSERT INTO products (
                    id, seller_id, category_id, title, slug, description,
                    condition, listing_type, buy_now_price, current_price,
                    quantity, status, created_at
                ) VALUES (
                    new_product_id,
                    user_rec.id,
                    selected_cat_id,
                    product_titles[(i - 1) % 30 + 1] || ' by ' || user_rec.username || ' #' || i,
                    user_rec.username || '-p-' || i || '-' || slug_suffix,
                    'High quality ' || product_titles[(i - 1) % 30 + 1] || ' for sale. Excellent condition, fast shipping. Listed by ' || user_rec.username,
                    CASE WHEN RANDOM() > 0.3 THEN 'new' ELSE 'like_new' END,
                    'buy_now',
                    prices[(i - 1) % 30 + 1] + (RANDOM() * 100)::DECIMAL(10,2),
                    prices[(i - 1) % 30 + 1] + (RANDOM() * 100)::DECIMAL(10,2),
                    FLOOR(RANDOM() * 10 + 1)::INT,
                    'active',
                    NOW() - (RANDOM() * 90)::INT * INTERVAL '1 day'
                );
            EXCEPTION WHEN unique_violation THEN
                -- Skip if duplicate
                NULL;
            END;
        END LOOP;

        RAISE NOTICE 'Added products for user: %', user_rec.username;
    END LOOP;

    -- Create orders between users (each user gets 30 orders as buyer)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..30 LOOP
            -- Get a random product from another seller
            SELECT p.id, p.seller_id, COALESCE(p.buy_now_price, p.current_price, 99.99) as price INTO product_rec
            FROM products p
            WHERE p.seller_id != user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF product_rec.id IS NOT NULL THEN
                new_order_id := uuid_generate_v4();
                BEGIN
                    INSERT INTO orders (
                        id, buyer_id, seller_id, total_amount, status,
                        shipping_address, created_at
                    ) VALUES (
                        new_order_id,
                        user_rec.id,
                        product_rec.seller_id,
                        product_rec.price,
                        CASE
                            WHEN RANDOM() < 0.2 THEN 'pending'
                            WHEN RANDOM() < 0.4 THEN 'confirmed'
                            WHEN RANDOM() < 0.6 THEN 'shipped'
                            WHEN RANDOM() < 0.8 THEN 'delivered'
                            ELSE 'cancelled'
                        END,
                        '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001", "country": "USA"}',
                        NOW() - (RANDOM() * 60)::INT * INTERVAL '1 day'
                    );

                    -- Add order item
                    INSERT INTO order_items (
                        id, order_id, product_id, quantity, price_at_purchase
                    ) VALUES (
                        uuid_generate_v4(),
                        new_order_id,
                        product_rec.id,
                        1,
                        product_rec.price
                    );
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added orders for user: %', user_rec.username;
    END LOOP;

    -- Create disputes for each user (30 disputes per user)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..30 LOOP
            -- Get a random order for this user
            SELECT o.id INTO order_rec
            FROM orders o
            WHERE o.buyer_id = user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF order_rec.id IS NOT NULL THEN
                BEGIN
                    INSERT INTO disputes (
                        id, order_id, opened_by, dispute_type, reason,
                        desired_resolution, status, created_at
                    ) VALUES (
                        uuid_generate_v4(),
                        order_rec.id,
                        user_rec.id,
                        dispute_types[(i % 2) + 1],
                        'Issue with order #' || i || ': ' || CASE WHEN i % 2 = 0 THEN 'Item was not received after 2 weeks' ELSE 'Item does not match description' END,
                        CASE WHEN i % 3 = 0 THEN 'Full refund requested' WHEN i % 3 = 1 THEN 'Partial refund requested' ELSE 'Replacement item requested' END,
                        dispute_statuses[(i % 4) + 1],
                        NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day'
                    );
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added disputes for user: %', user_rec.username;
    END LOOP;

    -- Create returns for each user (30 returns per user)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..30 LOOP
            -- Get a random order for this user
            SELECT o.id INTO order_rec
            FROM orders o
            WHERE o.buyer_id = user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF order_rec.id IS NOT NULL THEN
                BEGIN
                    INSERT INTO returns (
                        id, order_id, buyer_id, return_reason, return_details,
                        status, created_at
                    ) VALUES (
                        uuid_generate_v4(),
                        order_rec.id,
                        user_rec.id,
                        return_reasons[(i % 5) + 1],
                        'Return request #' || i || ': ' || CASE
                            WHEN i % 5 = 0 THEN 'Product arrived damaged'
                            WHEN i % 5 = 1 THEN 'Product does not match listing photos'
                            WHEN i % 5 = 2 THEN 'Received wrong item'
                            WHEN i % 5 = 3 THEN 'Changed my mind about purchase'
                            ELSE 'Item arrived too late'
                        END,
                        return_statuses[(i % 7) + 1],
                        NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day'
                    );
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added returns for user: %', user_rec.username;
    END LOOP;

    -- Add watchlist items for each user (30 items per user)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..30 LOOP
            SELECT p.id INTO product_rec
            FROM products p
            WHERE p.seller_id != user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF product_rec.id IS NOT NULL THEN
                BEGIN
                    INSERT INTO watchlist (id, user_id, product_id, created_at)
                    VALUES (uuid_generate_v4(), user_rec.id, product_rec.id, NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day');
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added watchlist for user: %', user_rec.username;
    END LOOP;

    -- Add saved searches for each user (30 searches per user)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..30 LOOP
            BEGIN
                INSERT INTO saved_searches (
                    id, user_id, name, query, filters, email_alerts, created_at
                ) VALUES (
                    uuid_generate_v4(),
                    user_rec.id,
                    CASE
                        WHEN i % 10 = 0 THEN 'iPhone deals'
                        WHEN i % 10 = 1 THEN 'Vintage watches'
                        WHEN i % 10 = 2 THEN 'Gaming consoles'
                        WHEN i % 10 = 3 THEN 'Designer bags'
                        WHEN i % 10 = 4 THEN 'Sneakers under $200'
                        WHEN i % 10 = 5 THEN 'Camera equipment'
                        WHEN i % 10 = 6 THEN 'Home appliances'
                        WHEN i % 10 = 7 THEN 'Pokemon cards'
                        WHEN i % 10 = 8 THEN 'Laptop deals'
                        ELSE 'Headphones sale'
                    END || ' #' || i,
                    CASE
                        WHEN i % 10 = 0 THEN 'iphone'
                        WHEN i % 10 = 1 THEN 'vintage watch'
                        WHEN i % 10 = 2 THEN 'playstation xbox'
                        WHEN i % 10 = 3 THEN 'louis vuitton gucci'
                        WHEN i % 10 = 4 THEN 'nike adidas sneakers'
                        WHEN i % 10 = 5 THEN 'canon sony camera'
                        WHEN i % 10 = 6 THEN 'dyson kitchenaid'
                        WHEN i % 10 = 7 THEN 'pokemon tcg'
                        WHEN i % 10 = 8 THEN 'macbook dell laptop'
                        ELSE 'airpods bose headphones'
                    END,
                    '{}',
                    CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
                    NOW() - (RANDOM() * 60)::INT * INTERVAL '1 day'
                );
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END LOOP;

        RAISE NOTICE 'Added saved searches for user: %', user_rec.username;
    END LOOP;

    -- Add messages between users (conversations)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..15 LOOP
            SELECT u.id INTO seller_rec
            FROM users u
            WHERE u.id != user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF seller_rec.id IS NOT NULL THEN
                -- Get a product for the conversation
                SELECT p.id INTO product_rec
                FROM products p
                WHERE p.seller_id = seller_rec.id
                ORDER BY RANDOM()
                LIMIT 1;

                IF product_rec.id IS NOT NULL THEN
                    BEGIN
                        INSERT INTO messages (
                            id, sender_id, recipient_id, product_id, subject, body, created_at
                        ) VALUES (
                            uuid_generate_v4(),
                            user_rec.id,
                            seller_rec.id,
                            product_rec.id,
                            'Question about your listing #' || i,
                            'Hi, I am interested in this item. Is it still available? What is the best price you can offer?',
                            NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day'
                        );

                        -- Reply from seller
                        INSERT INTO messages (
                            id, sender_id, recipient_id, product_id, subject, body, created_at
                        ) VALUES (
                            uuid_generate_v4(),
                            seller_rec.id,
                            user_rec.id,
                            product_rec.id,
                            'RE: Question about your listing #' || i,
                            'Yes, the item is still available! I can offer you a 10% discount if you buy today.',
                            NOW() - (RANDOM() * 29)::INT * INTERVAL '1 day'
                        );
                    EXCEPTION WHEN OTHERS THEN
                        NULL;
                    END;
                END IF;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added messages for user: %', user_rec.username;
    END LOOP;

END $$;

-- Verify counts
SELECT '=== PRODUCTS PER USER ===' as summary;
SELECT u.username, COUNT(p.id) as products
FROM users u
LEFT JOIN products p ON u.id = p.seller_id
GROUP BY u.username
ORDER BY products DESC;

SELECT '=== ORDERS PER USER (as buyer) ===' as summary;
SELECT u.username, COUNT(o.id) as orders
FROM users u
LEFT JOIN orders o ON u.id = o.buyer_id
GROUP BY u.username
ORDER BY orders DESC;

SELECT '=== DISPUTES PER USER ===' as summary;
SELECT u.username, COUNT(d.id) as disputes
FROM users u
LEFT JOIN disputes d ON u.id = d.opened_by
GROUP BY u.username
ORDER BY disputes DESC;

SELECT '=== RETURNS PER USER ===' as summary;
SELECT u.username, COUNT(r.id) as returns
FROM users u
LEFT JOIN returns r ON u.id = r.buyer_id
GROUP BY u.username
ORDER BY returns DESC;

SELECT '=== WATCHLIST PER USER ===' as summary;
SELECT u.username, COUNT(w.id) as watchlist_items
FROM users u
LEFT JOIN watchlist w ON u.id = w.user_id
GROUP BY u.username
ORDER BY watchlist_items DESC;

SELECT '=== SAVED SEARCHES PER USER ===' as summary;
SELECT u.username, COUNT(ss.id) as saved_searches
FROM users u
LEFT JOIN saved_searches ss ON u.id = ss.user_id
GROUP BY u.username
ORDER BY saved_searches DESC;

SELECT '=== MESSAGES PER USER ===' as summary;
SELECT u.username, COUNT(m.id) as messages
FROM users u
LEFT JOIN messages m ON u.id = m.sender_id OR u.id = m.recipient_id
GROUP BY u.username
ORDER BY messages DESC;
