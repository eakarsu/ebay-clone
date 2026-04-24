-- =====================================================================
-- seed_fill_features.sql
-- Idempotently fills every feature table to at least 15 rows.
-- Runs AFTER seed_complete.sql & seed_security_features.sql.
-- =====================================================================

\set ON_ERROR_ROLLBACK on
BEGIN;

-- ===== subcategories =====
INSERT INTO subcategories (category_id, name, slug, description, sort_order)
SELECT
  (SELECT id FROM categories ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM categories),1))::int LIMIT 1),
  'Subcategory ' || g,
  'subcat-' || g || '-' || substr(md5(random()::text || g::text),1,6),
  'Auto-generated subcategory #' || g,
  g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM categories)
  AND NOT EXISTS (SELECT 1 FROM subcategories s WHERE s.slug = ('subcat-' || g || '-placeholder'));

-- ===== categories_follows -> category_follows =====
INSERT INTO category_follows (user_id, category_id)
SELECT u.id, c.id
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM users) u
JOIN (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM categories) c
  ON c.rn = ((u.rn - 1) % GREATEST((SELECT COUNT(*) FROM categories),1)) + 1
WHERE u.rn <= 20
ON CONFLICT DO NOTHING;

-- ===== api_keys =====
INSERT INTO api_keys (user_id, name, key_hash, key_prefix, scopes, rate_limit_per_min)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'API Key ' || g,
  md5('apikey' || g || random()::text),
  'ek_' || substr(md5(g::text),1,8),
  ARRAY['public:read','public:write'],
  120
FROM generate_series(1,20) g
WHERE NOT EXISTS (SELECT 1 FROM api_keys WHERE name = 'API Key ' || g);

-- ===== api_key_usage =====
INSERT INTO api_key_usage (key_id, endpoint, bucket_start, request_count)
SELECT
  (SELECT id FROM api_keys ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM api_keys),1))::int LIMIT 1),
  '/api/endpoint/' || g,
  NOW() - (g * INTERVAL '1 hour'),
  10 + g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM api_keys)
ON CONFLICT DO NOTHING;

-- ===== ai_message_suggestions =====
INSERT INTO ai_message_suggestions (user_id, original_message, suggested_reply, context, used, feedback)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Is this still available? #' || g,
  'Yes, this item is still available and ready to ship.',
  jsonb_build_object('intent','availability','confidence',0.9),
  (g % 2 = 0),
  (ARRAY['helpful','not_helpful','edited'])[(g % 3) + 1]
FROM generate_series(1,20) g
WHERE NOT EXISTS (SELECT 1 FROM ai_message_suggestions WHERE original_message = 'Is this still available? #' || g);

-- ===== auction_events =====
INSERT INTO auction_events (product_id, event_type, event_data)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (ARRAY['bid_placed','auction_started','auction_ending_soon','reserve_met','auction_ended'])[(g % 5)+1],
  jsonb_build_object('amount', 10 + g * 5, 'seq', g)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products)
  AND NOT EXISTS (SELECT 1 FROM auction_events WHERE (event_data->>'seq')::int = g);

-- ===== authenticity_requests =====
INSERT INTO authenticity_requests (product_id, seller_id, buyer_id, item_category, brand, model, declared_value, auth_center_location, status, certificate_number)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET ((g+1) % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (ARRAY['handbag','watch','sneakers','jewelry','trading_card'])[(g % 5)+1],
  (ARRAY['Louis Vuitton','Rolex','Nike','Cartier','Pokemon'])[(g % 5)+1],
  'Model-' || g,
  200 + g * 50,
  'New Jersey, USA',
  'pending',
  'CERT-' || LPAD(g::text,6,'0') || '-' || substr(md5(g::text),1,6)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM authenticity_requests WHERE certificate_number LIKE 'CERT-' || LPAD(g::text,6,'0') || '%');

-- ===== automatic_feedback_log =====
INSERT INTO automatic_feedback_log (from_user_id, to_user_id, feedback_type, feedback_text, success)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET ((g+1) % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (ARRAY['positive','neutral','negative'])[(g % 3)+1],
  'Auto feedback batch ' || g,
  true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM automatic_feedback_log WHERE feedback_text = 'Auto feedback batch ' || g);

-- ===== automatic_feedback_settings (unique on user_id) =====
INSERT INTO automatic_feedback_settings (user_id, enabled, delay_days, feedback_template)
SELECT u.id, true, 3, 'Great buyer! Fast payment. Thank you!'
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== bid_velocity_log =====
INSERT INTO bid_velocity_log (user_id, product_id, ip, created_at)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  ('10.0.0.' || g)::inet,
  NOW() - (g * INTERVAL '1 minute')
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM products);

-- ===== bulk_uploads =====
INSERT INTO bulk_uploads (user_id, filename, status, total_rows, processed_rows, successful_rows, failed_rows)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'upload_batch_' || g || '.csv',
  (ARRAY['pending','processing','completed','failed'])[(g % 4)+1],
  100, 100-g, 95-g, 5
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM bulk_uploads WHERE filename = 'upload_batch_' || g || '.csv');

-- ===== bundle_discounts =====
INSERT INTO bundle_discounts (seller_id, name, min_items, discount_percent, is_active)
SELECT
  (SELECT id FROM users WHERE is_seller = true ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM users WHERE is_seller=true),1))::int LIMIT 1),
  'Bundle Deal #' || g,
  2 + (g % 4),
  5 + (g % 20),
  true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users WHERE is_seller = true)
  AND NOT EXISTS (SELECT 1 FROM bundle_discounts WHERE name = 'Bundle Deal #' || g);

-- ===== cart_reservations =====
WITH upairs AS (
  SELECT u.id AS user_id, p.id AS product_id,
         row_number() OVER () AS rn
  FROM (SELECT id FROM users ORDER BY created_at LIMIT 20) u
  CROSS JOIN LATERAL (SELECT id FROM products ORDER BY created_at OFFSET (random() * 50)::int LIMIT 1) p
)
INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
SELECT user_id, product_id, 1, NOW() + INTERVAL '15 minutes'
FROM upairs
ON CONFLICT (user_id, product_id) DO NOTHING;

-- ===== collection_followers =====
DO $$
DECLARE cid uuid;
BEGIN
  FOR cid IN SELECT id FROM collections LIMIT 5 LOOP
    INSERT INTO collection_followers (collection_id, user_id)
    SELECT cid, u.id FROM users u LIMIT 10
    ON CONFLICT (collection_id, user_id) DO NOTHING;
  END LOOP;
END $$;

-- ===== collection_items =====
DO $$
DECLARE cid uuid;
BEGIN
  FOR cid IN SELECT id FROM collections LIMIT 5 LOOP
    INSERT INTO collection_items (collection_id, product_id, notes)
    SELECT cid, p.id, 'Curated pick'
    FROM products p LIMIT 5
    ON CONFLICT (collection_id, product_id) DO NOTHING;
  END LOOP;
END $$;

-- ===== daily_deals =====
INSERT INTO daily_deals (product_id, discount_percentage, deal_price, original_price, start_time, end_time, quantity_available, is_active)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  10 + (g % 40),
  100 - (g % 40),
  100,
  NOW() - INTERVAL '1 hour',
  NOW() + (g * INTERVAL '1 day'),
  50, true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products)
  AND (SELECT COUNT(*) FROM daily_deals) < 15;

-- ===== dispute_messages =====
INSERT INTO dispute_messages (dispute_id, sender_id, message, is_admin)
SELECT
  (SELECT id FROM disputes ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM disputes),1))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Dispute message ' || g,
  (g % 2 = 0)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM disputes)
  AND NOT EXISTS (SELECT 1 FROM dispute_messages WHERE message = 'Dispute message ' || g);

-- ===== events =====
INSERT INTO events (event_name, user_id, session_id, product_id, properties)
SELECT
  (ARRAY['page_view','product_view','add_to_cart','checkout','purchase','search'])[(g % 6)+1],
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'sess_' || g || '_' || substr(md5(random()::text),1,8),
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  jsonb_build_object('seq',g)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM products);

-- ===== experiments =====
INSERT INTO experiments (key, name, variants, status)
SELECT
  'exp_' || g || '_' || substr(md5(g::text),1,4),
  'Experiment ' || g,
  '[{"key":"control","weight":50},{"key":"variant","weight":50}]'::jsonb,
  (ARRAY['running','paused','completed'])[(g % 3)+1]
FROM generate_series(1,20) g
ON CONFLICT (key) DO NOTHING;

-- ===== experiment_assignments =====
-- Cross-join experiments x users to ensure enough unique combos for both unique indexes
INSERT INTO experiment_assignments (experiment_key, user_id, session_id, variant)
SELECT e.key, u.id,
       'sess_' || substr(md5(e.key || u.id::text),1,12),
       (ARRAY['control','variant'])[((u.urn + e.ern) % 2)+1]
FROM (SELECT key, row_number() OVER (ORDER BY starts_at) ern FROM experiments LIMIT 5) e
CROSS JOIN (SELECT id, row_number() OVER (ORDER BY created_at) urn FROM users LIMIT 5) u
ON CONFLICT DO NOTHING;

-- ===== experiment_conversions =====
INSERT INTO experiment_conversions (experiment_key, variant, user_id, session_id, goal, value)
SELECT
  (SELECT key FROM experiments ORDER BY starts_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM experiments),1))::int LIMIT 1),
  (ARRAY['control','variant'])[(g % 2)+1],
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'sess_conv_' || g,
  (ARRAY['signup','purchase','click'])[(g % 3)+1],
  g * 10
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM experiments) AND EXISTS (SELECT 1 FROM users);

-- ===== flash_sales =====
INSERT INTO flash_sales (product_id, seller_id, discount_pct, starts_at, ends_at, max_uses, uses_count)
SELECT
  p.id,
  p.seller_id,
  10 + (g % 70),
  NOW() - INTERVAL '1 hour',
  NOW() + (g * INTERVAL '1 day'),
  100, 0
FROM (SELECT id, seller_id, row_number() OVER (ORDER BY created_at) rn FROM products) p
CROSS JOIN generate_series(1,1) g
WHERE p.rn <= 20
  AND NOT EXISTS (SELECT 1 FROM flash_sales fs WHERE fs.product_id = p.id);

-- ===== group_buys =====
INSERT INTO group_buys (product_id, seller_id, tiers, starts_at, ends_at, status)
SELECT
  p.id, p.seller_id,
  '[{"min_qty":5,"price":90},{"min_qty":10,"price":80},{"min_qty":20,"price":70}]'::jsonb,
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '7 days',
  'open'
FROM (SELECT id, seller_id, row_number() OVER (ORDER BY created_at) rn FROM products) p
WHERE p.rn <= 20
  AND NOT EXISTS (SELECT 1 FROM group_buys gb WHERE gb.product_id = p.id);

-- ===== group_buy_commitments =====
INSERT INTO group_buy_commitments (group_buy_id, user_id, quantity)
SELECT
  gb.id,
  (SELECT id FROM users ORDER BY created_at OFFSET (gb.rn % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  1 + (gb.rn % 5)
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM group_buys) gb
WHERE gb.rn <= 20
ON CONFLICT (group_buy_id, user_id) DO NOTHING;

-- ===== gsp_countries =====
INSERT INTO gsp_countries (country_code, country_name, is_supported, base_shipping_rate, estimated_days_min, estimated_days_max, duty_rate_percent, tax_rate_percent)
VALUES
  ('CA','Canada',true,15.00,5,10,2.5,5),
  ('GB','United Kingdom',true,25.00,7,14,3,20),
  ('DE','Germany',true,28.00,7,14,3,19),
  ('FR','France',true,28.00,7,14,3,20),
  ('IT','Italy',true,29.00,7,14,3,22),
  ('ES','Spain',true,29.00,8,15,3,21),
  ('AU','Australia',true,35.00,10,20,5,10),
  ('JP','Japan',true,32.00,7,14,3,10),
  ('NL','Netherlands',true,27.00,7,14,3,21),
  ('BE','Belgium',true,27.00,7,14,3,21),
  ('MX','Mexico',true,22.00,7,14,4,16),
  ('BR','Brazil',true,40.00,12,25,10,17),
  ('IN','India',true,30.00,10,21,7,18),
  ('CN','China',true,28.00,10,21,5,13),
  ('KR','South Korea',true,30.00,8,16,4,10),
  ('SG','Singapore',true,25.00,7,14,3,7),
  ('NZ','New Zealand',true,35.00,10,20,5,15),
  ('IE','Ireland',true,27.00,7,14,3,23),
  ('SE','Sweden',true,28.00,7,14,3,25),
  ('NO','Norway',true,30.00,7,14,3,25)
ON CONFLICT (country_code) DO NOTHING;

-- ===== gsp_shipments =====
INSERT INTO gsp_shipments (order_id, seller_id, buyer_id, domestic_tracking_number, domestic_carrier, hub_location, international_tracking_number, international_carrier, destination_country, status)
SELECT
  (SELECT id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  (SELECT seller_id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  (SELECT buyer_id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  'DOM' || LPAD(g::text,9,'0'),
  'USPS',
  'Kentucky, USA',
  'INT' || LPAD(g::text,9,'0'),
  'DHL',
  (ARRAY['CA','GB','DE','AU','JP'])[(g % 5)+1],
  (ARRAY['pending','in_transit','delivered'])[(g % 3)+1]
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM orders)
  AND NOT EXISTS (SELECT 1 FROM gsp_shipments WHERE domestic_tracking_number = 'DOM' || LPAD(g::text,9,'0'));

-- ===== ip_reputation =====
INSERT INTO ip_reputation (ip, score, label)
SELECT ('192.168.' || (g/256)::int || '.' || (g % 256))::inet, (g * 3) % 100, (ARRAY['clean','suspicious','abusive','vpn'])[(g % 4)+1]
FROM generate_series(1,20) g
ON CONFLICT (ip) DO NOTHING;

-- ===== live_streams =====
INSERT INTO live_streams (seller_id, title, description, status, scheduled_start, stream_key)
SELECT
  (SELECT id FROM users WHERE is_seller = true ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM users WHERE is_seller=true),1))::int LIMIT 1),
  'Live Auction Stream ' || g,
  'Exciting live auction featuring rare finds!',
  (ARRAY['scheduled','live','ended'])[(g % 3)+1],
  NOW() + (g * INTERVAL '1 hour'),
  'sk_' || substr(md5(g::text || random()::text),1,16)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users WHERE is_seller = true)
  AND NOT EXISTS (SELECT 1 FROM live_streams WHERE title = 'Live Auction Stream ' || g);

