const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const seedDatabase = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting database seed...');

    // Read and execute schema
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await client.query(schema);
    console.log('Schema created successfully');

    // Hash password for all users
    const passwordHash = await bcrypt.hash('password123', 10);

    // ==================== USERS ====================
    console.log('Seeding users...');
    const users = await client.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, phone, bio, is_verified, is_seller, seller_rating, total_sales, avatar_url) VALUES
      ('techdeals', 'techdeals@example.com', $1, 'John', 'Smith', '555-0101', 'Professional electronics seller with 10+ years experience. Quality guaranteed!', true, true, 4.95, 1523, 'https://api.dicebear.com/7.x/avataaars/svg?seed=techdeals'),
      ('vintagetreasures', 'vintage@example.com', $1, 'Sarah', 'Johnson', '555-0102', 'Curating the finest vintage and antique items since 2010.', true, true, 4.88, 892, 'https://api.dicebear.com/7.x/avataaars/svg?seed=vintage'),
      ('fashionista', 'fashion@example.com', $1, 'Emily', 'Davis', '555-0103', 'Fashion enthusiast selling designer items and trendy clothes.', true, true, 4.92, 2105, 'https://api.dicebear.com/7.x/avataaars/svg?seed=fashion'),
      ('sportsgear', 'sports@example.com', $1, 'Mike', 'Wilson', '555-0104', 'Your one-stop shop for sports equipment and athletic gear.', true, true, 4.78, 567, 'https://api.dicebear.com/7.x/avataaars/svg?seed=sports'),
      ('homeessentials', 'home@example.com', $1, 'Lisa', 'Brown', '555-0105', 'Home goods, furniture, and kitchen essentials at great prices.', true, true, 4.85, 743, 'https://api.dicebear.com/7.x/avataaars/svg?seed=home'),
      ('bookworm', 'books@example.com', $1, 'David', 'Lee', '555-0106', 'Rare books, first editions, and collectible literature.', true, true, 4.90, 412, 'https://api.dicebear.com/7.x/avataaars/svg?seed=books'),
      ('gamezone', 'games@example.com', $1, 'Chris', 'Taylor', '555-0107', 'Video games, consoles, and gaming accessories.', true, true, 4.82, 934, 'https://api.dicebear.com/7.x/avataaars/svg?seed=games'),
      ('artcollector', 'art@example.com', $1, 'Anna', 'Martinez', '555-0108', 'Original artwork, prints, and collectible art pieces.', true, true, 4.96, 298, 'https://api.dicebear.com/7.x/avataaars/svg?seed=art'),
      ('buyer_jane', 'jane@example.com', $1, 'Jane', 'Doe', '555-0109', 'Avid collector and bargain hunter.', true, false, 0, 0, 'https://api.dicebear.com/7.x/avataaars/svg?seed=jane'),
      ('buyer_bob', 'bob@example.com', $1, 'Bob', 'Anderson', '555-0110', 'Looking for great deals!', true, false, 0, 0, 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob')
      RETURNING id, username
    `, [passwordHash]);

    const userMap = {};
    users.rows.forEach(u => userMap[u.username] = u.id);

    // Create shopping carts for all users
    for (const userId of Object.values(userMap)) {
      await client.query('INSERT INTO shopping_carts (user_id) VALUES ($1)', [userId]);
    }

    // ==================== CATEGORIES ====================
    console.log('Seeding categories...');
    const categories = await client.query(`
      INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
      ('Electronics', 'electronics', 'Computers, phones, cameras, and more', 'devices', 1),
      ('Fashion', 'fashion', 'Clothing, shoes, and accessories', 'checkroom', 2),
      ('Home & Garden', 'home-garden', 'Furniture, decor, and outdoor', 'home', 3),
      ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', 'sports_soccer', 4),
      ('Collectibles & Art', 'collectibles-art', 'Antiques, art, and collectibles', 'palette', 5),
      ('Books & Media', 'books-media', 'Books, movies, music, and games', 'menu_book', 6),
      ('Toys & Games', 'toys-games', 'Toys, games, and hobbies', 'toys', 7),
      ('Motors', 'motors', 'Cars, motorcycles, and parts', 'directions_car', 8),
      ('Business & Industrial', 'business-industrial', 'Office equipment and industrial supplies', 'business', 9),
      ('Health & Beauty', 'health-beauty', 'Personal care and wellness products', 'spa', 10)
      RETURNING id, slug
    `);

    const catMap = {};
    categories.rows.forEach(c => catMap[c.slug] = c.id);

    // ==================== SUBCATEGORIES ====================
    console.log('Seeding subcategories...');
    const subcategories = await client.query(`
      INSERT INTO subcategories (category_id, name, slug, sort_order) VALUES
      -- Electronics
      ($1, 'Smartphones & Accessories', 'smartphones', 1),
      ($1, 'Computers & Tablets', 'computers-tablets', 2),
      ($1, 'Cameras & Photography', 'cameras', 3),
      ($1, 'TV & Home Audio', 'tv-audio', 4),
      ($1, 'Wearable Technology', 'wearables', 5),
      -- Fashion
      ($2, 'Men''s Clothing', 'mens-clothing', 1),
      ($2, 'Women''s Clothing', 'womens-clothing', 2),
      ($2, 'Shoes', 'shoes', 3),
      ($2, 'Watches & Jewelry', 'watches-jewelry', 4),
      ($2, 'Bags & Accessories', 'bags-accessories', 5),
      -- Home & Garden
      ($3, 'Furniture', 'furniture', 1),
      ($3, 'Kitchen & Dining', 'kitchen-dining', 2),
      ($3, 'Bedding & Bath', 'bedding-bath', 3),
      ($3, 'Garden & Patio', 'garden-patio', 4),
      ($3, 'Home Decor', 'home-decor', 5),
      -- Sports
      ($4, 'Exercise & Fitness', 'fitness', 1),
      ($4, 'Cycling', 'cycling', 2),
      ($4, 'Golf', 'golf', 3),
      ($4, 'Team Sports', 'team-sports', 4),
      ($4, 'Camping & Hiking', 'camping-hiking', 5),
      -- Collectibles
      ($5, 'Antiques', 'antiques', 1),
      ($5, 'Art', 'art', 2),
      ($5, 'Coins & Currency', 'coins', 3),
      ($5, 'Sports Memorabilia', 'sports-memorabilia', 4),
      ($5, 'Vintage Items', 'vintage-items', 5),
      -- Books
      ($6, 'Books', 'books', 1),
      ($6, 'Movies & TV', 'movies-tv', 2),
      ($6, 'Music', 'music', 3),
      ($6, 'Video Games', 'video-games', 4),
      ($6, 'Musical Instruments', 'instruments', 5)
      RETURNING id, slug, category_id
    `, [catMap['electronics'], catMap['fashion'], catMap['home-garden'], catMap['sports-outdoors'], catMap['collectibles-art'], catMap['books-media']]);

    const subMap = {};
    subcategories.rows.forEach(s => subMap[s.slug] = s.id);

    // ==================== ADDRESSES ====================
    console.log('Seeding addresses...');
    await client.query(`
      INSERT INTO addresses (user_id, address_type, is_default, full_name, street_address, city, state, postal_code, country, phone) VALUES
      ($1, 'both', true, 'Jane Doe', '123 Main Street', 'New York', 'NY', '10001', 'United States', '555-0109'),
      ($1, 'shipping', false, 'Jane Doe', '456 Oak Avenue', 'Brooklyn', 'NY', '11201', 'United States', '555-0109'),
      ($2, 'both', true, 'Bob Anderson', '789 Pine Road', 'Los Angeles', 'CA', '90001', 'United States', '555-0110'),
      ($3, 'both', true, 'John Smith', '321 Tech Blvd', 'San Francisco', 'CA', '94102', 'United States', '555-0101'),
      ($4, 'both', true, 'Sarah Johnson', '654 Vintage Lane', 'Chicago', 'IL', '60601', 'United States', '555-0102')
    `, [userMap['buyer_jane'], userMap['buyer_bob'], userMap['techdeals'], userMap['vintagetreasures']]);

    // ==================== PRODUCTS ====================
    console.log('Seeding products...');

    const products = [];

    // Electronics - Smartphones
    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'smartphones',
      title: 'iPhone 15 Pro Max 256GB - Natural Titanium', description: 'Brand new, sealed iPhone 15 Pro Max. Features the A17 Pro chip, 48MP camera system, and titanium design. Full Apple warranty included.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 1199.99,
      shipping: 0, freeShipping: true, city: 'San Francisco', state: 'CA',
      brand: 'Apple', model: 'iPhone 15 Pro Max', quantity: 5,
      images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', 'https://images.unsplash.com/photo-1695048132823-866d2c0f2f75?w=800']
    });

    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'smartphones',
      title: 'Samsung Galaxy S24 Ultra 512GB - Titanium Black', description: 'The ultimate Galaxy experience with AI-powered features, 200MP camera, and S Pen included.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 1299.99,
      shipping: 0, freeShipping: true, city: 'San Francisco', state: 'CA',
      brand: 'Samsung', model: 'Galaxy S24 Ultra', quantity: 3,
      images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800']
    });

    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'smartphones',
      title: 'Google Pixel 8 Pro 256GB - Obsidian', description: 'Experience the best of Google AI with the Pixel 8 Pro. Incredible camera, 7 years of updates.',
      condition: 'new', listingType: 'both', startingPrice: 699.99, buyNowPrice: 899.99,
      shipping: 9.99, freeShipping: false, city: 'San Francisco', state: 'CA',
      brand: 'Google', model: 'Pixel 8 Pro', quantity: 8,
      images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800']
    });

    // Electronics - Computers
    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'computers-tablets',
      title: 'MacBook Pro 16" M3 Max - Space Black', description: 'Powerhouse laptop with M3 Max chip, 36GB RAM, 1TB SSD. Perfect for professionals.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 3499.99,
      shipping: 0, freeShipping: true, city: 'San Francisco', state: 'CA',
      brand: 'Apple', model: 'MacBook Pro 16 M3 Max', quantity: 2,
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800']
    });

    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'computers-tablets',
      title: 'Dell XPS 15 - Intel i9, 32GB RAM, RTX 4070', description: 'Premium Windows laptop with stunning OLED display and powerful specs for creative work.',
      condition: 'like_new', listingType: 'auction', startingPrice: 1499.99,
      shipping: 19.99, freeShipping: false, city: 'San Francisco', state: 'CA',
      brand: 'Dell', model: 'XPS 15 9530', quantity: 1,
      images: ['https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800']
    });

    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'computers-tablets',
      title: 'iPad Pro 12.9" M2 256GB WiFi + Cellular', description: 'The ultimate iPad experience with M2 chip, Liquid Retina XDR display, and Apple Pencil support.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 1199.99,
      shipping: 0, freeShipping: true, city: 'San Francisco', state: 'CA',
      brand: 'Apple', model: 'iPad Pro 12.9 M2', quantity: 4,
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800']
    });

    // Electronics - Cameras
    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'cameras',
      title: 'Sony A7 IV Full-Frame Mirrorless Camera Body', description: 'Professional mirrorless camera with 33MP sensor, 4K 60p video, and advanced autofocus.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 2498.00,
      shipping: 0, freeShipping: true, city: 'San Francisco', state: 'CA',
      brand: 'Sony', model: 'A7 IV', quantity: 3,
      images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800']
    });

    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'cameras',
      title: 'Canon EOS R5 Body - 45MP Full Frame', description: '8K video capable mirrorless with incredible autofocus and in-body stabilization.',
      condition: 'like_new', listingType: 'auction', startingPrice: 2999.99,
      shipping: 24.99, freeShipping: false, city: 'San Francisco', state: 'CA',
      brand: 'Canon', model: 'EOS R5', quantity: 1,
      images: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800']
    });

    // Electronics - Wearables
    products.push({
      seller: 'techdeals', category: 'electronics', subcategory: 'wearables',
      title: 'Apple Watch Ultra 2 - Titanium with Orange Alpine Loop', description: 'The most rugged Apple Watch ever. Perfect for extreme sports and outdoor adventures.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 799.99,
      shipping: 0, freeShipping: true, city: 'San Francisco', state: 'CA',
      brand: 'Apple', model: 'Watch Ultra 2', quantity: 6,
      images: ['https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800']
    });

    // Fashion - Men's
    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'mens-clothing',
      title: 'Gucci GG Jacquard Wool Sweater - Size L', description: 'Authentic Gucci sweater in navy blue with iconic GG pattern. Made in Italy.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 1100.00,
      shipping: 14.99, freeShipping: false, city: 'New York', state: 'NY',
      brand: 'Gucci', size: 'L', material: 'Wool', quantity: 2,
      images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800']
    });

    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'mens-clothing',
      title: 'Vintage Levi\'s 501 Jeans - 32x32', description: 'Original vintage Levi\'s 501 from the 1990s. Perfect fade and authentic wear.',
      condition: 'good', listingType: 'auction', startingPrice: 89.99,
      shipping: 9.99, freeShipping: false, city: 'New York', state: 'NY',
      brand: 'Levi\'s', model: '501', size: '32x32', material: 'Denim', quantity: 1,
      images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=800']
    });

    // Fashion - Women's
    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'womens-clothing',
      title: 'Chanel Classic Tweed Jacket - Size 38', description: 'Iconic Chanel tweed jacket in black and white. Timeless elegance.',
      condition: 'like_new', listingType: 'auction', startingPrice: 2499.99,
      shipping: 0, freeShipping: true, city: 'New York', state: 'NY',
      brand: 'Chanel', size: '38', material: 'Tweed', quantity: 1,
      images: ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800']
    });

    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'womens-clothing',
      title: 'Reformation Linen Midi Dress - Emerald Green', description: 'Sustainable and stylish linen dress perfect for summer.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 248.00,
      shipping: 7.99, freeShipping: false, city: 'New York', state: 'NY',
      brand: 'Reformation', size: 'M', material: 'Linen', quantity: 3,
      images: ['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800']
    });

    // Fashion - Watches
    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'watches-jewelry',
      title: 'Rolex Submariner Date 126610LN - 2023', description: 'Brand new Rolex Submariner with box and papers. Full 5-year warranty.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 14500.00,
      shipping: 0, freeShipping: true, city: 'New York', state: 'NY',
      brand: 'Rolex', model: 'Submariner 126610LN', quantity: 1,
      images: ['https://images.unsplash.com/photo-1587836374828-4dbafa94cf0e?w=800']
    });

    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'watches-jewelry',
      title: 'Omega Speedmaster Professional Moonwatch', description: 'The legendary watch that went to the moon. Manual wind, hesalite crystal.',
      condition: 'like_new', listingType: 'auction', startingPrice: 5499.99,
      shipping: 0, freeShipping: true, city: 'New York', state: 'NY',
      brand: 'Omega', model: 'Speedmaster Professional', quantity: 1,
      images: ['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800']
    });

    // Fashion - Shoes
    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'shoes',
      title: 'Nike Air Jordan 1 Retro High OG "Chicago" - Size 10', description: 'Deadstock Air Jordan 1 Chicago colorway. Comes with original box.',
      condition: 'new', listingType: 'auction', startingPrice: 299.99,
      shipping: 14.99, freeShipping: false, city: 'New York', state: 'NY',
      brand: 'Nike', model: 'Air Jordan 1', size: '10', quantity: 1,
      images: ['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800']
    });

    products.push({
      seller: 'fashionista', category: 'fashion', subcategory: 'shoes',
      title: 'Christian Louboutin So Kate 120mm - Size 38', description: 'Classic black patent leather pumps with iconic red sole.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 795.00,
      shipping: 0, freeShipping: true, city: 'New York', state: 'NY',
      brand: 'Christian Louboutin', model: 'So Kate', size: '38', quantity: 2,
      images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800']
    });

    // Home & Garden - Furniture
    products.push({
      seller: 'homeessentials', category: 'home-garden', subcategory: 'furniture',
      title: 'Mid-Century Modern Leather Sofa - Cognac', description: 'Beautiful 3-seater leather sofa with solid walnut legs. Perfect condition.',
      condition: 'like_new', listingType: 'buy_now', buyNowPrice: 1899.00,
      shipping: 199.99, freeShipping: false, city: 'Seattle', state: 'WA',
      brand: 'West Elm', material: 'Leather', quantity: 1,
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800']
    });

    products.push({
      seller: 'homeessentials', category: 'home-garden', subcategory: 'furniture',
      title: 'Herman Miller Eames Lounge Chair & Ottoman', description: 'Authentic Herman Miller Eames chair in black leather with walnut shell.',
      condition: 'very_good', listingType: 'auction', startingPrice: 3999.99,
      shipping: 299.99, freeShipping: false, city: 'Seattle', state: 'WA',
      brand: 'Herman Miller', model: 'Eames Lounge', quantity: 1,
      images: ['https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800']
    });

    // Home & Garden - Kitchen
    products.push({
      seller: 'homeessentials', category: 'home-garden', subcategory: 'kitchen-dining',
      title: 'Le Creuset 7.25 Qt Dutch Oven - Flame Orange', description: 'Iconic French cookware. Perfect for braising, roasting, and baking.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 369.99,
      shipping: 0, freeShipping: true, city: 'Seattle', state: 'WA',
      brand: 'Le Creuset', color: 'Flame Orange', quantity: 4,
      images: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800']
    });

    products.push({
      seller: 'homeessentials', category: 'home-garden', subcategory: 'kitchen-dining',
      title: 'KitchenAid Artisan Stand Mixer 5Qt - Empire Red', description: 'The iconic stand mixer for baking enthusiasts. Includes multiple attachments.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 449.99,
      shipping: 0, freeShipping: true, city: 'Seattle', state: 'WA',
      brand: 'KitchenAid', model: 'Artisan', color: 'Empire Red', quantity: 3,
      images: ['https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=800']
    });

    // Sports - Fitness
    products.push({
      seller: 'sportsgear', category: 'sports-outdoors', subcategory: 'fitness',
      title: 'Peloton Bike+ with Accessories Bundle', description: 'Complete Peloton setup with weights, mat, and heart rate monitor.',
      condition: 'like_new', listingType: 'buy_now', buyNowPrice: 1999.99,
      shipping: 149.99, freeShipping: false, city: 'Denver', state: 'CO',
      brand: 'Peloton', model: 'Bike+', quantity: 1,
      images: ['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800']
    });

    products.push({
      seller: 'sportsgear', category: 'sports-outdoors', subcategory: 'fitness',
      title: 'Rogue Fitness Power Rack + Barbell Set', description: 'Commercial grade power rack with Olympic barbell and 300lb plate set.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 2499.99,
      shipping: 199.99, freeShipping: false, city: 'Denver', state: 'CO',
      brand: 'Rogue Fitness', quantity: 2,
      images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800']
    });

    // Sports - Cycling
    products.push({
      seller: 'sportsgear', category: 'sports-outdoors', subcategory: 'cycling',
      title: 'Specialized S-Works Tarmac SL7 - Size 56', description: 'Top-tier road bike with Shimano Dura-Ace Di2. Race-ready performance.',
      condition: 'like_new', listingType: 'auction', startingPrice: 8999.99,
      shipping: 149.99, freeShipping: false, city: 'Denver', state: 'CO',
      brand: 'Specialized', model: 'S-Works Tarmac SL7', size: '56', quantity: 1,
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800']
    });

    // Sports - Golf
    products.push({
      seller: 'sportsgear', category: 'sports-outdoors', subcategory: 'golf',
      title: 'TaylorMade Stealth 2 Plus Driver - 9°', description: 'Latest generation TaylorMade driver with carbon face technology.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 599.99,
      shipping: 0, freeShipping: true, city: 'Denver', state: 'CO',
      brand: 'TaylorMade', model: 'Stealth 2 Plus', quantity: 3,
      images: ['https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800']
    });

    // Collectibles - Antiques
    products.push({
      seller: 'vintagetreasures', category: 'collectibles-art', subcategory: 'antiques',
      title: 'Victorian Mahogany Writing Desk - Circa 1880', description: 'Stunning antique writing desk with leather top and brass hardware.',
      condition: 'very_good', listingType: 'auction', startingPrice: 1499.99,
      shipping: 299.99, freeShipping: false, city: 'Chicago', state: 'IL',
      brand: 'Victorian', material: 'Mahogany', quantity: 1,
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800']
    });

    products.push({
      seller: 'vintagetreasures', category: 'collectibles-art', subcategory: 'antiques',
      title: 'Tiffany Studios Bronze Table Lamp - Circa 1910', description: 'Authentic Tiffany lamp with dragonfly shade. Signed and numbered.',
      condition: 'very_good', listingType: 'auction', startingPrice: 12000.00,
      shipping: 0, freeShipping: true, city: 'Chicago', state: 'IL',
      brand: 'Tiffany Studios', quantity: 1,
      images: ['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800']
    });

    // Collectibles - Art
    products.push({
      seller: 'artcollector', category: 'collectibles-art', subcategory: 'art',
      title: 'Original Oil Painting - Abstract Landscape 36x48"', description: 'Contemporary abstract landscape by emerging artist. Signed and framed.',
      condition: 'new', listingType: 'auction', startingPrice: 799.99,
      shipping: 79.99, freeShipping: false, city: 'Santa Fe', state: 'NM',
      dimensions: '36x48 inches', quantity: 1,
      images: ['https://images.unsplash.com/photo-1549887534-1541e9326642?w=800']
    });

    products.push({
      seller: 'artcollector', category: 'collectibles-art', subcategory: 'art',
      title: 'Banksy "Girl with Balloon" Signed Print', description: 'Limited edition screen print, numbered 150/600. With certificate of authenticity.',
      condition: 'new', listingType: 'auction', startingPrice: 24999.99,
      shipping: 0, freeShipping: true, city: 'Santa Fe', state: 'NM',
      brand: 'Banksy', quantity: 1,
      images: ['https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800']
    });

    // Collectibles - Vintage
    products.push({
      seller: 'vintagetreasures', category: 'collectibles-art', subcategory: 'vintage-items',
      title: 'Vintage Coca-Cola Vending Machine - 1950s', description: 'Fully restored and working Coca-Cola vending machine from the 1950s.',
      condition: 'very_good', listingType: 'auction', startingPrice: 3499.99,
      shipping: 499.99, freeShipping: false, city: 'Chicago', state: 'IL',
      brand: 'Coca-Cola', quantity: 1,
      images: ['https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800']
    });

    // Books
    products.push({
      seller: 'bookworm', category: 'books-media', subcategory: 'books',
      title: 'First Edition Harry Potter and the Philosopher\'s Stone', description: 'True first edition, first print. Excellent condition with dust jacket.',
      condition: 'very_good', listingType: 'auction', startingPrice: 45000.00,
      shipping: 0, freeShipping: true, city: 'Boston', state: 'MA',
      brand: 'Bloomsbury', quantity: 1,
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800']
    });

    products.push({
      seller: 'bookworm', category: 'books-media', subcategory: 'books',
      title: 'Complete Set - Lord of the Rings First Editions', description: 'All three volumes, first UK editions with dust jackets. Exceptional condition.',
      condition: 'very_good', listingType: 'auction', startingPrice: 85000.00,
      shipping: 0, freeShipping: true, city: 'Boston', state: 'MA',
      brand: 'Allen & Unwin', quantity: 1,
      images: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800']
    });

    // Video Games
    products.push({
      seller: 'gamezone', category: 'books-media', subcategory: 'video-games',
      title: 'PlayStation 5 Disc Edition Bundle', description: 'PS5 with extra controller, headset, and 5 top games. Perfect condition.',
      condition: 'like_new', listingType: 'buy_now', buyNowPrice: 699.99,
      shipping: 0, freeShipping: true, city: 'Austin', state: 'TX',
      brand: 'Sony', model: 'PlayStation 5', quantity: 2,
      images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800']
    });

    products.push({
      seller: 'gamezone', category: 'books-media', subcategory: 'video-games',
      title: 'Nintendo Switch OLED + Mario Kart 8 Bundle', description: 'White Nintendo Switch OLED with Mario Kart 8 Deluxe. Brand new sealed.',
      condition: 'new', listingType: 'buy_now', buyNowPrice: 399.99,
      shipping: 0, freeShipping: true, city: 'Austin', state: 'TX',
      brand: 'Nintendo', model: 'Switch OLED', quantity: 5,
      images: ['https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800']
    });

    products.push({
      seller: 'gamezone', category: 'books-media', subcategory: 'video-games',
      title: 'Sealed Super Mario Bros. NES - WATA 9.4 A+', description: 'Extremely rare sealed copy of Super Mario Bros. WATA graded.',
      condition: 'new', listingType: 'auction', startingPrice: 150000.00,
      shipping: 0, freeShipping: true, city: 'Austin', state: 'TX',
      brand: 'Nintendo', model: 'NES', quantity: 1,
      images: ['https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=800']
    });

    products.push({
      seller: 'gamezone', category: 'books-media', subcategory: 'video-games',
      title: 'Steam Deck 512GB + Carrying Case', description: 'Portable gaming PC with anti-glare screen. Lightly used, perfect condition.',
      condition: 'like_new', listingType: 'buy_now', buyNowPrice: 549.99,
      shipping: 0, freeShipping: true, city: 'Austin', state: 'TX',
      brand: 'Valve', model: 'Steam Deck 512GB', quantity: 1,
      images: ['https://images.unsplash.com/photo-1640955014216-75201056c829?w=800']
    });

    // Insert all products
    for (const p of products) {
      const auctionStart = p.listingType === 'auction' || p.listingType === 'both' ? new Date() : null;
      const auctionEnd = auctionStart ? new Date(auctionStart.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
      const currentPrice = p.startingPrice || null;

      const productResult = await client.query(`
        INSERT INTO products (
          seller_id, category_id, subcategory_id, title, slug, description,
          condition, listing_type, starting_price, current_price, buy_now_price,
          auction_start, auction_end, quantity, shipping_cost, free_shipping,
          shipping_from_city, shipping_from_state, brand, model, size, color,
          material, dimensions, view_count, watch_count, featured
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
        RETURNING id
      `, [
        userMap[p.seller], catMap[p.category], subMap[p.subcategory],
        p.title, p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36),
        p.description, p.condition, p.listingType,
        p.startingPrice || null, currentPrice, p.buyNowPrice || null,
        auctionStart, auctionEnd, p.quantity, p.shipping || 0, p.freeShipping,
        p.city, p.state, p.brand || null, p.model || null, p.size || null,
        p.color || null, p.material || null, p.dimensions || null,
        Math.floor(Math.random() * 500) + 50, Math.floor(Math.random() * 50), Math.random() > 0.8
      ]);

      // Add images
      if (p.images) {
        for (let i = 0; i < p.images.length; i++) {
          await client.query(`
            INSERT INTO product_images (product_id, image_url, thumbnail_url, alt_text, sort_order, is_primary)
            VALUES ($1, $2, $2, $3, $4, $5)
          `, [productResult.rows[0].id, p.images[i], p.title, i, i === 0]);
        }
      }
    }

    console.log(`Seeded ${products.length} products`);

    // ==================== SAMPLE ORDERS ====================
    console.log('Seeding orders...');

    const productIds = await client.query("SELECT id, seller_id, buy_now_price, current_price FROM products WHERE status = 'active' LIMIT 10");

    for (let i = 0; i < 5; i++) {
      const product = productIds.rows[i];
      if (product) {
        const price = product.buy_now_price || product.current_price || 99.99;
        const orderNum = `EB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        await client.query(`
          INSERT INTO orders (order_number, buyer_id, seller_id, subtotal, shipping_cost, tax, total, status, payment_status)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          orderNum,
          userMap['buyer_jane'],
          product.seller_id,
          price,
          9.99,
          price * 0.08,
          price + 9.99 + (price * 0.08),
          ['pending', 'confirmed', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
          'completed'
        ]);
      }
    }

    // ==================== SAMPLE REVIEWS ====================
    console.log('Seeding reviews...');

    const sellerIds = Object.entries(userMap)
      .filter(([username]) => !username.startsWith('buyer_'))
      .map(([, id]) => id);

    const reviewTexts = [
      { title: 'Excellent seller!', comment: 'Fast shipping and item exactly as described. Would buy again!' },
      { title: 'Great transaction', comment: 'Smooth transaction, well packed, highly recommend this seller.' },
      { title: 'Very satisfied', comment: 'Product arrived quickly and in perfect condition. Thank you!' },
      { title: 'Awesome experience', comment: 'Best seller on the platform. Always a pleasure to buy from.' },
      { title: 'Highly recommended', comment: 'Professional service, excellent communication throughout.' },
    ];

    for (const sellerId of sellerIds) {
      for (let i = 0; i < 3; i++) {
        const review = reviewTexts[Math.floor(Math.random() * reviewTexts.length)];
        await client.query(`
          INSERT INTO reviews (reviewer_id, reviewed_user_id, review_type, rating, title, comment, is_verified_purchase)
          VALUES ($1, $2, 'seller', $3, $4, $5, true)
        `, [
          userMap['buyer_jane'],
          sellerId,
          Math.floor(Math.random() * 2) + 4,
          review.title,
          review.comment
        ]);
      }
    }

    // ==================== SAMPLE BIDS ====================
    console.log('Seeding bids...');

    const auctionProducts = await client.query(`
      SELECT id, current_price, starting_price FROM products
      WHERE listing_type IN ('auction', 'both') AND status = 'active'
      LIMIT 5
    `);

    for (const auction of auctionProducts.rows) {
      const basePrice = parseFloat(auction.current_price || auction.starting_price || 100);
      let currentBid = basePrice;

      for (let i = 0; i < 3; i++) {
        currentBid += Math.floor(Math.random() * 50) + 10;
        await client.query(`
          INSERT INTO bids (product_id, bidder_id, bid_amount, is_winning)
          VALUES ($1, $2, $3, $4)
        `, [
          auction.id,
          i % 2 === 0 ? userMap['buyer_jane'] : userMap['buyer_bob'],
          currentBid,
          i === 2
        ]);
      }

      await client.query(`
        UPDATE products SET current_price = $1, bid_count = 3 WHERE id = $2
      `, [currentBid, auction.id]);
    }

    // ==================== SAMPLE NOTIFICATIONS ====================
    console.log('Seeding notifications...');

    await client.query(`
      INSERT INTO notifications (user_id, type, title, message, link) VALUES
      ($1, 'bid_outbid', 'You have been outbid!', 'Someone placed a higher bid on "iPhone 15 Pro Max"', '/products'),
      ($1, 'watchlist', 'Price Drop Alert', 'An item in your watchlist dropped in price!', '/watchlist'),
      ($1, 'promotion', 'Special Offer', 'Get 10% off on your next purchase!', '/'),
      ($2, 'item_sold', 'You made a sale!', 'Your "MacBook Pro" has been sold for $3,499', '/orders'),
      ($2, 'review', 'New Review', 'You received a 5-star review from buyer_jane', '/reviews')
    `, [userMap['buyer_jane'], userMap['techdeals']]);

    // ==================== SAMPLE MESSAGES ====================
    console.log('Seeding messages...');

    await client.query(`
      INSERT INTO messages (sender_id, recipient_id, subject, body) VALUES
      ($1, $2, 'Question about iPhone', 'Hi, is this iPhone still available? Does it come with the original charger?'),
      ($2, $1, 'Re: Question about iPhone', 'Yes, it is available and includes all original accessories!'),
      ($1, $2, 'Re: Question about iPhone', 'Great! I will purchase it today. Thanks!')
    `, [userMap['buyer_jane'], userMap['techdeals']]);

    console.log('Database seeded successfully!');
    console.log('\nTest accounts:');
    console.log('Email: jane@example.com | Password: password123 (buyer)');
    console.log('Email: techdeals@example.com | Password: password123 (seller)');

  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

seedDatabase().catch(console.error);
