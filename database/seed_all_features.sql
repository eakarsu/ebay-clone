-- =====================================================
-- EBAY CLONE: SEED DATA FOR ALL 20 NEW FEATURES
-- =====================================================

-- Get user and product IDs for seeding
DO $$
DECLARE
    v_user_ids UUID[];
    v_product_ids UUID[];
    v_order_ids UUID[];
    v_user_id UUID;
    v_product_id UUID;
    v_order_id UUID;
    v_seller_id UUID;
    v_counter INTEGER;
BEGIN
    -- Get all user IDs
    SELECT ARRAY_AGG(id) INTO v_user_ids FROM users;

    -- Get all product IDs
    SELECT ARRAY_AGG(id) INTO v_product_ids FROM products;

    -- Get all order IDs
    SELECT ARRAY_AGG(id) INTO v_order_ids FROM orders;

    RAISE NOTICE 'Found % users, % products, % orders',
        array_length(v_user_ids, 1),
        array_length(v_product_ids, 1),
        array_length(v_order_ids, 1);
END $$;

-- =====================================================
-- 1. MAKE AN OFFER / BEST OFFER - Enable for products
-- =====================================================
-- Enable offers on ~40% of products
UPDATE products
SET accepts_offers = true,
    minimum_offer_percentage = 70 + floor(random() * 20)::int,
    auto_accept_price = buy_now_price * 0.95,
    auto_decline_price = buy_now_price * 0.60
WHERE random() < 0.4 AND buy_now_price IS NOT NULL;

-- Create sample offers
INSERT INTO offers (product_id, buyer_id, seller_id, offer_amount, quantity, message, status, counter_amount, counter_message, expires_at)
SELECT
    p.id,
    (SELECT id FROM users WHERE id != p.seller_id ORDER BY random() LIMIT 1),
    p.seller_id,
    p.buy_now_price * (0.70 + random() * 0.25),
    1,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'Would you consider this offer? I can pay immediately.'
        WHEN 1 THEN 'This is my best offer. Please let me know!'
        WHEN 2 THEN 'Hoping we can make a deal. Thanks for considering.'
        WHEN 3 THEN 'I''ve been watching this item. Ready to buy today.'
        ELSE 'Interested in purchasing. Is this price acceptable?'
    END,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'accepted'
        WHEN 2 THEN 'declined'
        WHEN 3 THEN 'countered'
        ELSE 'expired'
    END,
    CASE WHEN random() < 0.3 THEN p.buy_now_price * 0.90 ELSE NULL END,
    CASE WHEN random() < 0.3 THEN 'I can do this price. Let me know if interested.' ELSE NULL END,
    NOW() + (random() * 96)::int * INTERVAL '1 hour'
FROM products p
WHERE p.accepts_offers = true AND p.buy_now_price IS NOT NULL
LIMIT 200;

-- =====================================================
-- 2. PRODUCT Q&A - Questions and Answers
-- =====================================================
-- Create questions for products
INSERT INTO product_questions (product_id, asker_id, question, status, helpful_count)
SELECT
    p.id,
    (SELECT id FROM users WHERE id != p.seller_id ORDER BY random() LIMIT 1),
    CASE floor(random() * 15)::int
        WHEN 0 THEN 'What is the exact condition of this item?'
        WHEN 1 THEN 'Is this the original packaging?'
        WHEN 2 THEN 'Does this come with a warranty?'
        WHEN 3 THEN 'Can you ship this internationally?'
        WHEN 4 THEN 'What are the exact dimensions?'
        WHEN 5 THEN 'Is this item authentic/genuine?'
        WHEN 6 THEN 'How long have you had this item?'
        WHEN 7 THEN 'Are there any defects I should know about?'
        WHEN 8 THEN 'Can you provide more photos?'
        WHEN 9 THEN 'What is your return policy?'
        WHEN 10 THEN 'Is the price negotiable?'
        WHEN 11 THEN 'When was this manufactured?'
        WHEN 12 THEN 'Does this work with [specific model]?'
        WHEN 13 THEN 'How soon can you ship after purchase?'
        ELSE 'Is this still available?'
    END,
    CASE WHEN random() < 0.7 THEN 'answered' ELSE 'pending' END,
    floor(random() * 20)::int