-- ===== live_stream_products =====
INSERT INTO live_stream_products (stream_id, product_id, display_order, is_featured)
SELECT
  ls.id, p.id, p.rn, (p.rn % 3 = 0)
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM live_streams) ls
CROSS JOIN LATERAL (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM products LIMIT 2) p
WHERE ls.rn <= 10
ON CONFLICT (stream_id, product_id) DO NOTHING;

-- ===== live_chat_messages =====
INSERT INTO live_chat_messages (stream_id, user_id, message, is_pinned)
SELECT
  (SELECT id FROM live_streams ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM live_streams),1))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Chat message ' || g || ': This is awesome!',
  (g % 10 = 0)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM live_streams);

-- ===== pickup_locations =====
INSERT INTO pickup_locations (seller_id, name, address, city, state, postal_code)
SELECT
  (SELECT id FROM users WHERE is_seller = true ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM users WHERE is_seller=true),1))::int LIMIT 1),
  'Pickup Location ' || g,
  (100 + g) || ' Main St',
  (ARRAY['New York','Los Angeles','Chicago','Houston','Phoenix'])[(g % 5)+1],
  (ARRAY['NY','CA','IL','TX','AZ'])[(g % 5)+1],
  LPAD((10000+g)::text,5,'0')
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users WHERE is_seller=true)
  AND NOT EXISTS (SELECT 1 FROM pickup_locations WHERE name = 'Pickup Location ' || g);

-- ===== local_pickup_appointments =====
INSERT INTO local_pickup_appointments (product_id, seller_id, buyer_id, scheduled_date, scheduled_time, status, pickup_code)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET ((g+1) % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (CURRENT_DATE + g::int),
  ('10:00:00'::time + (g || ' minutes')::interval),
  'pending',
  'PU-' || LPAD(g::text,6,'0')
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users)
  AND NOT EXISTS (SELECT 1 FROM local_pickup_appointments WHERE pickup_code = 'PU-' || LPAD(g::text,6,'0'));

-- ===== local_pickup_settings =====
INSERT INTO local_pickup_settings (product_id, seller_id, offers_local_pickup, pickup_city, pickup_state, pickup_zip)
SELECT
  p.id, p.seller_id, true, 'New York', 'NY', '10001'
FROM (SELECT id, seller_id, row_number() OVER (ORDER BY created_at) rn FROM products) p
WHERE p.rn <= 20
ON CONFLICT (product_id) DO NOTHING;

-- ===== membership_exclusive_deals =====
INSERT INTO membership_exclusive_deals (title, description, discount_type, discount_value, product_id, start_date, end_date, max_uses, membership_required)
SELECT
  'Exclusive Deal ' || g,
  'Members-only offer #' || g,
  (ARRAY['percentage','fixed_amount'])[(g % 2)+1],
  5 + (g % 25),
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  NOW() - INTERVAL '1 day',
  NOW() + INTERVAL '30 days',
  100, true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products)
  AND NOT EXISTS (SELECT 1 FROM membership_exclusive_deals WHERE title = 'Exclusive Deal ' || g);

-- ===== moderation_reports =====
INSERT INTO moderation_reports (product_id, status, reason, matched_terms)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (ARRAY['pending','approved','rejected'])[(g % 3)+1],
  'Auto-flagged #' || g,
  ARRAY['prohibited','term']::varchar[]
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products);

-- ===== notification_preferences =====
INSERT INTO notification_preferences (user_id, email_notifications, push_notifications, sms_notifications)
SELECT u.id, true, true, false FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== notification_subscriptions =====
INSERT INTO notification_subscriptions (user_id, entity_type, entity_id, notify_on_bid, notify_on_price_change)
SELECT
  u.id,
  'product',
  p.id,
  true, true
FROM (SELECT id FROM users LIMIT 20) u
CROSS JOIN LATERAL (SELECT id FROM products ORDER BY random() LIMIT 1) p
ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING;

-- ===== password_reset_tokens =====
INSERT INTO password_reset_tokens (user_id, token, expires_at, used)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'prt_' || md5(g::text || random()::text || clock_timestamp()::text),
  NOW() + INTERVAL '1 hour',
  (g % 3 = 0)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
ON CONFLICT (token) DO NOTHING;

-- ===== payment_methods =====
INSERT INTO payment_methods (user_id, payment_type, is_default, card_last_four, card_brand, card_exp_month, card_exp_year)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (ARRAY['credit_card','debit_card','paypal','bank_account'])[(g % 4)+1],
  (g = 1),
  LPAD(((g * 137) % 10000)::text,4,'0'),
  (ARRAY['Visa','Mastercard','Amex','Discover'])[(g % 4)+1],
  1 + (g % 12),
  2027 + (g % 5)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
  AND (SELECT COUNT(*) FROM payment_methods) < 15;

-- ===== pickup_appointments =====
INSERT INTO pickup_appointments (order_id, buyer_id, seller_id, scheduled_date, status, confirmation_code)
SELECT
  o.id, o.buyer_id, o.seller_id,
  (CURRENT_DATE + o.rn::int),
  (ARRAY['scheduled','confirmed','completed'])[(o.rn % 3)+1],
  'C' || LPAD(o.rn::text,5,'0')
FROM (SELECT id, buyer_id, seller_id, row_number() OVER (ORDER BY created_at) rn FROM orders) o
WHERE o.rn <= 20
  AND NOT EXISTS (SELECT 1 FROM pickup_appointments pa WHERE pa.confirmation_code = 'C' || LPAD(o.rn::text,5,'0'));

-- ===== product_price_history =====
INSERT INTO product_price_history (product_id, price_type, old_price, new_price, changed_by)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (ARRAY['buy_now','starting','current_bid'])[(g % 3)+1],
  100 + g * 2,
  90 + g,
  (SELECT id FROM users ORDER BY created_at LIMIT 1)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users);

-- ===== proxy_bids =====
WITH pairs AS (
  SELECT p.id AS product_id, u.id AS bidder_id, row_number() OVER () rn
  FROM (SELECT id FROM products ORDER BY created_at LIMIT 20) p
  CROSS JOIN LATERAL (SELECT id FROM users ORDER BY random() LIMIT 1) u
)
INSERT INTO proxy_bids (product_id, bidder_id, max_bid_amount, current_proxy_bid, is_active)
SELECT product_id, bidder_id, 100 + rn * 10, 50 + rn * 5, true
FROM pairs
ON CONFLICT (product_id, bidder_id) DO NOTHING;

-- ===== questions =====
INSERT INTO questions (product_id, asker_id, question, answer, helpful_count)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Question ' || g || ': Is shipping included?',
  'Answer ' || g || ': Yes, shipping is free.',
  g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users);

-- ===== qa_upvotes =====
INSERT INTO qa_upvotes (user_id, target_type, target_id)
SELECT
  u.id,
  'question',
  q.id
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM questions LIMIT 20) q
JOIN (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM users) u
  ON u.rn = ((q.rn - 1) % (SELECT COUNT(*) FROM users)) + 1
ON CONFLICT DO NOTHING;

-- ===== referral_rewards =====
INSERT INTO referral_rewards (referrer_id, referred_id, event, amount)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET ((g+1) % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (ARRAY['signup','first_purchase','milestone'])[(g % 3)+1] || '_' || g,
  10 + g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
ON CONFLICT (referrer_id, referred_id, event) DO NOTHING;

-- ===== saved_search_last_run =====
INSERT INTO saved_search_last_run (saved_search_id, last_run_at, last_seen_product_ids)
SELECT ss.id, NOW() - (ss.rn * INTERVAL '1 hour'), ARRAY[]::uuid[]
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM saved_searches LIMIT 20) ss
ON CONFLICT (saved_search_id) DO NOTHING;

-- ===== scheduled_listing_log =====
INSERT INTO scheduled_listing_log (product_id, action, scheduled_for, executed_at)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (ARRAY['scheduled','published','ended','cancelled'])[(g % 4)+1],
  NOW() + (g * INTERVAL '1 day'),
  CASE WHEN g % 2 = 0 THEN NOW() - (g * INTERVAL '1 hour') ELSE NULL END
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products);

-- ===== search_impressions =====
INSERT INTO search_impressions (product_id, user_id, search_query, position_shown, clicked)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'search term ' || g,
  1 + (g % 20),
  (g % 3 = 0)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users);

-- ===== seller_defects =====
INSERT INTO seller_defects (seller_id, order_id, defect_type, description, defect_date, resolved, counts_toward_rate)
SELECT
  (SELECT seller_id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  (SELECT id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  (ARRAY['late_shipment','item_not_received','item_not_as_described','cancelled_order'])[(g % 4)+1],
  'Defect description ' || g,
  CURRENT_DATE - g,
  (g % 3 = 0),
  true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM orders);

-- ===== seller_follows =====
INSERT INTO seller_follows (follower_id, seller_id)
SELECT f.id, s.id
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM users) f
JOIN (SELECT id, row_number() OVER (ORDER BY created_at DESC) rn FROM users WHERE is_seller = true) s
  ON s.rn = ((f.rn - 1) % GREATEST((SELECT COUNT(*) FROM users WHERE is_seller=true),1)) + 1
WHERE f.rn <= 20 AND f.id <> s.id
ON CONFLICT DO NOTHING;

-- ===== seller_onboarding =====
INSERT INTO seller_onboarding (user_id, step_account, step_identity, step_payout, step_tax, step_policies, step_first_listing, completed_at)
SELECT u.id, true, true, (random() > 0.3), (random() > 0.3), (random() > 0.5), (random() > 0.5), NOW()
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== shipping_labels =====
INSERT INTO shipping_labels (order_id, carrier_id, tracking_number, label_cost, weight, status)
SELECT
  (SELECT id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  (SELECT id FROM shipping_carriers ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM shipping_carriers),1))::int LIMIT 1),
  'TRK' || LPAD(g::text,10,'0'),
  5 + g,
  1 + g * 0.5,
  (ARRAY['created','purchased','voided'])[(g % 3)+1]
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM orders) AND EXISTS (SELECT 1 FROM shipping_carriers)
  AND NOT EXISTS (SELECT 1 FROM shipping_labels WHERE tracking_number = 'TRK' || LPAD(g::text,10,'0'));

-- ===== shipping_reminders =====
INSERT INTO shipping_reminders (order_id, seller_id, reminder_time, reminder_type, sent)
SELECT
  o.id, o.seller_id, NOW() + (o.rn * INTERVAL '1 hour'),
  (ARRAY['handling_time','follow_up','final'])[(o.rn % 3)+1],
  false
FROM (SELECT id, seller_id, row_number() OVER (ORDER BY created_at) rn FROM orders) o
WHERE o.rn <= 20;

-- ===== shipping_tracking_events =====
INSERT INTO shipping_tracking_events (shipment_id, tracking_number, event_date, event_location, event_status, event_description)
SELECT
  gen_random_uuid(),
  'TRK' || LPAD(g::text,10,'0'),
  NOW() - (g * INTERVAL '1 hour'),
  (ARRAY['New York, NY','Chicago, IL','Los Angeles, CA','Atlanta, GA','Dallas, TX'])[(g % 5)+1],
  (ARRAY['picked_up','in_transit','out_for_delivery','delivered'])[(g % 4)+1],
  'Event description ' || g
FROM generate_series(1,20) g;

-- ===== stripe_customers =====
INSERT INTO stripe_customers (user_id, stripe_customer_id)
SELECT u.id, 'cus_' || substr(md5(u.id::text),1,14)
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== team_members =====
WITH owners AS (
  SELECT id, row_number() OVER (ORDER BY created_at) orn
  FROM users WHERE is_seller = true LIMIT 5
), members AS (
  SELECT id, row_number() OVER (ORDER BY created_at) mrn FROM users
)
INSERT INTO team_members (owner_id, member_id, role, is_active, accepted_at)
SELECT o.id, m.id,
  (ARRAY['viewer','editor','manager','admin'])[((m.mrn) % 4) + 1],
  true, NOW()
FROM owners o
JOIN members m ON m.mrn <= 20 AND m.id <> o.id
ON CONFLICT (owner_id, member_id) DO NOTHING;

-- ===== team_activity_log =====
INSERT INTO team_activity_log (team_member_id, action_type, action_details, entity_type, entity_id, ip_address)
SELECT
  (SELECT id FROM team_members ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM team_members),1))::int LIMIT 1),
  (ARRAY['listing_created','listing_updated','order_processed','message_sent'])[(g % 4)+1],
  jsonb_build_object('seq',g),
  'product',
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  '10.1.1.' || g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM team_members);

