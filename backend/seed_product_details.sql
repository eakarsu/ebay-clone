-- Update products with complete details (brand, model, color, specs, images, etc.)
DO $$
DECLARE
    product_rec RECORD;
    i INTEGER := 0;
    j INTEGER;
    brands TEXT[] := ARRAY['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Dell', 'HP', 'Lenovo', 'Canon', 'Nikon', 'LG', 'Bose', 'Dyson', 'KitchenAid', 'Nintendo', 'Microsoft', 'Rolex', 'Louis Vuitton', 'Gucci', 'Ray-Ban', 'GoPro', 'DJI', 'Herman Miller', 'Lego', 'Oakley', 'Sonos'];
    models TEXT[] := ARRAY['Pro Max', 'Ultra', 'Elite', 'Premium', 'Classic', 'Sport', 'Deluxe', 'Limited Edition', 'Signature Series', 'Professional', 'Home', 'Studio', 'Wireless', 'Smart', 'Compact'];
    colors TEXT[] := ARRAY['Black', 'White', 'Silver', 'Gold', 'Space Gray', 'Blue', 'Red', 'Green', 'Rose Gold', 'Midnight', 'Navy', 'Graphite', 'Natural', 'Titanium'];
    sizes TEXT[] := ARRAY['Small', 'Medium', 'Large', 'XL', 'XXL', 'One Size', '6.1 inch', '6.7 inch', '15 inch', '13 inch', '27 inch', '65 inch', '128GB', '256GB', '512GB', '1TB'];
    materials TEXT[] := ARRAY['Aluminum', 'Stainless Steel', 'Plastic', 'Leather', 'Canvas', 'Cotton', 'Ceramic', 'Glass', 'Carbon Fiber', 'Titanium', 'Wood', 'Silicone'];
    countries TEXT[] := ARRAY['China', 'USA', 'Japan', 'South Korea', 'Germany', 'Vietnam', 'India', 'Mexico', 'Taiwan', 'Italy', 'France', 'United Kingdom'];
    cities TEXT[] := ARRAY['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'San Francisco', 'Columbus', 'Seattle'];
    state_list TEXT[] := ARRAY['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA', 'TX', 'FL', 'CA', 'OH', 'WA'];
    city_idx INTEGER;
BEGIN
    -- Update all products with detailed info
    FOR product_rec IN SELECT id, title FROM products LOOP
        i := i + 1;
        city_idx := (i % 15) + 1;

        UPDATE products SET
            brand = brands[(i % 26) + 1],
            model = models[(i % 15) + 1],
            color = colors[(i % 14) + 1],
            size = sizes[(i % 16) + 1],
            material = materials[(i % 12) + 1],
            weight = (RANDOM() * 10 + 0.5)::DECIMAL(10,2),
            dimensions = FLOOR(RANDOM() * 20 + 5)::TEXT || ' x ' || FLOOR(RANDOM() * 15 + 3)::TEXT || ' x ' || FLOOR(RANDOM() * 10 + 2)::TEXT || ' inches',
            upc = LPAD(FLOOR(RANDOM() * 999999999999)::TEXT, 12, '0'),
            sku = 'SKU-' || UPPER(SUBSTRING(md5(random()::text), 1, 8)),
            country_of_origin = countries[(i % 12) + 1],
            shipping_from_city = cities[city_idx],
            shipping_from_state = state_list[city_idx],
            shipping_from_country = 'USA',
            estimated_delivery_days = FLOOR(RANDOM() * 7 + 3)::INT,
            allows_local_pickup = CASE WHEN RANDOM() > 0.7 THEN true ELSE false END,
            accepts_offers = CASE WHEN RANDOM() > 0.5 THEN true ELSE false END,
            minimum_offer_percentage = FLOOR(RANDOM() * 20 + 60)::INT,
            auto_accept_price = CASE
                WHEN RANDOM() > 0.5 THEN (COALESCE(buy_now_price, current_price, 100) * 0.95)::DECIMAL(10,2)
                ELSE NULL
            END,
            auto_decline_price = CASE
                WHEN RANDOM() > 0.5 THEN (COALESCE(buy_now_price, current_price, 100) * 0.6)::DECIMAL(10,2)
                ELSE NULL
            END,
            return_policy = CASE
                WHEN RANDOM() > 0.8 THEN 'no_returns'
                WHEN RANDOM() > 0.5 THEN 'exchange_only'
                ELSE 'returns_accepted'
            END,
            return_days = CASE WHEN RANDOM() > 0.5 THEN 30 ELSE 60 END,
            condition_description = CASE
                WHEN condition = 'new' THEN 'Brand new, sealed in original packaging. Never opened or used.'
                WHEN condition = 'like_new' THEN 'Open box, never used. All original accessories included.'
                WHEN condition = 'very_good' THEN 'Gently used with minimal signs of wear. Fully functional.'
                WHEN condition = 'good' THEN 'Used with some visible wear. Works perfectly.'
                ELSE 'Has visible wear and use. Tested and working.'
            END,
            view_count = FLOOR(RANDOM() * 500 + 50)::INT,
            watch_count = FLOOR(RANDOM() * 30 + 5)::INT,
            share_count = FLOOR(RANDOM() * 20)::INT
        WHERE id = product_rec.id;

        -- Add product images (3-5 per product)
        DELETE FROM product_images WHERE product_id = product_rec.id;
        FOR j IN 1..FLOOR(RANDOM() * 3 + 3)::INT LOOP
            INSERT INTO product_images (id, product_id, image_url, thumbnail_url, alt_text, sort_order, is_primary)
            VALUES (
                uuid_generate_v4(),
                product_rec.id,
                'https://picsum.photos/seed/' || SUBSTRING(product_rec.id::TEXT, 1, 8) || '-' || j || '/800/600',
                'https://picsum.photos/seed/' || SUBSTRING(product_rec.id::TEXT, 1, 8) || '-' || j || '/200/150',
                product_rec.title || ' - Image ' || j,
                j - 1,
                j = 1
            );
        END LOOP;

        -- Add product specifications
        DELETE FROM product_specifications WHERE product_id = product_rec.id;

        -- Key Features
        INSERT INTO product_specifications (id, product_id, spec_group, spec_name, spec_value, display_order)
        VALUES
            (uuid_generate_v4(), product_rec.id, 'Key Features', 'Fast Shipping', 'Ships within 24 hours', 1),
            (uuid_generate_v4(), product_rec.id, 'Key Features', 'Quality Guaranteed', '100% authentic product', 2),
            (uuid_generate_v4(), product_rec.id, 'Key Features', 'Easy Returns', 'Hassle-free return policy', 3),
            (uuid_generate_v4(), product_rec.id, 'Key Features', 'Secure Packaging', 'Double-boxed for protection', 4);

        -- Item Specifics
        INSERT INTO product_specifications (id, product_id, spec_group, spec_name, spec_value, display_order)
        VALUES
            (uuid_generate_v4(), product_rec.id, 'Item Specifics', 'Type', CASE
                WHEN i % 5 = 0 THEN 'Electronics'
                WHEN i % 5 = 1 THEN 'Fashion'
                WHEN i % 5 = 2 THEN 'Home & Garden'
                WHEN i % 5 = 3 THEN 'Sports'
                ELSE 'Collectibles'
            END, 10),
            (uuid_generate_v4(), product_rec.id, 'Item Specifics', 'Model Year', (2020 + (i % 6))::TEXT, 11),
            (uuid_generate_v4(), product_rec.id, 'Item Specifics', 'Warranty', CASE WHEN RANDOM() > 0.5 THEN '1 Year Manufacturer' ELSE '90 Days Seller' END, 12),
            (uuid_generate_v4(), product_rec.id, 'Item Specifics', 'Package Includes', 'Main item, manual, accessories', 13);

        -- Technical Specifications
        INSERT INTO product_specifications (id, product_id, spec_group, spec_name, spec_value, display_order)
        VALUES
            (uuid_generate_v4(), product_rec.id, 'Specifications', 'Power Source', CASE WHEN RANDOM() > 0.5 THEN 'Battery' ELSE 'AC Adapter' END, 20),
            (uuid_generate_v4(), product_rec.id, 'Specifications', 'Connectivity', CASE WHEN RANDOM() > 0.5 THEN 'Wireless / Bluetooth' ELSE 'USB-C / Lightning' END, 21),
            (uuid_generate_v4(), product_rec.id, 'Specifications', 'Compatibility', 'Universal / Multi-platform', 22);

        IF i % 100 = 0 THEN
            RAISE NOTICE 'Updated % products...', i;
        END IF;
    END LOOP;

    RAISE NOTICE 'Completed updating % products with details', i;
END $$;

-- Verify updates
SELECT 'Product Details Summary:' as info;
SELECT
    COUNT(*) as total_products,
    COUNT(brand) as with_brand,
    COUNT(model) as with_model,
    COUNT(color) as with_color,
    COUNT(country_of_origin) as with_origin,
    COUNT(condition_description) as with_condition_desc
FROM products;

SELECT 'Product Images Summary:' as info;
SELECT COUNT(*) as total_images, COUNT(DISTINCT product_id) as products_with_images
FROM product_images;

SELECT 'Product Specifications Summary:' as info;
SELECT spec_group, COUNT(*) as count
FROM product_specifications
GROUP BY spec_group
ORDER BY spec_group;

-- Show sample product data
SELECT 'Sample Product:' as info;
SELECT id, title, brand, model, color, size, material, country_of_origin, shipping_from_city, shipping_from_state
FROM products
LIMIT 3;
