-- eBay Clone - Final User Activity Seed Data
-- Uses actual products in the database

-- =====================================================
-- COMPREHENSIVE ORDERS WITH ORDER ITEMS
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

    -- Products (will be fetched dynamically)
    prod1 RECORD;
    prod2 RECORD;
    prod3 RECORD;
    prod4 RECORD;
    prod5 RECORD;
    prod6 RECORD;
    prod7 RECORD;
    prod8 RECORD;
    prod9 RECORD;
    prod10 RECORD;

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

    -- Get address IDs (create if not exist)
    SELECT id INTO bob_addr_id FROM addresses WHERE user_id = buyer_bob_id LIMIT 1;
    SELECT id INTO jane_addr_id FROM addresses WHERE user_id = buyer_jane_id LIMIT 1;
    SELECT id INTO bookworm_addr_id FROM addresses WHERE user_id = bookworm_id LIMIT 1;
    SELECT id INTO gamezone_addr_id FROM addresses WHERE user_id = gamezone_id LIMIT 1;
    SELECT id INTO artcollector_addr_id FROM addresses WHERE user_id = artcollector_id LIMIT 1;

    -- Get various products (use LIMIT 1 to get distinct products)
    SELECT id, title, current_price, seller_id INTO prod1 FROM products WHERE title ILIKE '%Samsung%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod2 FROM products WHERE title ILIKE '%MacBook%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod3 FROM products WHERE title ILIKE '%Bose%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod4 FROM products WHERE title ILIKE '%Dyson%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod5 FROM products WHERE title ILIKE '%DJI%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod6 FROM products WHERE title ILIKE '%Canon%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod7 FROM products WHERE title ILIKE '%Gucci%' OR title ILIKE '%Chanel%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod8 FROM products WHERE title ILIKE '%Rolex%' OR title ILIKE '%Watch%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod9 FROM products WHERE title ILIKE '%Nike%' OR title ILIKE '%Louboutin%' AND seller_id IS NOT NULL LIMIT 1;
    SELECT id, title, current_price, seller_id INTO prod10 FROM products WHERE title ILIKE '%Breville%' AND seller_id IS NOT NULL LIMIT 1;

    -- =====================================================
    -- BUYER_BOB's ORDERS (5 orders)
    -- =====================================================

    -- Order 1: Samsung - DELIVERED (30 days ago)
    IF prod1.id IS NOT NULL AND bob_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number,
                           shipped_at, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, prod1.seller_id, 'ORD-2024-1001',
                prod1.current_price, 0, prod1.current_price * 0.08, prod1.current_price * 1.08,
                'delivered', 'completed', bob_addr_id, '1Z999AA10123456784',
                NOW() - INTERVAL '28 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '30 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod1.id, 1, prod1.current_price, prod1.current_price);

        RAISE NOTICE 'Created order 1 for buyer_bob: %', prod1.title;
    END IF;

    -- Order 2: Bose - DELIVERED (20 days ago)
    IF prod3.id IS NOT NULL AND bob_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number,
                           shipped_at, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, prod3.seller_id, 'ORD-2024-1002',
                prod3.current_price, 0, prod3.current_price * 0.08, prod3.current_price * 1.08,
                'delivered', 'completed', bob_addr_id, '1Z999AA10123456785',
                NOW() - INTERVAL '18 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '20 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod3.id, 1, prod3.current_price, prod3.current_price);

        RAISE NOTICE 'Created order 2 for buyer_bob: %', prod3.title;
    END IF;

    -- Order 3: Dyson - SHIPPED (5 days ago)
    IF prod4.id IS NOT NULL AND bob_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, prod4.seller_id, 'ORD-2024-1003',
                prod4.current_price, 0, prod4.current_price * 0.08, prod4.current_price * 1.08,
                'shipped', 'completed', bob_addr_id, '9400111899223033005',
                NOW() - INTERVAL '4 days', NOW() - INTERVAL '5 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod4.id, 1, prod4.current_price, prod4.current_price);

        RAISE NOTICE 'Created order 3 for buyer_bob: %', prod4.title;
    END IF;

    -- Order 4: DJI Drone - PROCESSING (2 days ago)
    IF prod5.id IS NOT NULL AND bob_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, prod5.seller_id, 'ORD-2024-1004',
                prod5.current_price, 15.00, prod5.current_price * 0.08, prod5.current_price * 1.08 + 15,
                'processing', 'completed', bob_addr_id, NOW() - INTERVAL '2 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod5.id, 1, prod5.current_price, prod5.current_price);

        RAISE NOTICE 'Created order 4 for buyer_bob: %', prod5.title;
    END IF;

    -- Order 5: Canon - PENDING (today)
    IF prod6.id IS NOT NULL AND bob_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, prod6.seller_id, 'ORD-2024-1005',
                prod6.current_price, 25.00, prod6.current_price * 0.08, prod6.current_price * 1.08 + 25,
                'pending', 'pending', bob_addr_id, NOW())
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod6.id, 1, prod6.current_price, prod6.current_price);

        RAISE NOTICE 'Created order 5 for buyer_bob: %', prod6.title;
    END IF;

    -- =====================================================
    -- BUYER_JANE's ORDERS (4 orders)
    -- =====================================================

    -- Order 1: MacBook - DELIVERED (45 days ago)
    IF prod2.id IS NOT NULL AND jane_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number,
                           shipped_at, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, prod2.seller_id, 'ORD-2024-2001',
                prod2.current_price, 0, prod2.current_price * 0.08, prod2.current_price * 1.08,
                'delivered', 'completed', jane_addr_id, '1Z999AA10123456790',
                NOW() - INTERVAL '43 days', NOW() - INTERVAL '40 days', NOW() - INTERVAL '45 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod2.id, 1, prod2.current_price, prod2.current_price);

        RAISE NOTICE 'Created order 1 for buyer_jane: %', prod2.title;
    END IF;

    -- Order 2: Gucci/Chanel - DELIVERED (25 days ago)
    IF prod7.id IS NOT NULL AND jane_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number,
                           shipped_at, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, prod7.seller_id, 'ORD-2024-2002',
                prod7.current_price, 0, prod7.current_price * 0.08, prod7.current_price * 1.08,
                'delivered', 'completed', jane_addr_id, '1Z999AA10123456791',
                NOW() - INTERVAL '23 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod7.id, 1, prod7.current_price, prod7.current_price);

        RAISE NOTICE 'Created order 2 for buyer_jane: %', prod7.title;
    END IF;

    -- Order 3: Watch - SHIPPED (7 days ago)
    IF prod8.id IS NOT NULL AND jane_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, prod8.seller_id, 'ORD-2024-2003',
                prod8.current_price, 0, prod8.current_price * 0.08, prod8.current_price * 1.08,
                'shipped', 'completed', jane_addr_id, '785892346123',
                NOW() - INTERVAL '5 days', NOW() - INTERVAL '7 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod8.id, 1, prod8.current_price, prod8.current_price);

        RAISE NOTICE 'Created order 3 for buyer_jane: %', prod8.title;
    END IF;

    -- Order 4: Shoes - DELIVERED (60 days ago)
    IF prod9.id IS NOT NULL AND jane_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number,
                           shipped_at, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, prod9.seller_id, 'ORD-2024-2004',
                prod9.current_price, 15.00, prod9.current_price * 0.08, prod9.current_price * 1.08 + 15,
                'delivered', 'completed', jane_addr_id, 'FEDEX-12345',
                NOW() - INTERVAL '58 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '60 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod9.id, 1, prod9.current_price, prod9.current_price);

        RAISE NOTICE 'Created order 4 for buyer_jane: %', prod9.title;
    END IF;

    -- =====================================================
    -- BOOKWORM's ORDERS (2 orders)
    -- =====================================================

    -- Order 1: Breville - DELIVERED
    IF prod10.id IS NOT NULL AND bookworm_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number,
                           shipped_at, delivered_at, created_at)
        VALUES (uuid_generate_v4(), bookworm_id, prod10.seller_id, 'ORD-2024-3001',
                prod10.current_price, 10.00, prod10.current_price * 0.08, prod10.current_price * 1.08 + 10,
                'delivered', 'completed', bookworm_addr_id, '1Z999AA10123456800',
                NOW() - INTERVAL '33 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '35 days')
        RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod10.id, 1, prod10.current_price, prod10.current_price);

        RAISE NOTICE 'Created order 1 for bookworm: %', prod10.title;
    END IF;

    -- =====================================================
    -- GAMEZONE's ORDERS (1 order)
    -- =====================================================

    IF prod5.id IS NOT NULL AND gamezone_addr_id IS NOT NULL THEN
        -- Use a different product for gamezone
        SELECT id, title, current_price, seller_id INTO prod5 FROM products
        WHERE title ILIKE '%Dell%' OR title ILIKE '%Canon%' AND seller_id IS NOT NULL
        AND id NOT IN (SELECT product_id FROM order_items) LIMIT 1;

        IF prod5.id IS NOT NULL THEN
            INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                               status, payment_status, shipping_address_id, tracking_number,
                               shipped_at, delivered_at, created_at)
            VALUES (uuid_generate_v4(), gamezone_id, prod5.seller_id, 'ORD-2024-4001',
                    prod5.current_price, 15.00, prod5.current_price * 0.08, prod5.current_price * 1.08 + 15,
                    'delivered', 'completed', gamezone_addr_id, '9400111899223033010',
                    NOW() - INTERVAL '38 days', NOW() - INTERVAL '35 days', NOW() - INTERVAL '40 days')
            RETURNING id INTO order_id;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (order_id, prod5.id, 1, prod5.current_price, prod5.current_price);

            RAISE NOTICE 'Created order for gamezone: %', prod5.title;
        END IF;
    END IF;

    -- =====================================================
    -- ARTCOLLECTOR's CANCELLED ORDER
    -- =====================================================
    IF prod1.id IS NOT NULL AND artcollector_addr_id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), artcollector_id, prod1.seller_id, 'ORD-2024-5001',
                prod1.current_price, 0, prod1.current_price * 0.08, prod1.current_price * 1.08,
                'cancelled', 'refunded', artcollector_addr_id, NOW() - INTERVAL '50 days');

        RAISE NOTICE 'Created cancelled order for artcollector';
    END IF;

    RAISE NOTICE 'All orders created successfully!';
