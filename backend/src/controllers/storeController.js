// Store Controller - Complete Implementation
const { pool } = require('../config/database');

// Initialize tables if they don't exist
const initializeTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_stores (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        store_name VARCHAR(100) NOT NULL,
        store_slug VARCHAR(100) UNIQUE,
        tagline VARCHAR(255),
        description TEXT,
        logo_url VARCHAR(500),
        banner_url VARCHAR(500),
        theme_color VARCHAR(7) DEFAULT '#3665f3',
        policies JSONB DEFAULT '{}',
        about_html TEXT,
        social_links JSONB DEFAULT '{}',
        subscriber_count INTEGER DEFAULT 0,
        is_featured BOOLEAN DEFAULT false,
        is_verified BOOLEAN DEFAULT false,
        vacation_mode BOOLEAN DEFAULT false,
        vacation_message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_categories (
        id SERIAL PRIMARY KEY,
        store_id UUID REFERENCES seller_stores(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_subscribers (
        id SERIAL PRIMARY KEY,
        store_id UUID REFERENCES seller_stores(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(store_id, user_id)
      )
    `);
  } catch (error) {
    console.error('Error initializing store tables:', error.message);
  }
};

// Initialize on module load
initializeTables();

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

    // Check if current user is subscribed
    let isSubscribed = false;
    if (req.user?.id && storeData.id) {
      const subResult = await pool.query(
        `SELECT id FROM store_subscribers WHERE store_id = $1 AND user_id = $2`,
        [storeData.id, req.user.id]
      );
      isSubscribed = subResult.rows.length > 0;
    }

    res.json({
      ...storeData,
      storeName: storeData.store_name || storeData.username,
      logoUrl: storeData.logo_url || storeData.avatar_url,
      rating: storeData.avg_rating || storeData.seller_rating || 0,
      totalReviews: storeData.review_count || storeData.total_reviews || 0,
      totalSales: storeData.total_sales || storeData.totalSales || 0,
      createdAt: storeData.member_since,
      categories,
      isSubscribed
    });
  } catch (error) {
    console.error('Get store error:', error.message);
    res.status(500).json({ error: 'Failed to fetch store' });
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
    if (sort === 'popular') orderBy = 'p.view_count DESC';

    // Build WHERE conditions - support both store_slug and username
    let whereClause = `(s.store_slug = $1 OR u.username = $1) AND p.status = 'active'`;
    const params = [slug];
    let paramIndex = 2;

    if (search) {
      whereClause += ` AND p.title ILIKE $${paramIndex}`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(
      `SELECT p.*, p.buy_now_price as "buyNowPrice", p.current_price as "currentPrice",
              p.free_shipping as "freeShipping", p.listing_type as "listingType",
              p.auction_end as "auctionEnd", p.bid_count as "bidCount",
              c.name as category_name,
              (SELECT json_agg(json_build_object('url', image_url))
               FROM product_images WHERE product_id = p.id) as images
       FROM products p
       LEFT JOIN seller_stores s ON p.seller_id = s.user_id
       JOIN users u ON p.seller_id = u.id
       LEFT JOIN categories c ON p.category_id = c.id
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

    res.json({
      products: result.rows.map(p => ({
        ...p,
        primaryImage: p.images?.[0]?.url || p.image_url
      })),
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get store products error:', error.message);
    res.status(500).json({ error: 'Failed to fetch store products' });
  }
};

// Get store categories (dynamically from products)
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

    // Return empty array if no products/categories exist
    if (result.rows.length === 0) {
      return res.json([]);
    }

    res.json(result.rows.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon || '📦',
      count: parseInt(cat.count)
    })));
  } catch (error) {
    console.error('Get store categories error:', error.message);
    res.status(500).json({ error: 'Failed to fetch store categories' });
  }
};