-- ===== two_factor_auth =====
INSERT INTO two_factor_auth (user_id, secret, is_enabled, backup_codes)
SELECT u.id, substr(md5(u.id::text),1,16), (random() > 0.5), ARRAY['a1','b2','c3','d4','e5']::varchar[]
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== user_credit =====
INSERT INTO user_credit (user_id, balance)
SELECT u.id, (random() * 100)::numeric(10,2)
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== user_currency_preferences =====
INSERT INTO user_currency_preferences (user_id, preferred_currency, display_converted_prices)
SELECT u.id,
  (ARRAY['USD','EUR','GBP','CAD','AUD','JPY'])[(row_number() OVER (ORDER BY u.created_at)::int % 6)+1],
  true
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== user_memberships =====
INSERT INTO user_memberships (user_id, plan_id, status, billing_cycle, start_date, end_date, next_billing_date, auto_renew)
SELECT
  u.id,
  (SELECT id FROM membership_plans ORDER BY id LIMIT 1),
  'active',
  (ARRAY['monthly','annual'])[(u.rn % 2)+1],
  CURRENT_DATE - u.rn::int,
  CURRENT_DATE + 365,
  CURRENT_DATE + 30,
  true
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM users) u
WHERE u.rn <= 20
  AND EXISTS (SELECT 1 FROM membership_plans)
  AND NOT EXISTS (SELECT 1 FROM user_memberships um WHERE um.user_id = u.id);

-- ===== user_wallets =====
INSERT INTO user_wallets (user_id, balance)
SELECT u.id, (random() * 500)::numeric(12,2)
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== wallet_ledger =====
INSERT INTO wallet_ledger (user_id, amount, balance_after, reason, note)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (CASE WHEN g % 2 = 0 THEN 1 ELSE -1 END) * (10 + g),
  100 + g,
  (ARRAY['deposit','withdrawal','refund','purchase','bonus'])[(g % 5)+1],
  'Ledger entry ' || g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users);

-- ===== credit_transactions =====
INSERT INTO credit_transactions (user_id, amount, reason, gift_card_id)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  10 + g,
  (ARRAY['gift_card_redeem','store_credit','refund'])[(g % 3)+1],
  NULL
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users);

-- ===== gift_cards =====
INSERT INTO gift_cards (code, amount, purchased_by, recipient_email, message)
SELECT
  'GC-' || upper(substr(md5(g::text || random()::text),1,10)),
  25 * (1 + (g % 5)),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'recipient' || g || '@example.com',
  'Happy birthday!'
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
ON CONFLICT (code) DO NOTHING;

-- ===== coupon_usage =====
INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
SELECT
  c.id,
  o.buyer_id,
  o.id,
  5.0
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM coupons LIMIT 20) c
JOIN (SELECT id, buyer_id, row_number() OVER (ORDER BY created_at) rn FROM orders LIMIT 20) o ON o.rn = c.rn
ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING;

-- ===== promotion_bids =====
INSERT INTO promotion_bids (product_id, seller_id, cpc_bid, daily_budget, status)
SELECT
  p.id, p.seller_id, 0.25 + (p.rn * 0.05), 20 + p.rn, 'active'
FROM (SELECT id, seller_id, row_number() OVER (ORDER BY created_at) rn FROM products) p
WHERE p.rn <= 20
  AND NOT EXISTS (SELECT 1 FROM promotion_bids pb WHERE pb.product_id = p.id);

-- ===== promotion_events =====
INSERT INTO promotion_events (promotion_bid_id, kind, cost, occurred_at)
SELECT
  (SELECT id FROM promotion_bids ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM promotion_bids),1))::int LIMIT 1),
  (ARRAY['impression','click','conversion'])[(g % 3)+1],
  (0.1 + g * 0.05),
  NOW() - (g * INTERVAL '1 minute')
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM promotion_bids);

-- ===== auction_chat_messages =====
INSERT INTO auction_chat_messages (product_id, user_id, message)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Going once, going twice! Msg ' || g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users);

-- ===== support_agents =====
INSERT INTO support_agents (user_id, display_name, department, is_available, max_concurrent_chats)
SELECT u.id, 'Agent ' || substr(u.id::text,1,4), (ARRAY['general','billing','returns','technical'])[(row_number() OVER () % 4)+1], true, 5
FROM (SELECT id FROM users WHERE is_admin = true OR is_seller = true ORDER BY created_at LIMIT 20) u
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO support_agents (user_id, display_name, department, is_available)
SELECT u.id, 'Agent ' || substr(u.id::text,1,4), 'general', true
FROM (SELECT id FROM users ORDER BY created_at LIMIT 20) u
ON CONFLICT (user_id) DO NOTHING;

-- ===== support_chats =====
INSERT INTO support_chats (user_id, agent_id, subject, category, status, priority)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM support_agents ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM support_agents),1))::int LIMIT 1),
  'Support ticket #' || g,
  (ARRAY['order','payment','shipping','return','account','technical','other'])[(g % 7)+1],
  (ARRAY['waiting','active','resolved','closed'])[(g % 4)+1],
  (ARRAY['low','normal','high','urgent'])[(g % 4)+1]
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
  AND (SELECT COUNT(*) FROM support_chats) < 15;

-- ===== support_chat_messages =====
INSERT INTO support_chat_messages (chat_id, sender_id, message, message_type)
SELECT
  (SELECT id FROM support_chats ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM support_chats),1))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Chat message content ' || g,
  'text'
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM support_chats);

-- ===== vehicles =====
INSERT INTO vehicles (product_id, seller_id, vin, year, make, model, mileage, exterior_color, interior_color, title_status)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users WHERE is_seller = true ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM users WHERE is_seller=true),1))::int LIMIT 1),
  'VIN' || LPAD(g::text,14,'0'),
  2015 + (g % 10),
  (ARRAY['Toyota','Ford','Honda','Chevrolet','BMW'])[(g % 5)+1],
  (ARRAY['Camry','F-150','Civic','Silverado','X5'])[(g % 5)+1],
  10000 * g,
  (ARRAY['Black','White','Silver','Red','Blue'])[(g % 5)+1],
  (ARRAY['Black','Beige','Gray'])[(g % 3)+1],
  'clean'
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users WHERE is_seller=true)
ON CONFLICT (vin) DO NOTHING;

-- ===== vehicle_inspections =====
INSERT INTO vehicle_inspections (vehicle_id, inspector_name, inspection_location, inspection_date, overall_condition, exterior_rating, interior_rating, mechanical_rating, passed)
SELECT
  (SELECT id FROM vehicles ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM vehicles),1))::int LIMIT 1),
  'Inspector ' || g,
  'Inspection Center #' || (g % 5),
  CURRENT_DATE - g,
  (ARRAY['excellent','good','fair','poor'])[(g % 4)+1],
  1 + (g % 10),
  1 + (g % 10),
  1 + (g % 10),
  (g % 3 <> 0)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM vehicles);

-- ===== vehicle_parts_compatibility =====
INSERT INTO vehicle_parts_compatibility (product_id, year_from, year_to, make, model, trim_level, engine)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  2010 + (g % 10),
  2020 + (g % 5),
  (ARRAY['Toyota','Ford','Honda','Chevrolet','BMW'])[(g % 5)+1],
  (ARRAY['Camry','F-150','Civic','Silverado','X5'])[(g % 5)+1],
  (ARRAY['SE','LE','LX','EX','Sport'])[(g % 5)+1],
  (ARRAY['V6 3.5L','V8 5.0L','I4 2.0L'])[(g % 3)+1]
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products);

-- ===== vault_items =====
INSERT INTO vault_items (user_id, product_id, item_name, grading_service, status, estimated_value)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  'Vaulted Item #' || g,
  (ARRAY['PSA','BGS','CGC','SGC','none'])[(g % 5)+1],
  (ARRAY['pending','received','graded','stored'])[(g % 4)+1],
  500 + g * 50
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM products);

-- ===== websocket_sessions =====
INSERT INTO websocket_sessions (user_id, session_token, device_info, is_active)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'ws_' || md5(g::text || random()::text || clock_timestamp()::text),
  jsonb_build_object('os','iOS','browser','Safari','seq',g),
  true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users)
ON CONFLICT (session_token) DO NOTHING;

-- ===== websocket_connections =====
INSERT INTO websocket_connections (user_id, connection_id, device_type, ip_address, is_active)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'conn_' || md5(g::text || random()::text),
  (ARRAY['web','mobile','tablet'])[(g % 3)+1],
  '10.2.3.' || g,
  true
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users);

-- ===== digest_runs =====
INSERT INTO digest_runs (job_name, run_date, users_notified, started_at, finished_at)
SELECT
  (ARRAY['price_alerts','saved_searches','watchlist_update','outbid_summary'])[(g % 4)+1],
  CURRENT_DATE - g,
  10 + g,
  NOW() - (g * INTERVAL '1 day'),
  NOW() - (g * INTERVAL '1 day') + INTERVAL '5 minutes'
FROM generate_series(1,20) g
ON CONFLICT (job_name, run_date) DO NOTHING;

-- ===== admin_actions =====
INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details, ip_address)
SELECT
  COALESCE((SELECT id FROM users WHERE is_admin = true LIMIT 1), (SELECT id FROM users LIMIT 1)),
  (ARRAY['user_suspended','listing_removed','dispute_resolved','refund_issued'])[(g % 4)+1],
  (ARRAY['user','product','order','dispute'])[(g % 4)+1],
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  jsonb_build_object('seq',g),
  '192.168.1.' || g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users);

-- ===== rewards_tiers =====
INSERT INTO rewards_tiers (tier, min_points, earn_rate, bonus_multiplier, perks)
VALUES
  ('bronze', 0, 0.01, 1.0, '{"free_shipping":false}'::jsonb),
  ('silver', 500, 0.02, 1.2, '{"free_shipping":true}'::jsonb),
  ('gold', 2000, 0.03, 1.5, '{"free_shipping":true,"priority_support":true}'::jsonb),
  ('platinum', 10000, 0.05, 2.0, '{"free_shipping":true,"priority_support":true,"exclusive_deals":true}'::jsonb),
  ('diamond', 25000, 0.07, 2.5, '{"free_shipping":true,"priority_support":true,"concierge":true}'::jsonb),
  ('ruby', 50000, 0.08, 3.0, '{"all":true}'::jsonb),
  ('emerald', 100000, 0.09, 3.5, '{"all":true}'::jsonb),
  ('sapphire', 150000, 0.10, 4.0, '{"all":true}'::jsonb),
  ('topaz', 200000, 0.11, 4.5, '{"all":true}'::jsonb),
  ('amethyst', 250000, 0.12, 5.0, '{"all":true}'::jsonb),
  ('onyx', 300000, 0.13, 5.5, '{"all":true}'::jsonb),
  ('opal', 350000, 0.14, 6.0, '{"all":true}'::jsonb),
  ('jade', 400000, 0.15, 6.5, '{"all":true}'::jsonb),
  ('quartz', 450000, 0.16, 7.0, '{"all":true}'::jsonb),
  ('pearl', 500000, 0.17, 7.5, '{"all":true}'::jsonb),
  ('coral', 550000, 0.18, 8.0, '{"all":true}'::jsonb),
  ('amber', 600000, 0.19, 8.5, '{"all":true}'::jsonb)
ON CONFLICT (tier) DO NOTHING;

-- ===== rewards_program =====
INSERT INTO rewards_program (user_id, tier, total_points, available_points, lifetime_points)
SELECT
  u.id,
  (ARRAY['bronze','silver','gold','platinum'])[(row_number() OVER (ORDER BY u.created_at)::int % 4)+1],
  (random() * 5000)::int,
  (random() * 2000)::int,
  (random() * 10000)::int
FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== shipping_carriers =====
INSERT INTO shipping_carriers (name, code, tracking_url_template, is_active)
VALUES
  ('USPS','USPS','https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1={tracking}',true),
  ('UPS','UPS','https://www.ups.com/track?tracknum={tracking}',true),
  ('FedEx','FEDEX','https://www.fedex.com/fedextrack/?trknbr={tracking}',true),
  ('DHL','DHL','https://www.dhl.com/en/express/tracking.html?AWB={tracking}',true),
  ('OnTrac','ONTRAC','https://www.ontrac.com/trackingdetail.asp?tracking={tracking}',true),
  ('Canada Post','CANPOST','https://www.canadapost.ca/trackweb/{tracking}',true),
  ('Royal Mail','ROYALMAIL','https://www.royalmail.com/track-your-item#/tracking-results/{tracking}',true),
  ('LaserShip','LASER','https://www.lasership.com/track/?track_number_input={tracking}',true),
  ('Amazon Logistics','AMZL','https://track.amazon.com/tracking/{tracking}',true),
  ('PostNL','POSTNL','https://jouw.postnl.nl/#!/track-en-trace/{tracking}',true),
  ('SF Express','SFEXPRESS','http://www.sf-express.com/us/en/dynamic_function/waybill/{tracking}',true),
  ('Japan Post','JPPOST','https://trackings.post.japanpost.jp/services/srv/search/?reqCode={tracking}',true),
  ('Australia Post','AUPOST','https://auspost.com.au/mypost/track/#/details/{tracking}',true),
  ('DPD','DPD','https://www.dpd.com/tracking?parcelNumber={tracking}',true),
  ('GLS','GLS','https://gls-group.eu/track/{tracking}',true),
  ('Hermes','HERMES','https://www.hermes-europe.co.uk/myparcel/track/{tracking}',true),
  ('Yodel','YODEL','https://www.yodel.co.uk/tracking/{tracking}',true)
ON CONFLICT (code) DO NOTHING;

-- ===== product_quality_scores =====
INSERT INTO product_quality_scores (product_id, title_quality_score, description_quality_score, image_quality_score, item_specifics_score, seller_rating_score, seller_history_score, price_score, shipping_score, best_match_score)
SELECT p.id, 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50), 50+(p.rn%50)
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM products) p
WHERE p.rn <= 20
ON CONFLICT (product_id) DO NOTHING;

