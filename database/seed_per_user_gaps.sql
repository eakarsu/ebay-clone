-- ===================================================================
-- Per-user GAP fill: tables that the previous per-user seed missed.
-- Every user (all 20 — buyers, sellers, admin, demo accounts) gets
-- >=15 rows in every table below. Idempotent: each block guards on
-- COUNT(*) < 15.
--
-- This file deliberately SKIPS tables that are semantically singletons
-- per user (notification_preferences, two_factor_auth, user_wallets,
-- shopping_carts, stripe_customers, etc.) and pure system/security
-- buckets (token_blacklist, password_reset_tokens, error_logs).
-- ===================================================================
BEGIN;

-- ---- bid_velocity_log -------------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT; pid UUID;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM bid_velocity_log WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      SELECT id INTO pid FROM products ORDER BY random() LIMIT 1;
      INSERT INTO bid_velocity_log (user_id, product_id, ip, created_at)
      VALUES (u.id, pid,
              ('10.' || (i % 250) || '.' || ((i * 7) % 250) || '.' || ((i * 13) % 250))::inet,
              NOW() - (i || ' hours')::INTERVAL);
    END LOOP;
  END LOOP;
END $$;

-- ---- collection_followers --------------------------------------------
-- Each user follows 15 collections owned by other users.
DO $$
DECLARE u RECORD; need INT; coll RECORD;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM collection_followers WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR coll IN
      SELECT id FROM collections
      WHERE user_id <> u.id
        AND id NOT IN (SELECT collection_id FROM collection_followers WHERE user_id = u.id)
      ORDER BY random()
      LIMIT need
    LOOP
      INSERT INTO collection_followers (collection_id, user_id, followed_at)
      VALUES (coll.id, u.id, NOW() - (random() * INTERVAL '90 days'))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ---- email_logs ------------------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT;
  types TEXT[] := ARRAY[
    'order_confirmation','shipping_notification','delivery_confirmation',
    'password_reset','promotional','outbid','auction_won','auction_ending',
    'review_request','message_received','wallet_topup','refund_issued'
  ];
  subjects TEXT[] := ARRAY[
    'Your order is confirmed','Your item has shipped','Your item arrived',
    'Reset your password','Special offer just for you','You''ve been outbid',
    'Congratulations! You won','Auction ending soon',
    'Leave a review','New message from a seller','Funds added to your wallet','Refund processed'
  ];
