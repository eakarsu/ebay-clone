const { pool } = require('../config/database');

/**
 * CSV order export for a seller. Streams a .csv of the seller's orders —
 * one row per order (not per line item) — for the given `status` and date
 * range. Kept simple on purpose: small N, a single query, in-memory CSV.
 *
 * If sellers ever accumulate enough orders that this hits memory pressure,
 * swap to a row-by-row stream (`res.write`) plus `COPY (...) TO STDOUT`.
 */
const quoteCsv = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v);
  // RFC 4180: wrap in quotes if it contains comma, quote, or newline;
  // escape internal quotes by doubling them.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const exportSellerOrders = async (req, res, next) => {
  try {
    const { status, from, to } = req.query;

    // Build WHERE dynamically but keep the params list ordered.
    const conds = ['o.seller_id = $1'];
    const params = [req.user.id];
    if (status) { params.push(status); conds.push(`o.status = $${params.length}`); }
    if (from)   { params.push(from);   conds.push(`o.created_at >= $${params.length}`); }
    if (to)     { params.push(to);     conds.push(`o.created_at <= $${params.length}`); }

    const result = await pool.query(
      `SELECT o.order_number, o.status, o.payment_status, o.subtotal, o.shipping_cost,
              o.tax, o.discount, o.total, o.tracking_number, o.shipping_carrier,
              o.created_at, o.shipped_at, o.delivered_at,
              buyer.username AS buyer_username, buyer.email AS buyer_email,
              (SELECT string_agg(p.title, ' | ') FROM order_items oi
                 JOIN products p ON p.id = oi.product_id
                WHERE oi.order_id = o.id) AS items,
              (SELECT SUM(oi.quantity)::int FROM order_items oi WHERE oi.order_id = o.id) AS item_count
         FROM orders o
         JOIN users buyer ON buyer.id = o.buyer_id
        WHERE ${conds.join(' AND ')}
        ORDER BY o.created_at DESC
        LIMIT 10000`,
      params
    );

    const headers = [
      'order_number', 'status', 'payment_status', 'buyer_username', 'buyer_email',
      'item_count', 'items',
      'subtotal', 'shipping_cost', 'tax', 'discount', 'total',
      'tracking_number', 'carrier',
      'created_at', 'shipped_at', 'delivered_at',
    ];

    const lines = [headers.join(',')];
    for (const r of result.rows) {
      lines.push([
        r.order_number, r.status, r.payment_status, r.buyer_username, r.buyer_email,
        r.item_count || 0, r.items || '',
        r.subtotal, r.shipping_cost, r.tax, r.discount, r.total,
        r.tracking_number || '', r.shipping_carrier || '',
        r.created_at?.toISOString?.() || r.created_at || '',
        r.shipped_at?.toISOString?.() || r.shipped_at || '',
        r.delivered_at?.toISOString?.() || r.delivered_at || '',
      ].map(quoteCsv).join(','));
    }

    const filename = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
};

module.exports = { exportSellerOrders };
