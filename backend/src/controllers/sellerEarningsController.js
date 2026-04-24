const { pool } = require('../config/database');

// Read-only aggregate for the seller's earnings dashboard.
// Returns: { summary, timeseries: [{date, revenue, orders}], topProducts: [...] }
const getEarnings = async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days) || 30, 7), 365);

    // Summary — totals and pending payout (orders delivered but not refunded/cancelled).
    const summary = await pool.query(
      `SELECT
          COUNT(*)::int                                                     AS total_orders,
          COALESCE(SUM(total), 0)                                           AS gross_revenue,
          COALESCE(SUM(total) FILTER (WHERE status = 'delivered'), 0)       AS delivered_revenue,
          COALESCE(SUM(total) FILTER (WHERE status IN ('confirmed','processing','shipped')), 0)
                                                                            AS pending_payout,
          COALESCE(SUM(total) FILTER (WHERE status = 'cancelled'), 0)       AS cancelled_revenue,
          COALESCE(SUM(total) FILTER (WHERE status = 'returned'), 0)        AS returned_revenue,
          COUNT(*) FILTER (WHERE created_at >= NOW() - ($1 || ' days')::interval)::int
                                                                            AS recent_orders,
          COALESCE(SUM(total) FILTER (WHERE created_at >= NOW() - ($1 || ' days')::interval), 0)
                                                                            AS recent_revenue
         FROM orders
        WHERE seller_id = $2`,
      [String(days), req.user.id]
    );

    // Daily time series for the requested window.
    const series = await pool.query(
      `SELECT DATE_TRUNC('day', created_at)::date AS date,
              COUNT(*)::int                       AS orders,
              COALESCE(SUM(total), 0)             AS revenue
         FROM orders
        WHERE seller_id = $1
          AND created_at >= NOW() - ($2 || ' days')::interval
        GROUP BY 1
        ORDER BY 1 ASC`,
      [req.user.id, String(days)]
    );

    // Top products by revenue in window.
    const top = await pool.query(
      `SELECT p.id, p.title, p.slug,
              (SELECT image_url FROM product_images
                WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image,
              SUM(oi.quantity)::int                   AS units_sold,
              COALESCE(SUM(oi.total_price), 0)         AS revenue
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p     ON p.id = oi.product_id
        WHERE o.seller_id = $1
          AND o.created_at >= NOW() - ($2 || ' days')::interval
          AND o.status <> 'cancelled'
        GROUP BY p.id
        ORDER BY revenue DESC
        LIMIT 10`,
      [req.user.id, String(days)]
    );

    res.json({
      days,
      summary: summary.rows[0],
      timeseries: series.rows,
      topProducts: top.rows,
    });
  } catch (error) {
    console.error('Get earnings error:', error.message);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
};

module.exports = { getEarnings };
