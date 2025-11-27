const { pool } = require('../config/database');

// Get similar products
const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 12;

    const result = await pool.query(
      `SELECT p.*, pr.recommendation_type, pr.score,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM product_recommendations pr
       JOIN products p ON pr.recommended_product_id = p.id
       WHERE pr.product_id = $1 AND p.status = 'active'
       ORDER BY pr.score DESC
       LIMIT $2`,
      [productId, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get personalized recommendations for user
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT p.*, ur.recommendation_reason, ur.score,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM user_recommendations ur
       JOIN products p ON ur.product_id = p.id
       WHERE ur.user_id = $1 AND p.status = 'active' AND ur.is_viewed = false
       ORDER BY ur.score DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get "customers also viewed" products
const getCustomersAlsoViewed = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 8;

    const result = await pool.query(
      `SELECT p.*,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM product_recommendations pr
       JOIN products p ON pr.recommended_product_id = p.id
       WHERE pr.product_id = $1 AND pr.recommendation_type = 'customers_also_viewed' AND p.status = 'active'
       ORDER BY pr.score DESC
       LIMIT $2`,
      [productId, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get frequently bought together
const getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT p.*,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM product_recommendations pr
       JOIN products p ON pr.recommended_product_id = p.id
       WHERE pr.product_id = $1 AND pr.recommendation_type = 'frequently_bought_together' AND p.status = 'active'
       ORDER BY pr.score DESC
       LIMIT 4`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark recommendation as viewed
const markViewed = async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query(
      `UPDATE user_recommendations SET is_viewed = true WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, productId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trending products
const getTrending = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 12;

    const result = await pool.query(
      `SELECT p.*,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM products p
       WHERE p.status = 'active'
       ORDER BY p.view_count DESC, p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSimilarProducts,
  getPersonalizedRecommendations,
  getCustomersAlsoViewed,
  getFrequentlyBoughtTogether,
  markViewed,
  getTrending
};
