-- Backfill every per-user feature so EVERY user has >=15 rows.
-- Idempotent: uses COUNT guards and ON CONFLICT DO NOTHING for unique indexes.
-- Run after seed_fill_features.sql.

BEGIN;

-- Helper: ensure we have products to reference and they aren't owned by the same user
-- for watchlist/alerts/follows scenarios.

-- ===================================================================
-- watchlist  (unique: user_id, product_id)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod_ids UUID[]; i INT;
BEGIN
  SELECT array_agg(id) INTO prod_ids FROM products LIMIT 90;
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM watchlist WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..array_length(prod_ids,1) LOOP
      EXIT WHEN need <= 0;
      INSERT INTO watchlist (user_id, product_id)
        VALUES (u.id, prod_ids[i])
        ON CONFLICT (user_id, product_id) DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM watchlist WHERE user_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- recently_viewed  (unique: user_id, product_id)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod_ids UUID[]; i INT;
BEGIN
  SELECT array_agg(id) INTO prod_ids FROM products LIMIT 90;
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM recently_viewed WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..array_length(prod_ids,1) LOOP
      EXIT WHEN need <= 0;
      INSERT INTO recently_viewed (user_id, product_id, view_count, first_viewed_at, last_viewed_at)
        VALUES (u.id, prod_ids[i], 1+(i%5), NOW()-(INTERVAL '1 day' * i), NOW()-(INTERVAL '1 hour' * i))
        ON CONFLICT (user_id, product_id) DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM recently_viewed WHERE user_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- price_alerts  (unique: user_id, product_id)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod RECORD; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM price_alerts WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT id, COALESCE(current_price, buy_now_price, starting_price, 50) AS price FROM products ORDER BY id LIMIT 90 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO price_alerts (user_id, product_id, target_price, alert_on_any_drop, is_active)
        VALUES (u.id, prod.id, ROUND((prod.price * 0.85)::numeric, 2), (i%2=0), TRUE)
        ON CONFLICT (user_id, product_id) DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM price_alerts WHERE user_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- seller_follows  (unique: follower_id, seller_id; can't follow self)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; s RECORD;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM seller_follows WHERE follower_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR s IN SELECT id FROM users WHERE id <> u.id AND is_seller = TRUE LOOP
      EXIT WHEN need <= 0;
      INSERT INTO seller_follows (follower_id, seller_id)
        VALUES (u.id, s.id)
        ON CONFLICT DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM seller_follows WHERE follower_id=u.id);
    END LOOP;
    -- if not enough sellers, fall back to any other user
    FOR s IN SELECT id FROM users WHERE id <> u.id LOOP
      EXIT WHEN need <= 0;
      INSERT INTO seller_follows (follower_id, seller_id)
        VALUES (u.id, s.id)
        ON CONFLICT DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM seller_follows WHERE follower_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- addresses  (no unique user constraint; add distinct shipping addrs)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  cities TEXT[] := ARRAY['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis','Seattle','Denver','Washington','Boston'];
  states TEXT[] := ARRAY['NY','CA','IL','TX','AZ','PA','TX','CA','TX','CA','TX','FL','TX','OH','NC','IN','WA','CO','DC','MA'];
