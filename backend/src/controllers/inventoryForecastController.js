const { pool } = require('../config/database');

/**
 * Inventory velocity & stock-out forecast per product for a seller.
 * Sales velocity = units sold in the last 30 days / 30.
 * Days of cover = current_stock / velocity (∞ when velocity is 0).
 *
 * Status buckets:
 *   - 'urgent'  : days_of_cover < 7 and velocity > 0
 *   - 'warning' : days_of_cover < 21 and velocity > 0
 *   - 'ok'      : enough stock or steady-but-slow
 *   - 'idle'    : velocity == 0 (nothing sold in 30d)
 *
 * We only forecast for products with positive stock — out-of-stock items are
 * surfaced separately so the seller can decide whether to restock or delist.
 */

const statusFor = (stock, velocity) => {
  if (stock <= 0) return 'out_of_stock';
  if (!velocity || velocity <= 0) return 'idle';
  const days = stock / velocity;
  if (days < 7) return 'urgent';
  if (days < 21) return 'warning';
  return 'ok';
};

// GET /api/seller/inventory-forecast
const getInventoryForecast = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT p.id, p.title, p.slug, p.quantity AS stock, p.quantity_sold,
              p.buy_now_price,
              COALESCE(SUM(CASE
                WHEN o.created_at > NOW() - INTERVAL '30 days' THEN oi.quantity
                ELSE 0 END), 0)::int AS units_30d,
              COALESCE(SUM(CASE
                WHEN o.created_at > NOW() - INTERVAL '7 days' THEN oi.quantity
                ELSE 0 END), 0)::int AS units_7d,
              (SELECT image_url FROM product_images
                WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url
         FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
        WHERE p.seller_id = $1
          AND p.status = 'active'
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    const items = r.rows.map((row) => {
      const velocity = parseInt(row.units_30d, 10) / 30; // units per day
      const stock = parseInt(row.stock, 10) || 0;
      const daysOfCover = velocity > 0 ? stock / velocity : null;
      const stockOutDate = velocity > 0 && stock > 0
        ? new Date(Date.now() + (stock / velocity) * 24 * 3600 * 1000).toISOString()
        : null;
      return {
        productId: row.id,
        title: row.title,
        slug: row.slug,
        imageUrl: row.image_url,
        stock,
        units30d: parseInt(row.units_30d, 10),
        units7d: parseInt(row.units_7d, 10),
        velocityPerDay: Math.round(velocity * 100) / 100,
        daysOfCover: daysOfCover === null ? null : Math.round(daysOfCover * 10) / 10,
        stockOutDate,
        status: statusFor(stock, velocity),
      };
    });

    const byStatus = items.reduce((acc, it) => {
      acc[it.status] = (acc[it.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      items,
      summary: {
        total: items.length,
        urgent: byStatus.urgent || 0,
        warning: byStatus.warning || 0,
        ok: byStatus.ok || 0,
        idle: byStatus.idle || 0,
        outOfStock: byStatus.out_of_stock || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInventoryForecast, statusFor };