// Create/update store
const updateStore = async (req, res) => {
  try {
    const { storeName, tagline, description, logoUrl, bannerUrl, themeColor, policies, aboutHtml, socialLinks, vacationMode, vacationMessage } = req.body;

    if (!storeName || storeName.trim().length < 3) {
      return res.status(400).json({ error: 'Store name must be at least 3 characters' });
    }

    const storeSlug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    // Check if slug is already taken by another user
    const existingSlug = await pool.query(
      `SELECT id FROM seller_stores WHERE store_slug = $1 AND user_id != $2`,
      [storeSlug, req.user.id]
    );

    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'Store name is already taken' });
    }

    const result = await pool.query(
      `INSERT INTO seller_stores (user_id, store_name, store_slug, tagline, description, logo_url, banner_url, theme_color, policies, about_html, social_links, vacation_mode, vacation_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
         vacation_mode = COALESCE($12, seller_stores.vacation_mode),
         vacation_message = COALESCE($13, seller_stores.vacation_message),
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, storeName, storeSlug, tagline, description, logoUrl, bannerUrl, themeColor,
       JSON.stringify(policies || {}), aboutHtml, JSON.stringify(socialLinks || {}),
       vacationMode || false, vacationMessage]
    );

    res.json({
      message: 'Store updated successfully',
      store: result.rows[0]
    });
  } catch (error) {
    console.error('Update store error:', error.message);
    res.status(500).json({ error: 'Failed to update store' });
  }
};

// Get my store
const getMyStore = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*,
              (SELECT COUNT(*) FROM products WHERE seller_id = $1 AND status = 'active') as active_listings,
              (SELECT COUNT(*) FROM orders WHERE seller_id = $1) as total_orders,
              (SELECT SUM(total) FROM orders WHERE seller_id = $1 AND status = 'delivered') as total_revenue
       FROM seller_stores s
       WHERE s.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get my store error:', error.message);
    res.status(500).json({ error: 'Failed to fetch your store' });
  }
};

// Subscribe to store
const subscribeToStore = async (req, res) => {
  try {
    const { storeId } = req.params;

    // Check if store exists
    const store = await pool.query(
      `SELECT id, store_name FROM seller_stores WHERE id = $1`,
      [storeId]
    );

    if (store.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    await pool.query(
      `INSERT INTO store_subscribers (store_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [storeId, req.user.id]
    );

    // Update subscriber count
    await pool.query(
      `UPDATE seller_stores SET subscriber_count = (SELECT COUNT(*) FROM store_subscribers WHERE store_id = $1) WHERE id = $1`,
      [storeId]
    );

    res.json({
      success: true,
      message: `Subscribed to ${store.rows[0].store_name}`
    });
  } catch (error) {
    console.error('Subscribe to store error:', error.message);
    res.status(500).json({ error: 'Failed to subscribe' });
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

    res.json({ success: true, message: 'Unsubscribed from store' });
  } catch (error) {
    console.error('Unsubscribe from store error:', error.message);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
};

// Add store category
const addCategory = async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Category name must be at least 2 characters' });
    }

    const store = await pool.query(
      `SELECT id FROM seller_stores WHERE user_id = $1`,
      [req.user.id]
    );

    if (store.rows.length === 0) {
      return res.status(404).json({ error: 'You must create a store first' });
    }

    const result = await pool.query(
      `INSERT INTO store_categories (store_id, name, description, display_order)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [store.rows[0].id, name.trim(), description, displayOrder || 0]
    );

    res.status(201).json({
      message: 'Category added successfully',
      category: result.rows[0]
    });
  } catch (error) {
    console.error('Add category error:', error.message);
    res.status(500).json({ error: 'Failed to add category' });
  }
};

// Delete store category
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Verify ownership
    const result = await pool.query(
      `DELETE FROM store_categories sc
       USING seller_stores s
       WHERE sc.id = $1 AND sc.store_id = s.id AND s.user_id = $2
       RETURNING sc.*`,
      [categoryId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error.message);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Get featured stores
const getFeaturedStores = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.username, u.avatar_url, u.seller_rating,
              (SELECT COUNT(*) FROM products WHERE seller_id = s.user_id AND status = 'active') as product_count
       FROM seller_stores s
       JOIN users u ON s.user_id = u.id
       WHERE s.is_featured = true OR s.is_verified = true
       ORDER BY s.subscriber_count DESC
       LIMIT 10`
    );

    res.json(result.rows.map(store => ({
      id: store.id,
      storeName: store.store_name,
      storeSlug: store.store_slug,
      logoUrl: store.logo_url || store.avatar_url,
      tagline: store.tagline,
      rating: store.seller_rating,
      subscriberCount: store.subscriber_count,
      productCount: store.product_count,
      isFeatured: store.is_featured,
      isVerified: store.is_verified
    })));
  } catch (error) {
    console.error('Get featured stores error:', error.message);
    res.status(500).json({ error: 'Failed to fetch featured stores' });
  }
};

// Search stores
const searchStores = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const result = await pool.query(
      `SELECT s.*, u.username, u.avatar_url, u.seller_rating,
              (SELECT COUNT(*) FROM products WHERE seller_id = s.user_id AND status = 'active') as product_count
       FROM seller_stores s
       JOIN users u ON s.user_id = u.id
       WHERE s.store_name ILIKE $1 OR s.tagline ILIKE $1 OR s.description ILIKE $1
       ORDER BY s.subscriber_count DESC, s.is_verified DESC
       LIMIT $2 OFFSET $3`,
      [`%${q}%`, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM seller_stores s
       JOIN users u ON s.user_id = u.id
       WHERE s.store_name ILIKE $1 OR s.tagline ILIKE $1 OR s.description ILIKE $1`,
      [`%${q}%`]
    );

    res.json({
      stores: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Search stores error:', error.message);
    res.status(500).json({ error: 'Failed to search stores' });
  }
};

// Get user's subscriptions
const getMySubscriptions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, u.username, u.avatar_url, u.seller_rating,
              (SELECT COUNT(*) FROM products WHERE seller_id = s.user_id AND status = 'active') as product_count
       FROM store_subscribers sub
       JOIN seller_stores s ON sub.store_id = s.id
       JOIN users u ON s.user_id = u.id
       WHERE sub.user_id = $1
       ORDER BY sub.subscribed_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my subscriptions error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
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
  deleteCategory,
  getFeaturedStores,
  searchStores,
  getMySubscriptions
};
