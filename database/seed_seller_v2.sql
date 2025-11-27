-- eBay Clone - Seller Dashboard Data v2

-- Get category IDs
\set electronics_id `psql -U postgres -d ebay_clone -t -c "SELECT id FROM categories WHERE slug = 'electronics' LIMIT 1" | tr -d ' '`
\set fashion_id `psql -U postgres -d ebay_clone -t -c "SELECT id FROM categories WHERE slug = 'fashion' LIMIT 1" | tr -d ' '`
\set home_id `psql -U postgres -d ebay_clone -t -c "SELECT id FROM categories WHERE slug = 'home-garden' LIMIT 1" | tr -d ' '`
\set sports_id `psql -U postgres -d ebay_clone -t -c "SELECT id FROM categories WHERE slug = 'sports-outdoors' LIMIT 1" | tr -d ' '`
\set collectibles_id `psql -U postgres -d ebay_clone -t -c "SELECT id FROM categories WHERE slug = 'collectibles-art' LIMIT 1" | tr -d ' '`

-- Make users sellers
UPDATE users SET is_seller = true WHERE username IN ('techdeals', 'vintagetreasures', 'fashionista', 'sportsgear', 'homeessentials', 'bookworm');

-- Add products for SPORTSGEAR
INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count)
SELECT u.id, c.id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', view_count, watch_count
FROM users u
CROSS JOIN categories c
CROSS JOIN (VALUES
    ('Ping G430 Max Driver 10.5', 'ping-g430-max-driver', 'Forgiving driver with adjustable loft.', 'new', 'buy_now', 549.99, 549.99, 4, true, 'Ping', 280, 38),
    ('Titleist TSR3 Fairway Wood', 'titleist-tsr3-3wood', '15 degree fairway with tour shaft.', 'like_new', 'buy_now', 299.99, 299.99, 2, true, 'Titleist', 190, 28),
    ('Mizuno JPX923 Forged Irons', 'mizuno-jpx923-forged', '5-PW steel shafts.', 'new', 'buy_now', 999.99, 999.99, 3, true, 'Mizuno', 320, 45),
    ('Cleveland RTX6 Wedge Set', 'cleveland-rtx6-wedges', '52, 56, 60 degree set.', 'new', 'buy_now', 449.99, 449.99, 5, true, 'Cleveland', 210, 32),
    ('Titleist Pro V1x Golf Balls 4 Dozen', 'titleist-prov1x-4dz', 'Premium golf balls.', 'new', 'buy_now', 219.99, 219.99, 20, true, 'Titleist', 450, 58),
    ('Sun Mountain C130 Cart Bag', 'sunmtn-c130-bag', '14-way top divider cart bag.', 'new', 'buy_now', 269.99, 269.99, 6, true, 'Sun Mountain', 175, 25),
    ('FootJoy Pro SL Golf Shoes', 'footjoy-prosl-white', 'Size 10, spikeless.', 'new', 'buy_now', 169.99, 169.99, 8, true, 'FootJoy', 290, 42),
    ('Bushnell Tour V5 Rangefinder', 'bushnell-tourv5-rf', 'Slope edition with JOLT.', 'new', 'buy_now', 399.99, 399.99, 5, true, 'Bushnell', 320, 48),
    ('NordicTrack S22i Studio Cycle', 'nordictrack-s22i-bike', 'Interactive studio bike.', 'like_new', 'buy_now', 1499.00, 1499.00, 2, false, 'NordicTrack', 280, 38),
    ('Bowflex Revolution Home Gym', 'bowflex-revolution-gym', 'SpiraFlex resistance technology.', 'new', 'buy_now', 2699.00, 2699.00, 1, false, 'Bowflex', 190, 28),
    ('Schwinn IC4 Indoor Cycling Bike', 'schwinn-ic4-bike', 'Bluetooth enabled spin bike.', 'new', 'buy_now', 799.00, 799.00, 4, false, 'Schwinn', 420, 55),
    ('Concept2 Model D Rowing Machine', 'concept2-model-d', 'Commercial quality rower.', 'new', 'buy_now', 990.00, 990.00, 3, false, 'Concept2', 340, 48),
    ('TRX Pro4 Suspension Trainer', 'trx-pro4-trainer', 'Professional suspension system.', 'new', 'buy_now', 249.95, 249.95, 10, true, 'TRX', 280, 38),
    ('Rogue Ohio Power Bar', 'rogue-ohio-power-bar', 'IPF spec powerlifting bar.', 'new', 'buy_now', 395.00, 395.00, 6, true, 'Rogue', 190, 28),
    ('Theragun Pro Massage Gun', 'theragun-pro-5th', '5th generation percussive therapy.', 'new', 'buy_now', 599.00, 599.00, 8, true, 'Therabody', 520, 72)
) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, view_count, watch_count)
WHERE u.username = 'sportsgear' AND c.slug = 'sports-outdoors'
ON CONFLICT DO NOTHING;

-- Add products for HOMEESSENTIALS
INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count)
SELECT u.id, c.id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', view_count, watch_count
FROM users u
CROSS JOIN categories c
CROSS JOIN (VALUES
    ('Ninja Foodi 14-in-1 Pressure Cooker', 'ninja-foodi-14in1', 'Air fry, pressure cook, slow cook.', 'new', 'buy_now', 249.99, 249.99, 8, true, 'Ninja', 380, 52),
    ('Cuisinart 14-Cup Food Processor', 'cuisinart-14cup-fp', 'Commercial quality processor.', 'new', 'buy_now', 249.99, 249.99, 6, true, 'Cuisinart', 290, 42),
    ('Shark AI Robot Vacuum RV2001', 'shark-ai-rv2001', 'Self-emptying with LIDAR navigation.', 'new', 'buy_now', 549.99, 549.99, 5, true, 'Shark', 420, 58),
    ('Tempur-Pedic ProAdapt Medium Queen', 'tempurpedic-proadapt', 'Memory foam mattress.', 'new', 'buy_now', 2999.00, 2999.00, 3, false, 'Tempur-Pedic', 280, 38),
    ('Dyson V12 Detect Slim Vacuum', 'dyson-v12-detect', 'Lightweight cordless vacuum.', 'new', 'buy_now', 649.99, 649.99, 6, true, 'Dyson', 520, 72),
    ('De Longhi La Specialista Maestro', 'delonghi-specialista', 'Espresso machine with grinder.', 'new', 'buy_now', 1199.99, 1199.99, 3, true, 'DeLonghi', 340, 48),
    ('Instant Pot Duo Crisp 11-in-1', 'instantpot-duo-crisp', 'Pressure cooker and air fryer.', 'new', 'buy_now', 149.99, 149.99, 12, true, 'Instant Pot', 580, 75),
    ('Ecovacs Deebot X1 Omni', 'ecovacs-x1-omni', 'Robot vacuum and mop combo.', 'new', 'buy_now', 1099.99, 1099.99, 4, true, 'Ecovacs', 290, 42),
    ('Traeger Pro 780 Pellet Grill', 'traeger-pro-780', 'WiFIRE enabled smoker.', 'new', 'buy_now', 999.99, 999.99, 3, false, 'Traeger', 350, 48),
    ('Sonos Beam Gen 2 Soundbar', 'sonos-beam-gen2', 'Compact Dolby Atmos soundbar.', 'new', 'buy_now', 449.00, 449.00, 7, true, 'Sonos', 420, 55),
    ('LG WashTower Washer Dryer', 'lg-washtower-combo', 'Stacked washer and dryer.', 'new', 'buy_now', 2299.00, 2299.00, 2, false, 'LG', 180, 28),
    ('Blueair Blue Pure 311 Auto', 'blueair-pure-311', 'HEPA air purifier with auto mode.', 'new', 'buy_now', 299.99, 299.99, 8, true, 'Blueair', 290, 38),
    ('Anova Precision Cooker Pro', 'anova-precision-pro', 'WiFi sous vide circulator.', 'new', 'buy_now', 399.00, 399.00, 5, true, 'Anova', 210, 28),
    ('Staub Cast Iron Cocotte 7qt', 'staub-cocotte-7qt', 'French cast iron Dutch oven.', 'new', 'buy_now', 379.99, 379.99, 6, true, 'Staub', 320, 42),
    ('Simplehuman Sensor Mirror Pro', 'simplehuman-mirror-pro', 'Lighted makeup mirror 8 inch.', 'new', 'buy_now', 299.99, 299.99, 10, true, 'Simplehuman', 175, 25)
) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, view_count, watch_count)
WHERE u.username = 'homeessentials' AND c.slug = 'home-garden'
ON CONFLICT DO NOTHING;

-- Add products for VINTAGETREASURES (collectibles)
INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count)
SELECT u.id, c.id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, 'active', view_count, watch_count
FROM users u
CROSS JOIN categories c
CROSS JOIN (VALUES
    ('LEGO Star Wars UCS AT-AT 75313 NISB', 'lego-ucs-atat-75313', 'Brand new sealed Ultimate Collector Series.', 'new', 'buy_now', 899.99, 899.99, 2, false, 'LEGO', 450, 65),
    ('Nintendo Game Boy Color Pikachu Edition', 'gameboy-color-pikachu', 'Complete in box, excellent condition.', 'very_good', 'buy_now', 350.00, 350.00, 1, true, 'Nintendo', 380, 55),
    ('Vintage Coca-Cola Vending Machine 1950s', 'coke-vending-machine-1950', 'Restored Vendo 39 in working condition.', 'good', 'buy_now', 4500.00, 4500.00, 1, false, 'Coca-Cola', 290, 42),
    ('Beatles White Album 1968 First Press', 'beatles-white-album-1st', 'UK first pressing with poster and photos.', 'very_good', 'buy_now', 1200.00, 1200.00, 1, true, 'Apple Records', 340, 48),
    ('Transformers G1 Optimus Prime MIB', 'transformers-g1-optimus', 'Original 1984 Hasbro figure, complete.', 'very_good', 'buy_now', 850.00, 850.00, 1, true, 'Hasbro', 410, 58),
    ('Atari 2600 Console Complete Collection', 'atari-2600-collection', '50+ games with original console and controllers.', 'good', 'buy_now', 650.00, 650.00, 1, false, 'Atari', 280, 38),
    ('Garbage Pail Kids Complete Set 1985', 'gpk-complete-1985', 'Series 1-5 complete with variations.', 'very_good', 'buy_now', 1500.00, 1500.00, 1, true, 'Topps', 195, 28),
    ('Original Star Wars Movie Poster 1977', 'star-wars-poster-1977', 'Style A theatrical one-sheet, linen-backed.', 'very_good', 'buy_now', 3500.00, 3500.00, 1, true, '20th Century Fox', 680, 95),
    ('Vintage Mickey Mouse Watch 1933 Ingersoll', 'mickey-mouse-watch-1933', 'Original Ingersoll watch in working condition.', 'good', 'buy_now', 2800.00, 2800.00, 1, true, 'Ingersoll', 520, 72),
    ('He-Man Castle Grayskull Complete 1982', 'heman-castle-grayskull', 'Mattel playset with all accessories.', 'very_good', 'buy_now', 450.00, 450.00, 1, false, 'Mattel', 320, 42),
    ('Cabbage Patch Kids Signed Xavier Roberts', 'cpk-xavier-roberts', 'Original soft sculpture signed.', 'like_new', 'buy_now', 2200.00, 2200.00, 1, true, 'Cabbage Patch', 280, 38),
    ('Original Nintendo NES Console CIB', 'nes-console-complete', 'Complete in box with all manuals.', 'very_good', 'buy_now', 550.00, 550.00, 1, false, 'Nintendo', 480, 65),
    ('Vintage Lite-Brite Complete 1967', 'lite-brite-1967', 'Working with original pegs and sheets.', 'good', 'buy_now', 175.00, 175.00, 1, true, 'Hasbro', 190, 28),
    ('E.T. Atari 2600 Sealed WATA 9.4', 'et-atari-sealed-wata', 'Famous sealed game, graded 9.4.', 'new', 'buy_now', 8500.00, 8500.00, 1, true, 'Atari', 920, 125),
    ('Pez Space Gun 1950s', 'pez-space-gun-1950', 'Rare vintage Pez dispenser.', 'good', 'buy_now', 3200.00, 3200.00, 1, true, 'Pez', 410, 55)
) AS t(title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, view_count, watch_count)
WHERE u.username = 'vintagetreasures' AND c.slug = 'collectibles-art'
ON CONFLICT DO NOTHING;

-- Create more orders for sellers
DO $$
DECLARE
    buyer_id UUID;
    seller_id UUID;
    addr_id UUID;
    prod RECORD;
    order_id UUID;
BEGIN
    -- Get a buyer and address
    SELECT id INTO buyer_id FROM users WHERE username = 'buyer_bob';
    SELECT id INTO addr_id FROM addresses LIMIT 1;

    -- Orders for SPORTSGEAR
    SELECT id INTO seller_id FROM users WHERE username = 'sportsgear';
    FOR prod IN SELECT id, current_price FROM products WHERE seller_id = seller_id LIMIT 4 LOOP
        INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (buyer_id, seller_id, 'ORD-SPORT-' || floor(random()*1000)::text,
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, 'TRACK' || floor(random()*100000)::text,
                NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END LOOP;

    -- Orders for HOMEESSENTIALS
    SELECT id INTO seller_id FROM users WHERE username = 'homeessentials';
    FOR prod IN SELECT id, current_price FROM products WHERE seller_id = seller_id LIMIT 4 LOOP
        INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (buyer_id, seller_id, 'ORD-HOME-' || floor(random()*1000)::text,
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, 'TRACK' || floor(random()*100000)::text,
                NOW() - INTERVAL '8 days', NOW() - INTERVAL '12 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END LOOP;

    -- Add pending orders for various sellers
    SELECT id INTO buyer_id FROM users WHERE username = 'buyer_jane';

    -- Pending for sportsgear
    SELECT id INTO seller_id FROM users WHERE username = 'sportsgear';
    SELECT id, current_price INTO prod FROM products WHERE seller_id = seller_id ORDER BY random() LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (buyer_id, seller_id, 'ORD-SPORT-PEND-1',
                prod.current_price, 15.00, prod.current_price * 0.08, prod.current_price * 1.08 + 15,
                'pending', 'pending', addr_id, NOW());
    END IF;

    -- Processing for homeessentials
    SELECT id INTO seller_id FROM users WHERE username = 'homeessentials';
    SELECT id, current_price INTO prod FROM products WHERE seller_id = seller_id ORDER BY random() LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (buyer_id, seller_id, 'ORD-HOME-PROC-1',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'processing', 'completed', addr_id, NOW() - INTERVAL '1 day');
    END IF;

    RAISE NOTICE 'Created orders for all sellers!';
END $$;

-- Add more disputes
DO $$
DECLARE
    order_rec RECORD;
BEGIN
    -- Find orders for disputes
    FOR order_rec IN
        SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.order_id = o.id)
        LIMIT 3
    LOOP
        INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, status,
                             reason, desired_resolution, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                (ARRAY['item_not_as_described', 'item_not_received', 'counterfeit'])[floor(random()*3)+1],
                (ARRAY['open', 'under_review', 'resolved'])[floor(random()*3)+1],
                'Issue with this order',
                'full_refund', NOW() - INTERVAL '5 days');
    END LOOP;
END $$;

-- Add more returns
DO $$
DECLARE
    order_rec RECORD;
BEGIN
    FOR order_rec IN
        SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id, o.total
        FROM orders o
        JOIN order_items oi ON oi.order_id = o.id
        WHERE o.status = 'delivered'
        AND NOT EXISTS (SELECT 1 FROM returns r WHERE r.order_id = o.id)
        AND NOT EXISTS (SELECT 1 FROM disputes d WHERE d.order_id = o.id)
        LIMIT 3
    LOOP
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason,
                            return_details, status, refund_amount, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                (ARRAY['changed_mind', 'defective', 'wrong_item', 'not_as_described'])[floor(random()*4)+1],
                'Requesting return for this item',
                (ARRAY['requested', 'approved', 'shipped', 'refunded', 'rejected'])[floor(random()*5)+1],
                order_rec.total, NOW() - INTERVAL '3 days');
    END LOOP;
END $$;

-- Update seller statistics
UPDATE users u SET
    total_sales = (SELECT COUNT(*) FROM orders o WHERE o.seller_id = u.id AND o.payment_status = 'completed'),
    seller_rating = 4.5 + (RANDOM() * 0.5)
WHERE u.is_seller = true;

-- Add product images
INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, sort_order)
SELECT p.id,
       'https://picsum.photos/seed/' || LEFT(p.id::text, 8) || '/800/600',
       'https://picsum.photos/seed/' || LEFT(p.id::text, 8) || '/300/200',
       true, 0
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

-- Summary
SELECT 'Seller Data v2 Complete!' as status;

SELECT u.username as seller, COUNT(p.id) as products
FROM users u
LEFT JOIN products p ON p.seller_id = u.id
WHERE u.is_seller = true
GROUP BY u.username
ORDER BY products DESC;

SELECT u.username as seller,
       COUNT(o.id) as total_orders,
       COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as processing,
       COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped,
       COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered
FROM users u
LEFT JOIN orders o ON o.seller_id = u.id
WHERE u.is_seller = true
GROUP BY u.username
ORDER BY total_orders DESC;