BEGIN
  FOR u IN SELECT id, email FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM email_logs WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO email_logs (user_id, email_type, recipient_email, subject, status, created_at)
      VALUES (
        u.id,
        types[1 + ((i - 1) % array_length(types, 1))],
        u.email,
        subjects[1 + ((i - 1) % array_length(subjects, 1))] || ' #' || i,
        CASE WHEN i % 11 = 0 THEN 'failed' ELSE 'sent' END,
        NOW() - (i || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- events (analytics) ----------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT; pid UUID;
  names TEXT[] := ARRAY[
    'page_view','product_view','search_performed','add_to_cart',
    'add_to_watchlist','checkout_started','purchase','signup',
    'bid_placed','offer_made','share_clicked','filter_applied'
  ];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM events WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      SELECT id INTO pid FROM products ORDER BY random() LIMIT 1;
      INSERT INTO events (event_name, user_id, session_id, product_id, properties, occurred_at)
      VALUES (
        names[1 + ((i - 1) % array_length(names, 1))],
        u.id,
        'sess-' || SUBSTRING(md5(u.id::text || i::text), 1, 10),
        pid,
        jsonb_build_object('idx', i, 'source', 'seed'),
        NOW() - (i || ' hours')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- experiment_assignments ------------------------------------------
-- Unique constraint (experiment_key, user_id) means each user can only
-- be assigned to a given experiment once. We use 15 distinct synthetic
-- keys so every user has exactly 15 assignments without colliding.
DO $$
DECLARE u RECORD; need INT; i INT;
  variants TEXT[] := ARRAY['control','variant_a','variant_b'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM experiment_assignments WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO experiment_assignments (experiment_key, user_id, session_id, variant, assigned_at)
      VALUES (
        'seed_exp_' || i,
        u.id,
        'sess-' || SUBSTRING(md5(u.id::text || i::text), 1, 12),
        variants[1 + ((i - 1) % 3)],
        NOW() - (i || ' days')::INTERVAL
      )
      ON CONFLICT (experiment_key, user_id) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ---- experiment_conversions ------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT;
  exp_keys TEXT[] := ARRAY[
    'homepage_v2','search_ranking','checkout_flow','price_display','recs_algorithm'
  ];
  variants TEXT[] := ARRAY['control','variant_a','variant_b'];
  goals    TEXT[] := ARRAY['signup','purchase','add_to_cart','click_through','watchlist_add'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM experiment_conversions WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO experiment_conversions (experiment_key, variant, user_id, session_id, goal, value, occurred_at)
      VALUES (
        exp_keys[1 + ((i - 1) % array_length(exp_keys, 1))],
        variants[1 + ((i - 1) % 3)],
        u.id,
        'sess-' || SUBSTRING(md5(u.id::text || i::text), 1, 10),
        goals[1 + ((i - 1) % array_length(goals, 1))],
        ROUND((10 + (i * 11) % 80)::NUMERIC, 2),
        NOW() - (i || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- group_buy_commitments -------------------------------------------
-- Each user commits to 15 distinct group buys (random selection).
DO $$
DECLARE u RECORD; need INT; gb RECORD;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM group_buy_commitments WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR gb IN
      SELECT id FROM group_buys
      WHERE id NOT IN (SELECT group_buy_id FROM group_buy_commitments WHERE user_id = u.id)
      ORDER BY random()
      LIMIT need
    LOOP
      INSERT INTO group_buy_commitments (group_buy_id, user_id, quantity, created_at)
      VALUES (gb.id, u.id, 1 + (random() * 4)::INT, NOW() - (random() * INTERVAL '60 days'));
    END LOOP;
  END LOOP;
END $$;

-- ---- live_chat_messages ----------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT; sid UUID;
  msgs TEXT[] := ARRAY[
    'Looks great!','Is this still available?','Wow, I want one!',
    'Can you ship internationally?','How long is the warranty?',
    'Just bought it 🎉','First time watching, hi!','Price is fair',
    'Show the back side please','Is it new or refurbished?',
    'Great deal','Following the seller','Bidding now','Sold!','Loved this stream'
  ];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM live_chat_messages WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      SELECT id INTO sid FROM live_streams ORDER BY random() LIMIT 1;
      INSERT INTO live_chat_messages (stream_id, user_id, message, created_at)
      VALUES (
        sid, u.id,
        msgs[1 + ((i - 1) % array_length(msgs, 1))],
        NOW() - (i || ' hours')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- payment_transactions --------------------------------------------
-- Tied to orders. For each user, generate transactions against their
-- own orders (as buyer) until they have >=15. If a user has fewer than
-- 15 orders, reuse them — payment_transactions has no uniqueness on order_id.
DO $$
DECLARE u RECORD; need INT; i INT; oid UUID;
  statuses TEXT[] := ARRAY['succeeded','succeeded','succeeded','succeeded','pending','failed'];
  methods  TEXT[] := ARRAY['card','card','card','paypal','wallet','apple_pay','google_pay'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM payment_transactions WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      -- Prefer the user's own orders; fall back to any order if none exist.
      SELECT id INTO oid FROM orders WHERE buyer_id = u.id ORDER BY random() LIMIT 1;
      IF oid IS NULL THEN
        SELECT id INTO oid FROM orders ORDER BY random() LIMIT 1;
      END IF;
      INSERT INTO payment_transactions (
        order_id, user_id, stripe_payment_intent_id, stripe_charge_id,
        amount, currency, status, payment_method_type, receipt_url, created_at
      ) VALUES (
        oid, u.id,
        'pi_' || SUBSTRING(md5(u.id::text || i::text), 1, 24),
        'ch_' || SUBSTRING(md5('charge' || u.id::text || i::text), 1, 24),
        ROUND((25 + (i * 13) % 200)::NUMERIC, 2),
        'usd',
        statuses[1 + ((i - 1) % array_length(statuses, 1))],
        methods[1 + ((i - 1) % array_length(methods, 1))],
        'https://stripe.example/r/' || SUBSTRING(md5(u.id::text || i::text), 1, 8),
        NOW() - (i || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- search_impressions ----------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT; pid UUID;
  queries TEXT[] := ARRAY[
    'iphone','macbook','vintage watch','gaming laptop','sneakers',
    'rare coin','art print','camera','drone','headphones',
    'running shoes','collectible cards','keyboard','board game','jewelry'
  ];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM search_impressions WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      SELECT id INTO pid FROM products ORDER BY random() LIMIT 1;
      INSERT INTO search_impressions (
        product_id, user_id, search_query, position_shown, clicked, clicked_at,
        purchased, purchased_at, created_at
      ) VALUES (
        pid, u.id,
        queries[1 + ((i - 1) % array_length(queries, 1))],
        1 + (i % 30),
        (i % 3 = 0),
        CASE WHEN i % 3 = 0 THEN NOW() - (i || ' hours')::INTERVAL ELSE NULL END,
        (i % 11 = 0),
        CASE WHEN i % 11 = 0 THEN NOW() - (i || ' hours')::INTERVAL ELSE NULL END,
        NOW() - (i || ' hours')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- security_audit_logs ---------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT;
  events     TEXT[] := ARRAY[
    'login_success','login_failed','password_changed','2fa_enabled',
    'suspicious_login','session_started','session_ended','api_key_used',
    'permission_check','rate_limit_hit'
  ];
  severities TEXT[] := ARRAY['info','info','info','low','medium','high'];
  ips        TEXT[] := ARRAY['198.51.100.1','203.0.113.5','192.0.2.10','10.0.0.42','172.16.5.7'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM security_audit_logs WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO security_audit_logs (
        event_type, severity, source_ip, user_agent, user_id, request_url, blocked, created_at
      ) VALUES (
        events[1 + ((i - 1) % array_length(events, 1))],
        severities[1 + ((i - 1) % array_length(severities, 1))],
        ips[1 + ((i - 1) % array_length(ips, 1))],
        'Mozilla/5.0 SeedAgent/1.0',
        u.id,
        '/api/auth/login',
        (i % 13 = 0),
        NOW() - (i || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- websocket_connections -------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT;
  devices TEXT[] := ARRAY['desktop','mobile','tablet'];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM websocket_connections WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO websocket_connections (
        user_id, connection_id, connected_at, last_ping, device_type, ip_address, is_active
      ) VALUES (
        u.id,
        'ws-' || SUBSTRING(md5(u.id::text || i::text), 1, 16),
        NOW() - (i || ' hours')::INTERVAL,
        NOW() - ((i - 1) || ' hours')::INTERVAL,
        devices[1 + ((i - 1) % 3)],
        '10.0.' || (i % 250) || '.' || ((i * 7) % 250),
        (i <= 2)  -- only the latest two are still active
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- websocket_sessions ----------------------------------------------
DO $$
DECLARE u RECORD; need INT; i INT;
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM websocket_sessions WHERE user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      INSERT INTO websocket_sessions (
        user_id, session_token, device_info, ip_address, is_active,
        last_ping_at, connected_at, disconnected_at
      ) VALUES (
        u.id,
        'wsst-' || SUBSTRING(md5(u.id::text || i::text || 'sess'), 1, 24),
        jsonb_build_object('ua', 'SeedAgent/1.0', 'platform', 'web'),
        ('10.0.' || (i % 250) || '.' || ((i * 5) % 250))::inet,
        (i <= 1),
        NOW() - (i || ' hours')::INTERVAL,
        NOW() - ((i + 1) || ' hours')::INTERVAL,
        CASE WHEN i > 1 THEN NOW() - ((i - 1) || ' hours')::INTERVAL ELSE NULL END
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- messages (sender_id) --------------------------------------------
-- Some users (particularly low-traffic demo accounts) have <15 sent
-- messages. Ensure 15+ for everyone.
DO $$
DECLARE u RECORD; need INT; i INT; recip UUID;
  bodies TEXT[] := ARRAY[
    'Hi! Is this still available?','Can you offer a small discount?',
    'When can you ship?','Does this work internationally?',
    'Thanks for the quick response!','Is the box included?',
    'Could you provide more photos?','Would you accept $X for this?',
    'Looking forward to it','Please confirm tracking when shipped',
    'Hello, I have a question','Is the item authentic?',
    'Any minor scratches I should know about?','Combined shipping?','Thanks!'
  ];
BEGIN
  FOR u IN SELECT id FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM messages WHERE sender_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    FOR i IN 1..need LOOP
      SELECT id INTO recip FROM users WHERE id <> u.id ORDER BY random() LIMIT 1;
      INSERT INTO messages (sender_id, recipient_id, subject, body, is_read, created_at)
      VALUES (
        u.id, recip,
        'Re: Item inquiry #' || i,
        bodies[1 + ((i - 1) % array_length(bodies, 1))],
        (i % 4 = 0),
        NOW() - (i || ' hours')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

-- ---- reviews (reviewed_user_id) --------------------------------------
-- Each user should have >=15 reviews where they are the reviewee. For
-- buyer-only users this counts as buyer-feedback (review_type='buyer').
DO $$
DECLARE u RECORD; need INT; i INT; reviewer UUID; rtype TEXT;
  titles TEXT[] := ARRAY[
    'Great seller','Smooth transaction','Highly recommended',
    'Fast shipping','As described','Friendly communication',
    'Will buy again','Quick payment','Excellent buyer','Easy to deal with',
    'Nicely packaged','Top notch','Five stars','Recommend','A pleasure'
  ];
  comments TEXT[] := ARRAY[
    'Everything went perfectly. Thanks!',
    'Item arrived quickly and matched the description.',
    'Communication was clear throughout.',
    'Paid promptly and was very polite. Welcome anytime!',
    'No issues — would gladly transact again.'
  ];
BEGIN
  FOR u IN SELECT id, is_seller FROM users LOOP
    SELECT 15 - COUNT(*) INTO need FROM reviews WHERE reviewed_user_id = u.id;
    IF need <= 0 THEN CONTINUE; END IF;
    rtype := CASE WHEN u.is_seller THEN 'seller' ELSE 'buyer' END;
    FOR i IN 1..need LOOP
      SELECT id INTO reviewer FROM users WHERE id <> u.id ORDER BY random() LIMIT 1;
      INSERT INTO reviews (
        reviewer_id, reviewed_user_id, review_type, rating, title, comment,
        is_verified_purchase, helpful_count, created_at
      ) VALUES (
        reviewer, u.id, rtype,
        CASE WHEN i % 11 = 0 THEN 3 ELSE 5 END,  -- mostly positive
        titles[1 + ((i - 1) % array_length(titles, 1))],
        comments[1 + ((i - 1) % array_length(comments, 1))],
        TRUE,
        (i * 3) % 25,
        NOW() - (i || ' days')::INTERVAL
      );
    END LOOP;
  END LOOP;
END $$;

COMMIT;
