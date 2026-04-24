-- Add disputes and returns for all users
DO $$
DECLARE
    user_rec RECORD;
    order_rec RECORD;
    i INTEGER;
    dispute_types TEXT[] := ARRAY['item_not_received', 'item_not_as_described'];
    dispute_statuses TEXT[] := ARRAY['open', 'under_review', 'resolved', 'closed'];
    desired_resolutions TEXT[] := ARRAY['full_refund', 'partial_refund', 'replacement', 'other'];
    return_statuses TEXT[] := ARRAY['requested', 'approved', 'rejected', 'shipped', 'received', 'refunded', 'closed'];
    return_reasons TEXT[] := ARRAY['defective', 'not_as_described', 'wrong_item', 'changed_mind', 'arrived_late'];
BEGIN
    -- Create disputes for each user (30 disputes per user)
    FOR user_rec IN SELECT id, username FROM users LOOP
        FOR i IN 1..30 LOOP
            -- Get a random order for this user with seller_id
            SELECT o.id, o.seller_id INTO order_rec
            FROM orders o
            WHERE o.buyer_id = user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF order_rec.id IS NOT NULL AND order_rec.seller_id IS NOT NULL THEN
                BEGIN
                    INSERT INTO disputes (
                        id, order_id, opened_by, against_user, dispute_type, reason,
                        desired_resolution, status, created_at
                    ) VALUES (
                        uuid_generate_v4(),
                        order_rec.id,
                        user_rec.id,
                        order_rec.seller_id,
                        dispute_types[(i % 2) + 1],
                        'Issue with order #' || i || ': ' || CASE WHEN i % 2 = 0 THEN 'Item was not received after 2 weeks' ELSE 'Item does not match description' END,
                        desired_resolutions[(i % 4) + 1],
                        dispute_statuses[(i % 4) + 1],
                        NOW() - (RANDOM() * 30)::INT * INTERVAL '1 day'
                    );
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Dispute error for % (#%): %', user_rec.username, i, SQLERRM;
                END;
            ELSE
                RAISE NOTICE 'No valid orders found for % to create dispute #%', user_rec.username, i;
            END IF;
        END LOOP;

        RAISE NOTICE 'Added disputes for user: %', user_rec.username;
    END LOOP;

    -- Create additional returns for users who have less than 30
    FOR user_rec IN SELECT u.id, u.username, COUNT(r.id) as cnt
                    FROM users u
                    LEFT JOIN returns r ON u.id = r.buyer_id
                    GROUP BY u.id, u.username
                    HAVING COUNT(r.id) < 30 LOOP
        FOR i IN 1..(30 - user_rec.cnt) LOOP
            -- Get a random order for this user with seller_id
            SELECT o.id, o.seller_id INTO order_rec
            FROM orders o
            WHERE o.buyer_id = user_rec.id
            ORDER BY RANDOM()
            LIMIT 1;

            IF order_rec.id IS NOT NULL AND order_rec.seller_id IS NOT NULL THEN
                BEGIN
                    INSERT INTO returns (
                        id, order_id, buyer_id, seller_id, return_reason, return_details,
                        status, created_at
                    ) VALUES (
                        uuid_generate_v4(),
                        order_rec.id,
                        user_rec.id,
                        order_rec.seller_id,
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

        RAISE NOTICE 'Added extra returns for user: %', user_rec.username;
    END LOOP;

END $$;

-- Verify counts
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
