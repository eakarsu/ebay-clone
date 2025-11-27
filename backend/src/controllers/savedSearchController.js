const { pool } = require('../config/database');

// Create saved search
const createSavedSearch = async (req, res, next) => {
  try {
    const {
      name,
      searchQuery,
      categoryId,
      subcategoryId,
      minPrice,
      maxPrice,
      condition,
      listingType,
      freeShipping,
      emailAlerts,
      alertFrequency,
    } = req.body;

    // Check limit (max 50 saved searches per user)
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM saved_searches WHERE user_id = $1',
      [req.user.id]
    );

    if (parseInt(countResult.rows[0].count) >= 50) {
      return res.status(400).json({ error: 'Maximum saved searches limit reached (50)' });
    }

    const result = await pool.query(
      `INSERT INTO saved_searches (user_id, name, search_query, category_id, subcategory_id, min_price, max_price, condition, listing_type, free_shipping, email_alerts, alert_frequency)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        req.user.id,
        name,
        searchQuery,
        categoryId,
        subcategoryId,
        minPrice,
        maxPrice,
        condition,
        listingType,
        freeShipping || false,
        emailAlerts !== false,
        alertFrequency || 'daily',
      ]
    );

    res.status(201).json({
      success: true,
      savedSearch: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        searchQuery: result.rows[0].search_query,
        emailAlerts: result.rows[0].email_alerts,
        alertFrequency: result.rows[0].alert_frequency,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's saved searches
const getSavedSearches = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT ss.*, c.name as category_name, sc.name as subcategory_name
       FROM saved_searches ss
       LEFT JOIN categories c ON ss.category_id = c.id
       LEFT JOIN subcategories sc ON ss.subcategory_id = sc.id
       WHERE ss.user_id = $1
       ORDER BY ss.created_at DESC`,
      [req.user.id]
    );

    res.json({
      savedSearches: result.rows.map((s) => ({
        id: s.id,
        name: s.name,
        searchQuery: s.search_query,
        categoryId: s.category_id,
        categoryName: s.category_name,
        subcategoryId: s.subcategory_id,
        subcategoryName: s.subcategory_name,
        minPrice: s.min_price ? parseFloat(s.min_price) : null,
        maxPrice: s.max_price ? parseFloat(s.max_price) : null,
        condition: s.condition,
        listingType: s.listing_type,
        freeShipping: s.free_shipping,
        emailAlerts: s.email_alerts,
        alertFrequency: s.alert_frequency,
        lastAlertSent: s.last_alert_sent,
        createdAt: s.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get saved search by ID
const getSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ss.*, c.name as category_name, sc.name as subcategory_name
       FROM saved_searches ss
       LEFT JOIN categories c ON ss.category_id = c.id
       LEFT JOIN subcategories sc ON ss.subcategory_id = sc.id
       WHERE ss.id = $1 AND ss.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    const s = result.rows[0];

    res.json({
      savedSearch: {
        id: s.id,
        name: s.name,
        searchQuery: s.search_query,
        categoryId: s.category_id,
        categoryName: s.category_name,
        subcategoryId: s.subcategory_id,
        subcategoryName: s.subcategory_name,
        minPrice: s.min_price ? parseFloat(s.min_price) : null,
        maxPrice: s.max_price ? parseFloat(s.max_price) : null,
        condition: s.condition,
        listingType: s.listing_type,
        freeShipping: s.free_shipping,
        emailAlerts: s.email_alerts,
        alertFrequency: s.alert_frequency,
        createdAt: s.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update saved search
const updateSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, emailAlerts, alertFrequency } = req.body;

    const existingResult = await pool.query(
      'SELECT * FROM saved_searches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    const result = await pool.query(
      `UPDATE saved_searches
       SET name = COALESCE($1, name),
           email_alerts = COALESCE($2, email_alerts),
           alert_frequency = COALESCE($3, alert_frequency),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [name, emailAlerts, alertFrequency, id, req.user.id]
    );

    res.json({
      success: true,
      savedSearch: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        emailAlerts: result.rows[0].email_alerts,
        alertFrequency: result.rows[0].alert_frequency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete saved search
const deleteSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM saved_searches WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    res.json({ success: true, message: 'Saved search deleted' });
  } catch (error) {
    next(error);
  }
};

// Run saved search (get matching products)
const runSavedSearch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const searchResult = await pool.query(
      'SELECT * FROM saved_searches WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (searchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Saved search not found' });
    }

    const search = searchResult.rows[0];

    // Build product query based on saved search criteria
    let query = `
      SELECT p.*, c.name as category_name, u.username as seller_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (search.search_query) {
      params.push(`%${search.search_query}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    if (search.category_id) {
      params.push(search.category_id);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (search.subcategory_id) {
      params.push(search.subcategory_id);
      query += ` AND p.subcategory_id = $${params.length}`;
    }

    if (search.min_price) {
      params.push(search.min_price);
      query += ` AND p.price >= $${params.length}`;
    }

    if (search.max_price) {
      params.push(search.max_price);
      query += ` AND p.price <= $${params.length}`;
    }

    if (search.condition) {
      params.push(search.condition);
      query += ` AND p.condition = $${params.length}`;
    }

    if (search.listing_type) {
      params.push(search.listing_type);
      query += ` AND p.listing_type = $${params.length}`;
    }

    if (search.free_shipping) {
      query += ` AND p.free_shipping = true`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      products: result.rows.map((p) => ({
        id: p.id,
        title: p.title,
        price: parseFloat(p.price),
        imageUrl: p.image_url,
        condition: p.condition,
        listingType: p.listing_type,
        categoryName: p.category_name,
        sellerName: p.seller_name,
        createdAt: p.created_at,
      })),
      search: {
        id: search.id,
        name: search.name,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSavedSearch,
  getSavedSearches,
  getSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  runSavedSearch,
};
