-- Seed products for all categories to have at least 25 items each
DO $$
DECLARE
    v_seller_ids UUID[];
    v_category_id UUID;
    v_seller_id UUID;
    i INT;
    v_price DECIMAL;
    v_condition TEXT;
    v_listing_type TEXT;
    v_free_shipping BOOLEAN;
    v_brand TEXT;
    v_color TEXT;
BEGIN
    -- Get all seller IDs
    SELECT ARRAY_AGG(id) INTO v_seller_ids FROM users WHERE is_seller = true LIMIT 10;

    -- ===================== BABY & KIDS =====================
    SELECT id INTO v_category_id FROM categories WHERE slug = 'baby-kids';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..30 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 15 + (random() * 200)::INT;
            v_condition := (ARRAY['new', 'like_new', 'very_good'])[1 + (random() * 2)::INT];
            v_listing_type := (ARRAY['buy_now', 'auction', 'both'])[1 + (random() * 2)::INT];
            v_free_shipping := random() < 0.4;
            v_brand := (ARRAY['Fisher-Price', 'Graco', 'Pampers', 'Huggies', 'Carter''s', 'Gerber', 'Skip Hop', 'Baby Bjorn', 'Chicco', 'Britax'])[1 + (random() * 9)::INT];
            v_color := (ARRAY['Pink', 'Blue', 'White', 'Yellow', 'Green', 'Gray', 'Beige'])[1 + (random() * 6)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, color, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Baby Stroller Lightweight Foldable', 'Infant Car Seat with Base', 'Baby Monitor with Camera WiFi',
                    'Convertible Crib 4-in-1', 'Baby Swing Electric Portable', 'High Chair Adjustable Height',
                    'Diaper Bag Backpack Large', 'Baby Carrier Ergonomic', 'Playpen Portable Travel',
                    'Baby Walker Activity Center', 'Nursing Pillow Support', 'Baby Bathtub Foldable',
                    'Bottle Warmer Fast Electric', 'Baby Food Maker Steamer', 'Pacifier Set BPA Free',
                    'Baby Clothes Set Organic Cotton', 'Swaddle Blanket Set', 'Baby Shoes First Walker',
                    'Teething Toys Silicone', 'Baby Gate Safety Door', 'Changing Pad Waterproof',
                    'Baby Rocker Bouncer', 'Kids Tricycle Balance Bike', 'Toddler Bed Rail Guard',
                    'Baby Night Light Projector', 'Kids Potty Training Seat', 'Baby Humidifier Cool Mist',
                    'Stroller Organizer Bag', 'Baby Play Mat Educational', 'Kids Backpack Toddler'
                ])[i],
                'baby-item-' || i || '-' || substr(md5(random()::text), 1, 6),
                'High quality baby product, safe and durable for your little one.',
                v_condition,
                v_listing_type,
                v_price,
                CASE WHEN v_listing_type IN ('buy_now', 'both') THEN v_price ELSE NULL END,
                1 + (random() * 10)::INT,
                v_free_shipping,
                v_brand,
                v_color,
                'active',
                random() < 0.5,
                (random() * 500)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 30 Baby & Kids products';
    END IF;

    -- ===================== BOOKS & MEDIA =====================
    SELECT id INTO v_category_id FROM categories WHERE slug = 'books-media';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..30 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 5 + (random() * 100)::INT;
            v_condition := (ARRAY['new', 'like_new', 'very_good', 'good'])[1 + (random() * 3)::INT];
            v_listing_type := (ARRAY['buy_now', 'auction', 'both'])[1 + (random() * 2)::INT];
            v_free_shipping := random() < 0.5;
            v_brand := (ARRAY['Penguin', 'HarperCollins', 'Random House', 'Simon & Schuster', 'Hachette', 'Macmillan', 'Scholastic', 'Marvel Comics', 'DC Comics', 'Criterion'])[1 + (random() * 9)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Harry Potter Complete Box Set', 'Lord of the Rings Trilogy Hardcover', 'Stephen King Collection Horror',
                    'Marvel Comics Omnibus Edition', 'Game of Thrones Book Set', 'Star Wars Encyclopedia',
                    'National Geographic Magazine Collection', 'Vintage Vinyl Records Jazz', 'Classic Movies DVD Collection',
                    'Beatles Abbey Road Vinyl Original', 'Photography Art Book Coffee Table', 'Cookbook Collection Italian',
                    'Self Help Books Best Sellers', 'Science Fiction Anthology', 'Mystery Thriller Novel Set',
                    'Children Books Educational Set', 'Biography History Collection', 'Romance Novel Bundle',
                    'Manga Complete Series Box', 'Comic Book Rare First Edition', 'Audiobook Collection USB',
                    'Dictionary Encyclopedia Set', 'Travel Guide Book Collection', 'Art History Coffee Table Book',
                    'Music Theory Textbook Set', 'Programming Books Bundle', 'Business Leadership Books',
                    'Poetry Anthology Classic', 'Religious Texts Collection', 'Vintage Magazine Lot'
                ])[i],
                'book-media-' || i || '-' || substr(md5(random()::text), 1, 6),
                'Great condition media item, perfect for collectors or readers.',
                v_condition,
                v_listing_type,
                v_price,
                CASE WHEN v_listing_type IN ('buy_now', 'both') THEN v_price ELSE NULL END,
                1 + (random() * 5)::INT,
                v_free_shipping,
                v_brand,
                'active',
                random() < 0.6,
                (random() * 400)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 30 Books & Media products';
    END IF;

    -- ===================== BUSINESS & INDUSTRIAL =====================
    SELECT id INTO v_category_id FROM categories WHERE slug = 'business-industrial';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..30 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 50 + (random() * 2000)::INT;
            v_condition := (ARRAY['new', 'like_new', 'very_good'])[1 + (random() * 2)::INT];
            v_listing_type := (ARRAY['buy_now', 'auction', 'both'])[1 + (random() * 2)::INT];
            v_free_shipping := random() < 0.3;
            v_brand := (ARRAY['3M', 'Caterpillar', 'DeWalt', 'Milwaukee', 'Bosch', 'Makita', 'Stanley', 'Honeywell', 'Siemens', 'ABB'])[1 + (random() * 9)::INT];
            v_color := (ARRAY['Yellow', 'Black', 'Orange', 'Red', 'Blue', 'Gray'])[1 + (random() * 5)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, color, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Industrial Air Compressor 60 Gallon', 'Forklift Pallet Jack Electric', 'Commercial Pressure Washer 4000 PSI',
                    'Welding Machine MIG TIG Combo', 'CNC Router Machine Desktop', 'Industrial Generator 10000W',
                    'Commercial Vacuum Cleaner Heavy Duty', 'Pallet Racking System Warehouse', 'Industrial Fan 36 Inch',
                    'Commercial Deep Fryer Stainless', 'Point of Sale POS System Complete', 'Security Camera System 16 Channel',
                    'Commercial Refrigerator Double Door', 'Industrial Shelving Metal Heavy', 'Conveyor Belt System Module',
                    'Commercial Ice Machine 500 lb', 'Industrial Drill Press Floor', 'Commercial Oven Convection',
                    'Forklift Battery 36V Industrial', 'Commercial Dishwasher High Temp', 'Industrial Lathe Machine',
                    'Commercial Mixer 60 Quart', 'Packing Machine Automatic', 'Industrial Scale Platform 1000 lb',
                    'Commercial Printer Industrial Label', 'Hydraulic Press 50 Ton', 'Industrial Bandsaw Metal Cut',
                    'Commercial HVAC Unit 5 Ton', 'Warehouse Dock Equipment', 'Industrial Safety Equipment Set'
                ])[i],
                'business-ind-' || i || '-' || substr(md5(random()::text), 1, 6),
                'Professional grade industrial equipment for business use.',
                v_condition,
                v_listing_type,
                v_price,
                CASE WHEN v_listing_type IN ('buy_now', 'both') THEN v_price ELSE NULL END,
                1 + (random() * 3)::INT,
                v_free_shipping,
                v_brand,
                v_color,
                'active',
                random() < 0.7,
                (random() * 300)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 30 Business & Industrial products';
    END IF;

    -- ===================== JEWELRY & WATCHES =====================
    SELECT id INTO v_category_id FROM categories WHERE slug = 'jewelry-watches';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..30 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 25 + (random() * 5000)::INT;
            v_condition := (ARRAY['new', 'like_new', 'very_good'])[1 + (random() * 2)::INT];
            v_listing_type := (ARRAY['buy_now', 'auction', 'both'])[1 + (random() * 2)::INT];
            v_free_shipping := random() < 0.6;
            v_brand := (ARRAY['Rolex', 'Omega', 'Cartier', 'Tiffany & Co', 'Pandora', 'Swarovski', 'Michael Kors', 'Fossil', 'Seiko', 'Citizen'])[1 + (random() * 9)::INT];
            v_color := (ARRAY['Gold', 'Silver', 'Rose Gold', 'Black', 'White', 'Blue'])[1 + (random() * 5)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, color, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Diamond Engagement Ring 1 Carat', 'Luxury Watch Automatic Swiss', 'Gold Necklace 18K Italian Chain',
                    'Pearl Earrings Genuine Freshwater', 'Silver Bracelet Sterling 925', 'Sapphire Pendant Natural Blue',
                    'Mens Watch Chronograph Sport', 'Diamond Tennis Bracelet 3 Carat', 'Gold Hoop Earrings 14K',
                    'Vintage Pocket Watch Antique', 'Ruby Ring Natural Red Stone', 'Smart Watch Luxury Edition',
                    'Wedding Band Set His Hers', 'Emerald Necklace Genuine Stone', 'Womens Watch Rose Gold',
                    'Diamond Stud Earrings 0.5 Carat', 'Mens Signet Ring Gold', 'Charm Bracelet Silver',
                    'Vintage Brooch Antique Gold', 'Opal Ring Australian Fire', 'Dive Watch Professional 200m',
                    'Pearl Necklace Cultured Strand', 'Cufflinks Set Luxury Gold', 'Anklet Gold Dainty Chain',
                    'Birthstone Ring Custom', 'Skeleton Watch Mechanical', 'Diamond Wedding Band Eternity',
                    'Mens Bracelet Leather Steel', 'Vintage Watch Collection Lot', 'Jewelry Box Organizer Wood'
                ])[i],
                'jewelry-watch-' || i || '-' || substr(md5(random()::text), 1, 6),
                'Beautiful jewelry piece or timepiece, authentic and high quality.',
                v_condition,
                v_listing_type,
                v_price,
                CASE WHEN v_listing_type IN ('buy_now', 'both') THEN v_price ELSE NULL END,
                1,
                v_free_shipping,
                v_brand,
                v_color,
                'active',
                random() < 0.8,
                (random() * 600)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 30 Jewelry & Watches products';
    END IF;

    -- ===================== HOME & GARDEN (needs 10 more) =====================
    SELECT id INTO v_category_id FROM categories WHERE slug = 'home-garden';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..15 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 20 + (random() * 500)::INT;
            v_condition := (ARRAY['new', 'like_new'])[1 + (random() * 1)::INT];
            v_listing_type := (ARRAY['buy_now', 'both'])[1 + (random() * 1)::INT];
            v_free_shipping := random() < 0.4;
            v_brand := (ARRAY['KitchenAid', 'Dyson', 'iRobot', 'Ninja', 'Cuisinart', 'Weber', 'Scotts', 'Black+Decker', 'Craftsman', 'DeWalt'])[1 + (random() * 9)::INT];
            v_color := (ARRAY['Black', 'White', 'Silver', 'Red', 'Green', 'Blue'])[1 + (random() * 5)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, color, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Robot Vacuum Cleaner Smart', 'Air Purifier HEPA Large Room', 'Stand Mixer Professional 6 Qt',
                    'Pressure Cooker Electric 8 Qt', 'Cordless Stick Vacuum', 'Dehumidifier 50 Pint',
                    'Gas Grill 4 Burner Stainless', 'Lawn Mower Electric Cordless', 'Power Washer 2000 PSI',
                    'Patio Furniture Set 5 Piece', 'Garden Tool Set Complete', 'Outdoor String Lights Solar',
                    'Fire Pit Table Propane', 'Raised Garden Bed Kit', 'Smart Thermostat WiFi'
                ])[i],
                'home-garden-new-' || i || '-' || substr(md5(random()::text), 1, 6),
                'Quality home and garden product for your household needs.',
                v_condition,
                v_listing_type,
                v_price,
                v_price,
                1 + (random() * 5)::INT,
                v_free_shipping,
                v_brand,
                v_color,
                'active',
                random() < 0.5,
                (random() * 400)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 15 more Home & Garden products';
    END IF;

    -- Update Electronics to have more variety
    SELECT id INTO v_category_id FROM categories WHERE slug = 'electronics';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..20 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 30 + (random() * 1500)::INT;
            v_condition := (ARRAY['new', 'like_new', 'very_good'])[1 + (random() * 2)::INT];
            v_listing_type := (ARRAY['buy_now', 'auction', 'both'])[1 + (random() * 2)::INT];
            v_free_shipping := random() < 0.5;
            v_brand := (ARRAY['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Bose', 'JBL', 'Canon', 'Nikon'])[1 + (random() * 9)::INT];
            v_color := (ARRAY['Black', 'White', 'Silver', 'Space Gray', 'Blue', 'Red'])[1 + (random() * 5)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, color, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Wireless Earbuds Pro Noise Cancel', 'Portable Bluetooth Speaker', 'Action Camera 4K Waterproof',
                    'E-Reader Tablet 7 inch', 'Wireless Charging Pad Fast', 'USB-C Hub Multiport Adapter',
                    'External SSD 1TB Portable', 'Webcam 4K Streaming', 'Microphone USB Podcast',
                    'Ring Light LED 18 inch', 'Drone Mini Camera HD', 'VR Headset Standalone',
                    'Projector Home Theater 1080p', 'Smart Display Voice Assistant', 'Fitness Tracker Watch',
                    'Noise Cancelling Headphones', 'Tablet Stand Adjustable', 'Power Bank 20000mAh',
                    'Smart Plug WiFi Set 4', 'Cable Management Kit'
                ])[i],
                'electronics-new-' || i || '-' || substr(md5(random()::text), 1, 6),
                'Latest technology electronics with warranty.',
                v_condition,
                v_listing_type,
                v_price,
                CASE WHEN v_listing_type IN ('buy_now', 'both') THEN v_price ELSE NULL END,
                1 + (random() * 10)::INT,
                v_free_shipping,
                v_brand,
                v_color,
                'active',
                random() < 0.6,
                (random() * 800)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 20 more Electronics products';
    END IF;

    -- Update Motors to have more variety
    SELECT id INTO v_category_id FROM categories WHERE slug = 'motors';
    IF v_category_id IS NOT NULL THEN
        FOR i IN 1..20 LOOP
            v_seller_id := v_seller_ids[1 + (i % array_length(v_seller_ids, 1))];
            v_price := 20 + (random() * 500)::INT;
            v_condition := (ARRAY['new', 'like_new', 'very_good', 'good'])[1 + (random() * 3)::INT];
            v_listing_type := (ARRAY['buy_now', 'auction', 'both'])[1 + (random() * 2)::INT];
            v_free_shipping := random() < 0.3;
            v_brand := (ARRAY['Bosch', 'NGK', 'Michelin', 'Mobil 1', 'K&N', 'WeatherTech', 'Hella', 'Bilstein', 'Brembo', 'ACDelco'])[1 + (random() * 9)::INT];
            v_color := (ARRAY['Black', 'Chrome', 'Silver', 'Red', 'Blue'])[1 + (random() * 4)::INT];

            INSERT INTO products (seller_id, category_id, title, slug, description, condition, listing_type, current_price, buy_now_price, quantity, free_shipping, brand, color, status, accepts_offers, view_count)
            VALUES (
                v_seller_id,
                v_category_id,
                (ARRAY[
                    'Car Floor Mats All Weather Set', 'LED Headlight Bulbs H11 Pair', 'Dash Cam Front Rear 4K',
                    'Tire Pressure Monitor TPMS', 'Jump Starter Portable 2000A', 'Car Cover Waterproof SUV',
                    'OBD2 Scanner Bluetooth Pro', 'Seat Covers Universal Set', 'Car Vacuum Cleaner Cordless',
                    'Roof Rack Cross Bars', 'Tonneau Cover Truck Bed', 'Car Stereo Android Auto',
                    'Backup Camera Wireless', 'Performance Air Filter', 'Steering Wheel Cover Leather',
                    'Car Phone Mount Wireless Charge', 'Windshield Sunshade Foldable', 'Motorcycle Helmet Full Face',
                    'Motorcycle Gloves Leather', 'ATV Winch 4500 lb'
                ])[i],
                'motors-new-' || i || '-' || substr(md5(random()::text), 1, 6),
                'Quality automotive parts and accessories.',
                v_condition,
                v_listing_type,
                v_price,
                CASE WHEN v_listing_type IN ('buy_now', 'both') THEN v_price ELSE NULL END,
                1 + (random() * 15)::INT,
                v_free_shipping,
                v_brand,
                v_color,
                'active',
                random() < 0.5,
                (random() * 350)::INT
            );
        END LOOP;
        RAISE NOTICE 'Added 20 more Motors products';
    END IF;

END $$;

-- Verify the counts
SELECT c.name, COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
GROUP BY c.id, c.name
ORDER BY product_count DESC;
