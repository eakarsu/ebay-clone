const { pool } = require('../config/database');

/**
 * Order status timeline. The history is populated by a DB trigger on the
 * orders table, so this controller is a thin read path.
 *
 * Authorization: only the buyer or the seller on the order may see the
 * timeline. Admins fall through via is_admin.
 */

const getOrderTimeline = async (req, res, next) => {
  try {
    const orderId = req.params.id;

    // Confirm the caller has access to this order.
    const ord = await pool.query(
      'SELECT buyer_id, seller_id FROM orders WHERE id = $1',
      [orderId]
    );
    if (ord.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const { buyer_id, seller_id } = ord.rows[0];
    const isPartyToOrder =
      req.user.id === buyer_id || req.user.id === seller_id || req.user.is_admin;
    if (!isPartyToOrder) return res.status(403).json({ error: 'Not authorized' });

    const r = await pool.query(
      `SELECT h.id, h.from_status, h.to_status, h.note, h.created_at,
              u.username AS changed_by_username
         FROM order_status_history h
    LEFT JOIN users u ON u.id = h.changed_by
        WHERE h.order_id = $1
        ORDER BY h.created_at ASC`,
      [orderId]
    );
    res.json({ orderId, events: r.rows });
  } catch (err) {
    // Graceful degradation when the migration hasn't been applied yet.
    if (err.code === '42P01') {
      return res.json({ orderId: req.params.id, events: [], warning: 'timeline_not_migrated' });
    }
    next(err);
  }
};

module.exports = { getOrderTimeline };
