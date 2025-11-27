// Seed file for all new features
const { pool } = require('../config/database');

const seedNewFeatures = async () => {
  console.log('Seeding new features data...');

  try {
    // 1. Seed GSP Countries
    console.log('Seeding GSP countries...');
    await pool.query(`
      INSERT INTO gsp_countries (country_code, country_name, duty_rate_percent, tax_rate_percent, base_shipping_rate, estimated_days_min, estimated_days_max, is_supported)
      VALUES
        ('GB', 'United Kingdom', 0, 20, 19.99, 7, 12, true),
        ('DE', 'Germany', 0, 19, 18.99, 8, 14, true),
        ('FR', 'France', 0, 20, 18.99, 8, 14, true),
        ('AU', 'Australia', 5, 10, 24.99, 10, 18, true),
        ('CA', 'Canada', 0, 5, 14.99, 5, 10, true),
        ('JP', 'Japan', 0, 10, 22.99, 8, 14, true),
        ('IT', 'Italy', 0, 22, 19.99, 9, 15, true),
        ('ES', 'Spain', 0, 21, 19.99, 9, 15, true),
        ('NL', 'Netherlands', 0, 21, 17.99, 7, 12, true),
        ('BR', 'Brazil', 60, 17, 29.99, 14, 21, true)
      ON CONFLICT (country_code) DO NOTHING
    `);

    // 2. Seed Bid Increments
    console.log('Seeding bid increments...');
    await pool.query(`
      INSERT INTO bid_increments (price_from, price_to, increment_amount)
      VALUES
        (0.01, 0.99, 0.05),
        (1.00, 4.99, 0.25),
        (5.00, 24.99, 0.50),
        (25.00, 99.99, 1.00),
        (100.00, 249.99, 2.50),
        (250.00, 499.99, 5.00),
        (500.00, 999.99, 10.00),
        (1000.00, 2499.99, 25.00),
        (2500.00, 4999.99, 50.00),
        (5000.00, 99999999.99, 100.00)
      ON CONFLICT DO NOTHING
    `);

    // 3. Seed Authenticity Categories
    console.log('Seeding authenticity categories...');
    await pool.query(`
      INSERT INTO authenticity_categories (category_name, min_value_threshold, inspection_fee, is_mandatory)
      VALUES
        ('Luxury Watches', 500, 35.00, true),
        ('Designer Handbags', 300, 25.00, true),
        ('Sneakers', 150, 15.00, false),
        ('Trading Cards', 250, 20.00, false),
        ('Fine Jewelry', 1000, 50.00, true),
        ('Designer Clothing', 200, 20.00, false),
        ('Sunglasses', 150, 15.00, false),
        ('Streetwear', 200, 18.00, false)
      ON CONFLICT DO NOTHING
    `);

    // 4. Seed Membership Plans
    console.log('Seeding membership plans...');
    await pool.query(`
      INSERT INTO membership_plans (name, description, monthly_price, annual_price, free_shipping, free_returns, extended_returns_days, exclusive_deals, priority_support, early_access, cashback_percent, is_active)
      VALUES
        ('eBay Plus Basic', 'Basic membership with free shipping and extended returns', 9.99, 99.99, true, true, 60, true, false, false, 2, true),
        ('eBay Plus Premium', 'Premium membership with priority support and early access', 19.99, 199.99, true, true, 90, true, true, true, 5, true),
        ('eBay Plus Elite', 'Elite membership with maximum benefits and cashback', 29.99, 299.99, true, true, 365, true, true, true, 10, true)
      ON CONFLICT DO NOTHING
    `);

    // 5. Get existing user IDs for foreign key references
    const users = await pool.query(`SELECT id, username FROM users LIMIT 5`);

    if (users.rows.length >= 2) {
      const sellerId = users.rows[0].id;
      const buyerId = users.rows[1].id;

      // 6. Seed Seller Performance data
      console.log('Seeding seller performance...');
      await pool.query(`
        INSERT INTO seller_performance (seller_id, total_transactions, defect_count, defect_rate, late_shipment_count, late_shipment_rate, positive_feedback_count, negative_feedback_count, neutral_feedback_count, feedback_score, seller_level, final_value_fee_discount)
        VALUES ($1, 250, 2, 0.008, 5, 0.02, 240, 3, 7, 96.00, 'top_rated', 10)
        ON CONFLICT (seller_id) DO UPDATE SET
          total_transactions = 250, defect_rate = 0.008, feedback_score = 96.00, seller_level = 'top_rated'
      `, [sellerId]);

      // 7. Seed Local Pickup Settings (skip if no products - table requires product_id)
      console.log('Local pickup settings skipped (linked to products)...');
    }

    // 9. Get existing products for vehicle and authenticity data
    const products = await pool.query(`SELECT id, seller_id FROM products LIMIT 5`);

    if (products.rows.length > 0) {
      const productId = products.rows[0].id;
      const sellerId = products.rows[0].seller_id;

      // 10. Seed a sample vehicle
      console.log('Seeding sample vehicle...');
      await pool.query(`
        INSERT INTO vehicles (product_id, seller_id, vin, year, make, model, trim_level, body_type, engine_type, engine_size, fuel_type, transmission, drivetrain, horsepower, mileage, exterior_color, interior_color, num_owners, accident_history, title_status, features)
        VALUES ($1, $2, '1HGBH41JXMN109186', 2023, 'Honda', 'Accord', 'Sport', 'Sedan', 'I4', '1.5L Turbo', 'Gasoline', 'CVT', 'FWD', 192, 15000, 'Crystal Black Pearl', 'Black', 1, false, 'clean', '["Sunroof", "Leather Seats", "Navigation", "Backup Camera", "Bluetooth", "Apple CarPlay", "Android Auto"]')
        ON CONFLICT DO NOTHING
      `, [productId, sellerId]);

      // 11. Seed product quality scores
      console.log('Seeding product quality scores...');
      for (const product of products.rows) {
        const randomScore = 50 + Math.floor(Math.random() * 50);
        await pool.query(`
          INSERT INTO product_quality_scores (product_id, title_quality_score, description_quality_score, image_quality_score, item_specifics_score, seller_rating_score, seller_history_score, price_score, shipping_score, best_match_score)
          VALUES ($1, $2, $2, $2, $2, $2, $2, $2, $2, $2)
          ON CONFLICT (product_id) DO UPDATE SET best_match_score = $2
        `, [product.id, randomScore]);
      }
    }

    console.log('New features seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding new features:', error);
    throw error;
  }
};

// Run if executed directly
if (require.main === module) {
  seedNewFeatures()
    .then(() => {
      console.log('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed failed:', error);
      process.exit(1);
    });
}

module.exports = { seedNewFeatures };