-- ===== seller_performance =====
INSERT INTO seller_performance (seller_id, total_transactions, defect_count, defect_rate, late_shipment_rate, feedback_score, seller_level)
SELECT
  u.id, 10 + (row_number() OVER (ORDER BY u.created_at))::int, (row_number() OVER (ORDER BY u.created_at))::int % 3, 0.02, 0.01, 98.5,
  (ARRAY['standard','top_rated','below_standard'])[(row_number() OVER (ORDER BY u.created_at)::int % 3)+1]
FROM users u
WHERE u.is_seller = true
ON CONFLICT (seller_id) DO NOTHING;

-- Fallback: seller_performance top-up to 15 with any users
INSERT INTO seller_performance (seller_id, total_transactions, feedback_score, seller_level)
SELECT u.id, 5, 95.0, 'standard'
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM seller_performance sp WHERE sp.seller_id = u.id)
  AND (SELECT COUNT(*) FROM seller_performance) < 15
LIMIT 20
ON CONFLICT (seller_id) DO NOTHING;

-- ===== shipping_zones =====
INSERT INTO shipping_zones (name, countries, is_active) VALUES
  ('North America', ARRAY['US','CA','MX']::varchar[], true),
  ('Europe West', ARRAY['GB','FR','DE','IT','ES']::varchar[], true),
  ('Europe Nordic', ARRAY['SE','NO','FI','DK']::varchar[], true),
  ('Asia Pacific', ARRAY['JP','KR','SG','AU','NZ']::varchar[], true),
  ('South America', ARRAY['BR','AR','CL']::varchar[], true),
  ('Middle East', ARRAY['AE','SA','IL']::varchar[], true),
  ('Africa', ARRAY['ZA','EG','NG']::varchar[], true),
  ('Southeast Asia', ARRAY['TH','VN','ID','MY','PH']::varchar[], true),
  ('Eastern Europe', ARRAY['PL','CZ','HU','RO']::varchar[], true),
  ('Benelux', ARRAY['NL','BE','LU']::varchar[], true),
  ('Caribbean', ARRAY['JM','BB','TT']::varchar[], true),
  ('Central America', ARRAY['CR','PA','GT']::varchar[], true),
  ('Central Asia', ARRAY['KZ','UZ']::varchar[], true),
  ('Oceania', ARRAY['FJ','PG']::varchar[], true),
  ('India Region', ARRAY['IN','LK','BD']::varchar[], true),
  ('Greater China', ARRAY['CN','HK','TW']::varchar[], true);

-- ===== currency_rates =====
INSERT INTO currency_rates (code, rate_to_usd, symbol, updated_at) VALUES
  ('USD', 1.00, '$', NOW()),
  ('EUR', 0.92, E'\u20AC', NOW()),
  ('GBP', 0.79, E'\u00A3', NOW()),
  ('JPY', 149.5, E'\u00A5', NOW()),
  ('CAD', 1.36, 'C$', NOW()),
  ('AUD', 1.52, 'A$', NOW()),
  ('CHF', 0.89, 'CHF', NOW()),
  ('CNY', 7.24, E'\u00A5', NOW()),
  ('INR', 83.2, E'\u20B9', NOW()),
  ('MXN', 17.1, 'M$', NOW()),
  ('BRL', 4.95, 'R$', NOW()),
  ('KRW', 1330, E'\u20A9', NOW()),
  ('SGD', 1.34, 'S$', NOW()),
  ('NZD', 1.65, 'NZ$', NOW()),
  ('SEK', 10.6, 'kr', NOW()),
  ('NOK', 10.8, 'kr', NOW()),
  ('DKK', 6.87, 'kr', NOW()),
  ('HKD', 7.82, 'HK$', NOW()),
  ('ZAR', 18.7, 'R', NOW()),
  ('PLN', 4.05, E'z\u0142', NOW())
ON CONFLICT DO NOTHING;

-- ===== currencies =====
INSERT INTO currencies (code, name, symbol, decimal_places, exchange_rate_to_usd, is_active) VALUES
  ('USD','US Dollar','$',2,1.00,true),
  ('EUR','Euro',E'\u20AC',2,0.92,true),
  ('GBP','British Pound',E'\u00A3',2,0.79,true),
  ('JPY','Japanese Yen',E'\u00A5',0,149.5,true),
  ('CAD','Canadian Dollar','C$',2,1.36,true),
  ('AUD','Australian Dollar','A$',2,1.52,true),
  ('CHF','Swiss Franc','CHF',2,0.89,true),
  ('CNY','Chinese Yuan',E'\u00A5',2,7.24,true),
  ('INR','Indian Rupee',E'\u20B9',2,83.2,true),
  ('MXN','Mexican Peso','M$',2,17.1,true),
  ('BRL','Brazilian Real','R$',2,4.95,true),
  ('KRW','South Korean Won',E'\u20A9',0,1330,true),
  ('SGD','Singapore Dollar','S$',2,1.34,true),
  ('NZD','New Zealand Dollar','NZ$',2,1.65,true),
  ('SEK','Swedish Krona','kr',2,10.6,true),
  ('NOK','Norwegian Krone','kr',2,10.8,true),
  ('DKK','Danish Krone','kr',2,6.87,true),
  ('HKD','Hong Kong Dollar','HK$',2,7.82,true)
ON CONFLICT (code) DO NOTHING;

-- ===== reserve_price_history =====
INSERT INTO reserve_price_history (product_id, previous_reserve, new_reserve, reason)
SELECT
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  100 + g,
  80 + g,
  'Adjustment #' || g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM products);

-- ===== seller_stores =====
INSERT INTO seller_stores (user_id, store_name, store_slug, tagline, description, is_verified)
SELECT
  u.id,
  'Store of ' || COALESCE(u.username, substr(u.id::text,1,8)),
  'store-' || substr(md5(u.id::text),1,10),
  'Quality items since 2020',
  'We sell amazing products!',
  (u.rn % 2 = 0)
FROM (SELECT id, username, row_number() OVER (ORDER BY created_at) rn FROM users WHERE is_seller = true) u
WHERE u.rn <= 20
ON CONFLICT (user_id) DO NOTHING;

-- Ensure store rows for any seller even if not flagged
INSERT INTO seller_stores (user_id, store_name, store_slug)
SELECT u.id, 'Shop ' || substr(u.id::text,1,6), 'shop-' || substr(md5(u.id::text || 'x'),1,10)
FROM users u
WHERE NOT EXISTS (SELECT 1 FROM seller_stores s WHERE s.user_id = u.id)
  AND (SELECT COUNT(*) FROM seller_stores) < 15
LIMIT 20
ON CONFLICT DO NOTHING;

-- ===== shopping_carts =====
INSERT INTO shopping_carts (user_id) SELECT u.id FROM users u
ON CONFLICT (user_id) DO NOTHING;

-- ===== cart_items =====
INSERT INTO cart_items (cart_id, product_id, quantity)
SELECT c.id, p.id, 1 + (p.rn % 3)
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM shopping_carts LIMIT 20) c
JOIN (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM products LIMIT 20) p ON p.rn = c.rn
ON CONFLICT (cart_id, product_id) DO NOTHING;

-- ===== store_subscribers =====
INSERT INTO store_subscribers (store_id, user_id)
SELECT s.id, u.id
FROM (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM seller_stores LIMIT 20) s
JOIN (SELECT id, row_number() OVER (ORDER BY created_at) rn FROM users LIMIT 20) u
  ON u.rn = ((s.rn - 1) % 20) + 1
ON CONFLICT (store_id, user_id) DO NOTHING;

-- ===== payment_transactions =====
INSERT INTO payment_transactions (order_id, user_id, stripe_payment_intent_id, amount, currency, status, payment_method_type)
SELECT
  o.id, o.buyer_id,
  'pi_' || substr(md5(o.id::text || o.rn::text),1,14),
  o.total,
  'usd',
  (ARRAY['succeeded','processing','pending','refunded'])[(o.rn % 4)+1],
  (ARRAY['card','ach','paypal'])[(o.rn % 3)+1]
FROM (SELECT id, buyer_id, total, row_number() OVER (ORDER BY created_at) rn FROM orders) o
WHERE o.rn <= 20;

-- ===== listing_templates =====
INSERT INTO listing_templates (user_id, name, category_id, template_data, is_default)
SELECT
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  'Template ' || g,
  (SELECT id FROM categories ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM categories),1))::int LIMIT 1),
  jsonb_build_object('title_format','[Brand] [Model]','description_default','Great item!','seq',g),
  (g = 1)
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM users) AND EXISTS (SELECT 1 FROM categories)
  AND NOT EXISTS (SELECT 1 FROM listing_templates WHERE name = 'Template ' || g);

