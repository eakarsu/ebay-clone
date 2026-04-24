const { pool } = require('../config/database');

// GET /api/price-history/:productId?type=buy_now&days=90
const getProductPriceHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { type = 'buy_now', days = 90 } = req.query;
    const daysInt = Math.max(1, Math.min(parseInt(days, 10) || 90, 365));

    const result = await pool.query(
      `SELECT price_type, old_price, new_price, changed_at
         FROM product_price_history
        WHERE product_id = $1
          AND price_type = $2
          AND changed_at >= NOW() - ($3 || ' days')::INTERVAL
        ORDER BY changed_at ASC`,
      [productId, type, String(daysInt)]
    );

    // Stats for the chart header.
    const prices = result.rows.map((r) => parseFloat(r.new_price)).filter((n) => !Number.isNaN(n));
    const stats = prices.length
      ? {
          min: Math.min(...prices),
          max: Math.max(...prices),
          current: prices[prices.length - 1],
          changes: result.rows.length,
        }
      : null;

    res.json({
      productId,
      priceType: type,
      days: daysInt,
      stats,
      history: result.rows.map((r) => ({
        oldPrice: r.old_price ? parseFloat(r.old_price) : null,
        newPrice: r.new_price ? parseFloat(r.new_price) : null,
        changedAt: r.changed_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProductPriceHistory };
