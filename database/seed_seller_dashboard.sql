-- eBay Clone - Comprehensive Seller Dashboard Seed Data
-- At least 15 products per seller, orders, disputes, returns

-- =====================================================
-- ADD MORE PRODUCTS FOR EACH SELLER (15+ each)
-- =====================================================

-- Get seller IDs and category IDs first
DO $$
DECLARE
    techdeals_id UUID;
    vintagetreasures_id UUID;
    fashionista_id UUID;
    sportsgear_id UUID;
    homeessentials_id UUID;
    bookworm_id UUID;

    electronics_id UUID;
    fashion_id UUID;
    home_id UUID;
    sports_id UUID;
    collectibles_id UUID;
    books_id UUID;
BEGIN
    -- Get seller IDs
    SELECT id INTO techdeals_id FROM users WHERE username = 'techdeals';
    SELECT id INTO vintagetreasures_id FROM users WHERE username = 'vintagetreasures';
    SELECT id INTO fashionista_id FROM users WHERE username = 'fashionista';
    SELECT id INTO sportsgear_id FROM users WHERE username = 'sportsgear';
    SELECT id INTO homeessentials_id FROM users WHERE username = 'homeessentials';
    SELECT id INTO bookworm_id FROM users WHERE username = 'bookworm';

    -- Get category IDs
    SELECT id INTO electronics_id FROM categories WHERE slug = 'electronics' LIMIT 1;
    SELECT id INTO fashion_id FROM categories WHERE slug = 'fashion' LIMIT 1;
    SELECT id INTO home_id FROM categories WHERE slug = 'home-garden' LIMIT 1;
    SELECT id INTO sports_id FROM categories WHERE slug = 'sporting-goods' LIMIT 1;
    SELECT id INTO collectibles_id FROM categories WHERE slug = 'collectibles' LIMIT 1;
    SELECT id INTO books_id FROM categories WHERE slug = 'books-media' LIMIT 1;

    -- Make all these users sellers
    UPDATE users SET is_seller = true WHERE id IN (techdeals_id, vintagetreasures_id, fashionista_id, sportsgear_id, homeessentials_id, bookworm_id);

    -- =====================================================
    -- TECHDEALS - Electronics Seller (15+ products)
    -- =====================================================
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count) VALUES
    (techdeals_id, electronics_id, 'iPhone 15 Pro Max 256GB Natural Titanium', 'iphone-15-pro-max-256gb', 'Latest iPhone with A17 Pro chip. Factory unlocked.', 'new', 'buy_now', 1199.00, 1199.00, 8, true, 'Apple', 'active', 450, 32),
    (techdeals_id, electronics_id, 'iPad Pro 12.9" M2 WiFi 256GB', 'ipad-pro-129-m2-256gb', 'Professional tablet with M2 chip and Liquid Retina XDR.', 'new', 'buy_now', 1099.00, 1099.00, 5, true, 'Apple', 'active', 320, 28),
    (techdeals_id, electronics_id, 'Sony WH-1000XM5 Wireless Headphones', 'sony-wh1000xm5-black', 'Industry-leading noise cancellation headphones.', 'new', 'buy_now', 348.00, 348.00, 15, true, 'Sony', 'active', 280, 45),
    (techdeals_id, electronics_id, 'Samsung 65" Neo QLED 4K Smart TV', 'samsung-65-neo-qled-qn65', 'Quantum Matrix Technology for incredible picture.', 'new', 'buy_now', 1597.99, 1597.99, 3, false, 'Samsung', 'active', 190, 15),
    (techdeals_id, electronics_id, 'NVIDIA GeForce RTX 4090 24GB', 'nvidia-rtx-4090-founders', 'Ultimate gaming graphics card. Founders Edition.', 'new', 'both', 1599.00, 1799.00, 2, true, 'NVIDIA', 'active', 890, 120),
    (techdeals_id, electronics_id, 'Apple Watch Ultra 2 49mm Titanium', 'apple-watch-ultra-2-titanium', 'Most rugged Apple Watch with precision GPS.', 'new', 'buy_now', 799.00, 799.00, 6, true, 'Apple', 'active', 340, 52),
    (techdeals_id, electronics_id, 'Sonos Arc Premium Soundbar', 'sonos-arc-soundbar-black', 'Dolby Atmos soundbar for immersive audio.', 'new', 'buy_now', 899.00, 899.00, 4, true, 'Sonos', 'active', 175, 22),
    (techdeals_id, electronics_id, 'Logitech MX Master 3S Mouse', 'logitech-mx-master-3s', 'Ergonomic wireless mouse for productivity.', 'new', 'buy_now', 99.99, 99.99, 25, true, 'Logitech', 'active', 520, 65),
    (techdeals_id, electronics_id, 'Samsung Galaxy Tab S9 Ultra 512GB', 'samsung-tab-s9-ultra-512', 'Largest Android tablet with S Pen included.', 'new', 'buy_now', 1199.99, 1199.99, 4, true, 'Samsung', 'active', 210, 18),
    (techdeals_id, electronics_id, 'GoPro HERO12 Black Creator Edition', 'gopro-hero12-creator', 'Action camera with 5.3K video and HyperSmooth 6.0.', 'new', 'buy_now', 599.99, 599.99, 10, true, 'GoPro', 'active', 445, 55),
    (techdeals_id, electronics_id, 'Razer Blade 17 Gaming Laptop RTX 4080', 'razer-blade-17-rtx4080', '17.3" QHD 240Hz, i9-13950HX, 32GB RAM.', 'new', 'buy_now', 3499.99, 3499.99, 2, true, 'Razer', 'active', 380, 42),
    (techdeals_id, electronics_id, 'Meta Quest 3 128GB VR Headset', 'meta-quest-3-128gb', 'Mixed reality headset with breakthrough experiences.', 'new', 'buy_now', 499.99, 499.99, 12, true, 'Meta', 'active', 670, 88),
    (techdeals_id, electronics_id, 'Anker 737 Power Bank 24000mAh', 'anker-737-powerbank-24k', '140W portable charger for laptops and phones.', 'new', 'buy_now', 149.99, 149.99, 30, true, 'Anker', 'active', 290, 35),
    (techdeals_id, electronics_id, 'Keychron Q1 Pro Mechanical Keyboard', 'keychron-q1-pro-brown', 'Wireless mechanical keyboard with hot-swap.', 'new', 'buy_now', 199.00, 199.00, 8, true, 'Keychron', 'active', 185, 24),
    (techdeals_id, electronics_id, 'Elgato Stream Deck MK.2', 'elgato-stream-deck-mk2', '15 LCD keys for streaming and productivity.', 'new', 'buy_now', 149.99, 149.99, 15, true, 'Elgato', 'active', 320, 40),
    -- Some SOLD products for techdeals
    (techdeals_id, electronics_id, 'PS5 Slim Digital Edition', 'ps5-slim-digital-sold', 'PlayStation 5 Slim console.', 'new', 'buy_now', 449.99, 449.99, 0, true, 'Sony', 'sold', 850, 95),
    (techdeals_id, electronics_id, 'Xbox Series X 1TB', 'xbox-series-x-sold', 'Microsoft flagship gaming console.', 'new', 'buy_now', 499.99, 499.99, 0, true, 'Microsoft', 'sold', 720, 82)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- VINTAGETREASURES - Collectibles Seller (15+ products)
    -- =====================================================
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count, auction_end) VALUES
    (vintagetreasures_id, collectibles_id, '1st Edition Charizard PSA 10 Gem Mint', 'charizard-1st-psa10', 'Holy grail Pokemon card in perfect condition.', 'like_new', 'auction', 45000.00, NULL, 1, true, 'Pokemon', 'active', 2500, 350, NOW() + INTERVAL '5 days'),
    (vintagetreasures_id, collectibles_id, 'Star Wars Vintage Boba Fett 1979 AFA 85', 'boba-fett-1979-afa85', 'Original Kenner figure, graded AFA 85.', 'very_good', 'auction', 8500.00, NULL, 1, true, 'Kenner', 'active', 890, 125, NOW() + INTERVAL '3 days'),
    (vintagetreasures_id, collectibles_id, 'Michael Jordan 1986 Fleer RC PSA 9', 'jordan-fleer-86-psa9', 'Iconic rookie card in near-mint condition.', 'very_good', 'auction', 25000.00, NULL, 1, true, 'Fleer', 'active', 1800, 220, NOW() + INTERVAL '7 days'),
    (vintagetreasures_id, collectibles_id, 'LEGO Star Wars UCS AT-AT 75313 NISB', 'lego-ucs-atat-75313', 'Brand new sealed Ultimate Collector Series.', 'new', 'buy_now', 899.99, 899.99, 2, false, 'LEGO', 'active', 450, 65),
    (vintagetreasures_id, collectibles_id, 'Amazing Spider-Man #129 CGC 9.2', 'asm-129-cgc92', 'First appearance of the Punisher!', 'very_good', 'both', 4500.00, 5500.00, 1, true, 'Marvel', 'active', 780, 98, NOW() + INTERVAL '4 days'),
    (vintagetreasures_id, collectibles_id, 'Funko Pop Freddy Funko as Batman SDCC', 'funko-freddy-batman-sdcc', 'Ultra rare SDCC exclusive, limited to 100.', 'new', 'auction', 3200.00, NULL, 1, true, 'Funko', 'active', 920, 145, NOW() + INTERVAL '2 days'),
    (vintagetreasures_id, collectibles_id, 'Nintendo Game Boy Color Pikachu Edition', 'gameboy-color-pikachu', 'Complete in box, excellent condition.', 'very_good', 'buy_now', 350.00, 350.00, 1, true, 'Nintendo', 'active', 380, 55),
    (vintagetreasures_id, collectibles_id, 'Magic The Gathering Black Lotus BGS 7', 'mtg-black-lotus-bgs7', 'Power Nine card from Alpha set.', 'good', 'auction', 85000.00, NULL, 1, true, 'WOTC', 'active', 3200, 480, NOW() + INTERVAL '10 days'),
    (vintagetreasures_id, collectibles_id, 'Vintage Coca-Cola Vending Machine 1950s', 'coke-vending-machine-1950', 'Restored Vendo 39 in working condition.', 'good', 'buy_now', 4500.00, 4500.00, 1, false, 'Coca-Cola', 'active', 290, 42),
    (vintagetreasures_id, collectibles_id, 'Beatles White Album 1968 First Press', 'beatles-white-album-1st', 'UK first pressing with poster and photos.', 'very_good', 'buy_now', 1200.00, 1200.00, 1, true, 'Apple Records', 'active', 340, 48),
    (vintagetreasures_id, collectibles_id, 'Hot Wheels Redline Pink Beach Bomb', 'hotwheels-pink-beach-bomb', 'Rare prototype variation from 1969.', 'good', 'auction', 125000.00, NULL, 1, true, 'Mattel', 'active', 4500, 620, NOW() + INTERVAL '14 days'),
    (vintagetreasures_id, collectibles_id, 'Transformers G1 Optimus Prime MIB', 'transformers-g1-optimus', 'Original 1984 Hasbro figure, complete.', 'very_good', 'buy_now', 850.00, 850.00, 1, true, 'Hasbro', 'active', 410, 58),
    (vintagetreasures_id, collectibles_id, 'Atari 2600 Console Complete Collection', 'atari-2600-collection', '50+ games with original console and controllers.', 'good', 'buy_now', 650.00, 650.00, 1, false, 'Atari', 'active', 280, 38),
    (vintagetreasures_id, collectibles_id, 'Vintage Mickey Mouse Watch 1933', 'mickey-mouse-watch-1933', 'Original Ingersoll watch in working condition.', 'good', 'auction', 2800.00, NULL, 1, true, 'Ingersoll', 'active', 520, 72, NOW() + INTERVAL '6 days'),
    (vintagetreasures_id, collectibles_id, 'Garbage Pail Kids Complete Set 1985', 'gpk-complete-1985', 'Series 1-5 complete with variations.', 'very_good', 'buy_now', 1500.00, 1500.00, 1, true, 'Topps', 'active', 195, 28),
    (vintagetreasures_id, collectibles_id, 'Original Star Wars Movie Poster 1977', 'star-wars-poster-1977', 'Style A theatrical one-sheet, linen-backed.', 'very_good', 'buy_now', 3500.00, 3500.00, 1, true, '20th Century Fox', 'active', 680, 95)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- FASHIONISTA - Fashion Seller (15+ products)
    -- =====================================================
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count, auction_end) VALUES
    (fashionista_id, fashion_id, 'Hermès Birkin 30 Togo Gold GHW', 'hermes-birkin-30-gold', 'Iconic Birkin bag in pristine condition.', 'like_new', 'buy_now', 18500.00, 18500.00, 1, true, 'Hermès', 'active', 1200, 180),
    (fashionista_id, fashion_id, 'Louis Vuitton Speedy 25 Monogram', 'lv-speedy-25-mono', 'Classic LV bag with dust bag and receipt.', 'very_good', 'buy_now', 1100.00, 1100.00, 1, true, 'Louis Vuitton', 'active', 650, 92),
    (fashionista_id, fashion_id, 'Chanel Classic Flap Medium Caviar Black', 'chanel-flap-medium-black', 'Timeless classic with gold hardware.', 'like_new', 'buy_now', 8900.00, 8900.00, 1, true, 'Chanel', 'active', 890, 145),
    (fashionista_id, fashion_id, 'Nike Dunk Low Panda 2024', 'nike-dunk-low-panda', 'Brand new, multiple sizes available.', 'new', 'buy_now', 135.00, 135.00, 20, true, 'Nike', 'active', 1500, 220),
    (fashionista_id, fashion_id, 'Adidas Yeezy Boost 350 V2 Zebra', 'yeezy-350-zebra-2024', 'Deadstock with original box and tags.', 'new', 'buy_now', 280.00, 280.00, 8, true, 'Adidas', 'active', 780, 110),
    (fashionista_id, fashion_id, 'Omega Seamaster Diver 300M Blue', 'omega-seamaster-300-blue', 'Professional dive watch, complete set.', 'like_new', 'buy_now', 4800.00, 4800.00, 1, true, 'Omega', 'active', 420, 65),
    (fashionista_id, fashion_id, 'Cartier Love Bracelet Yellow Gold', 'cartier-love-bracelet-yg', 'Size 17, with screwdriver and box.', 'like_new', 'buy_now', 6800.00, 6800.00, 1, true, 'Cartier', 'active', 580, 88),
    (fashionista_id, fashion_id, 'Burberry Trench Coat Heritage Kensington', 'burberry-trench-kensington', 'Size Medium, honey color, excellent condition.', 'very_good', 'buy_now', 1200.00, 1200.00, 1, true, 'Burberry', 'active', 320, 45),
    (fashionista_id, fashion_id, 'Off-White x Nike Air Force 1 Low', 'off-white-af1-low', 'The Ten collection, size 10.', 'new', 'auction', 850.00, NULL, 1, true, 'Nike x Off-White', 'active', 920, 135, NOW() + INTERVAL '3 days'),
    (fashionista_id, fashion_id, 'Prada Re-Edition 2005 Nylon Black', 'prada-re-edition-2005', 'Trending mini bag with authenticity card.', 'new', 'buy_now', 1350.00, 1350.00, 3, true, 'Prada', 'active', 510, 72),
    (fashionista_id, fashion_id, 'Tiffany & Co Diamond Solitaire Ring 1ct', 'tiffany-solitaire-1ct', 'Platinum setting, E color VS1 clarity.', 'like_new', 'buy_now', 12500.00, 12500.00, 1, true, 'Tiffany & Co', 'active', 340, 52),
    (fashionista_id, fashion_id, 'Supreme Box Logo Hoodie FW23 Black', 'supreme-bogo-fw23-black', 'Size Large, brand new with tags.', 'new', 'auction', 550.00, NULL, 1, true, 'Supreme', 'active', 680, 98, NOW() + INTERVAL '2 days'),
    (fashionista_id, fashion_id, 'Moncler Maya Down Jacket Navy', 'moncler-maya-navy', 'Size 3 (Medium), like new condition.', 'like_new', 'buy_now', 1100.00, 1100.00, 1, true, 'Moncler', 'active', 290, 42),
    (fashionista_id, fashion_id, 'Balenciaga Triple S Sneakers White', 'balenciaga-triple-s-white', 'Size 42, worn once, includes box.', 'like_new', 'buy_now', 650.00, 650.00, 1, true, 'Balenciaga', 'active', 420, 58),
    (fashionista_id, fashion_id, 'Ray-Ban Wayfarer Classic Black', 'rayban-wayfarer-classic', 'Polarized lenses, brand new.', 'new', 'buy_now', 175.00, 175.00, 15, true, 'Ray-Ban', 'active', 380, 48),
    (fashionista_id, fashion_id, 'Dior Saddle Bag Oblique Jacquard', 'dior-saddle-oblique', 'Iconic silhouette in signature Dior print.', 'like_new', 'buy_now', 3200.00, 3200.00, 1, true, 'Dior', 'active', 470, 68)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- SPORTSGEAR - Sports Seller (15+ products)
    -- =====================================================
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count, auction_end) VALUES
    (sportsgear_id, sports_id, 'Callaway Paradym X Driver 10.5°', 'callaway-paradym-x-driver', 'Latest driver with Jailbreak AI technology.', 'new', 'buy_now', 549.99, 549.99, 5, true, 'Callaway', 'active', 380, 55),
    (sportsgear_id, sports_id, 'Titleist Scotty Cameron Phantom X 5', 'scotty-cameron-phantom-x5', 'Tour-proven mallet putter.', 'like_new', 'buy_now', 399.99, 399.99, 3, true, 'Titleist', 'active', 290, 42),
    (sportsgear_id, sports_id, 'TaylorMade P770 Irons 4-PW Steel', 'taylormade-p770-irons', 'Forged players distance irons.', 'new', 'buy_now', 1299.99, 1299.99, 2, true, 'TaylorMade', 'active', 245, 38),
    (sportsgear_id, sports_id, 'Bowflex SelectTech 552 Dumbbells', 'bowflex-selecttech-552', 'Adjustable dumbbells 5-52.5 lbs each.', 'new', 'buy_now', 429.00, 429.00, 8, false, 'Bowflex', 'active', 520, 72),
    (sportsgear_id, sports_id, 'Peloton Bike+ with Accessories', 'peloton-bike-plus-bundle', 'Includes mat, weights, and heart rate monitor.', 'like_new', 'buy_now', 1999.00, 1999.00, 1, false, 'Peloton', 'active', 410, 58),
    (sportsgear_id, sports_id, 'Garmin Forerunner 965 GPS Watch', 'garmin-forerunner-965', 'Premium triathlon smartwatch with maps.', 'new', 'buy_now', 599.99, 599.99, 6, true, 'Garmin', 'active', 340, 48),
    (sportsgear_id, sports_id, 'Wilson Pro Staff RF97 Autograph', 'wilson-prostaff-rf97', 'Roger Federer signature racquet.', 'new', 'buy_now', 269.00, 269.00, 4, true, 'Wilson', 'active', 195, 28),
    (sportsgear_id, sports_id, 'YETI Hopper M30 Soft Cooler', 'yeti-hopper-m30', 'Portable soft cooler holds 20 cans.', 'new', 'buy_now', 325.00, 325.00, 10, true, 'YETI', 'active', 280, 38),
    (sportsgear_id, sports_id, 'Burton Custom Flying V Snowboard 158', 'burton-custom-fv-158', 'Versatile all-mountain freestyle board.', 'like_new', 'auction', 450.00, NULL, 1, true, 'Burton', 'active', 320, 45, NOW() + INTERVAL '4 days'),
    (sportsgear_id, sports_id, 'Specialized S-Works Tarmac SL7 56cm', 'specialized-tarmac-sl7', 'Pro-level road bike, Shimano Dura-Ace.', 'like_new', 'buy_now', 8500.00, 8500.00, 1, false, 'Specialized', 'active', 580, 85),
    (sportsgear_id, sports_id, 'Bauer Vapor Hyperlite Hockey Skates', 'bauer-hyperlite-skates', 'Size 9D, top-of-line skates.', 'new', 'buy_now', 899.99, 899.99, 3, true, 'Bauer', 'active', 210, 32),
    (sportsgear_id, sports_id, 'Rawlings Heart of the Hide Glove', 'rawlings-hoh-glove', '11.75" infield pattern, brand new.', 'new', 'buy_now', 299.99, 299.99, 5, true, 'Rawlings', 'active', 175, 25),
    (sportsgear_id, sports_id, 'Hydrow Rowing Machine', 'hydrow-rower-2024', 'Connected rowing with live classes.', 'new', 'buy_now', 2245.00, 2245.00, 2, false, 'Hydrow', 'active', 390, 52),
    (sportsgear_id, sports_id, 'Osprey Atmos AG 65 Backpack', 'osprey-atmos-ag-65', 'Anti-Gravity suspension hiking pack.', 'new', 'buy_now', 320.00, 320.00, 7, true, 'Osprey', 'active', 245, 35),
    (sportsgear_id, sports_id, 'Thule T2 Pro XTR Bike Rack', 'thule-t2-pro-xtr', 'Platform hitch rack for 2 bikes.', 'new', 'buy_now', 749.95, 749.95, 4, false, 'Thule', 'active', 180, 28),
    (sportsgear_id, sports_id, 'Shimano Stradic FM 4000 Spinning Reel', 'shimano-stradic-fm-4000', 'High-performance fishing reel.', 'new', 'buy_now', 299.99, 299.99, 8, true, 'Shimano', 'active', 290, 42)
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- HOMEESSENTIALS - Home & Garden Seller (15+ products)
    -- =====================================================
    INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, view_count, watch_count) VALUES
    (homeessentials_id, home_id, 'Vitamix A3500 Ascent Series Blender', 'vitamix-a3500-blender', 'Smart blender with touchscreen controls.', 'new', 'buy_now', 649.95, 649.95, 6, true, 'Vitamix', 'active', 420, 58),
    (homeessentials_id, home_id, 'All-Clad D5 Stainless 10-Piece Set', 'allclad-d5-10pc-set', 'Professional-grade cookware set.', 'new', 'buy_now', 899.99, 899.99, 4, true, 'All-Clad', 'active', 350, 48),
    (homeessentials_id, home_id, 'Roomba j9+ Self-Emptying Robot', 'roomba-j9-plus', 'Latest iRobot with obstacle avoidance.', 'new', 'buy_now', 799.99, 799.99, 8, true, 'iRobot', 'active', 580, 75),
    (homeessentials_id, home_id, 'Dyson Purifier Hot+Cool HP09', 'dyson-hp09-purifier', 'HEPA air purifier with heating and cooling.', 'new', 'buy_now', 749.99, 749.99, 5, true, 'Dyson', 'active', 420, 55),
    (homeessentials_id, home_id, 'Thermador 36" Gas Range PRG366WH', 'thermador-range-36', 'Professional 6-burner range.', 'new', 'buy_now', 6999.00, 6999.00, 2, false, 'Thermador', 'active', 180, 25),
    (homeessentials_id, home_id, 'West Elm Harmony Sofa 82"', 'west-elm-harmony-sofa', 'Modern sofa in Distressed Velvet.', 'new', 'buy_now', 2199.00, 2199.00, 3, false, 'West Elm', 'active', 290, 42),
    (homeessentials_id, home_id, 'Casper Wave Hybrid King Mattress', 'casper-wave-hybrid-king', 'Premium hybrid mattress with cooling.', 'new', 'buy_now', 2895.00, 2895.00, 4, false, 'Casper', 'active', 320, 45),
    (homeessentials_id, home_id, 'Philips Hue Starter Kit 4 Bulbs', 'philips-hue-starter-kit', 'Smart lighting with Bridge included.', 'new', 'buy_now', 199.99, 199.99, 15, true, 'Philips', 'active', 480, 65),
    (homeessentials_id, home_id, 'Weber Spirit II E-310 Gas Grill', 'weber-spirit-ii-e310', '3-burner propane grill with side tables.', 'new', 'buy_now', 519.00, 519.00, 6, false, 'Weber', 'active', 350, 48),
    (homeessentials_id, home_id, 'KitchenAid Pro 600 Stand Mixer 6qt', 'kitchenaid-pro-600-6qt', 'Professional mixer in Empire Red.', 'new', 'buy_now', 449.99, 449.99, 8, true, 'KitchenAid', 'active', 520, 72),
    (homeessentials_id, home_id, 'Nespresso Vertuo Next Premium', 'nespresso-vertuo-next', 'Centrifusion brewing with Aeroccino.', 'new', 'buy_now', 229.00, 229.00, 12, true, 'Nespresso', 'active', 380, 52),
    (homeessentials_id, home_id, 'Crate & Barrel Axis Sectional', 'cb-axis-sectional', '3-piece sectional in light gray.', 'like_new', 'buy_now', 3499.00, 3499.00, 1, false, 'Crate & Barrel', 'active', 210, 32),
    (homeessentials_id, home_id, 'Miele Complete C3 Vacuum', 'miele-c3-vacuum', 'German engineering canister vacuum.', 'new', 'buy_now', 899.00, 899.00, 5, true, 'Miele', 'active', 290, 42),
    (homeessentials_id, home_id, 'Breville Oracle Touch Espresso', 'breville-oracle-touch', 'Automatic espresso with touch screen.', 'new', 'buy_now', 2499.95, 2499.95, 3, true, 'Breville', 'active', 380, 55),
    (homeessentials_id, home_id, 'Herman Miller Aeron Chair Size B', 'herman-miller-aeron-b', 'Ergonomic office chair, graphite.', 'like_new', 'buy_now', 1195.00, 1195.00, 4, true, 'Herman Miller', 'active', 450, 62),
    (homeessentials_id, home_id, 'Restoration Hardware Cloud Sofa', 'rh-cloud-sofa-classic', 'Luxurious deep seat sofa 8 foot.', 'like_new', 'buy_now', 4500.00, 4500.00, 1, false, 'RH', 'active', 180, 28)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Added 15+ products for each seller!';
END $$;

-- =====================================================
-- CREATE ORDERS WHERE SELLERS MAKE SALES
-- =====================================================
DO $$
DECLARE
    -- Buyers
    buyer_bob_id UUID;
    buyer_jane_id UUID;
    bookworm_id UUID;
    gamezone_id UUID;
    artcollector_id UUID;

    -- Sellers
    techdeals_id UUID;
    vintagetreasures_id UUID;
    fashionista_id UUID;
    sportsgear_id UUID;
    homeessentials_id UUID;

    -- Address
    addr_id UUID;

    -- Products and order
    prod RECORD;
    order_id UUID;
    item_id UUID;
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
    SELECT id INTO sportsgear_id FROM users WHERE username = 'sportsgear';
    SELECT id INTO homeessentials_id FROM users WHERE username = 'homeessentials';

    SELECT id INTO addr_id FROM addresses LIMIT 1;

    -- =====================================================
    -- SALES FOR TECHDEALS (10 orders - various statuses)
    -- =====================================================

    -- Sold iPhone to buyer_jane - DELIVERED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%iPhone 15 Pro%' AND seller_id = techdeals_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, techdeals_id, 'ORD-TECH-001',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, '1Z999AA10001', NOW() - INTERVAL '20 days', NOW() - INTERVAL '25 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
        VALUES (uuid_generate_v4(), order_id, prod.id, 1, prod.current_price, prod.current_price)
        RETURNING id INTO item_id;
    END IF;

    -- Sold Sony headphones to buyer_bob - DELIVERED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Sony WH-1000XM5%' AND seller_id = techdeals_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, techdeals_id, 'ORD-TECH-002',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, '1Z999AA10002', NOW() - INTERVAL '15 days', NOW() - INTERVAL '18 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
        VALUES (uuid_generate_v4(), order_id, prod.id, 1, prod.current_price, prod.current_price)
        RETURNING id INTO item_id;
    END IF;

    -- Meta Quest to gamezone - SHIPPED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Meta Quest 3%' AND seller_id = techdeals_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
        VALUES (uuid_generate_v4(), gamezone_id, techdeals_id, 'ORD-TECH-003',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'shipped', 'completed', addr_id, '1Z999AA10003', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- Razer laptop to bookworm - PROCESSING
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Razer Blade%' AND seller_id = techdeals_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), bookworm_id, techdeals_id, 'ORD-TECH-004',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'processing', 'completed', addr_id, NOW() - INTERVAL '1 day')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- Apple Watch to artcollector - PENDING
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Apple Watch Ultra%' AND seller_id = techdeals_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), artcollector_id, techdeals_id, 'ORD-TECH-005',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'pending', 'pending', addr_id, NOW())
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- =====================================================
    -- SALES FOR VINTAGETREASURES (5 orders)
    -- =====================================================

    -- LEGO set to buyer_bob - DELIVERED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%LEGO Star Wars UCS%' AND seller_id = vintagetreasures_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, vintagetreasures_id, 'ORD-VINT-001',
                prod.current_price, 25.00, prod.current_price * 0.08, prod.current_price * 1.08 + 25,
                'delivered', 'completed', addr_id, '9400111899001', NOW() - INTERVAL '10 days', NOW() - INTERVAL '14 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- Game Boy to gamezone - SHIPPED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Game Boy Color%' AND seller_id = vintagetreasures_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
        VALUES (uuid_generate_v4(), gamezone_id, vintagetreasures_id, 'ORD-VINT-002',
                prod.current_price, 15.00, prod.current_price * 0.08, prod.current_price * 1.08 + 15,
                'shipped', 'completed', addr_id, '9400111899002', NOW() - INTERVAL '3 days', NOW() - INTERVAL '5 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- Transformers to buyer_jane - PROCESSING
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Transformers G1%' AND seller_id = vintagetreasures_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, vintagetreasures_id, 'ORD-VINT-003',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'processing', 'completed', addr_id, NOW() - INTERVAL '2 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- =====================================================
    -- SALES FOR FASHIONISTA (5 orders)
    -- =====================================================

    -- Nike Dunk to gamezone - DELIVERED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Nike Dunk Low Panda%' AND seller_id = fashionista_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (uuid_generate_v4(), gamezone_id, fashionista_id, 'ORD-FASH-001',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, 'FEDEX12345', NOW() - INTERVAL '12 days', NOW() - INTERVAL '15 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- LV bag to buyer_jane - SHIPPED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Louis Vuitton Speedy%' AND seller_id = fashionista_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, fashionista_id, 'ORD-FASH-002',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'shipped', 'completed', addr_id, 'FEDEX12346', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
        VALUES (uuid_generate_v4(), order_id, prod.id, 1, prod.current_price, prod.current_price)
        RETURNING id INTO item_id;
    END IF;

    -- Omega watch to artcollector - PENDING
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Omega Seamaster%' AND seller_id = fashionista_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), artcollector_id, fashionista_id, 'ORD-FASH-003',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'pending', 'pending', addr_id, NOW())
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- =====================================================
    -- SALES FOR SPORTSGEAR (4 orders)
    -- =====================================================

    -- Callaway driver to buyer_bob - DELIVERED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Callaway Paradym%' AND seller_id = sportsgear_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, sportsgear_id, 'ORD-SPORT-001',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, 'UPS12345', NOW() - INTERVAL '8 days', NOW() - INTERVAL '12 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price)
        VALUES (uuid_generate_v4(), order_id, prod.id, 1, prod.current_price, prod.current_price)
        RETURNING id INTO item_id;
    END IF;

    -- Garmin watch to bookworm - SHIPPED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Garmin Forerunner%' AND seller_id = sportsgear_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, shipped_at, created_at)
        VALUES (uuid_generate_v4(), bookworm_id, sportsgear_id, 'ORD-SPORT-002',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'shipped', 'completed', addr_id, 'UPS12346', NOW() - INTERVAL '1 day', NOW() - INTERVAL '3 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- =====================================================
    -- SALES FOR HOMEESSENTIALS (4 orders)
    -- =====================================================

    -- Vitamix to buyer_jane - DELIVERED
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Vitamix%' AND seller_id = homeessentials_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, tracking_number, delivered_at, created_at)
        VALUES (uuid_generate_v4(), buyer_jane_id, homeessentials_id, 'ORD-HOME-001',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'delivered', 'completed', addr_id, 'USPS12345', NOW() - INTERVAL '18 days', NOW() - INTERVAL '22 days')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    -- Roomba to buyer_bob - PROCESSING
    SELECT id, current_price INTO prod FROM products WHERE title ILIKE '%Roomba%' AND seller_id = homeessentials_id LIMIT 1;
    IF prod.id IS NOT NULL THEN
        INSERT INTO orders (id, buyer_id, seller_id, order_number, subtotal, shipping_cost, tax, total,
                           status, payment_status, shipping_address_id, created_at)
        VALUES (uuid_generate_v4(), buyer_bob_id, homeessentials_id, 'ORD-HOME-002',
                prod.current_price, 0, prod.current_price * 0.08, prod.current_price * 1.08,
                'processing', 'completed', addr_id, NOW() - INTERVAL '1 day')
        RETURNING id INTO order_id;
        INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
        VALUES (order_id, prod.id, 1, prod.current_price, prod.current_price);
    END IF;

    RAISE NOTICE 'Created orders for all sellers!';
END $$;

-- =====================================================
-- CREATE DISPUTES (various statuses)
-- =====================================================
DO $$
DECLARE
    order_rec RECORD;
    order_item_id UUID;
BEGIN
    -- Dispute 1: Item not as described (resolved)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered' AND o.order_number = 'ORD-TECH-001'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, status,
                             reason, desired_resolution, resolution_notes, resolved_at, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'item_not_as_described', 'resolved',
                'Phone had minor scratches not shown in photos',
                'partial_refund', 'Seller agreed to $100 refund for cosmetic issues',
                NOW() - INTERVAL '5 days', NOW() - INTERVAL '15 days');
        RAISE NOTICE 'Created resolved dispute';
    END IF;

    -- Dispute 2: Item not received (open)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'shipped' AND o.order_number LIKE 'ORD-VINT-%'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, status,
                             reason, desired_resolution, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'item_not_received', 'open',
                'Tracking shows delivered but I never received the package',
                'full_refund', NOW() - INTERVAL '2 days');
        RAISE NOTICE 'Created open dispute';
    END IF;

    -- Dispute 3: Counterfeit item (under review)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered' AND o.order_number LIKE 'ORD-FASH-%'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, status,
                             reason, desired_resolution, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'counterfeit', 'under_review',
                'I believe this bag is not authentic, stitching is wrong',
                'full_refund', NOW() - INTERVAL '3 days');
        RAISE NOTICE 'Created under review dispute';
    END IF;
END $$;

-- =====================================================
-- CREATE RETURNS (various statuses)
-- =====================================================
DO $$
DECLARE
    order_rec RECORD;
BEGIN
    -- Return 1: Changed mind (approved, awaiting return)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id, o.total
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered' AND o.order_number = 'ORD-TECH-002'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason,
                            return_details, status, refund_amount, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'changed_mind', 'Found a better deal elsewhere, would like to return',
                'approved', order_rec.total, NOW() - INTERVAL '10 days');
        RAISE NOTICE 'Created approved return';
    END IF;

    -- Return 2: Defective item (completed/refunded)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id, o.total
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered' AND o.order_number = 'ORD-SPORT-001'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason,
                            return_details, status, refund_amount, return_tracking_number,
                            returned_at, refunded_at, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'defective', 'Driver head came loose after first use',
                'refunded', order_rec.total, '1Z999RET001',
                NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '8 days');
        RAISE NOTICE 'Created refunded return';
    END IF;

    -- Return 3: Wrong item (requested, pending seller approval)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id, o.total
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered' AND o.order_number = 'ORD-HOME-001'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason,
                            return_details, status, refund_amount, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'wrong_item', 'Received different color than ordered',
                'requested', order_rec.total, NOW() - INTERVAL '1 day');
        RAISE NOTICE 'Created requested return';
    END IF;

    -- Return 4: Not as described (rejected by seller)
    SELECT o.id, o.buyer_id, o.seller_id, oi.id as item_id, o.total
    INTO order_rec
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'delivered' AND o.order_number LIKE 'ORD-VINT-%'
    LIMIT 1;

    IF order_rec.id IS NOT NULL THEN
        INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason,
                            return_details, status, seller_notes, created_at)
        VALUES (order_rec.id, order_rec.item_id, order_rec.buyer_id, order_rec.seller_id,
                'not_as_described', 'Item condition is worse than listed',
                'rejected', 'Item was listed as-is, all flaws were documented in photos',
                NOW() - INTERVAL '12 days');
        RAISE NOTICE 'Created rejected return';
    END IF;
END $$;

-- =====================================================
-- UPDATE SELLER STATISTICS
-- =====================================================
UPDATE users u SET
    total_sales = (SELECT COUNT(*) FROM orders o WHERE o.seller_id = u.id AND o.payment_status = 'completed'),
    seller_rating = 4.5 + (RANDOM() * 0.5)
WHERE u.is_seller = true;

-- =====================================================
-- ADD PRODUCT IMAGES FOR NEW PRODUCTS
-- =====================================================
INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, sort_order)
SELECT p.id,
       'https://picsum.photos/seed/' || LEFT(p.id::text, 8) || '/800/600',
       'https://picsum.photos/seed/' || LEFT(p.id::text, 8) || '/300/200',
       true, 0
FROM products p
WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id);

-- =====================================================
-- SUMMARY
-- =====================================================
SELECT 'Seller Dashboard Seed Complete!' as status;

-- Products per seller
SELECT u.username as seller, COUNT(p.id) as products,
       COUNT(CASE WHEN p.status = 'active' THEN 1 END) as active,
       COUNT(CASE WHEN p.listing_type = 'auction' THEN 1 END) as auctions
FROM users u
LEFT JOIN products p ON p.seller_id = u.id
WHERE u.is_seller = true
GROUP BY u.username
ORDER BY products DESC;

-- Orders per seller
SELECT u.username as seller,
       COUNT(o.id) as total_orders,
       COUNT(CASE WHEN o.status = 'pending' THEN 1 END) as pending,
       COUNT(CASE WHEN o.status = 'processing' THEN 1 END) as processing,
       COUNT(CASE WHEN o.status = 'shipped' THEN 1 END) as shipped,
       COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered,
       COALESCE(SUM(CASE WHEN o.payment_status = 'completed' THEN o.total END), 0)::numeric(10,2) as total_sales
FROM users u
LEFT JOIN orders o ON o.seller_id = u.id
WHERE u.is_seller = true
GROUP BY u.username
ORDER BY total_sales DESC;

-- Disputes and Returns summary
SELECT 'Disputes' as type, status, COUNT(*) as count FROM disputes GROUP BY status
UNION ALL
SELECT 'Returns', status, COUNT(*) FROM returns GROUP BY status
ORDER BY type, status;
