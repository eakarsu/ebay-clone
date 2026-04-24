const { pool } = require('../config/database');

/**
 * Low-stock alerts.
 * - Seller sets a per-listing threshold.
 * - checkAndNotifyLowStock(productId) is called after inventory decrements
 *   (order creation, etc.) and fires at most one notification until stock
 *   is replenished above threshold.
 */

// GET /api/low-stock  -- list seller's tripped thresholds + current stock
const listLowStock = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, title, slug, quantity, quantity_sold, low_stock_threshold, low_stock_alerted_at,
              (quantity - quantity_sold) AS remaining
         FROM products
        WHERE seller_id = $1
          AND low_stock_threshold > 0
          AND (quantity - quantity_sold) <= low_stock_threshold
          AND status = 'active'
        ORDER BY (quantity - quantity_sold) ASC`,
      [req.user.id]
    );
    res.json({
      items: result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        slug: r.slug,
        remaining: parseInt(r.remaining, 10),
        threshold: r.low_stock_threshold,
        alertedAt: r.low_stock_alerted_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/low-stock/:productId  -- set threshold (0 = disable)
const setThreshold = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { threshold } = req.body;
    const t = Math.max(0, parseInt(threshold, 10) || 0);

    const result = await pool.query(
      `UPDATE products
          SET low_stock_threshold = $1,
              low_stock_alerted_at = NULL
        WHERE id = $2 AND seller_id = $3
        RETURNING id, low_stock_threshold`,
      [t, productId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or not owned by you' });
    }

    res.json({ success: true, threshold: result.rows[0].low_stock_threshold });
  } catch (err) {
    next(err);
  }
};

/**
 * Internal helper. Call after any inventory change. Fires a notification to
 * the seller if remaining stock dipped to/below threshold and we haven't
 * already alerted in the current stockout cycle.
 *
 * Safe to call unconditionally — early-exits if the product has no threshold set.
 */
const checkAndNotifyLowStock = async (productId) => {
  try {
    const r = await pool.query(
      `SELECT id, seller_id, title, slug,
              (quantity - quantity_sold) AS remaining,
              low_stock_threshold, low_stock_alerted_at
         FROM products
        WHERE id = $1`,
      [productId]
    );
    if (r.rows.length === 0) return;
    const p = r.rows[0];
    if (!p.low_stock_threshold || p.low_stock_threshold <= 0) return;

    const remaining = parseInt(p.remaining, 10);

    // Replenished above threshold — clear the cooldown so next drop alerts again.
    if (remaining > p.low_stock_threshold && p.low_stock_alerted_at) {
      await pool.query(
        'UPDATE products SET low_stock_alerted_at = NULL WHERE id = $1',
        [p.id]
      );
      return;
    }

    // Below or at threshold, and we haven't alerted yet this cycle.
    if (remaining <= p.low_stock_threshold && !p.low_stock_alerted_at) {
      const isOut = remaining <= 0;
      const title = isOut ? 'Listing is out of stock' : 'Low stock alert';
      const message = isOut
        ? `"${p.title}" is out of stock. Restock to keep the listing active.`
        : `"${p.title}" has ${remaining} left (threshold ${p.low_stock_threshold}).`;

      await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'low_stock', $2, $3, $4)`,
        [p.seller_id, title, message, `/product/${p.slug || p.id}`]
      );

      await pool.query(
        'UPDATE products SET low_stock_alerted_at = NOW() WHERE id = $1',
        [p.id]
      );
    }
  } catch (err) {
    // Non-fatal — the calling order/inventory operation should not fail because
    // a notification couldn't be written.
    console.warn('[low-stock] notify failed:', err.message);
  }
};

module.exports = {
  listLowStock,
  setThreshold,
  checkAndNotifyLowStock,
};