END $$;

-- =====================================================
-- CREATE PAYMENT TRANSACTIONS
-- =====================================================
INSERT INTO payment_transactions (order_id, user_id, amount, status, stripe_payment_intent_id, created_at)
SELECT o.id, o.buyer_id, o.total, 'succeeded', 'pi_' || md5(o.id::text), o.created_at
FROM orders o
WHERE o.payment_status = 'completed'
AND NOT EXISTS (SELECT 1 FROM payment_transactions pt WHERE pt.order_id = o.id);

-- =====================================================
-- CREATE SAMPLE DISPUTE AND RETURN
-- =====================================================
DO $$
DECLARE
    delivered_order RECORD;
    buyer_id UUID;
    seller_id UUID;
    order_item_id UUID;
BEGIN
    -- Get a delivered order for dispute
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id
    INTO delivered_order
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    LIMIT 1;

    IF delivered_order.id IS NOT NULL THEN
        -- Create a resolved dispute
        INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, status, reason, desired_resolution, resolution_notes, resolved_at)
        VALUES (delivered_order.id, delivered_order.item_id, delivered_order.buyer_id, delivered_order.seller_id,
                'item_not_as_described', 'resolved', 'Minor scratches not shown in photos',
                'partial_refund', 'Partial refund of $50 issued', NOW() - INTERVAL '10 days');

        RAISE NOTICE 'Dispute created for order %', delivered_order.id;
    END IF;

    -- Get another delivered order for return
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id
    INTO delivered_order
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    AND o.id NOT IN (SELECT order_id FROM disputes)
    LIMIT 1;

    IF delivered_order.id IS NOT NULL THEN
        -- Create a return
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason, return_details, status, refund_amount)
        VALUES (delivered_order.id, delivered_order.item_id, delivered_order.buyer_id, delivered_order.seller_id,
                'changed_mind', 'Found a better deal elsewhere', 'approved', 100.00);

        RAISE NOTICE 'Return created for order %', delivered_order.id;
    END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'Final Activity Seed Complete!' as status;

SELECT 'Orders' as entity, COUNT(*) as count FROM orders
UNION ALL SELECT 'Order Items', COUNT(*) FROM order_items
UNION ALL SELECT 'Bids', COUNT(*) FROM bids
UNION ALL SELECT 'Reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'Watchlist', COUNT(*) FROM watchlist
UNION ALL SELECT 'Notifications', COUNT(*) FROM notifications
UNION ALL SELECT 'Addresses', COUNT(*) FROM addresses
UNION ALL SELECT 'Payments', COUNT(*) FROM payment_transactions
UNION ALL SELECT 'Disputes', COUNT(*) FROM disputes
UNION ALL SELECT 'Returns', COUNT(*) FROM returns;

-- Show user order summary
SELECT u.username,
       COUNT(DISTINCT CASE WHEN o.status != 'cancelled' THEN o.id END) as orders,
       COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total END), 0)::numeric(10,2) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.buyer_id
WHERE u.username IN ('buyer_bob', 'buyer_jane', 'bookworm', 'gamezone', 'artcollector')
GROUP BY u.username
ORDER BY total_spent DESC;