FROM products p
CROSS JOIN generate_series(1, 3)
WHERE random() < 0.6
LIMIT 500;

-- Create answers for questions
INSERT INTO product_answers (question_id, answerer_id, answer, is_seller_answer, helpful_count)
SELECT
    q.id,
    CASE WHEN random() < 0.8
        THEN (SELECT seller_id FROM products WHERE id = q.product_id)
        ELSE (SELECT id FROM users ORDER BY random() LIMIT 1)
    END,
    CASE floor(random() * 10)::int
        WHEN 0 THEN 'Yes, this item is in excellent condition as described. Please see the photos.'
        WHEN 1 THEN 'This is the original packaging, unopened and sealed.'
        WHEN 2 THEN 'The item comes with manufacturer warranty. I can provide documentation.'
        WHEN 3 THEN 'Yes, I ship internationally. Please message me for shipping quote.'
        WHEN 4 THEN 'Please check the item specifications section for exact dimensions.'
        WHEN 5 THEN 'This is 100% authentic. I purchased it directly from authorized dealer.'
        WHEN 6 THEN 'I can ship within 1-2 business days of payment.'
        WHEN 7 THEN 'No defects - item is in perfect working condition.'
        WHEN 8 THEN 'I can send additional photos. Please message me your email.'
        ELSE 'Feel free to message me with any other questions!'
    END,
    CASE WHEN random() < 0.8 THEN true ELSE false END,
    floor(random() * 15)::int
FROM product_questions q
WHERE q.status = 'answered'
LIMIT 400;

-- =====================================================
-- 3. RECENTLY VIEWED ITEMS
-- =====================================================
INSERT INTO recently_viewed (user_id, product_id, view_count, first_viewed_at, last_viewed_at)
SELECT
    u.id,
    p.id,
    floor(1 + random() * 10)::int,
    NOW() - (random() * 30)::int * INTERVAL '1 day',
    NOW() - (random() * 7)::int * INTERVAL '1 day'
FROM users u
CROSS JOIN products p
WHERE random() < 0.15
ON CONFLICT (user_id, product_id) DO NOTHING;

-- =====================================================
-- 4. SIMILAR ITEMS / RECOMMENDATIONS
-- =====================================================
-- Product to product recommendations (same category)
INSERT INTO product_recommendations (product_id, recommended_product_id, recommendation_type, score)
SELECT DISTINCT ON (p1.id, p2.id)
    p1.id,
    p2.id,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'similar'
        WHEN 1 THEN 'frequently_bought_together'
        WHEN 2 THEN 'customers_also_viewed'
        ELSE 'sponsored'
    END,
    0.5 + random() * 0.5
FROM products p1
JOIN products p2 ON p1.category_id = p2.category_id AND p1.id != p2.id
WHERE random() < 0.3
LIMIT 1000
ON CONFLICT DO NOTHING;

-- User personalized recommendations
INSERT INTO user_recommendations (user_id, product_id, recommendation_reason, score)
SELECT
    u.id,
    p.id,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'based_on_browsing'
        WHEN 1 THEN 'based_on_purchases'
        WHEN 2 THEN 'based_on_watchlist'
        WHEN 3 THEN 'trending_in_category'
        ELSE 'popular_item'
    END,
    0.5 + random() * 0.5
FROM users u
CROSS JOIN products p
WHERE random() < 0.1
LIMIT 500
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. PRICE DROP ALERTS
-- =====================================================
INSERT INTO price_alerts (user_id, product_id, target_price, alert_on_any_drop, percentage_drop, is_active)
SELECT
    u.id,
    p.id,
    CASE WHEN random() < 0.5 THEN p.buy_now_price * (0.7 + random() * 0.2) ELSE NULL END,
    CASE WHEN random() < 0.5 THEN true ELSE false END,
    CASE WHEN random() < 0.3 THEN floor(10 + random() * 30)::int ELSE NULL END,
    true
