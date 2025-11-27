const { pool } = require('../config/database');

// Get store by slug or username
const getStore = async (req, res) => {
  try {
    const { slug } = req.params;

    // First try to find by store_slug
    let store = await pool.query(
      `SELECT s.*, u.username, u.avatar_url, u.created_at as member_since, u.bio,
              u.seller_rating, u.total_sales, u.is_verified as isVerified,
              (SELECT COUNT(*) FROM products WHERE seller_id = s.user_id AND status = 'active') as active_listings,
              (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = s.user_id) as avg_rating,
              (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = s.user_id) as review_count
       FROM seller_stores s
       JOIN users u ON s.user_id = u.id
       WHERE s.store_slug = $1`,
      [slug]
    );

    // If not found by slug, try to find by username
    if (store.rows.length === 0) {
      store = await pool.query(
        `SELECT u.id as user_id, u.username, u.avatar_url as logo_url, u.created_at as member_since, u.bio as description,
                u.seller_rating as rating, u.total_sales as totalSales, u.is_verified as isVerified,
                u.username as store_name,
                (SELECT COUNT(*) FROM products WHERE seller_id = u.id AND status = 'active') as active_listings,
                (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = u.id) as avg_rating,
                (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = u.id) as total_reviews
         FROM users u
         WHERE u.username = $1 AND u.is_seller = true`,
        [slug]
      );
    }

    if (store.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const storeData = store.rows[0];

    // Get store categories if store has an id
    let categories = [];
    if (storeData.id) {
      const catResult = await pool.query(
        `SELECT * FROM store_categories WHERE store_id = $1 ORDER BY display_order`,
        [storeData.id]
      );
      categories = catResult.rows;
    }

    res.json({
      ...storeData,
      storeName: storeData.store_name || storeData.username,
      logoUrl: storeData.logo_url || storeData.avatar_url,
      rating: storeData.avg_rating || storeData.seller_rating || 0.99,
      totalReviews: storeData.review_count || storeData.total_reviews || 0,
      totalSales: storeData.total_sales || storeData.totalSales || 0,
      createdAt: storeData.member_since,
      categories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get store products
const getStoreProducts = async (req, res) => {
  try {
    const { slug } = req.params;
    const { category, sort, page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_low') orderBy = 'p.buy_now_price ASC';
    if (sort === 'price_high') orderBy = 'p.buy_now_price DESC';
    if (sort === 'ending_soon') orderBy = 'p.auction_end ASC';

    // Build WHERE conditions - support both store_slug and username
    let whereClause = `(s.store_slug = $1 OR u.username = $1) AND p.status = 'active'`;
    const params = [slug];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND p.title ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await pool.query(
      `SELECT p.*, p.buy_now_price as "buyNowPrice", p.current_price as "currentPrice",
              p.free_shipping as "freeShipping",
              (SELECT json_agg(json_build_object('url', image_url))
               FROM product_images WHERE product_id = p.id) as images
       FROM products p
       LEFT JOIN seller_stores s ON p.seller_id = s.user_id
       JOIN users u ON p.seller_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const countParams = params.slice(0, -2);
    const count = await pool.query(
      `SELECT COUNT(*) FROM products p
       LEFT JOIN seller_stores s ON p.seller_id = s.user_id
       JOIN users u ON p.seller_id = u.id
       WHERE ${whereClause}`,
      countParams
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get store categories
const getStoreCategories = async (req, res) => {
  try {
    const { slug } = req.params;

    // Get categories from products in the store (dynamically based on product categories)
    const result = await pool.query(
      `SELECT c.id, c.name, c.icon,
              COUNT(p.id) as count
       FROM categories c
       JOIN products p ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       LEFT JOIN seller_stores s ON p.seller_id = s.user_id
       WHERE (s.store_slug = $1 OR u.username = $1) AND p.status = 'active'
       GROUP BY c.id, c.name, c.icon
       ORDER BY count DESC`,
      [slug]
    );

    // If no categories found from products, return mock categories
    if (result.rows.length === 0) {
      return res.json([
        { id: 1, name: 'Electronics', count: 45, icon: '📱' },
        { id: 2, name: 'Clothing', count: 128, icon: '👕' },
        { id: 3, name: 'Collectibles', count: 67, icon: '🏆' },
        { id: 4, name: 'Home & Garden', count: 34, icon: '🏠' },
        { id: 5, name: 'Toys & Games', count: 23, icon: '🎮' },
        { id: 6, name: 'Books', count: 56, icon: '📚' },
      ]);
    }

    res.json(result.rows);
  } catch (error) {
    // Return mock categories on error
    res.json([
      { id: 1, name: 'Electronics', count: 45, icon: '📱' },
      { id: 2, name: 'Clothing', count: 128, icon: '👕' },
      { id: 3, name: 'Collectibles', count: 67, icon: '🏆' },
      { id: 4, name: 'Home & Garden', count: 34, icon: '🏠' },
      { id: 5, name: 'Toys & Games', count: 23, icon: '🎮' },
      { id: 6, name: 'Books', count: 56, icon: '📚' },
    ]);
  }
};

// Create/update store
const updateStore = async (req, res) => {
  try {
    const { storeName, tagline, description, logoUrl, bannerUrl, themeColor, policies, aboutHtml, socialLinks } = req.body;

    const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await pool.query(
      `INSERT INTO seller_stores (user_id, store_name, store_slug, tagline, description, logo_url, banner_url, theme_color, policies, about_html, social_links)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (user_id)
       DO UPDATE SET
         store_name = COALESCE($2, seller_stores.store_name),
         store_slug = COALESCE($3, seller_stores.store_slug),
         tagline = COALESCE($4, seller_stores.tagline),
         description = COALESCE($5, seller_stores.description),
         logo_url = COALESCE($6, seller_stores.logo_url),
         banner_url = COALESCE($7, seller_stores.banner_url),
         theme_color = COALESCE($8, seller_stores.theme_color),
         policies = COALESCE($9, seller_stores.policies),
         about_html = COALESCE($10, seller_stores.about_html),
         social_links = COALESCE($11, seller_stores.social_links),
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, storeName, storeSlug, tagline, description, logoUrl, bannerUrl, themeColor, policies, aboutHtml, socialLinks]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my store
const getMyStore = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM seller_stores WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Subscribe to store
const subscribeToStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    await pool.query(
      `INSERT INTO store_subscribers (store_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [storeId, req.user.id]
    );

    await pool.query(
      `UPDATE seller_stores SET subscriber_count = (SELECT COUNT(*) FROM store_subscribers WHERE store_id = $1) WHERE id = $1`,
      [storeId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unsubscribe from store
const unsubscribeFromStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    await pool.query(
      `DELETE FROM store_subscribers WHERE store_id = $1 AND user_id = $2`,
      [storeId, req.user.id]
    );

    await pool.query(
      `UPDATE seller_stores SET subscriber_count = (SELECT COUNT(*) FROM store_subscribers WHERE store_id = $1) WHERE id = $1`,
      [storeId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add store category
const addCategory = async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;

    const store = await pool.query(
      `SELECT id FROM seller_stores WHERE user_id = $1`,
      [req.user.id]
    );

    if (store.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const result = await pool.query(
      `INSERT INTO store_categories (store_id, name, description, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [store.rows[0].id, name, description, displayOrder || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get featured stores
const getFeaturedStores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.username
       FROM seller_stores s
       JOIN users u ON s.user_id = u.id
       WHERE s.is_featured = true OR s.is_verified = true
       ORDER BY s.subscriber_count DESC
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStore,
  getStoreProducts,
  getStoreCategories,
  updateStore,
  getMyStore,
  subscribeToStore,
  unsubscribeFromStore,
  addCategory,
  getFeaturedStores
};