BEGIN
  FOR u IN SELECT id, first_name, last_name FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM addresses WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO addresses (user_id, address_type, is_default, full_name, street_address, city, state, postal_code, country, phone)
        VALUES (
          u.id,
          (ARRAY['shipping','billing','both'])[1 + (i % 3)],
          FALSE,
          COALESCE(u.first_name,'Test')||' '||COALESCE(u.last_name,'User'),
          (100 + i)::text || ' Main St Apt ' || i,
          cities[1 + (i % 20)],
          states[1 + (i % 20)],
          LPAD((10000 + i * 7)::text, 5, '0'),
          'US',
          '555-01' || LPAD(i::text, 2, '0')
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- payment_methods
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  types TEXT[] := ARRAY['credit_card','debit_card','paypal','bank_account'];
  brands TEXT[] := ARRAY['Visa','Mastercard','Amex','Discover'];
BEGIN
  FOR u IN SELECT id, email FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM payment_methods WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO payment_methods (user_id, payment_type, card_last_four, card_brand, card_exp_month, card_exp_year, paypal_email, bank_name, bank_account_last_four)
        VALUES (
          u.id,
          types[1 + (i % 4)],
          LPAD((1234 + i)::text, 4, '0'),
          brands[1 + (i % 4)],
          1 + (i % 12),
          2028 + (i % 5),
          'paypal+'||i||'@'||u.email,
          (ARRAY['Chase','Bank of America','Wells Fargo','Citi'])[1 + (i % 4)],
          LPAD((5000 + i)::text, 4, '0')
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- saved_searches
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  queries TEXT[] := ARRAY['iphone','macbook','vintage camera','sneakers','watch','designer bag','guitar','tent','drone','lego','nike','ps5','bicycle','ring','art print','baseball card','record','coffee machine','headphones','hiking boots'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM saved_searches WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO saved_searches (user_id, name, search_query, min_price, max_price, email_alerts, alert_frequency)
        VALUES (
          u.id,
          'Saved: '||queries[1+(i%20)]||' #'||i,
          queries[1 + (i % 20)],
          10 + i,
          500 + i * 25,
          (i%2=0),
          (ARRAY['daily','weekly','instant'])[1 + (i % 3)]
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- collections
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  names TEXT[] := ARRAY['Wishlist','Favorites','Gift ideas','Tech','Vintage','Seasonal','Home','Office','Travel','Garage','Sports','Collectibles','Books','Music','Kitchen','Kids','Pet','Garden','Emergency','Party'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM collections WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO collections (user_id, name, description, is_public)
        VALUES (
          u.id,
          names[1 + (i % 20)]||' '||i,
          'Auto-seeded collection #'||i,
          (i%2=0)
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- messages  (ensure each user participates in >=15 messages, in either side)
-- ===================================================================
DO $$
DECLARE u RECORD; other RECORD; need INT; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM messages WHERE sender_id=u.id OR recipient_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR other IN SELECT id FROM users WHERE id <> u.id ORDER BY created_at LIMIT 30 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO messages (sender_id, recipient_id, subject, body, is_read)
        VALUES (
          CASE WHEN i%2=0 THEN u.id ELSE other.id END,
          CASE WHEN i%2=0 THEN other.id ELSE u.id END,
          'Conversation #'||i,
          'Auto-seeded message body for user conversation. Iteration '||i||'.',
          (i%3=0)
        );
      need := 15 - (SELECT COUNT(*) FROM messages WHERE sender_id=u.id OR recipient_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- notifications
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  types TEXT[] := ARRAY['bid_outbid','bid_won','auction_ending','item_sold','order_update','message','review','price_drop','watchlist','promotion'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM notifications WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO notifications (user_id, type, title, message, link, is_read)
        VALUES (
          u.id,
          types[1 + (i % 10)],
          'Notification #'||i,
          'You have a new update — auto-seeded entry '||i,
          '/',
          (i%3=0)
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- bids  (use auction listings if available, else any product;
--        bidder cannot be seller of product)
-- ===================================================================
DO $$
DECLARE u RECORD; prod RECORD; need INT; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM bids WHERE bidder_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT p.id, COALESCE(p.current_price, p.buy_now_price, p.starting_price, 50) AS price, p.seller_id FROM products p WHERE p.seller_id <> u.id LIMIT 50 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning, is_auto_bid, created_at)
        VALUES (
          prod.id, u.id,
          ROUND((COALESCE(prod.price,50) * (0.8 + (i * 0.01)))::numeric, 2),
          FALSE, (i%3=0),
          NOW() - (INTERVAL '1 hour' * i)
        );
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- offers  (buyer != seller)
-- ===================================================================
DO $$
DECLARE u RECORD; prod RECORD; need INT; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM offers WHERE buyer_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT p.id, COALESCE(p.current_price, p.buy_now_price, p.starting_price, 50) AS price, p.seller_id FROM products p WHERE p.seller_id <> u.id LIMIT 50 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO offers (product_id, buyer_id, seller_id, offer_amount, quantity, message, status, expires_at)
        VALUES (
          prod.id, u.id, prod.seller_id,
          ROUND((COALESCE(prod.price,50) * 0.7)::numeric, 2),
          1,
          'Would you take this price?',
          (ARRAY['pending','pending','accepted','declined','countered','expired'])[1 + (i % 6)],
          NOW() + INTERVAL '7 days'
        );
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- orders + order_items  (buyer_id = u; seller_id from product)
-- ===================================================================
DO $$
DECLARE u RECORD; prod RECORD; need INT; i INT;
  subt NUMERIC; shipc NUMERIC; taxv NUMERIC; totv NUMERIC;
  ord_id UUID;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM orders WHERE buyer_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT p.id AS pid, COALESCE(p.current_price, p.buy_now_price, p.starting_price, 25) AS price, p.seller_id FROM products p WHERE p.seller_id <> u.id LIMIT 50 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      subt := ROUND(COALESCE(prod.price, 25.00)::numeric, 2);
      shipc := 7.99;
      taxv := ROUND(subt * 0.08, 2);
      totv := subt + shipc + taxv;
      INSERT INTO orders (order_number, buyer_id, seller_id, subtotal, shipping_cost, tax, total, status, payment_status, created_at)
        VALUES (
          'PU-' || substring(u.id::text,1,6) || '-' || substring(gen_random_uuid()::text,1,6) || '-' || i,
          u.id, prod.seller_id, subt, shipc, taxv, totv,
          (ARRAY['pending','confirmed','processing','shipped','delivered'])[1 + (i % 5)],
          (ARRAY['pending','completed','completed','completed','completed'])[1 + (i % 5)],
          NOW() - (INTERVAL '1 day' * (i * 2))
        )
        RETURNING id INTO ord_id;

      INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (ord_id, prod.pid, 1, subt, subt);

      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- reviews  (given by user; reviewer=u; review_type in product|seller|buyer)
-- ===================================================================
DO $$
DECLARE u RECORD; prod RECORD; need INT; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM reviews WHERE reviewer_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT p.id AS pid, p.seller_id FROM products p WHERE p.seller_id <> u.id LIMIT 50 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO reviews (product_id, reviewed_user_id, reviewer_id, review_type, rating, title, comment, is_verified_purchase)
        VALUES (
          prod.pid, prod.seller_id, u.id,
          (ARRAY['product','product','seller'])[1 + (i % 3)],
          1 + (i % 5),
          'Review #'||i,
          'Auto-seeded review '||i||'. Product was as described.',
          (i%2=0)
        );
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- coupon_usage  (unique: coupon_id, user_id, order_id)
-- ===================================================================
DO $$
DECLARE u RECORD; coup RECORD; need INT; ord_id UUID; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM coupon_usage WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR coup IN SELECT id FROM coupons LIMIT 20 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      SELECT id INTO ord_id FROM orders WHERE buyer_id=u.id ORDER BY created_at DESC OFFSET (i % 15) LIMIT 1;
      INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
        VALUES (coup.id, u.id, ord_id, ROUND((5 + i * 1.1)::numeric, 2))
        ON CONFLICT (coupon_id, user_id, order_id) DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM coupon_usage WHERE user_id=u.id);
    END LOOP;
    -- fallback: if still not enough (few coupons), loop with NULL order_id once per coupon
    -- (unique allows one NULL order_id row per (coupon, user))
  END LOOP;
END $$;

-- ===================================================================
-- vault_items
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  services TEXT[] := ARRAY['PSA','BGS','CGC','SGC','none'];
  statuses TEXT[] := ARRAY['pending','shipped_to_vault','received','grading','graded','stored','shipping_out','delivered'];
  grades   TEXT[] := ARRAY['10','9.5','9','8.5','8','7.5','PR','GEM MT','MINT','NM'];
  names    TEXT[] := ARRAY['1998 Pokemon Charizard','Michael Jordan Rookie','Ken Griffey Jr Rookie','Tom Brady Rookie','LeBron James Rookie','Amazing Spider-Man #1','Action Comics #1','Detective Comics #27','Superman #1','Batman #1','Pokemon Blastoise','Pokemon Venusaur','Mickey Mantle Card','Hank Aaron Card','Babe Ruth Card','Jackie Robinson Card','1952 Topps','Magic Black Lotus','Pikachu Illustrator','Tiger Woods Rookie'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM vault_items WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO vault_items (user_id, item_name, item_description, grading_service, grade, cert_number, status, vault_location, estimated_value, insurance_value, submission_date)
        VALUES (
          u.id,
          names[1 + (i % 20)] || ' #' || i,
          'Auto-seeded vault item ' || i,
          services[1 + (i % 5)],
          grades[1 + (i % 10)],
          'CERT-' || substring(u.id::text,1,4) || '-' || LPAD(i::text,6,'0'),
          statuses[1 + (i % 8)],
          'Vault-Aisle-' || (1 + (i % 12)),
          ROUND((100 + i * 47.3)::numeric, 2),
          ROUND((120 + i * 50)::numeric, 2),
          NOW() - (INTERVAL '1 day' * i * 3)
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- listing_templates
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM listing_templates WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO listing_templates (user_id, name, template_data, is_default, usage_count)
        VALUES (
          u.id,
          'Template ' || i || ' (' || (ARRAY['Electronics','Fashion','Home','Collectibles','Sports'])[1+(i%5)] || ')',
          jsonb_build_object(
            'title','Sample listing title '||i,
            'condition',(ARRAY['new','used','refurbished'])[1+(i%3)],
            'shipping',(ARRAY['standard','expedited','free'])[1+(i%3)],
            'price', 25 + i * 3
          ),
          (i=1),
          i * 2
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- bid_retractions  (need an existing bid by this user)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; b RECORD; i INT;
  reasons TEXT[] := ARRAY['entered_wrong_amount','seller_changed_description','cannot_contact_seller','other'];
  statuses TEXT[] := ARRAY['pending','approved','denied'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM bid_retractions WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR b IN SELECT id, product_id, bid_amount FROM bids WHERE bidder_id=u.id ORDER BY created_at DESC LIMIT 20 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      -- skip bids that already have a retraction (one per bid makes sense)
      IF EXISTS (SELECT 1 FROM bid_retractions WHERE bid_id=b.id) THEN CONTINUE; END IF;
      INSERT INTO bid_retractions (bid_id, user_id, product_id, original_amount, reason, explanation, status)
        VALUES (
          b.id, u.id, b.product_id, b.bid_amount,
          reasons[1 + (i % 4)],
          'Auto-seeded retraction #'||i,
          statuses[1 + (i % 3)]
        );
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- rewards_transactions
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  types TEXT[] := ARRAY['earned','earned','earned','redeemed','bonus','adjustment'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM rewards_transactions WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO rewards_transactions (user_id, transaction_type, points, description, expires_at)
        VALUES (
          u.id,
          types[1 + (i % 6)],
          CASE WHEN types[1 + (i % 6)] = 'redeemed' THEN -(50 + i * 5) ELSE 50 + i * 7 END,
          'Reward transaction #' || i,
          CURRENT_DATE + (365 - (i*10))
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- payment_plans  (needs order_id)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; ord RECORD; i INT;
  ptypes TEXT[] := ARRAY['pay_in_4','pay_monthly','pay_in_6'];
  pstats TEXT[] := ARRAY['active','active','completed','cancelled'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM payment_plans WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR ord IN SELECT id, total FROM orders WHERE buyer_id=u.id ORDER BY created_at DESC LIMIT 20 LOOP
      EXIT WHEN need <= 0;
      -- one plan per order
      IF EXISTS (SELECT 1 FROM payment_plans WHERE order_id=ord.id) THEN CONTINUE; END IF;
      i := i + 1;
      INSERT INTO payment_plans (order_id, user_id, plan_type, total_amount, installment_amount, installments_total, installments_paid, status, next_payment_date)
        VALUES (
          ord.id, u.id,
          ptypes[1 + (i % 3)],
          ord.total,
          ROUND((ord.total / 4.0)::numeric, 2),
          4,
          (i % 4),
          pstats[1 + (i % 4)],
          CURRENT_DATE + (7 * (i % 6))
        );
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- credit_transactions
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  reasons TEXT[] := ARRAY['topup','refund','purchase','referral','bonus','adjustment'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM credit_transactions WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO credit_transactions (user_id, amount, reason)
        VALUES (
          u.id,
          CASE WHEN i%2=0 THEN ROUND((5 + i * 0.75)::numeric,2) ELSE -ROUND((3 + i * 0.5)::numeric,2) END,
          reasons[1 + (i % 6)]
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- social_shares
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod RECORD; i INT;
  platforms TEXT[] := ARRAY['facebook','twitter','pinterest','linkedin','whatsapp','email','copy_link'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM social_shares WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT id FROM products ORDER BY id LIMIT 30 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO social_shares (product_id, user_id, platform, share_url, click_count)
        VALUES (
          prod.id, u.id,
          platforms[1 + (i % 7)],
          'https://example.com/s/'||substring(gen_random_uuid()::text,1,8),
          i * 3
        );
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- api_keys
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT; kh TEXT; kp TEXT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM api_keys WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      kh := md5(random()::text || u.id::text || i::text);
      kp := 'sk_' || substring(md5(random()::text),1,8);
      INSERT INTO api_keys (user_id, name, key_hash, key_prefix, scopes, rate_limit_per_min)
        VALUES (
          u.id,
          'Key #'||i||' ('||(ARRAY['dev','staging','prod','test','webhooks'])[1+(i%5)]||')',
          kh,
          kp,
          (ARRAY['read','write','admin'])[1:(1 + (i % 3))],
          60 + (i * 10)
        )
        ON CONFLICT (key_hash) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- bulk_uploads
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  statuses TEXT[] := ARRAY['pending','processing','completed','failed'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM bulk_uploads WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO bulk_uploads (user_id, filename, status, total_rows, processed_rows, successful_rows, failed_rows)
        VALUES (
          u.id,
          'import-'||to_char(NOW() - (INTERVAL '1 day' * i), 'YYYYMMDD')||'-'||i||'.csv',
          statuses[1 + (i % 4)],
          50 + i * 10,
          50 + i * 10 - (i % 3),
          50 + i * 10 - (i % 5),
          (i % 5)
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- support_chats
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT; ag_id UUID;
  cats TEXT[] := ARRAY['order','payment','shipping','return','account','technical','other'];
  prios TEXT[] := ARRAY['low','normal','high','urgent'];
  stats TEXT[] := ARRAY['waiting','active','resolved','closed'];
BEGIN
  SELECT id INTO ag_id FROM support_agents LIMIT 1;
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM support_chats WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO support_chats (user_id, agent_id, subject, category, priority, status, rating, feedback)
        VALUES (
          u.id, ag_id,
          'Question #'||i||' about '||cats[1+(i%7)],
          cats[1 + (i % 7)],
          prios[1 + (i % 4)],
          stats[1 + (i % 4)],
          1 + (i % 5),
          'Auto-seeded feedback '||i
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- user_recommendations  (unique user,product)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod RECORD; i INT;
  reasons TEXT[] := ARRAY['similar','trending','viewed_together','price_match','favorite_seller','category_match','new_arrival'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM user_recommendations WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT id FROM products ORDER BY id LIMIT 90 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO user_recommendations (user_id, product_id, recommendation_reason, score, is_viewed)
        VALUES (
          u.id, prod.id,
          reasons[1 + (i % 7)],
          ROUND((0.4 + (i * 0.03))::numeric, 2),
          (i % 3 = 0)
        )
        ON CONFLICT (user_id, product_id) DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM user_recommendations WHERE user_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- cart_reservations  (unique user,product)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod RECORD; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM cart_reservations WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT id FROM products ORDER BY id LIMIT 90 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
        VALUES (u.id, prod.id, 1 + (i % 3), NOW() + (INTERVAL '15 minutes' * (i+1)))
        ON CONFLICT (user_id, product_id) DO NOTHING;
      need := 15 - (SELECT COUNT(*) FROM cart_reservations WHERE user_id=u.id);
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- category_follows  (unique user,category; capped by # categories)
-- Only 15 categories exist, so each user can follow them all.
-- ===================================================================
DO $$
DECLARE u RECORD; cat RECORD;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    FOR cat IN SELECT id FROM categories LOOP
      INSERT INTO category_follows (user_id, category_id)
        VALUES (u.id, cat.id)
        ON CONFLICT (user_id, category_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- auction_chat_messages  (needs auction product; 15 per user)
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; prod RECORD; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM auction_chat_messages WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    i := 0;
    FOR prod IN SELECT id FROM products WHERE listing_type IN ('auction','both') ORDER BY id LIMIT 30 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO auction_chat_messages (product_id, user_id, message)
        VALUES (prod.id, u.id, 'Is this still available? (msg '||i||')');
      need := need - 1;
    END LOOP;
    -- fallback: any product if not enough auctions
    FOR prod IN SELECT id FROM products ORDER BY id LIMIT 30 LOOP
      EXIT WHEN need <= 0;
      i := i + 1;
      INSERT INTO auction_chat_messages (product_id, user_id, message)
        VALUES (prod.id, u.id, 'Interested in bidding, message '||i);
      need := need - 1;
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- ai_message_suggestions
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  feedbacks TEXT[] := ARRAY['helpful','not_helpful','edited'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM ai_message_suggestions WHERE user_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO ai_message_suggestions (user_id, original_message, suggested_reply, context, used, feedback)
        VALUES (
          u.id,
          'Original buyer question #'||i,
          'AI-suggested reply: Thanks for your interest! Happy to help with item '||i,
          jsonb_build_object('type','reply','tone','friendly'),
          (i%2=0),
          feedbacks[1 + (i % 3)]
        );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- coupons (seller-owned) — 15 per user split across Active / Inactive / Expired
-- so all three tabs on the Coupons page are populated.
-- ===================================================================
DO $$
DECLARE u RECORD; need INT; i INT;
  types TEXT[] := ARRAY['percentage','fixed_amount'];
  kinds TEXT[] := ARRAY[
    'active','active','active','active','active','active',
    'inactive','inactive','inactive','inactive','inactive',
    'expired','expired','expired','expired'
  ];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM coupons WHERE seller_id=u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, usage_limit, usage_count, per_user_limit, seller_id, start_date, end_date, is_active)
      VALUES (
        'USR-' || substring(u.id::text,1,4) || '-' || UPPER(substring(md5(random()::text),1,5)) || i,
        kinds[1 + ((i-1) % 15)] || ' coupon #' || i,
        types[1 + (i % 2)],
        CASE WHEN (i % 2) = 0 THEN 5 + i ELSE 10 + (i % 30) END,
        CASE WHEN i%3=0 THEN 25 ELSE 0 END,
        100,
        (i % 20),
        CASE WHEN i%4=0 THEN 3 ELSE 1 END,
        u.id,
        CASE kinds[1 + ((i-1) % 15)]
          WHEN 'expired' THEN NOW() - INTERVAL '60 days'
          ELSE NOW() - INTERVAL '5 days'
        END,
        CASE kinds[1 + ((i-1) % 15)]
          WHEN 'expired' THEN NOW() - INTERVAL '2 days'
          ELSE NOW() + INTERVAL '30 days'
        END,
        CASE kinds[1 + ((i-1) % 15)]
          WHEN 'inactive' THEN FALSE
          ELSE TRUE
        END
      );
    END LOOP;
  END LOOP;
END $$;

-- ===================================================================
-- wallet_ledger — 15 entries per user (mixed credits/debits) so every
-- login (buyer or seller demo account) has a populated Wallet page.
-- Also writes/refreshes the user_wallets row so balance reconciles
-- with the final balance_after.
-- ===================================================================
DO $$
DECLARE
  u            RECORD;
  need         INT;
  i            INT;
  bal          NUMERIC(10,2);
  amt          NUMERIC(10,2);
  reason_v     VARCHAR(60);
  note_v       TEXT;
  entries_made INT;
  start_at     TIMESTAMP;
  reasons      TEXT[] := ARRAY[
    'credit:topup',  'credit:refund', 'credit:promo',
    'credit:referral','credit:cashback',
    'debit:purchase', 'debit:fee',    'debit:withdraw'
  ];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM wallet_ledger WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;

    -- Anchor balance off any existing ledger; start fresh otherwise.
    -- We must also place new entries AFTER any existing ledger row so the
    -- "most recent" entry shown to the user matches user_wallets.balance.
    SELECT balance_after, created_at
      INTO bal, start_at
    FROM wallet_ledger
    WHERE user_id = u.id
    ORDER BY created_at DESC
    LIMIT 1;
    IF bal IS NULL THEN
      bal := 50.00;
      start_at := NOW() - (need || ' hours')::INTERVAL;
    ELSE
      -- begin one hour after the last existing entry so chronology stays right
      start_at := start_at + INTERVAL '1 hour';
    END IF;

    entries_made := 0;

    FOR i IN 1..need LOOP
      reason_v := reasons[1 + ((i - 1) % array_length(reasons, 1))];
      amt := ROUND(((10 + (i * 7) % 90))::NUMERIC, 2);
      IF reason_v LIKE 'debit:%' THEN
        -- never let balance go negative (constraint check on user_wallets)
        IF bal - amt < 0 THEN
          amt := LEAST(amt, GREATEST(bal - 1, 0));
          IF amt = 0 THEN
            -- fall back to a credit so we still log an entry
            reason_v := 'credit:promo';
            amt := 10.00;
            bal := bal + amt;
          ELSE
            amt := -amt;       -- mark as debit
            bal := bal + amt;  -- subtract
          END IF;
        ELSE
          amt := -amt;
          bal := bal + amt;
        END IF;
      ELSE
        bal := bal + amt;
      END IF;

      note_v := CASE
        WHEN reason_v = 'credit:topup'    THEN 'Manual top-up #' || i
        WHEN reason_v = 'credit:refund'   THEN 'Order refund #' || i
        WHEN reason_v = 'credit:promo'    THEN 'Promotional credit #' || i
        WHEN reason_v = 'credit:referral' THEN 'Referral bonus #' || i
        WHEN reason_v = 'credit:cashback' THEN 'Cashback reward #' || i
        WHEN reason_v = 'debit:purchase' THEN 'Order checkout #' || i
        WHEN reason_v = 'debit:fee'      THEN 'Service fee #' || i
        WHEN reason_v = 'debit:withdraw' THEN 'Withdrawal #' || i
        ELSE 'Ledger entry #' || i
      END;

      INSERT INTO wallet_ledger
        (user_id, amount, balance_after, reason, note, created_at)
      VALUES
        (u.id, amt, bal, reason_v, note_v,
         start_at + (entries_made || ' hours')::INTERVAL * 6);

      entries_made := entries_made + 1;
    END LOOP;

    -- Reconcile user_wallets to the final running balance.
    INSERT INTO user_wallets (user_id, balance, updated_at)
      VALUES (u.id, bal, NOW())
    ON CONFLICT (user_id) DO UPDATE
      SET balance = EXCLUDED.balance,
          updated_at = NOW();
  END LOOP;
END $$;

COMMIT;
