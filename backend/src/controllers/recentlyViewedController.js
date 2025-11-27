const { pool } = require('../config/database');

// Get recently viewed items
const getRecentlyViewed = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT rv.*, p.title, p.slug, p.buy_now_price, p.current_price, p.condition,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM recently_viewed rv
       JOIN products p ON rv.product_id = p.id
       WHERE rv.user_id = $1 AND p.status = 'active'
       ORDER BY rv.last_viewed_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track a view (called when visiting product page)
const trackView = async (req, res) => {
  try {
    const { productId } = req.body;

    // Upsert - insert or update view count
    const result = await pool.query(
      `INSERT INTO recently_viewed (user_id, product_id, view_count, last_viewed_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET view_count = recently_viewed.view_count + 1, last_viewed_at = NOW()
       RETURNING *`,
      [req.user.id, productId]
    );

    // Also update product view count
    await pool.query(
      `UPDATE products SET view_count = view_count + 1 WHERE id = $1`,
      [productId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Track view with optional auth - always succeeds, only tracks for logged-in users
const trackViewOptional = async (req, res) => {
  try {
    const { productId } = req.body;

    // Always update product view count
    if (productId) {
      await pool.query(
        `UPDATE products SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1`,
        [productId]
      );
    }

    // If user is logged in, also track in their history
    if (req.user && productId) {
      await pool.query(
        `INSERT INTO recently_viewed (user_id, product_id, view_count, last_viewed_at)
         VALUES ($1, $2, 1, NOW())
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET view_count = recently_viewed.view_count + 1, last_viewed_at = NOW()`,
        [req.user.id, productId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    // Silently succeed - tracking views shouldn't break the user experience
    res.json({ success: true });
  }
};

// Clear history
const clearHistory = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM recently_viewed WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove single item from history
const removeFromHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query(
      `DELETE FROM recently_viewed WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, productId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getRecentlyViewed,
  trackView,
  trackViewOptional,
  clearHistory,
  removeFromHistory
};
