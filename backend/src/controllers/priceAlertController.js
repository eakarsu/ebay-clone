const { pool } = require('../config/database');

// Get user's price alerts
const getMyAlerts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pa.*, p.title, p.slug, p.buy_now_price, p.current_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM price_alerts pa
       JOIN products p ON pa.product_id = p.id
       WHERE pa.user_id = $1
       ORDER BY pa.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create price alert
const createAlert = async (req, res) => {
  try {
    const { productId, targetPrice, alertOnAnyDrop, percentageDrop } = req.body;

    const result = await pool.query(
      `INSERT INTO price_alerts (user_id, product_id, target_price, alert_on_any_drop, percentage_drop)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET target_price = $3, alert_on_any_drop = $4, percentage_drop = $5, is_active = true
       RETURNING *`,
      [req.user.id, productId, targetPrice, alertOnAnyDrop, percentageDrop]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update price alert
const updateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetPrice, alertOnAnyDrop, percentageDrop, isActive } = req.body;

    const result = await pool.query(
      `UPDATE price_alerts
       SET target_price = COALESCE($1, target_price),
           alert_on_any_drop = COALESCE($2, alert_on_any_drop),
           percentage_drop = COALESCE($3, percentage_drop),
           is_active = COALESCE($4, is_active)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [targetPrice, alertOnAnyDrop, percentageDrop, isActive, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete price alert
const deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM price_alerts WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get price history for a product
const getPriceHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    const days = parseInt(req.query.days) || 30;

    const result = await pool.query(
      `SELECT * FROM price_history
       WHERE product_id = $1 AND recorded_at > NOW() - INTERVAL '${days} days'
       ORDER BY recorded_at ASC`,
      [productId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getPriceHistory
};
