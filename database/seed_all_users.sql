-- Comprehensive seed data for ALL users
-- Adds watchlist, addresses, and orders for every user

-- =====================================================
-- 1. CLEAR EXISTING DATA
-- =====================================================
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM watchlist;
DELETE FROM addresses WHERE user_id IN (SELECT id FROM users);

-- =====================================================
-- 2. ADD ADDRESSES FOR ALL USERS
-- =====================================================

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Jane Doe', '123 Main Street', 'New York', 'NY', '10001', 'United States', true
FROM users WHERE username = 'buyer_jane';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Bob Smith', '456 Oak Avenue', 'Los Angeles', 'CA', '90001', 'United States', true
FROM users WHERE username = 'buyer_bob';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Tech Deals Inc', '789 Silicon Valley Blvd', 'San Jose', 'CA', '95101', 'United States', true
FROM users WHERE username = 'techdeals';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Vintage Treasures LLC', '321 Antique Row', 'Boston', 'MA', '02101', 'United States', true
FROM users WHERE username = 'vintagetreasures';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Fashion Forward', '555 Style Ave', 'Miami', 'FL', '33101', 'United States', true
FROM users WHERE username = 'fashionista';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Home Essentials Co', '777 Comfort Lane', 'Chicago', 'IL', '60601', 'United States', true
FROM users WHERE username = 'homeessentials';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Sports Gear Pro', '888 Athletic Way', 'Denver', 'CO', '80201', 'United States', true
FROM users WHERE username = 'sportsgear';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Game Zone HQ', '999 Gamer Street', 'Seattle', 'WA', '98101', 'United States', true
FROM users WHERE username = 'gamezone';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Book Worm Store', '111 Library Lane', 'Portland', 'OR', '97201', 'United States', true
FROM users WHERE username = 'bookworm';

INSERT INTO addresses (user_id, full_name, street_address, city, state, postal_code, country, is_default)
SELECT id, 'Art Collector Gallery', '222 Museum Drive', 'San Francisco', 'CA', '94101', 'United States', true
FROM users WHERE username = 'artcollector';

-- =====================================================
-- 3. ADD WATCHLIST FOR ALL USERS (15+ each)
-- =====================================================

-- Function to add watchlist items for a user
DO $$
DECLARE
    user_rec RECORD;
    prod_id UUID;
    counter INTEGER;
BEGIN
    -- Loop through each user
    FOR user_rec IN SELECT id, username FROM users LOOP
        counter := 0;
        -- Add 15-20 random products to their watchlist (not their own products)
        FOR prod_id IN
            SELECT p.id FROM products p
            WHERE p.seller_id != user_rec.id
            AND p.status = 'active'
            AND p.id NOT IN (SELECT product_id FROM watchlist WHERE user_id = user_rec.id)
            ORDER BY RANDOM()
            LIMIT 18
        LOOP
            INSERT INTO watchlist (user_id, product_id)
            VALUES (user_rec.id, prod_id)
            ON CONFLICT DO NOTHING;
            counter := counter + 1;
        END LOOP;
        RAISE NOTICE 'Added % watchlist items for %', counter, user_rec.username;
    END LOOP;
END $$;

-- =====================================================
-- 4. ADD ORDERS FOR ALL USERS (15+ each)
-- =====================================================

DO $$
DECLARE
    user_rec RECORD;
    prod RECORD;
    order_id UUID;
    addr_id UUID;
    counter INTEGER;
    order_status TEXT;
    payment_status TEXT;
BEGIN
    -- Loop through each user to create purchases
    FOR user_rec IN SELECT id, username FROM users LOOP
        -- Get user's address
        SELECT id INTO addr_id FROM addresses WHERE user_id = user_rec.id LIMIT 1;

        -- Skip if no address
        IF addr_id IS NULL THEN
            CONTINUE;
        END IF;

        counter := 1;

        -- Create 15-18 orders for this user (buying from other sellers)
        FOR prod IN
            SELECT p.id, p.seller_id, p.title,
                   COALESCE(p.current_price, p.buy_now_price, 49.99 + RANDOM() * 200) as price
            FROM products p
            WHERE p.seller_id != user_rec.id
            AND p.status = 'active'
            ORDER BY RANDOM()
            LIMIT 16
        LOOP
            -- Vary the order statuses
            CASE
                WHEN counter <= 4 THEN
                    order_status := 'delivered';
                    payment_status := 'completed';
                WHEN counter <= 7 THEN
                    order_status := 'shipped';
                    payment_status := 'completed';
                WHEN counter <= 11 THEN
                    order_status := 'processing';
                    payment_status := 'completed';
                ELSE
                    order_status := 'pending';
                    payment_status := 'pending';
            END CASE;

            INSERT INTO orders (
                buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                status, payment_status, shipping_address_id, created_at
            ) VALUES (
                user_rec.id,
                prod.seller_id,
                'ORD-' || UPPER(SUBSTRING(user_rec.username, 1, 4)) || '-' || counter || '-' || (RANDOM() * 10000)::INT,
                prod.price,
                CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 9.99 END,
                prod.price * 0.08,
                prod.price * 1.08 + CASE WHEN RANDOM() > 0.5 THEN 0 ELSE 9.99 END,
                order_status,
                payment_status,
                addr_id,
                NOW() - (counter * INTERVAL '2 days') - (RANDOM() * INTERVAL '5 days')
            ) RETURNING id INTO order_id;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
            VALUES (order_id, prod.id, 1, prod.price, prod.price);

            counter := counter + 1;
        END LOOP;

        RAISE NOTICE 'Created % orders for %', counter - 1, user_rec.username;
    END LOOP;
END $$;

-- =====================================================
-- 5. UPDATE SELLER STATISTICS
-- =====================================================

UPDATE users u
SET total_sales = COALESCE(
    (SELECT SUM(o.total) FROM orders o WHERE o.seller_id = u.id AND o.payment_status = 'completed'),
    0
)
WHERE u.is_seller = true;

-- =====================================================
-- 6. SUMMARY REPORT
-- =====================================================

SELECT '=== WATCHLIST SUMMARY ===' as report;
SELECT u.username, COUNT(w.id) as watchlist_count
FROM users u
LEFT JOIN watchlist w ON u.id = w.user_id
GROUP BY u.username
ORDER BY watchlist_count DESC;

SELECT '=== ORDERS (PURCHASES) SUMMARY ===' as report;
SELECT u.username, COUNT(o.id) as orders_count, COALESCE(SUM(o.total)::numeric(10,2), 0) as total_spent
FROM users u
LEFT JOIN orders o ON u.id = o.buyer_id
GROUP BY u.username
ORDER BY orders_count DESC;

SELECT '=== SALES SUMMARY ===' as report;
SELECT u.username, COUNT(o.id) as sales_count, COALESCE(SUM(o.total)::numeric(10,2), 0) as total_revenue
FROM users u
LEFT JOIN orders o ON u.id = o.seller_id
WHERE u.is_seller = true
GROUP BY u.username
ORDER BY sales_count DESC;

SELECT '=== TOTALS ===' as report;
SELECT
    (SELECT COUNT(*) FROM watchlist) as total_watchlist_items,
    (SELECT COUNT(*) FROM orders) as total_orders,
    (SELECT COALESCE(SUM(total)::numeric(10,2), 0) FROM orders WHERE payment_status = 'completed') as total_sales_value;