FROM users u
CROSS JOIN products p
WHERE random() < 0.08 AND p.buy_now_price IS NOT NULL
ON CONFLICT DO NOTHING;

-- Price history for products
INSERT INTO price_history (product_id, price, price_type, recorded_at)
SELECT
    p.id,
    p.buy_now_price * (0.9 + random() * 0.2),
    'buy_now',
    NOW() - (days.d * INTERVAL '1 day')
FROM products p
CROSS JOIN generate_series(1, 30) AS days(d)
WHERE p.buy_now_price IS NOT NULL AND random() < 0.3;

-- =====================================================
-- 6. ITEM COLLECTIONS / LISTS
-- =====================================================
-- Create collections for users
INSERT INTO collections (user_id, name, description, is_public, item_count)
SELECT
    u.id,
    collection_name,
    collection_desc,
    random() < 0.7,
    0
FROM users u
CROSS JOIN (VALUES
    ('Wish List', 'Items I want to buy'),
    ('Birthday Ideas', 'Gift ideas for birthdays'),
    ('Home Decor', 'Items for home decoration'),
    ('Tech Gadgets', 'Cool technology items'),
    ('Fashion Picks', 'Clothing and accessories'),
    ('Collectibles', 'Rare and collectible items'),
    ('Gift Ideas', 'Potential gifts for others'),
    ('Watch Later', 'Items to consider later')
) AS c(collection_name, collection_desc)
WHERE random() < 0.4;

-- Add items to collections
INSERT INTO collection_items (collection_id, product_id, notes)
SELECT
    c.id,
    p.id,
    CASE WHEN random() < 0.3 THEN 'Love this item!' ELSE NULL END
FROM collections c
CROSS JOIN products p
WHERE random() < 0.1
LIMIT 1000;

-- Update collection item counts
UPDATE collections SET item_count = (
    SELECT COUNT(*) FROM collection_items WHERE collection_id = collections.id
);

-- Collection followers
INSERT INTO collection_followers (collection_id, user_id)
SELECT c.id, u.id
FROM collections c
CROSS JOIN users u
WHERE c.is_public = true AND c.user_id != u.id AND random() < 0.1
ON CONFLICT DO NOTHING;

-- Update follower counts
UPDATE collections SET follower_count = (
    SELECT COUNT(*) FROM collection_followers WHERE collection_id = collections.id
);

-- =====================================================
-- 7. SOCIAL SHARING TRACKING
-- =====================================================
INSERT INTO social_shares (product_id, user_id, platform, click_count)
SELECT
    p.id,
    CASE WHEN random() < 0.5 THEN (SELECT id FROM users ORDER BY random() LIMIT 1) ELSE NULL END,
    CASE floor(random() * 7)::int
        WHEN 0 THEN 'facebook'
        WHEN 1 THEN 'twitter'
        WHEN 2 THEN 'pinterest'
        WHEN 3 THEN 'linkedin'
        WHEN 4 THEN 'whatsapp'
        WHEN 5 THEN 'email'
        ELSE 'copy_link'
    END,
    floor(random() * 50)::int
FROM products p
CROSS JOIN generate_series(1, 3)
WHERE random() < 0.3;

-- Update product share counts
UPDATE products SET share_count = (
    SELECT COUNT(*) FROM social_shares WHERE product_id = products.id
);

-- =====================================================
-- 8. BULK LISTING TEMPLATES
-- =====================================================
INSERT INTO listing_templates (user_id, name, category_id, template_data, is_default, usage_count)
SELECT
    u.id,
    template_name,
    (SELECT id FROM categories ORDER BY random() LIMIT 1),
    jsonb_build_object(
        'condition', 'new',
        'shipping_type', 'standard',
        'return_policy', '30_days',
        'listing_duration', 7,
        'auto_relist', true
    ),
    false,
    floor(random() * 20)::int
