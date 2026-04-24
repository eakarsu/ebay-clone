-- Add orders, disputes, and returns for all users
DO $$
DECLARE
    user_rec RECORD;
    product_rec RECORD;
    order_rec RECORD;
    i INTEGER;
    new_order_id UUID;
    order_num TEXT;
    dispute_types TEXT[] := ARRAY['item_not_received', 'item_not_as_described'];
    dispute_statuses TEXT[] := ARRAY['open', 'under_review', 'resolved', 'closed'];
    return_statuses TEXT[] := ARRAY['requested', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'closed'];
    return_reasons TEXT[] := ARRAY['defective', 'not_as_described', 'wrong_item', 'changed_mind', 'arrived_late'];
BEGIN
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
                order_num := 'ORD-' || UPPER(SUBSTRING(user_rec.username, 1, 3)) || '-' || FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000 + RANDOM() * 100000)::TEXT;

                BEGIN
                    INSERT INTO orders (
                        id, order_number, buyer_id, seller_id, subtotal, total, status, created_at
                    ) VALUES (
                        new_order_id,
                        order_num,
                        user_rec.id,
                        product_rec.seller_id,
                        product_rec.price,
                        product_rec.price,
                        CASE
                            WHEN RANDOM() < 0.2 THEN 'pending'
                            WHEN RANDOM() < 0.4 THEN 'confirmed'
                            WHEN RANDOM() < 0.6 THEN 'shipped'
                            WHEN RANDOM() < 0.8 THEN 'delivered'
                            ELSE 'cancelled'
                        END,
                        NOW() - (RANDOM() * 60)::INT * INTERVAL '1 day'
                    );

                    -- Add order item
                    INSERT INTO order_items (
                        id, order_id, product_id, quantity, unit_price, total_price
                    ) VALUES (
                        uuid_generate_v4(),
                        new_order_id,
                        product_rec.id,
                        1,
                        product_rec.price,
                        product_rec.price
                    );
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Order error for %: %', user_rec.username, SQLERRM;
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
                    RAISE NOTICE 'Dispute error for %: %', user_rec.username, SQLERRM;
                END;
            ELSE
                RAISE NOTICE 'No orders found for % to create disputes', user_rec.username;
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
                    RAISE NOTICE 'Return error for %: %', user_rec.username, SQLERRM;
                END;
            ELSE
                RAISE NOTICE 'No orders found for % to create returns', user_rec.username;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added returns for user: %', user_rec.username;
    END LOOP;

    -- Add saved searches for sellers who don't have them
    FOR user_rec IN SELECT id, username FROM users WHERE id NOT IN (SELECT DISTINCT user_id FROM saved_searches) LOOP
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

END $$;

-- Verify counts
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

SELECT '=== SAVED SEARCHES PER USER ===' as summary;
SELECT u.username, COUNT(ss.id) as saved_searches
FROM users u
LEFT JOIN saved_searches ss ON u.id = ss.user_id
GROUP BY u.username
ORDER BY saved_searches DESC;