-- ===== reviews (top-up) =====
INSERT INTO reviews (order_id, product_id, reviewer_id, reviewed_user_id, review_type, rating, title, comment, is_verified_purchase, helpful_count)
SELECT
  (SELECT id FROM orders ORDER BY created_at OFFSET (g % GREATEST((SELECT COUNT(*) FROM orders),1))::int LIMIT 1),
  (SELECT id FROM products ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM products))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET (g % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (SELECT id FROM users ORDER BY created_at OFFSET ((g+1) % (SELECT COUNT(*) FROM users))::int LIMIT 1),
  (ARRAY['product','seller','buyer'])[(g % 3)+1],
  1 + (g % 5),
  'Review title #' || g,
  'Detailed review comment body ' || g,
  true,
  g
FROM generate_series(1,20) g
WHERE EXISTS (SELECT 1 FROM orders) AND EXISTS (SELECT 1 FROM products) AND EXISTS (SELECT 1 FROM users)
  AND (SELECT COUNT(*) FROM reviews) < 15;

COMMIT;

-- ===== PER-USER TOP-UPS FOR TEST ACCOUNTS =====
-- Ensures buyer@ebay.com, seller@ebay.com, admin@ebay.com each own >=15 rows
-- in every user-facing feature table. Also tops up seller-side metrics and
-- admin-side metrics. Idempotent via COUNT guards and NOT EXISTS.

BEGIN;

-- Helper: resolve UUIDs once via a temp table
DROP TABLE IF EXISTS _tu;
CREATE TEMP TABLE _tu AS
SELECT id, email,
       CASE email
         WHEN 'buyer@ebay.com'  THEN 'buyer'
         WHEN 'seller@ebay.com' THEN 'seller'
         WHEN 'admin@ebay.com'  THEN 'admin'
       END AS role
FROM users
WHERE email IN ('buyer@ebay.com','seller@ebay.com','admin@ebay.com');

-- ---------------------------------------------------------------
-- ensure a wallet row + address + payment_method + store exist
-- ---------------------------------------------------------------
INSERT INTO user_wallets (user_id, balance)
SELECT id, 1000.00 FROM _tu
ON CONFLICT (user_id) DO NOTHING;

-- default address per user
INSERT INTO addresses (user_id, address_type, is_default, full_name, street_address, city, state, postal_code, country)
SELECT id, 'both', true, 'Test ' || email, '123 Market St', 'San Francisco', 'CA', '94103', 'United States'
FROM _tu
WHERE NOT EXISTS (SELECT 1 FROM addresses a WHERE a.user_id=_tu.id AND a.is_default=true);

-- seller store ensured (seller already has one, guard anyway)
INSERT INTO seller_stores (user_id, store_name, store_slug, tagline, description)
SELECT id, 'Store of ' || split_part(email,'@',1), 'store-' || split_part(email,'@',1), 'Test store', 'Auto-seeded store'
FROM _tu
WHERE NOT EXISTS (SELECT 1 FROM seller_stores s WHERE s.user_id=_tu.id);

-- ---------------------------------------------------------------
-- PER-USER TOP-UPS (loop over the 3 test accounts)
-- ---------------------------------------------------------------
DO $$
DECLARE
  u RECORD;
  p RECORD;
  prod_id UUID;
  seller_user UUID;
  other_user UUID;
  addr_id UUID;
  ord_id UUID;
  cart_uuid UUID;
  coupon_uuid UUID;
  need INT;
  g INT;
  prod_ids UUID[];
  user_ids UUID[];
  auction_ids UUID[];
  coupon_ids UUID[];
  cur_bal NUMERIC(10,2);
  delta NUMERIC(10,2);
  seller_products UUID[];
  seller_id_v UUID := '8b805921-fc57-478e-ae81-f7cf6781890e';
  admin_id_v  UUID := 'f029054b-85fa-412e-ad52-b5166a872c6a';
  buyer_id_v  UUID := '2c15b672-fbf5-4b3b-9eef-a40002ff17d1';
  store_id_v  UUID;
BEGIN
  -- pre-compute shared arrays
  SELECT array_agg(id) INTO prod_ids FROM (SELECT id FROM products WHERE status='active' ORDER BY created_at LIMIT 60) q;
  SELECT array_agg(id) INTO user_ids FROM (SELECT id FROM users ORDER BY created_at LIMIT 30) q;
  SELECT array_agg(id) INTO auction_ids FROM products WHERE listing_type IN ('auction','both') AND status='active';
  SELECT array_agg(id) INTO coupon_ids FROM (SELECT id FROM coupons ORDER BY created_at LIMIT 20) q;
  SELECT array_agg(id) INTO seller_products FROM products WHERE seller_id = seller_id_v;
  SELECT id INTO store_id_v FROM seller_stores WHERE user_id = seller_id_v;

  FOR u IN SELECT id, email, role FROM _tu LOOP

    -- default address
    SELECT id INTO addr_id FROM addresses WHERE user_id=u.id ORDER BY is_default DESC LIMIT 1;

    -- ======= wallet_ledger (and keep user_wallets.balance in sync) =======
    SELECT COUNT(*) INTO need FROM wallet_ledger WHERE user_id=u.id;
    IF need < 15 THEN
      SELECT balance INTO cur_bal FROM user_wallets WHERE user_id=u.id;
      IF cur_bal IS NULL THEN cur_bal := 0; INSERT INTO user_wallets(user_id,balance) VALUES (u.id,0) ON CONFLICT DO NOTHING; END IF;
      FOR g IN 1..(15-need) LOOP
        -- alternate credits/debits; always keep balance_after >= 0
        delta := (10 + (g*7) % 90)::numeric;
        IF (g % 2)=0 AND cur_bal >= delta THEN
          cur_bal := cur_bal - delta;
          INSERT INTO wallet_ledger(user_id,amount,balance_after,reason,note,created_at)
          VALUES (u.id, -delta, cur_bal,
                  (ARRAY['purchase','withdrawal','fee','refund_issued'])[(g%4)+1],
                  'Top-up seed debit #'||g,
                  NOW() - ((g*3)||' days')::interval);
        ELSE
          cur_bal := cur_bal + delta;
          INSERT INTO wallet_ledger(user_id,amount,balance_after,reason,note,created_at)
          VALUES (u.id, delta, cur_bal,
                  (ARRAY['deposit','refund','reward','cashback','referral'])[(g%5)+1],
                  'Top-up seed credit #'||g,
                  NOW() - ((g*3)||' days')::interval);
        END IF;
      END LOOP;
      UPDATE user_wallets SET balance = cur_bal, updated_at=NOW() WHERE user_id=u.id;
    END IF;

    -- ======= watchlist =======
    SELECT COUNT(*) INTO need FROM watchlist WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..array_length(prod_ids,1) LOOP
        EXIT WHEN (SELECT COUNT(*) FROM watchlist WHERE user_id=u.id) >= 15;
        INSERT INTO watchlist(user_id,product_id,created_at)
        VALUES (u.id, prod_ids[g], NOW() - ((g*2)||' days')::interval)
        ON CONFLICT (user_id,product_id) DO NOTHING;
      END LOOP;
    END IF;

    -- ======= recently_viewed =======
    SELECT COUNT(*) INTO need FROM recently_viewed WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..array_length(prod_ids,1) LOOP
        EXIT WHEN (SELECT COUNT(*) FROM recently_viewed WHERE user_id=u.id) >= 15;
        INSERT INTO recently_viewed(user_id,product_id,view_count,first_viewed_at,last_viewed_at)
        VALUES (u.id, prod_ids[g], 1 + (g%5),
                NOW() - ((g*2)||' days')::interval,
                NOW() - ((g)||' hours')::interval)
        ON CONFLICT (user_id,product_id) DO NOTHING;
      END LOOP;
    END IF;

    -- ======= price_alerts =======
    SELECT COUNT(*) INTO need FROM price_alerts WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..array_length(prod_ids,1) LOOP
        EXIT WHEN (SELECT COUNT(*) FROM price_alerts WHERE user_id=u.id) >= 15;
        INSERT INTO price_alerts(user_id,product_id,target_price,alert_on_any_drop,percentage_drop,is_active,created_at)
        VALUES (u.id, prod_ids[g], (50 + g*13)::numeric, (g%2=0), 10 + (g%30), true,
                NOW() - ((g*2)||' days')::interval)
        ON CONFLICT (user_id,product_id) DO NOTHING;
      END LOOP;
    END IF;

    -- ======= user_recommendations =======
    SELECT COUNT(*) INTO need FROM user_recommendations WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..array_length(prod_ids,1) LOOP
        EXIT WHEN (SELECT COUNT(*) FROM user_recommendations WHERE user_id=u.id) >= 15;
        INSERT INTO user_recommendations(user_id,product_id,recommendation_reason,score,is_viewed,created_at)
        VALUES (u.id, prod_ids[g],
                (ARRAY['viewed_similar','bought_together','trending','category_match','seller_follow'])[(g%5)+1],
                (0.5 + (g%50)/100.0)::numeric(5,4), (g%3=0),
                NOW() - ((g)||' days')::interval)
        ON CONFLICT (user_id,product_id) DO NOTHING;
      END LOOP;
    END IF;

    -- ======= saved_searches =======
    SELECT COUNT(*) INTO need FROM saved_searches WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO saved_searches(user_id,name,search_query,min_price,max_price,alert_frequency,email_alerts,created_at)
        VALUES (u.id,
                u.role||' search #'||g,
                (ARRAY['iphone','watch','bag','card','shoes','laptop','camera','guitar','bike','lego'])[(g%10)+1],
                (10*g)::numeric, (100*g+500)::numeric,
                (ARRAY['instant','daily','weekly'])[(g%3)+1], true,
                NOW() - ((g*2)||' days')::interval);
      END LOOP;
    END IF;

    -- ======= collections =======
    SELECT COUNT(*) INTO need FROM collections WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO collections(user_id,name,description,is_public,item_count,follower_count,created_at)
        VALUES (u.id, u.role||' collection '||g, 'Curated picks '||g, (g%2=0), g, g*2,
                NOW() - ((g*3)||' days')::interval);
      END LOOP;
    END IF;

    -- ======= notifications =======
    SELECT COUNT(*) INTO need FROM notifications WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO notifications(user_id,type,title,message,link,is_read,created_at)
        VALUES (u.id,
                (ARRAY['bid_outbid','bid_won','auction_ending','item_sold','order_update','message','review','price_drop','watchlist','promotion'])[(g%10)+1],
                'Notification '||g, 'You have a new update #'||g, '/notifications/'||g, (g%2=0),
                NOW() - ((g*2)||' hours')::interval);
      END LOOP;
    END IF;

    -- ======= messages (sender=u, recipient=someone else) =======
    SELECT COUNT(*) INTO need FROM messages WHERE sender_id=u.id OR recipient_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        other_user := user_ids[ 1 + ((g + (CASE u.role WHEN 'buyer' THEN 0 WHEN 'seller' THEN 3 ELSE 6 END)) % array_length(user_ids,1)) ];
        IF other_user = u.id THEN
          other_user := user_ids[ 1 + ((g+1) % array_length(user_ids,1)) ];
        END IF;
        INSERT INTO messages(sender_id,recipient_id,subject,body,is_read,created_at)
        VALUES (u.id, other_user, 'Subject '||g, 'Hello from '||u.email||' message '||g, (g%2=0),
                NOW() - ((g*3)||' hours')::interval);
      END LOOP;
    END IF;

    -- ======= addresses =======
    SELECT COUNT(*) INTO need FROM addresses WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO addresses(user_id,address_type,is_default,full_name,street_address,city,state,postal_code,country,phone)
        VALUES (u.id,
                (ARRAY['shipping','billing','both'])[(g%3)+1], false,
                'Test Addr '||g||' '||u.email, g||' Main St', 'City'||g, 'CA', LPAD(((90000+g))::text,5,'0'),
                'United States', '555-01'||LPAD(g::text,2,'0'));
      END LOOP;
    END IF;

    -- ======= payment_methods =======
    SELECT COUNT(*) INTO need FROM payment_methods WHERE user_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO payment_methods(user_id,payment_type,is_default,card_last_four,card_brand,card_exp_month,card_exp_year,billing_address_id,paypal_email)
        VALUES (u.id,
                (ARRAY['credit_card','debit_card','paypal','bank_account'])[(g%4)+1],
                false,
                LPAD(((1000+g)%10000)::text,4,'0'),
                (ARRAY['Visa','Mastercard','Amex','Discover'])[(g%4)+1],
                1 + (g%12), 2027 + (g%3),
                addr_id,
                CASE WHEN (g%4)=2 THEN split_part(u.email,'@',1)||g||'@paypal.com' END);
      END LOOP;
    END IF;

    -- ======= seller_follows =======
    SELECT COUNT(*) INTO need FROM seller_follows WHERE follower_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..array_length(user_ids,1) LOOP
        EXIT WHEN (SELECT COUNT(*) FROM seller_follows WHERE follower_id=u.id) >= 15;
        IF user_ids[g] <> u.id THEN
          INSERT INTO seller_follows(follower_id,seller_id,created_at)
          VALUES (u.id, user_ids[g], NOW() - ((g*2)||' days')::interval)
          ON CONFLICT DO NOTHING;
        END IF;
      END LOOP;
    END IF;

    -- ======= bids (auction products only) =======
    SELECT COUNT(*) INTO need FROM bids WHERE bidder_id=u.id;
    IF need < 15 AND array_length(auction_ids,1) > 0 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO bids(product_id,bidder_id,bid_amount,max_bid_amount,is_winning,is_auto_bid,created_at)
        VALUES (auction_ids[ 1 + (g % array_length(auction_ids,1)) ], u.id,
                (100 + g*25)::numeric, (200 + g*25)::numeric, false, (g%3=0),
                NOW() - ((g*4)||' hours')::interval);
      END LOOP;
    END IF;

    -- ======= offers (as buyer) =======
    SELECT COUNT(*) INTO need FROM offers WHERE buyer_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        prod_id := prod_ids[ 1 + (g % array_length(prod_ids,1)) ];
        SELECT seller_id INTO seller_user FROM products WHERE id = prod_id;
        IF seller_user = u.id THEN
          -- skip seller's own product; pick another
          prod_id := prod_ids[ 1 + ((g+1) % array_length(prod_ids,1)) ];
          SELECT seller_id INTO seller_user FROM products WHERE id = prod_id;
        END IF;
        INSERT INTO offers(product_id,buyer_id,seller_id,offer_amount,quantity,message,status,created_at)
        VALUES (prod_id, u.id, seller_user, (50 + g*15)::numeric, 1, 'Offer note '||g,
                (ARRAY['pending','accepted','declined','countered','expired','withdrawn'])[(g%6)+1],
                NOW() - ((g*2)||' days')::interval);
      END LOOP;
    END IF;

    -- ======= orders as buyer (+invoices, +returns, +reviews, +coupon_usage, +cart_items) =======
    SELECT COUNT(*) INTO need FROM orders WHERE buyer_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        prod_id := prod_ids[ 1 + (g % array_length(prod_ids,1)) ];
        SELECT seller_id INTO seller_user FROM products WHERE id = prod_id;
        IF seller_user = u.id THEN
          prod_id := prod_ids[ 1 + ((g+2) % array_length(prod_ids,1)) ];
          SELECT seller_id INTO seller_user FROM products WHERE id = prod_id;
        END IF;
        INSERT INTO orders(order_number,buyer_id,seller_id,subtotal,shipping_cost,tax,total,payment_status,status,created_at)
        VALUES ('TOP-'||u.role||'-'||g||'-'||floor(random()*1000000)::int,
                u.id, seller_user,
                (80+g*12)::numeric, 7.99, 6.50, (80+g*12+7.99+6.50)::numeric,
                (ARRAY['completed','pending','processing','refunded'])[(g%4)+1],
                (ARRAY['delivered','shipped','processing','confirmed','pending'])[(g%5)+1],
                NOW() - ((g*3)||' days')::interval)
        RETURNING id INTO ord_id;

        INSERT INTO order_items(order_id,product_id,quantity,unit_price,total_price)
        VALUES (ord_id, prod_id, 1, (80+g*12)::numeric, (80+g*12)::numeric);
      END LOOP;
    END IF;

    -- invoices as buyer
    SELECT COUNT(*) INTO need FROM invoices WHERE buyer_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        SELECT id, seller_id, subtotal, total FROM orders WHERE buyer_id=u.id
          AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.order_id = orders.id)
          ORDER BY created_at DESC LIMIT 1
          INTO ord_id, seller_user, cur_bal, delta;
        EXIT WHEN ord_id IS NULL;
        INSERT INTO invoices(order_id,invoice_number,buyer_id,seller_id,subtotal,tax_amount,shipping_amount,total_amount,status,due_date,created_at)
        VALUES (ord_id, 'INV-TOP-'||u.role||'-'||g||'-'||floor(random()*1000000)::int,
                u.id, seller_user, cur_bal, 6.50, 7.99, delta,
                (ARRAY['issued','paid','overdue','draft'])[(g%4)+1],
                (CURRENT_DATE + (g||' days')::interval)::date,
                NOW() - ((g)||' days')::interval);
      END LOOP;
    END IF;

    -- returns as buyer
    SELECT COUNT(*) INTO need FROM returns WHERE buyer_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        SELECT id, seller_id FROM orders WHERE buyer_id=u.id
          AND NOT EXISTS (SELECT 1 FROM returns r WHERE r.order_id = orders.id)
          ORDER BY created_at DESC LIMIT 1
          INTO ord_id, seller_user;
        EXIT WHEN ord_id IS NULL;
        INSERT INTO returns(order_id,buyer_id,seller_id,return_reason,return_details,status,refund_amount,refund_type,created_at)
        VALUES (ord_id, u.id, seller_user,
                (ARRAY['changed_mind','defective','not_as_described','wrong_item','arrived_late','other'])[(g%6)+1],
                'Return details '||g,
                (ARRAY['requested','approved','rejected','shipped','received','refunded','closed'])[(g%7)+1],
                (30+g*5)::numeric,
                (ARRAY['full','partial','store_credit'])[(g%3)+1],
                NOW() - ((g*2)||' days')::interval);
      END LOOP;
    END IF;

    -- reviews given
    SELECT COUNT(*) INTO need FROM reviews WHERE reviewer_id=u.id;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        prod_id := prod_ids[ 1 + (g % array_length(prod_ids,1)) ];
        SELECT seller_id INTO seller_user FROM products WHERE id = prod_id;
        INSERT INTO reviews(product_id,reviewer_id,reviewed_user_id,review_type,rating,title,comment,is_verified_purchase,helpful_count,created_at)
        VALUES (prod_id, u.id, seller_user,
                (ARRAY['product','seller','buyer'])[(g%3)+1],
                1 + (g%5),
                u.role||' review '||g, 'Detailed review body from '||u.email||' #'||g, true, g,
                NOW() - ((g*2)||' days')::interval);
      END LOOP;
    END IF;

    -- coupon_usage (each row must be unique on coupon+user+order; use distinct orders)
    SELECT COUNT(*) INTO need FROM coupon_usage WHERE user_id=u.id;
    IF need < 15 AND array_length(coupon_ids,1) > 0 THEN
      g := 0;
      FOR p IN SELECT id FROM orders WHERE buyer_id=u.id ORDER BY created_at LIMIT 30 LOOP
        EXIT WHEN (SELECT COUNT(*) FROM coupon_usage WHERE user_id=u.id) >= 15;
        g := g + 1;
        coupon_uuid := coupon_ids[ 1 + ((g-1) % array_length(coupon_ids,1)) ];
        INSERT INTO coupon_usage(coupon_id,user_id,order_id,discount_applied,used_at)
        VALUES (coupon_uuid, u.id, p.id, (5 + g*2)::numeric, NOW() - ((g*2)||' days')::interval)
        ON CONFLICT (coupon_id,user_id,order_id) DO NOTHING;
      END LOOP;
    END IF;

    -- cart_items (ensure cart exists, fill 15+ items)
    INSERT INTO shopping_carts(user_id) VALUES (u.id) ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO cart_uuid FROM shopping_carts WHERE user_id=u.id;
    SELECT COUNT(*) INTO need FROM cart_items WHERE cart_id=cart_uuid;
    IF need < 15 THEN
      FOR g IN 1..array_length(prod_ids,1) LOOP
        EXIT WHEN (SELECT COUNT(*) FROM cart_items WHERE cart_id=cart_uuid) >= 15;
        INSERT INTO cart_items(cart_id,product_id,quantity,added_at)
        VALUES (cart_uuid, prod_ids[g], 1 + (g%3), NOW() - ((g)||' hours')::interval)
        ON CONFLICT (cart_id,product_id) DO NOTHING;
      END LOOP;
    END IF;

  END LOOP;