FROM users u
CROSS JOIN (VALUES
    ('Electronics Standard'),
    ('Clothing Template'),
    ('Collectibles Default'),
    ('Quick Listing'),
    ('Premium Listing')
) AS t(template_name)
WHERE random() < 0.3;

-- =====================================================
-- 9. SCHEDULED LISTINGS - Update some products
-- =====================================================
UPDATE products
SET is_scheduled = true,
    scheduled_start = NOW() + (floor(random() * 14) + 1)::int * INTERVAL '1 day',
    scheduled_end = NOW() + (floor(random() * 14) + 15)::int * INTERVAL '1 day'
WHERE status = 'draft' OR random() < 0.05;

-- Log scheduled listings
INSERT INTO scheduled_listing_log (product_id, action, scheduled_for)
SELECT id, 'scheduled', scheduled_start
FROM products
WHERE is_scheduled = true;

-- =====================================================
-- 10. SELLER STORE PAGES
-- =====================================================
INSERT INTO seller_stores (user_id, store_name, store_slug, tagline, description, theme_color, is_verified, subscriber_count)
SELECT
    u.id,
    u.username || '''s Store',
    lower(replace(u.username, ' ', '-')) || '-store',
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'Quality items at great prices!'
        WHEN 1 THEN 'Your trusted seller since 2020'
        WHEN 2 THEN 'Fast shipping, great service'
        WHEN 3 THEN 'Rare finds and collectibles'
        ELSE 'Premium products, premium service'
    END,
    'Welcome to my store! I specialize in quality products with fast shipping and excellent customer service. Check out my listings and feel free to ask any questions.',
    CASE floor(random() * 5)::int
        WHEN 0 THEN '#3665f3'
        WHEN 1 THEN '#e53935'
        WHEN 2 THEN '#43a047'
        WHEN 3 THEN '#fb8c00'
        ELSE '#8e24aa'
    END,
    random() < 0.3,
    floor(random() * 500)::int
FROM users u
WHERE EXISTS (SELECT 1 FROM products WHERE seller_id = u.id)
ON CONFLICT (user_id) DO NOTHING;

-- Store categories
INSERT INTO store_categories (store_id, name, description, display_order)
SELECT
    s.id,
    cat_name,
    'Browse our ' || lower(cat_name) || ' collection',
    row_number() OVER (PARTITION BY s.id)
FROM seller_stores s
CROSS JOIN (VALUES
    ('Featured Items'),
    ('New Arrivals'),
    ('Sale Items'),
    ('Best Sellers'),
    ('Clearance')
) AS c(cat_name);

-- Store subscribers
INSERT INTO store_subscribers (store_id, user_id)
SELECT s.id, u.id
FROM seller_stores s
CROSS JOIN users u
WHERE s.user_id != u.id AND random() < 0.15
ON CONFLICT DO NOTHING;

-- Update subscriber counts
UPDATE seller_stores SET subscriber_count = (
    SELECT COUNT(*) FROM store_subscribers WHERE store_id = seller_stores.id
);

-- =====================================================
-- 11. NOTIFICATION PREFERENCES
-- =====================================================
INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, sms_notifications,
    bid_outbid, bid_won, auction_ending, item_sold, order_updates, messages, price_drops, promotions, newsletter)
SELECT
    u.id,
    true,
    random() < 0.8,
    random() < 0.2,
    true,
    true,
    true,
    true,
    true,
    true,
    random() < 0.7,
    random() < 0.3,
    random() < 0.2
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 12. INVOICES - Create for orders
-- =====================================================
INSERT INTO invoices (order_id, invoice_number, buyer_id, seller_id, subtotal, tax_amount, shipping_amount, total_amount, status, due_date)
SELECT
    o.id,
    'INV-' || to_char(NOW(), 'YYYYMMDD') || '-' || lpad(row_number() OVER ()::text, 6, '0'),
    o.user_id,
    o.seller_id,
    o.subtotal,
    o.tax,
    o.shipping_cost,
    o.total,
    CASE o.payment_status
        WHEN 'completed' THEN 'paid'
        WHEN 'pending' THEN 'issued'
        ELSE 'issued'
    END,
    (o.created_at + INTERVAL '30 days')::date
FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE order_id = o.id);

-- =====================================================
-- 13. LOCAL PICKUP - Enable for some products
-- =====================================================
UPDATE products
SET allows_local_pickup = true,
    pickup_location_city = CASE floor(random() * 10)::int
        WHEN 0 THEN 'New York'
        WHEN 1 THEN 'Los Angeles'
        WHEN 2 THEN 'Chicago'
        WHEN 3 THEN 'Houston'
        WHEN 4 THEN 'Phoenix'
        WHEN 5 THEN 'Philadelphia'
        WHEN 6 THEN 'San Antonio'
        WHEN 7 THEN 'San Diego'
        WHEN 8 THEN 'Dallas'
        ELSE 'San Jose'
    END,
    pickup_location_state = CASE floor(random() * 10)::int
        WHEN 0 THEN 'NY'
        WHEN 1 THEN 'CA'
        WHEN 2 THEN 'IL'
        WHEN 3 THEN 'TX'
        WHEN 4 THEN 'AZ'
        WHEN 5 THEN 'PA'
        WHEN 6 THEN 'TX'
        WHEN 7 THEN 'CA'
        WHEN 8 THEN 'TX'
        ELSE 'CA'
    END,
    pickup_instructions = 'Please message seller to arrange pickup time. Meet at public location.'
WHERE random() < 0.2;

-- =====================================================
-- 14. MULTI-CURRENCY SUPPORT
-- =====================================================
INSERT INTO currencies (code, name, symbol, exchange_rate_to_usd, is_active) VALUES
    ('USD', 'US Dollar', '$', 1.000000, true),
    ('EUR', 'Euro', '€', 0.920000, true),
    ('GBP', 'British Pound', '£', 0.790000, true),
    ('CAD', 'Canadian Dollar', 'C$', 1.360000, true),
    ('AUD', 'Australian Dollar', 'A$', 1.530000, true),
    ('JPY', 'Japanese Yen', '¥', 149.500000, true),
    ('CNY', 'Chinese Yuan', '¥', 7.240000, true),
    ('INR', 'Indian Rupee', '₹', 83.200000, true),
    ('MXN', 'Mexican Peso', '$', 17.150000, true),
    ('BRL', 'Brazilian Real', 'R$', 4.970000, true)
ON CONFLICT (code) DO UPDATE SET exchange_rate_to_usd = EXCLUDED.exchange_rate_to_usd;

-- User currency preferences
INSERT INTO user_currency_preferences (user_id, preferred_currency, display_converted_prices)
SELECT u.id,
    CASE floor(random() * 10)::int
        WHEN 0 THEN 'EUR'
        WHEN 1 THEN 'GBP'
        WHEN 2 THEN 'CAD'
        ELSE 'USD'
    END,
    true
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 15. INTERNATIONAL SHIPPING RATES
-- =====================================================
INSERT INTO shipping_zones (name, countries, is_active) VALUES
    ('North America', ARRAY['US', 'CA', 'MX'], true),
    ('Europe', ARRAY['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH'], true),
    ('Asia Pacific', ARRAY['JP', 'CN', 'KR', 'AU', 'NZ', 'SG', 'HK'], true),
    ('South America', ARRAY['BR', 'AR', 'CL', 'CO', 'PE'], true),
    ('Rest of World', ARRAY['*'], true)
ON CONFLICT DO NOTHING;

-- International shipping rates
INSERT INTO international_shipping_rates (zone_id, service_name, base_rate, per_pound_rate, estimated_days_min, estimated_days_max)
SELECT
    z.id,
    service_name,
    base_rate,
    per_pound,
    days_min,
    days_max
FROM shipping_zones z
CROSS JOIN (VALUES
    ('Economy International', 15.99, 2.50, 14, 21),
    ('Standard International', 24.99, 3.50, 7, 14),
    ('Express International', 49.99, 5.00, 3, 7),
    ('Priority International', 79.99, 7.50, 1, 3)
) AS rates(service_name, base_rate, per_pound, days_min, days_max);

-- Enable international shipping on some products
UPDATE products
SET ships_internationally = true,
    international_shipping_cost = shipping_cost * (1.5 + random())
WHERE random() < 0.4;

-- =====================================================
-- 16. REWARDS / EBAY BUCKS PROGRAM
-- =====================================================
-- Rewards tiers
INSERT INTO rewards_tiers (tier, min_points, earn_rate, bonus_multiplier, perks) VALUES
    ('bronze', 0, 0.01, 1.0, '{"free_shipping_threshold": 50, "early_access": false}'::jsonb),
    ('silver', 1000, 0.015, 1.25, '{"free_shipping_threshold": 35, "early_access": false}'::jsonb),
    ('gold', 5000, 0.02, 1.5, '{"free_shipping_threshold": 25, "early_access": true}'::jsonb),
    ('platinum', 20000, 0.03, 2.0, '{"free_shipping_threshold": 0, "early_access": true}'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- Enroll users in rewards program
INSERT INTO rewards_program (user_id, tier, total_points, available_points, lifetime_points)
SELECT
    u.id,
    CASE
        WHEN random() < 0.1 THEN 'platinum'
        WHEN random() < 0.3 THEN 'gold'
        WHEN random() < 0.6 THEN 'silver'
        ELSE 'bronze'
    END,
    floor(random() * 10000)::int,
    floor(random() * 5000)::int,
    floor(random() * 25000)::int
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- Rewards transactions
INSERT INTO rewards_transactions (user_id, order_id, transaction_type, points, description, expires_at)
SELECT
    rp.user_id,
    (SELECT id FROM orders WHERE user_id = rp.user_id ORDER BY random() LIMIT 1),
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'earned'
        WHEN 1 THEN 'redeemed'
        ELSE 'bonus'
    END,
    CASE floor(random() * 3)::int
        WHEN 0 THEN floor(random() * 500)::int
        WHEN 1 THEN -floor(random() * 200)::int
        ELSE floor(random() * 100)::int
    END,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'Points earned from purchase'
        WHEN 1 THEN 'Points redeemed for discount'
        WHEN 2 THEN 'Welcome bonus'
        ELSE 'Promotional bonus'
    END,
    (NOW() + INTERVAL '1 year')::date
FROM rewards_program rp
CROSS JOIN generate_series(1, 5);

-- =====================================================
-- 17. PAYMENT PLANS - For high-value orders
-- =====================================================
INSERT INTO payment_plans (order_id, user_id, plan_type, total_amount, installment_amount, installments_total, installments_paid, next_payment_date, status, provider)
SELECT
    o.id,
    o.user_id,
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'pay_in_4'
        WHEN 1 THEN 'pay_monthly'
        ELSE 'pay_in_6'
    END,
    o.total,
    o.total / 4,
    4,
    floor(random() * 4)::int,
    (NOW() + INTERVAL '14 days')::date,
    'active',
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'Klarna'
        WHEN 1 THEN 'Affirm'
        ELSE 'PayPal Credit'
    END
FROM orders o
WHERE o.total > 100 AND random() < 0.2
LIMIT 50;

-- Payment plan installments
INSERT INTO payment_plan_installments (plan_id, installment_number, amount, due_date, status)
SELECT
    pp.id,
    n,
    pp.installment_amount,
    (pp.created_at + (n * 14) * INTERVAL '1 day')::date,
    CASE
        WHEN n <= pp.installments_paid THEN 'paid'
        ELSE 'pending'
    END
FROM payment_plans pp
CROSS JOIN generate_series(1, 4) AS n;

-- =====================================================
-- 18. LIVE CHAT SUPPORT
-- =====================================================
-- Create support agents from admin users
INSERT INTO support_agents (user_id, display_name, department, is_available, max_concurrent_chats, average_rating)
SELECT
    u.id,
    'Agent ' || u.first_name,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'order'
        WHEN 1 THEN 'payment'
        WHEN 2 THEN 'shipping'
        ELSE 'technical'
    END,
    true,
    5,
    4.0 + random()
FROM users u
WHERE u.is_admin = true OR random() < 0.1
LIMIT 10
ON CONFLICT (user_id) DO NOTHING;

-- Support chats
INSERT INTO support_chats (user_id, agent_id, subject, category, status, priority, rating, feedback)
SELECT
    u.id,
    (SELECT user_id FROM support_agents ORDER BY random() LIMIT 1),
    CASE floor(random() * 6)::int
        WHEN 0 THEN 'Order not received'
        WHEN 1 THEN 'Payment issue'
        WHEN 2 THEN 'Return request help'
        WHEN 3 THEN 'Shipping question'
        WHEN 4 THEN 'Account problem'
        ELSE 'General inquiry'
    END,
    CASE floor(random() * 7)::int
        WHEN 0 THEN 'order'
        WHEN 1 THEN 'payment'
        WHEN 2 THEN 'shipping'
        WHEN 3 THEN 'return'
        WHEN 4 THEN 'account'
        WHEN 5 THEN 'technical'
        ELSE 'other'
    END,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'waiting'
        WHEN 1 THEN 'active'
        WHEN 2 THEN 'resolved'
        ELSE 'closed'
    END,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'normal'
        WHEN 2 THEN 'high'
        ELSE 'urgent'
    END,
    CASE WHEN random() < 0.5 THEN floor(3 + random() * 3)::int ELSE NULL END,
    CASE WHEN random() < 0.3 THEN 'Great help, very responsive!' ELSE NULL END
FROM users u
WHERE random() < 0.2
LIMIT 100;

-- Chat messages
INSERT INTO support_chat_messages (chat_id, sender_id, message, message_type, is_read)
SELECT
    c.id,
    CASE WHEN random() < 0.5 THEN c.user_id ELSE c.agent_id END,
    CASE floor(random() * 8)::int
        WHEN 0 THEN 'Hello, how can I help you today?'
        WHEN 1 THEN 'I need help with my order.'
        WHEN 2 THEN 'Can you provide your order number?'
        WHEN 3 THEN 'My order number is EB-12345678.'
        WHEN 4 THEN 'Let me look into that for you.'
        WHEN 5 THEN 'I found your order. How can I assist?'
        WHEN 6 THEN 'Thank you for your help!'
        ELSE 'Is there anything else I can help with?'
    END,
    'text',
    true
FROM support_chats c
CROSS JOIN generate_series(1, 5);

-- =====================================================
-- 19. BID RETRACTION - Sample retractions
-- =====================================================
INSERT INTO bid_retractions (bid_id, user_id, product_id, original_amount, reason, explanation, status)
SELECT
    b.id,
    b.bidder_id,
    b.product_id,
    b.amount,
    CASE floor(random() * 4)::int
        WHEN 0 THEN 'entered_wrong_amount'
        WHEN 1 THEN 'seller_changed_description'
        WHEN 2 THEN 'cannot_contact_seller'
        ELSE 'other'
    END,
    'I made an error and need to retract this bid.',
    CASE floor(random() * 3)::int
        WHEN 0 THEN 'approved'
        WHEN 1 THEN 'denied'
        ELSE 'pending'
    END
FROM bids b
WHERE random() < 0.02
LIMIT 20;

-- =====================================================
-- 20. RESERVE PRICE - Update products with reserve
-- =====================================================
UPDATE products
SET reserve_price = starting_price * (1.5 + random()),
    reserve_price_hidden = true,
    show_reserve_not_met = true,
    reserve_met = CASE
        WHEN current_price IS NOT NULL AND current_price >= reserve_price THEN true
        ELSE false
    END
WHERE listing_type IN ('auction', 'both') AND random() < 0.3;

-- Log reserve price history
INSERT INTO reserve_price_history (product_id, previous_reserve, new_reserve, reason)
SELECT
    id,
    NULL,
    reserve_price,
    'Initial reserve price set'
FROM products
WHERE reserve_price IS NOT NULL;

-- =====================================================
-- SUMMARY REPORT
-- =====================================================
DO $$
DECLARE
    v_offers INTEGER;
    v_questions INTEGER;
    v_answers INTEGER;
    v_recently_viewed INTEGER;
    v_recommendations INTEGER;
    v_price_alerts INTEGER;
    v_collections INTEGER;
    v_collection_items INTEGER;
    v_social_shares INTEGER;
    v_templates INTEGER;
    v_stores INTEGER;
    v_invoices INTEGER;
    v_currencies INTEGER;
    v_shipping_zones INTEGER;
    v_rewards_users INTEGER;
    v_payment_plans INTEGER;
    v_support_chats INTEGER;
    v_bid_retractions INTEGER;
    v_reserve_products INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_offers FROM offers;
    SELECT COUNT(*) INTO v_questions FROM product_questions;
    SELECT COUNT(*) INTO v_answers FROM product_answers;
    SELECT COUNT(*) INTO v_recently_viewed FROM recently_viewed;
    SELECT COUNT(*) INTO v_recommendations FROM product_recommendations;
    SELECT COUNT(*) INTO v_price_alerts FROM price_alerts;
    SELECT COUNT(*) INTO v_collections FROM collections;
    SELECT COUNT(*) INTO v_collection_items FROM collection_items;
    SELECT COUNT(*) INTO v_social_shares FROM social_shares;
    SELECT COUNT(*) INTO v_templates FROM listing_templates;
    SELECT COUNT(*) INTO v_stores FROM seller_stores;
    SELECT COUNT(*) INTO v_invoices FROM invoices;
    SELECT COUNT(*) INTO v_currencies FROM currencies;
    SELECT COUNT(*) INTO v_shipping_zones FROM shipping_zones;
    SELECT COUNT(*) INTO v_rewards_users FROM rewards_program;
    SELECT COUNT(*) INTO v_payment_plans FROM payment_plans;
    SELECT COUNT(*) INTO v_support_chats FROM support_chats;
    SELECT COUNT(*) INTO v_bid_retractions FROM bid_retractions;
    SELECT COUNT(*) INTO v_reserve_products FROM products WHERE reserve_price IS NOT NULL;

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'ALL 20 FEATURES SEED DATA COMPLETED!';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE '1. Make an Offer: % offers created', v_offers;
    RAISE NOTICE '2. Product Q&A: % questions, % answers', v_questions, v_answers;
    RAISE NOTICE '3. Recently Viewed: % records', v_recently_viewed;
    RAISE NOTICE '4. Recommendations: % product recommendations', v_recommendations;
    RAISE NOTICE '5. Price Alerts: % alerts set', v_price_alerts;
    RAISE NOTICE '6. Collections: % collections, % items', v_collections, v_collection_items;
    RAISE NOTICE '7. Social Shares: % shares tracked', v_social_shares;
    RAISE NOTICE '8. Listing Templates: % templates', v_templates;
    RAISE NOTICE '9. Scheduled Listings: Check products table';
    RAISE NOTICE '10. Seller Stores: % stores created', v_stores;
    RAISE NOTICE '11. Notification Prefs: Check notification_preferences table';
    RAISE NOTICE '12. Invoices: % invoices generated', v_invoices;
    RAISE NOTICE '13. Local Pickup: Check products table';
    RAISE NOTICE '14. Multi-Currency: % currencies', v_currencies;
    RAISE NOTICE '15. Intl Shipping: % zones', v_shipping_zones;
    RAISE NOTICE '16. Rewards: % users enrolled', v_rewards_users;
    RAISE NOTICE '17. Payment Plans: % plans created', v_payment_plans;
    RAISE NOTICE '18. Live Chat: % support chats', v_support_chats;
    RAISE NOTICE '19. Bid Retractions: % retractions', v_bid_retractions;
    RAISE NOTICE '20. Reserve Price: % products with reserve', v_reserve_products;
    RAISE NOTICE '=====================================================';
END $$;
