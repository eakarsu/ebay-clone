-- Comprehensive seed data for watchlist, purchases, listings, and sales
-- Run this after the main seed files

-- =====================================================
-- 1. ADD WATCHLIST ITEMS (15+ items for each buyer)
-- =====================================================

-- Clear existing watchlist
DELETE FROM watchlist;

-- Add watchlist items for buyer_jane (20 items from various sellers)
INSERT INTO watchlist (user_id, product_id)
SELECT
    (SELECT id FROM users WHERE username = 'buyer_jane'),
    p.id
FROM products p
WHERE p.status = 'active'
ORDER BY RANDOM()
LIMIT 20;

-- Add watchlist items for buyer_bob (18 items)
INSERT INTO watchlist (user_id, product_id)
SELECT
    (SELECT id FROM users WHERE username = 'buyer_bob'),
    p.id
FROM products p
WHERE p.status = 'active'
  AND p.id NOT IN (SELECT product_id FROM watchlist WHERE user_id = (SELECT id FROM users WHERE username = 'buyer_bob'))
ORDER BY RANDOM()
LIMIT 18;

-- =====================================================
-- 2. CREATE MORE ORDERS/PURCHASES FOR BUYERS
-- =====================================================

-- First, ensure buyers have addresses
INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT
    (SELECT id FROM users WHERE username = 'buyer_jane'),
    'Jane Doe',
    '123 Main Street',
    'New York',
    'NY',
    '10001',
    'United States',
    true
WHERE NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = (SELECT id FROM users WHERE username = 'buyer_jane'));

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT
    (SELECT id FROM users WHERE username = 'buyer_bob'),
    'Bob Smith',
    '456 Oak Avenue',
    'Los Angeles',
    'CA',
    '90001',
    'United States',
    true
WHERE NOT EXISTS (SELECT 1 FROM addresses WHERE user_id = (SELECT id FROM users WHERE username = 'buyer_bob'));

-- Create 15+ purchases for buyer_jane from different sellers
DO $$
DECLARE
    jane_id UUID;
    bob_id UUID;
    jane_addr_id UUID;
    bob_addr_id UUID;
    prod RECORD;
    order_id UUID;
    counter INTEGER := 1;
BEGIN
    SELECT id INTO jane_id FROM users WHERE username = 'buyer_jane';
    SELECT id INTO bob_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO jane_addr_id FROM addresses WHERE user_id = jane_id LIMIT 1;
    SELECT id INTO bob_addr_id FROM addresses WHERE user_id = bob_id LIMIT 1;

    -- Create 18 orders for buyer_jane
    FOR prod IN
        SELECT p.id, p.seller_id, p.title, COALESCE(p.current_price, p.buy_now_price, 99.99) as price
        FROM products p
        WHERE p.status = 'active' AND p.seller_id != jane_id
        ORDER BY RANDOM()
        LIMIT 18
    LOOP
        INSERT INTO orders (
            buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
            status, payment_status, shipping_address_id, created_at
        ) VALUES (
            jane_id,
            prod.seller_id,
            'ORD-JANE-' || counter || '-' || (RANDOM() * 1000)::INT,
            prod.price,
            CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 9.99 END,
            prod.price * 0.08,
            prod.price * 1.08 + CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 9.99 END,
            CASE
                WHEN counter <= 5 THEN 'delivered'
                WHEN counter <= 8 THEN 'shipped'
                WHEN counter <= 12 THEN 'processing'
                ELSE 'pending'
            END,
            CASE WHEN counter <= 12 THEN 'completed' ELSE 'pending' END,
            jane_addr_id,
            NOW() - (counter * INTERVAL '3 days')
        ) RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.price, prod.price);

        counter := counter + 1;
    END LOOP;

    -- Create 16 orders for buyer_bob
    counter := 1;
    FOR prod IN
        SELECT p.id, p.seller_id, p.title, COALESCE(p.current_price, p.buy_now_price, 99.99) as price
        FROM products p
        WHERE p.status = 'active' AND p.seller_id != bob_id
        ORDER BY RANDOM()
        LIMIT 16
    LOOP
        INSERT INTO orders (
            buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
            status, payment_status, shipping_address_id, created_at
        ) VALUES (
            bob_id,
            prod.seller_id,
            'ORD-BOB-' || counter || '-' || (RANDOM() * 1000)::INT,
            prod.price,
            CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 9.99 END,
            prod.price * 0.08,
            prod.price * 1.08 + CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 9.99 END,
            CASE
                WHEN counter <= 4 THEN 'delivered'
                WHEN counter <= 7 THEN 'shipped'
                WHEN counter <= 11 THEN 'processing'
                ELSE 'pending'
            END,
            CASE WHEN counter <= 11 THEN 'completed' ELSE 'pending' END,
            bob_addr_id,
            NOW() - (counter * INTERVAL '2 days')
        ) RETURNING id INTO order_id;

        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.price, prod.price);

        counter := counter + 1;
    END LOOP;
END $$;

-- =====================================================
-- 3. UPDATE SELLER STATISTICS
-- =====================================================

UPDATE users u
SET total_sales = COALESCE(
    (SELECT SUM(o.total) FROM orders o WHERE o.seller_id = u.id AND o.payment_status = 'completed'),
    0
)
WHERE u.is_seller = true;

-- =====================================================
-- 4. SUMMARY
-- =====================================================

SELECT 'Watchlist items:' as metric, COUNT(*)::text as value FROM watchlist
UNION ALL
SELECT 'Orders for buyer_jane:', COUNT(*)::text FROM orders WHERE buyer_id = (SELECT id FROM users WHERE username = 'buyer_jane')
UNION ALL
SELECT 'Orders for buyer_bob:', COUNT(*)::text FROM orders WHERE buyer_id = (SELECT id FROM users WHERE username = 'buyer_bob')
UNION ALL
SELECT 'Total orders:', COUNT(*)::text FROM orders
UNION ALL
SELECT 'Total sales (completed):', '$' || COALESCE(SUM(total)::text, '0') FROM orders WHERE payment_status = 'completed';