END $$;

-- ---------------------------------------------------------------
-- SELLER-SIDE TOP-UPS FOR seller@ebay.com
-- ---------------------------------------------------------------
DO $$
DECLARE
  seller_id_v UUID := '8b805921-fc57-478e-ae81-f7cf6781890e';
  buyer_id_v  UUID := '2c15b672-fbf5-4b3b-9eef-a40002ff17d1';
  store_id_v  UUID;
  prod_ids UUID[];
  user_ids UUID[];
  non_seller_users UUID[];
  need INT;
  g INT;
  prod_id UUID;
  ord_id UUID;
  other_buyer UUID;
  subt NUMERIC;
  tot NUMERIC;
BEGIN
  SELECT id INTO store_id_v FROM seller_stores WHERE user_id=seller_id_v;
  SELECT array_agg(id) INTO prod_ids FROM products WHERE seller_id = seller_id_v;
  SELECT array_agg(id) INTO user_ids FROM (SELECT id FROM users ORDER BY created_at LIMIT 30) q;
  SELECT array_agg(id) INTO non_seller_users FROM (SELECT id FROM users WHERE id <> seller_id_v ORDER BY created_at LIMIT 30) q;

  -- offers as seller (received)
  SELECT COUNT(*) INTO need FROM offers WHERE seller_id=seller_id_v;
  IF need < 15 AND array_length(prod_ids,1) > 0 THEN
    FOR g IN 1..(15-need) LOOP
      prod_id := prod_ids[ 1 + ((g-1) % array_length(prod_ids,1)) ];
      other_buyer := non_seller_users[ 1 + ((g-1) % array_length(non_seller_users,1)) ];
      INSERT INTO offers(product_id,buyer_id,seller_id,offer_amount,quantity,message,status,created_at)
      VALUES (prod_id, other_buyer, seller_id_v, (75 + g*20)::numeric, 1, 'Offer on your product '||g,
              (ARRAY['pending','accepted','declined','countered','expired','withdrawn'])[(g%6)+1],
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- orders as seller (buyer = someone else, product = seller's product)
  SELECT COUNT(*) INTO need FROM orders WHERE seller_id=seller_id_v;
  IF need < 15 AND array_length(prod_ids,1) > 0 THEN
    FOR g IN 1..(15-need) LOOP
      prod_id := prod_ids[ 1 + ((g-1) % array_length(prod_ids,1)) ];
      other_buyer := non_seller_users[ 1 + ((g-1) % array_length(non_seller_users,1)) ];
      subt := (60 + g*17)::numeric;
      tot  := (subt + 7.99 + 5.00);
      INSERT INTO orders(order_number,buyer_id,seller_id,subtotal,shipping_cost,tax,total,payment_status,status,created_at)
      VALUES ('TOP-SLR-'||g||'-'||floor(random()*1000000)::int,
              other_buyer, seller_id_v, subt, 7.99, 5.00, tot,
              (ARRAY['completed','pending','processing'])[(g%3)+1],
              (ARRAY['delivered','shipped','processing','confirmed'])[(g%4)+1],
              NOW() - ((g*2)||' days')::interval)
      RETURNING id INTO ord_id;

      INSERT INTO order_items(order_id,product_id,quantity,unit_price,total_price)
      VALUES (ord_id, prod_id, 1, subt, subt);
    END LOOP;
  END IF;

  -- invoices as seller (use existing orders where this seller is seller)
  SELECT COUNT(*) INTO need FROM invoices WHERE seller_id=seller_id_v;
  IF need < 15 THEN
    g := 0;
    FOR ord_id, other_buyer, subt, tot IN
      SELECT o.id, o.buyer_id, o.subtotal, o.total FROM orders o
      WHERE o.seller_id = seller_id_v
        AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.order_id = o.id)
      ORDER BY o.created_at DESC LIMIT 50
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM invoices WHERE seller_id=seller_id_v) >= 15;
      g := g + 1;
      INSERT INTO invoices(order_id,invoice_number,buyer_id,seller_id,subtotal,tax_amount,shipping_amount,total_amount,status,due_date,created_at)
      VALUES (ord_id, 'INV-SLR-'||g||'-'||floor(random()*1000000)::int,
              other_buyer, seller_id_v, subt, 5.00, 7.99, tot,
              (ARRAY['issued','paid','overdue','draft'])[(g%4)+1],
              (CURRENT_DATE + (g||' days')::interval)::date,
              NOW() - ((g)||' days')::interval);
    END LOOP;
  END IF;

  -- returns as seller (use existing orders)
  SELECT COUNT(*) INTO need FROM returns WHERE seller_id=seller_id_v;
  IF need < 15 THEN
    g := 0;
    FOR ord_id, other_buyer IN
      SELECT o.id, o.buyer_id FROM orders o
      WHERE o.seller_id = seller_id_v
        AND NOT EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)
      ORDER BY o.created_at DESC LIMIT 50
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM returns WHERE seller_id=seller_id_v) >= 15;
      g := g + 1;
      INSERT INTO returns(order_id,buyer_id,seller_id,return_reason,return_details,status,refund_amount,refund_type,created_at)
      VALUES (ord_id, other_buyer, seller_id_v,
              (ARRAY['changed_mind','defective','not_as_described','wrong_item','arrived_late','other'])[(g%6)+1],
              'Seller-side return note '||g,
              (ARRAY['requested','approved','rejected','shipped','received','refunded','closed'])[(g%7)+1],
              (25+g*5)::numeric,
              (ARRAY['full','partial','store_credit'])[(g%3)+1],
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- reviews received by seller
  SELECT COUNT(*) INTO need FROM reviews WHERE reviewed_user_id=seller_id_v;
  IF need < 15 AND array_length(prod_ids,1) > 0 THEN
    FOR g IN 1..(15-need) LOOP
      prod_id := prod_ids[ 1 + ((g-1) % array_length(prod_ids,1)) ];
      other_buyer := non_seller_users[ 1 + ((g-1) % array_length(non_seller_users,1)) ];
      INSERT INTO reviews(product_id,reviewer_id,reviewed_user_id,review_type,rating,title,comment,is_verified_purchase,helpful_count,created_at)
      VALUES (prod_id, other_buyer, seller_id_v,
              (ARRAY['product','seller'])[(g%2)+1],
              1 + (g%5),
              'Review for seller #'||g, 'Customer feedback #'||g, true, g,
              NOW() - ((g*3)||' days')::interval);
    END LOOP;
  END IF;

  -- store_subscribers of seller's store
  SELECT COUNT(*) INTO need FROM store_subscribers WHERE store_id=store_id_v;
  IF need < 15 AND store_id_v IS NOT NULL THEN
    FOR g IN 1..array_length(non_seller_users,1) LOOP
      EXIT WHEN (SELECT COUNT(*) FROM store_subscribers WHERE store_id=store_id_v) >= 15;
      INSERT INTO store_subscribers(store_id,user_id,subscribed_at)
      VALUES (store_id_v, non_seller_users[g], NOW() - ((g*2)||' days')::interval)
      ON CONFLICT (store_id,user_id) DO NOTHING;
    END LOOP;
    UPDATE seller_stores SET subscriber_count = (SELECT COUNT(*) FROM store_subscribers WHERE store_id=store_id_v)
      WHERE id = store_id_v;
  END IF;

  -- products listed by seller (already 15, but guard)
  SELECT COUNT(*) INTO need FROM products WHERE seller_id=seller_id_v;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO products(seller_id,category_id,title,slug,description,condition,listing_type,current_price,buy_now_price,starting_price,quantity,status)
      SELECT seller_id_v, c.id,
             'Seller Top-Up Product '||g, 'seller-topup-prod-'||g||'-'||floor(random()*1000000)::int,
             'Auto-seeded seller product '||g, 'new', 'buy_now',
             (50+g*25)::numeric, (50+g*25)::numeric, (50+g*25)::numeric, 5, 'active'
      FROM categories c LIMIT 1;
    END LOOP;
  END IF;
END $$;

-- ---------------------------------------------------------------
-- ADMIN-SIDE TOP-UPS FOR admin@ebay.com
-- ---------------------------------------------------------------
DO $$
DECLARE
  admin_id_v UUID := 'f029054b-85fa-412e-ad52-b5166a872c6a';
  need INT;
  g INT;
  target UUID;
  user_ids UUID[];
  prod_ids UUID[];
  report_id UUID;
  chat_user UUID;
BEGIN
  SELECT array_agg(id) INTO user_ids FROM (SELECT id FROM users WHERE id <> admin_id_v ORDER BY created_at LIMIT 30) q;
  SELECT array_agg(id) INTO prod_ids FROM (SELECT id FROM products ORDER BY created_at LIMIT 30) q;

  -- admin_actions
  SELECT COUNT(*) INTO need FROM admin_actions WHERE admin_id=admin_id_v;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      target := user_ids[ 1 + ((g-1) % array_length(user_ids,1)) ];
      INSERT INTO admin_actions(admin_id,action_type,target_type,target_id,details,ip_address,created_at)
      VALUES (admin_id_v,
              (ARRAY['suspend_user','verify_seller','remove_listing','approve_refund','warn_user','unsuspend','adjust_fee'])[(g%7)+1],
              'user', target,
              jsonb_build_object('note','admin seed action '||g, 'reason','policy_review'),
              '10.0.0.'||g,
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- moderation_reports as reviewer (resolver)
  SELECT COUNT(*) INTO need FROM moderation_reports WHERE reviewer_id=admin_id_v;
  IF need < 15 THEN
    g := 0;
    FOR report_id IN
      SELECT id FROM moderation_reports WHERE reviewer_id IS NULL ORDER BY created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM moderation_reports WHERE reviewer_id=admin_id_v) >= 15;
      g := g + 1;
      UPDATE moderation_reports
      SET reviewer_id = admin_id_v,
          status = (ARRAY['resolved','rejected','approved'])[(g%3)+1],
          reviewed_at = NOW() - ((g)||' hours')::interval
      WHERE id = report_id;
    END LOOP;
    -- if still short, create new resolved reports
    SELECT COUNT(*) INTO need FROM moderation_reports WHERE reviewer_id=admin_id_v;
    IF need < 15 THEN
      FOR g IN 1..(15-need) LOOP
        INSERT INTO moderation_reports(product_id,status,reason,matched_terms,reviewer_id,created_at,reviewed_at)
        VALUES (prod_ids[ 1 + ((g-1) % array_length(prod_ids,1)) ],
                (ARRAY['resolved','rejected','approved'])[(g%3)+1],
                'Admin-reviewed report '||g,
                ARRAY['flagged','seed'],
                admin_id_v,
                NOW() - ((g*2)||' days')::interval,
                NOW() - ((g)||' hours')::interval);
      END LOOP;
    END IF;
  END IF;

  -- support_chats as agent
  SELECT COUNT(*) INTO need FROM support_chats WHERE agent_id=admin_id_v;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      chat_user := user_ids[ 1 + ((g-1) % array_length(user_ids,1)) ];
      INSERT INTO support_chats(user_id,agent_id,subject,category,status,priority,rating,started_at,ended_at,created_at)
      VALUES (chat_user, admin_id_v,
              'Help request '||g,
              (ARRAY['order','payment','shipping','return','account','technical','other'])[(g%7)+1],
              (ARRAY['resolved','closed','active','waiting'])[(g%4)+1],
              (ARRAY['low','normal','high','urgent'])[(g%4)+1],
              1 + (g%5),
              NOW() - ((g*3)||' hours')::interval,
              NOW() - ((g)||' hours')::interval,
              NOW() - ((g*3)||' hours')::interval);
    END LOOP;
  END IF;
END $$;

-- ---------------------------------------------------------------
-- FINAL RECONCILIATION: sync user_wallets.balance to latest ledger row
-- ---------------------------------------------------------------
UPDATE user_wallets uw
SET balance = GREATEST(0, sub.balance_after), updated_at = NOW()
FROM (
  SELECT DISTINCT ON (user_id) user_id, balance_after
  FROM wallet_ledger
  ORDER BY user_id, created_at DESC, ctid DESC
) sub
WHERE uw.user_id = sub.user_id
  AND uw.user_id IN (
    SELECT id FROM users WHERE email IN ('buyer@ebay.com','seller@ebay.com','admin@ebay.com')
  );

-- =====================================================================
-- PART 2: Additional fills (use email-based user lookups, not hardcoded UUIDs)
-- Idempotent. Adds missing columns, fixes broken FKs, fills gaps for buyer/seller.
-- =====================================================================

-- Add missing columns to users for vacation mode and wishlist sharing
ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_mode BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vacation_return_date DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wishlist_public BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS wishlist_share_token VARCHAR(64);

-- Fix broken daily_deals product_id FKs by pointing them at real products
UPDATE daily_deals d
SET product_id = sub.id
FROM (
  SELECT id, row_number() OVER (ORDER BY created_at) rn
  FROM products WHERE status='active' LIMIT 60
) sub
WHERE d.id IN (
  SELECT dd.id FROM daily_deals dd
  LEFT JOIN products p ON p.id = dd.product_id
  WHERE p.id IS NULL
)
AND sub.rn = ((abs(hashtext(d.id::text)) % 60) + 1);

DO $$
DECLARE
  buyer_uid  UUID;
  seller_uid UUID;
  admin_uid  UUID;
  prod_ids  UUID[];
  seller_prod_ids UUID[];
  user_ids  UUID[];
  auction_ids UUID[];
  coupon_ids UUID[];
  cat_ids UUID[];
  need INT;
  g INT;
  prod_id UUID;
  ord_id UUID;
  buyer_order_id UUID;
  bid_uid UUID;
  stream_uid UUID;
  plan_uid UUID;
BEGIN
  SELECT id INTO buyer_uid  FROM users WHERE email='buyer@ebay.com';
  SELECT id INTO seller_uid FROM users WHERE email='seller@ebay.com';
  SELECT id INTO admin_uid  FROM users WHERE email='admin@ebay.com';

  SELECT array_agg(id) INTO prod_ids FROM (
    SELECT id FROM products WHERE status='active' ORDER BY created_at LIMIT 60
  ) q;
  SELECT array_agg(id) INTO seller_prod_ids FROM (
    SELECT p.id FROM products p WHERE p.seller_id = seller_uid ORDER BY p.created_at LIMIT 60
  ) q;
  -- fallback: if seller has no products, use any
  IF seller_prod_ids IS NULL OR array_length(seller_prod_ids,1)=0 THEN
    seller_prod_ids := prod_ids;
  END IF;
  SELECT array_agg(id) INTO user_ids FROM (
    SELECT id FROM users u WHERE u.id <> buyer_uid AND u.id <> seller_uid AND u.id <> admin_uid
    ORDER BY u.created_at LIMIT 30
  ) q;
  SELECT array_agg(id) INTO auction_ids FROM products WHERE listing_type IN ('auction','both') AND status='active';
  SELECT array_agg(id) INTO coupon_ids FROM (SELECT id FROM coupons ORDER BY created_at LIMIT 20) q;
  SELECT array_agg(id) INTO cat_ids FROM (SELECT id FROM categories ORDER BY created_at LIMIT 20) q;

  -- ============ BUYER ============

  -- product_questions (asker). Target seller products so seller's Q&A page shows them too.
  SELECT COUNT(*) INTO need FROM product_questions WHERE asker_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO product_questions(product_id, asker_id, question, is_public, status, helpful_count, created_at)
      VALUES (seller_prod_ids[ 1 + ((g-1) % array_length(seller_prod_ids,1)) ], buyer_uid,
              'Buyer question #'||g||': Does this come with the original box?',
              true, (ARRAY['pending','answered','answered','pending'])[(g%4)+1], g,
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- product_questions (seller-side): ensure seller's products have ≥15 questions total
  SELECT COUNT(*) INTO need FROM product_questions q
    JOIN products p ON p.id=q.product_id WHERE p.seller_id=seller_uid;
  IF need < 15 AND seller_prod_ids IS NOT NULL AND array_length(seller_prod_ids,1) > 0 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO product_questions(product_id, asker_id, question, is_public, status, helpful_count, created_at)
      VALUES (seller_prod_ids[ 1 + ((g-1) % array_length(seller_prod_ids,1)) ], buyer_uid,
              'Another buyer question #'||g||': shipping timeline please?',
              true, 'pending', 0,
              NOW() - ((g)||' days')::interval);
    END LOOP;
  END IF;

  -- rewards_transactions
  SELECT COUNT(*) INTO need FROM rewards_transactions WHERE user_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO rewards_transactions(user_id, transaction_type, points, description, expires_at, created_at)
      VALUES (buyer_uid,
              (ARRAY['earned','redeemed','bonus','earned','earned'])[(g%5)+1],
              10 + (g*5),
              'Rewards #'||g||' - '||(ARRAY['order','signup','referral','review','birthday'])[(g%5)+1],
              (CURRENT_DATE + (365||' days')::interval)::date,
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- payment_plans (need an order)
  SELECT COUNT(*) INTO need FROM payment_plans WHERE user_id=buyer_uid;
  IF need < 15 THEN
    g := 0;
    FOR buyer_order_id IN
      SELECT o.id FROM orders o WHERE o.buyer_id=buyer_uid
        AND NOT EXISTS (SELECT 1 FROM payment_plans pp WHERE pp.order_id = o.id)
        ORDER BY o.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM payment_plans WHERE user_id=buyer_uid) >= 15;
      g := g + 1;
      INSERT INTO payment_plans(order_id, user_id, plan_type, total_amount, installment_amount,
                                installments_total, installments_paid, interest_rate, next_payment_date,
                                status, provider, created_at)
      VALUES (buyer_order_id, buyer_uid,
              (ARRAY['pay_in_4','pay_monthly','pay_in_6'])[(g%3)+1],
              (200 + g*30)::numeric,
              ((200 + g*30)/4.0)::numeric,
              4, (g%4), 0.0,
              (CURRENT_DATE + (g*7||' days')::interval)::date,
              (ARRAY['active','active','completed','active'])[(g%4)+1],
              'klarna',
              NOW() - ((g*2)||' days')::interval)
      RETURNING id INTO plan_uid;

      -- add a few installments per plan
      INSERT INTO payment_plan_installments(plan_id, installment_number, amount, due_date, status)
      SELECT plan_uid, i, ((200 + g*30)/4.0)::numeric,
             (CURRENT_DATE + (i*14||' days')::interval)::date,
             (ARRAY['pending','paid','pending','paid'])[(i%4)+1]
      FROM generate_series(1,4) i;
    END LOOP;
  END IF;

  -- support_chats as user (buyer-initiated)
  SELECT COUNT(*) INTO need FROM support_chats WHERE user_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO support_chats(user_id, agent_id, subject, category, status, priority, rating, started_at, ended_at, created_at)
      VALUES (buyer_uid, admin_uid,
              'Buyer chat #'||g||': '||(ARRAY['Order question','Return help','Shipping delay','Payment issue'])[(g%4)+1],
              (ARRAY['order','payment','shipping','return','account','technical','other'])[(g%7)+1],
              (ARRAY['resolved','closed','active','waiting'])[(g%4)+1],
              (ARRAY['low','normal','high','urgent'])[(g%4)+1],
              1 + (g%5),
              NOW() - ((g*3)||' hours')::interval,
              CASE WHEN (g%3)=0 THEN NULL ELSE NOW() - ((g)||' hours')::interval END,
              NOW() - ((g*3)||' hours')::interval);
    END LOOP;
  END IF;

  -- bid_retractions — need a bid by buyer first
  SELECT COUNT(*) INTO need FROM bid_retractions WHERE user_id=buyer_uid;
  IF need < 15 THEN
    g := 0;
    FOR bid_uid, prod_id IN
      SELECT b.id, b.product_id FROM bids b
      WHERE b.bidder_id = buyer_uid
        AND NOT EXISTS (SELECT 1 FROM bid_retractions r WHERE r.bid_id = b.id)
      ORDER BY b.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM bid_retractions WHERE user_id=buyer_uid) >= 15;
      g := g + 1;
      INSERT INTO bid_retractions(bid_id, user_id, product_id, original_amount, reason, explanation, status, created_at)
      VALUES (bid_uid, buyer_uid, prod_id,
              (100 + g*15)::numeric,
              (ARRAY['entered_wrong_amount','seller_changed_description','cannot_contact_seller','other'])[(g%4)+1],
              'Retraction reason #'||g,
              (ARRAY['pending','approved','denied','approved'])[(g%4)+1],
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- category_follows
  SELECT COUNT(*) INTO need FROM category_follows WHERE user_id=buyer_uid;
  IF need < 15 AND cat_ids IS NOT NULL THEN
    FOR g IN 1..LEAST(array_length(cat_ids,1),20) LOOP
      EXIT WHEN (SELECT COUNT(*) FROM category_follows WHERE user_id=buyer_uid) >= 15;
      INSERT INTO category_follows(user_id, category_id)
      VALUES (buyer_uid, cat_ids[g])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- authenticity_requests (buyer role)
  SELECT COUNT(*) INTO need FROM authenticity_requests ar WHERE ar.buyer_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      prod_id := prod_ids[ 1 + ((g-1) % array_length(prod_ids,1)) ];
      INSERT INTO authenticity_requests(product_id, seller_id, buyer_id, item_category, brand, model, declared_value,
                                        auth_center_location, status, created_at)
      VALUES (prod_id, seller_uid, buyer_uid,
              (ARRAY['sneakers','handbags','watches','jewelry','trading-cards','collectibles'])[(g%6)+1],
              (ARRAY['Nike','Gucci','Rolex','Tiffany','Pokemon','Hermes'])[(g%6)+1],
              'Model '||g, (500 + g*50)::numeric,
              'Los Angeles, CA',
              (ARRAY['pending','in_transit','at_authenticator','authenticated','rejected','completed'])[(g%6)+1],
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- disputes (top up to 15 minimum as opened_by=buyer)
  SELECT COUNT(*) INTO need FROM disputes WHERE opened_by=buyer_uid;
  IF need < 15 THEN
    g := 0;
    FOR ord_id IN
      SELECT o.id FROM orders o WHERE o.buyer_id=buyer_uid
        AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.order_id = o.id AND d.opened_by = buyer_uid)
      ORDER BY o.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM disputes WHERE opened_by=buyer_uid) >= 15;
      g := g + 1;
      INSERT INTO disputes(order_id, opened_by, against_user, dispute_type, status, reason, desired_resolution, created_at)
      SELECT ord_id, buyer_uid, o.seller_id,
             (ARRAY['item_not_received','item_not_as_described','unauthorized_purchase','other'])[(g%4)+1],
             (ARRAY['open','under_review','resolved','closed','escalated'])[(g%5)+1],
             'Dispute reason #'||g||' for order',
             (ARRAY['full_refund','replacement','partial_refund','other'])[(g%4)+1],
             NOW() - ((g*3)||' days')::interval
      FROM orders o WHERE o.id = ord_id;
    END LOOP;
  END IF;

  -- returns (top up)
  SELECT COUNT(*) INTO need FROM returns r WHERE r.buyer_id=buyer_uid;
  IF need < 15 THEN
    g := 0;
    FOR ord_id IN
      SELECT o.id FROM orders o WHERE o.buyer_id=buyer_uid
        AND NOT EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)
      ORDER BY o.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM returns r WHERE r.buyer_id=buyer_uid) >= 15;
      g := g + 1;
      INSERT INTO returns(order_id, buyer_id, seller_id, return_reason, return_details, status, refund_amount, refund_type, created_at)
      SELECT o.id, buyer_uid, o.seller_id,
             (ARRAY['changed_mind','defective','not_as_described','wrong_item','arrived_late','other'])[(g%6)+1],
             'Return #'||g, (ARRAY['requested','approved','rejected','shipped','received','refunded','closed'])[(g%7)+1],
             (40 + g*5)::numeric, (ARRAY['full','partial','store_credit'])[(g%3)+1],
             NOW() - ((g*2)||' days')::interval
      FROM orders o WHERE o.id = ord_id;
    END LOOP;
  END IF;

  -- vault_items (top up)
  SELECT COUNT(*) INTO need FROM vault_items WHERE user_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO vault_items(user_id, product_id, item_name, item_description, grading_service, grade,
                              status, estimated_value, insurance_value, submission_date, created_at)
      VALUES (buyer_uid, prod_ids[ 1 + ((g-1) % array_length(prod_ids,1)) ],
              'Vault Item #'||g, 'High value collectible '||g,
              (ARRAY['PSA','BGS','CGC','SGC'])[(g%4)+1],
              (ARRAY['9','9.5','10','8.5','9'])[(g%5)+1],
              (ARRAY['pending','received','graded','stored','shipped_out','listed'])[(g%6)+1],
              (500 + g*100)::numeric, (600 + g*110)::numeric,
              NOW() - ((g*5)||' days')::interval, NOW() - ((g*5)||' days')::interval);
    END LOOP;
  END IF;

  -- gift_cards: guarantee ≥15 rows where buyer is the PURCHASER (what /gift-cards/my returns).
  SELECT COUNT(*) INTO need FROM gift_cards gc WHERE gc.purchased_by=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO gift_cards(code, amount, purchased_by, redeemed_by, recipient_email, message, created_at)
      VALUES ('GC-BUYER-'||g||'-'||substr(md5(random()::text),1,6),
              (25 + g*5)::numeric,
              buyer_uid,
              CASE WHEN (g%3)=0 THEN buyer_uid ELSE NULL END,
              'friend'||g||'@example.com',
              'Gift card message #'||g,
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- api_keys (top up for buyer)
  SELECT COUNT(*) INTO need FROM api_keys WHERE user_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO api_keys(user_id, name, key_hash, key_prefix, scopes, rate_limit_per_min)
      VALUES (buyer_uid, 'Buyer API Key '||g,
              md5('buyer-apikey-'||g||random()::text),
              'ek_bu_'||substr(md5('buy'||g||random()::text),1,6),
              ARRAY['public:read'], 60);
    END LOOP;
  END IF;

  -- listing_templates for buyer (some buyers might also sell)
  SELECT COUNT(*) INTO need FROM listing_templates WHERE user_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO listing_templates(user_id, name, category_id, template_data, is_default, usage_count)
      VALUES (buyer_uid, 'Buyer Template '||g,
              cat_ids[ 1 + ((g-1) % array_length(cat_ids,1)) ],
              jsonb_build_object('title','Draft '||g, 'description','Template body '||g, 'condition','new'),
              (g=1), g);
    END LOOP;
  END IF;

  -- team_members for buyer (buyer as owner)
  SELECT COUNT(*) INTO need FROM team_members WHERE owner_id=buyer_uid;
  IF need < 15 AND user_ids IS NOT NULL THEN
    FOR g IN 1..LEAST(array_length(user_ids,1),20) LOOP
      EXIT WHEN (SELECT COUNT(*) FROM team_members WHERE owner_id=buyer_uid) >= 15;
      INSERT INTO team_members(owner_id, member_id, role, permissions, invited_by, accepted_at, is_active)
      VALUES (buyer_uid, user_ids[g],
              (ARRAY['viewer','editor','manager','admin'])[(g%4)+1],
              jsonb_build_object('read',true,'write',(g%2=0)),
              buyer_uid, NOW() - ((g)||' days')::interval, true)
      ON CONFLICT (owner_id, member_id) DO NOTHING;
    END LOOP;
  END IF;

  -- bundle_discounts owned by buyer (some buyers sell too)
  SELECT COUNT(*) INTO need FROM bundle_discounts bd WHERE bd.seller_id=buyer_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO bundle_discounts(seller_id, name, min_items, discount_percent, is_active, created_at)
      VALUES (buyer_uid, 'Bundle '||g, 2 + (g%4), (5 + g*2)::numeric, true,
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- ============ SELLER ============

  -- live_streams (seller)
  SELECT COUNT(*) INTO need FROM live_streams ls WHERE ls.seller_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO live_streams(seller_id, title, description, status, scheduled_start, category_id, is_featured, created_at)
      VALUES (seller_uid, 'Live Stream '||g, 'Stream description '||g,
              (ARRAY['scheduled','live','ended','scheduled'])[(g%4)+1],
              NOW() + ((g)||' hours')::interval,
              cat_ids[ 1 + ((g-1) % array_length(cat_ids,1)) ],
              (g=1),
              NOW() - ((g)||' days')::interval)
      RETURNING id INTO stream_uid;

      -- add a product to the stream
      IF seller_prod_ids IS NOT NULL AND array_length(seller_prod_ids,1) > 0 THEN
        INSERT INTO live_stream_products(stream_id, product_id, is_featured, display_order)
        VALUES (stream_uid,
                seller_prod_ids[ 1 + ((g-1) % array_length(seller_prod_ids,1)) ],
                (g=1), g)
        ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- vehicles (motors) by seller
  SELECT COUNT(*) INTO need FROM vehicles v WHERE v.seller_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO vehicles(seller_id, vin, year, make, model, trim_level, body_type,
                           engine_type, fuel_type, transmission, drivetrain,
                           horsepower, mileage, exterior_color)
      VALUES (seller_uid,
              substr(md5('vin'||g||random()::text),1,17),
              2015 + (g%10),
              (ARRAY['Toyota','Honda','Ford','BMW','Tesla','Chevrolet','Mazda'])[(g%7)+1],
              (ARRAY['Camry','Civic','F-150','3 Series','Model 3','Silverado','CX-5'])[(g%7)+1],
              (ARRAY['LE','EX','XLT','Sport','Long Range','LT','Touring'])[(g%7)+1],
              (ARRAY['sedan','suv','truck','coupe','hatchback'])[(g%5)+1],
              'V6 3.5L', (ARRAY['gasoline','diesel','electric','hybrid'])[(g%4)+1],
              'automatic', (ARRAY['FWD','AWD','RWD','4WD'])[(g%4)+1],
              200 + g*10, 20000 + g*5000,
              (ARRAY['White','Black','Silver','Red','Blue'])[(g%5)+1])
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;

  -- flash_sales for seller (uses seller's products)
  SELECT COUNT(*) INTO need FROM flash_sales fs WHERE fs.seller_id=seller_uid;
  IF need < 15 AND seller_prod_ids IS NOT NULL AND array_length(seller_prod_ids,1) > 0 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO flash_sales(product_id, seller_id, discount_pct, starts_at, ends_at, max_uses, uses_count, created_at)
      VALUES (seller_prod_ids[ 1 + ((g-1) % array_length(seller_prod_ids,1)) ],
              seller_uid, (10 + g)::numeric,
              NOW() - ((g)||' hours')::interval, NOW() + ((24+g)||' hours')::interval,
              20 + g, (g%5),
              NOW() - ((g)||' hours')::interval);
    END LOOP;
  END IF;

  -- bundle_discounts (seller)
  SELECT COUNT(*) INTO need FROM bundle_discounts bd WHERE bd.seller_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO bundle_discounts(seller_id, name, min_items, discount_percent, is_active, created_at)
      VALUES (seller_uid, 'Seller Bundle '||g, 2 + (g%4), (5 + g*2)::numeric, true,
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- listing_templates (seller)
  SELECT COUNT(*) INTO need FROM listing_templates WHERE user_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO listing_templates(user_id, name, category_id, template_data, is_default, usage_count)
      VALUES (seller_uid, 'Seller Template '||g,
              cat_ids[ 1 + ((g-1) % array_length(cat_ids,1)) ],
              jsonb_build_object('title','Listing Draft '||g, 'description','Seller template '||g, 'condition','new'),
              (g=1), g);
    END LOOP;
  END IF;

  -- coupons owned by seller
  SELECT COUNT(*) INTO need FROM coupons c WHERE c.seller_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO coupons(code, description, discount_type, discount_value, min_purchase_amount,
                          usage_limit, usage_count, per_user_limit, seller_id,
                          start_date, end_date, is_active)
      VALUES ('SELLER'||g||'-'||substr(md5(random()::text),1,6),
              'Seller coupon '||g,
              (ARRAY['percentage','fixed_amount','free_shipping'])[(g%3)+1],
              (5 + g*2)::numeric, 50, 100, g, 1, seller_uid,
              NOW() - ((g)||' days')::interval,
              NOW() + ((30+g)||' days')::interval, true)
      ON CONFLICT (code) DO NOTHING;
    END LOOP;
  END IF;

  -- coupons available to buyer (no seller_id, active)
  SELECT COUNT(*) INTO need FROM coupons c WHERE c.seller_id IS NULL AND c.is_active=true AND c.end_date > NOW();
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO coupons(code, description, discount_type, discount_value, min_purchase_amount,
                          usage_limit, usage_count, per_user_limit,
                          start_date, end_date, is_active)
      VALUES ('PROMO'||g||'-'||substr(md5(random()::text),1,6),
              'Platform coupon '||g,
              (ARRAY['percentage','fixed_amount','free_shipping'])[(g%3)+1],
              (10 + g)::numeric, 0, 1000, 0, 10,
              NOW() - ((g)||' days')::interval,
              NOW() + ((60+g)||' days')::interval, true)
      ON CONFLICT (code) DO NOTHING;
    END LOOP;
  END IF;

  -- api_keys for seller
  SELECT COUNT(*) INTO need FROM api_keys WHERE user_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO api_keys(user_id, name, key_hash, key_prefix, scopes, rate_limit_per_min)
      VALUES (seller_uid, 'Seller API Key '||g,
              md5('seller-apikey-'||g||random()::text),
              'ek_se_'||substr(md5('sel'||g||random()::text),1,6),
              ARRAY['products:write','orders:read'], 120);
    END LOOP;
  END IF;

  -- seller-side returns (fill so seller's Returns page shows ≥15)
  SELECT COUNT(*) INTO need FROM returns r WHERE r.seller_id=seller_uid;
  IF need < 15 THEN
    g := 0;
    FOR ord_id IN
      SELECT o.id FROM orders o WHERE o.seller_id=seller_uid
        AND NOT EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)
      ORDER BY o.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM returns r WHERE r.seller_id=seller_uid) >= 15;
      g := g + 1;
      INSERT INTO returns(order_id, buyer_id, seller_id, return_reason, return_details, status, refund_amount, refund_type, created_at)
      SELECT o.id, o.buyer_id, seller_uid,
             (ARRAY['changed_mind','defective','not_as_described','wrong_item','arrived_late','other'])[(g%6)+1],
             'Seller return #'||g, (ARRAY['requested','approved','shipped','received','refunded'])[(g%5)+1],
             (30 + g*5)::numeric, (ARRAY['full','partial','store_credit'])[(g%3)+1],
             NOW() - ((g*3)||' days')::interval
      FROM orders o WHERE o.id = ord_id;
    END LOOP;
  END IF;

  -- seller-side disputes (against_user=seller)
  SELECT COUNT(*) INTO need FROM disputes d WHERE d.against_user=seller_uid;
  IF need < 15 THEN
    g := 0;
    FOR ord_id IN
      SELECT o.id FROM orders o WHERE o.seller_id=seller_uid
        AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.order_id = o.id)
      ORDER BY o.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM disputes d WHERE d.against_user=seller_uid) >= 15;
      g := g + 1;
      INSERT INTO disputes(order_id, opened_by, against_user, dispute_type, status, reason, desired_resolution, created_at)
      SELECT o.id, o.buyer_id, seller_uid,
             (ARRAY['item_not_received','item_not_as_described','unauthorized_purchase','other'])[(g%4)+1],
             (ARRAY['open','under_review','resolved','escalated'])[(g%4)+1],
             'Seller-side dispute #'||g, (ARRAY['full_refund','replacement','partial_refund','other'])[(g%4)+1],
             NOW() - ((g*2)||' days')::interval
      FROM orders o WHERE o.id = ord_id;
    END LOOP;
  END IF;

  -- authenticity_requests (seller-side) — seller receives requests
  SELECT COUNT(*) INTO need FROM authenticity_requests ar WHERE ar.seller_id=seller_uid;
  IF need < 15 THEN
    FOR g IN 1..(15-need) LOOP
      prod_id := seller_prod_ids[ 1 + ((g-1) % array_length(seller_prod_ids,1)) ];
      INSERT INTO authenticity_requests(product_id, seller_id, buyer_id, item_category, brand, model,
                                        declared_value, auth_center_location, status, created_at)
      VALUES (prod_id, seller_uid, buyer_uid,
              (ARRAY['sneakers','handbags','watches','jewelry','trading-cards'])[(g%5)+1],
              'Brand '||g, 'Model '||g, (500 + g*50)::numeric,
              'Los Angeles, CA',
              (ARRAY['pending','in_transit','at_authenticator','authenticated','completed'])[(g%5)+1],
              NOW() - ((g*2)||' days')::interval);
    END LOOP;
  END IF;

  -- ============ ADMIN ============

  -- bid_retractions pending review (none pending presently)
  SELECT COUNT(*) INTO need FROM bid_retractions WHERE status='pending';
  IF need < 15 AND auction_ids IS NOT NULL AND array_length(auction_ids,1) > 0 THEN
    FOR g IN 1..(15-need) LOOP
      INSERT INTO bid_retractions(bid_id, user_id, product_id, original_amount, reason, explanation, status, created_at)
      SELECT b.id, b.bidder_id, b.product_id, b.bid_amount,
             (ARRAY['entered_wrong_amount','seller_changed_description','cannot_contact_seller','other'])[(g%4)+1],
             'Pending retraction #'||g, 'pending', NOW() - ((g)||' hours')::interval
      FROM bids b
      WHERE NOT EXISTS (SELECT 1 FROM bid_retractions r WHERE r.bid_id = b.id)
      ORDER BY b.created_at DESC
      LIMIT 1;
    END LOOP;
  END IF;

  -- disputes for admin review
  SELECT COUNT(*) INTO need FROM disputes WHERE status IN ('open','under_review','escalated');
  IF need < 15 THEN
    g := 0;
    FOR ord_id IN
      SELECT o.id FROM orders o
        WHERE NOT EXISTS (SELECT 1 FROM disputes d WHERE d.order_id = o.id)
      ORDER BY o.created_at DESC LIMIT 30
    LOOP
      EXIT WHEN (SELECT COUNT(*) FROM disputes WHERE status IN ('open','under_review','escalated')) >= 15;
      g := g + 1;
      INSERT INTO disputes(order_id, opened_by, against_user, dispute_type, status, reason, desired_resolution, created_at)
      SELECT o.id, o.buyer_id, o.seller_id,
             (ARRAY['item_not_received','item_not_as_described','unauthorized_purchase'])[(g%3)+1],
             (ARRAY['open','under_review','escalated'])[(g%3)+1],
             'Admin-visible dispute #'||g, 'full_refund',
             NOW() - ((g*2)||' days')::interval
      FROM orders o WHERE o.id = ord_id;
    END LOOP;
  END IF;

  -- Ensure seller has a seller_store (seller slug must be unique, so use per-user)
  INSERT INTO seller_stores(user_id, store_name, store_slug, tagline, description)
  SELECT seller_uid, 'Seller Store', 'seller-store-'||substr(md5(seller_uid::text),1,8), 'Test seller store', 'Auto-seeded'
  WHERE NOT EXISTS (SELECT 1 FROM seller_stores WHERE user_id = seller_uid);
END $$;

COMMIT;

