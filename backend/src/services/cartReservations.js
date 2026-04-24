// Cart stock reservations. When a buyer adds N units to their cart, we reserve
// those units against the product for a fixed TTL. Other shoppers can still see
// the product but its "available" count shows the net (quantity - active reservations
// by other users). Expired reservations are swept by a periodic cleanup job.
const { pool } = require('../config/database');

const RESERVATION_TTL_MINUTES = 10;

// Get the currently-available quantity for a product, net of reservations held
// by *other* users (a user shouldn't compete with themselves).
const getAvailable = async (productId, userId) => {
  const result = await pool.query(
    `SELECT
        (p.quantity - COALESCE(p.quantity_sold, 0)) AS base,
        COALESCE((
          SELECT SUM(quantity) FROM cart_reservations
            WHERE product_id = p.id
              AND expires_at > NOW()
              AND user_id <> $2
        ), 0)::int AS held
      FROM products p WHERE p.id = $1`,
    [productId, userId || '00000000-0000-0000-0000-000000000000']
  );
  if (result.rows.length === 0) return 0;
  const base = Number(result.rows[0].base || 0);
  const held = Number(result.rows[0].held || 0);
  return Math.max(0, base - held);
};

// Reserve (or top up an existing reservation). If quantity would exceed availability,
// returns { ok: false, reason }.
const reserve = async (userId, productId, quantity) => {
  const available = await getAvailable(productId, userId);
  if (quantity > available) {
    return { ok: false, reason: 'not_enough_stock', available };
  }
  const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000);
  await pool.query(
    `INSERT INTO cart_reservations (user_id, product_id, quantity, expires_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, product_id) DO UPDATE
       SET quantity = EXCLUDED.quantity,
           expires_at = EXCLUDED.expires_at`,
    [userId, productId, quantity, expiresAt]
  );
  return { ok: true, expiresAt };
};

// Release a reservation (on remove from cart or completed checkout).
const release = async (userId, productId) => {
  await pool.query(
    `DELETE FROM cart_reservations WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
};

// Release all reservations for a user (on cart clear / order placed).
const releaseAll = async (userId) => {
  await pool.query(`DELETE FROM cart_reservations WHERE user_id = $1`, [userId]);
};

// Sweep expired rows. Called by a setInterval in index.js.
const cleanupExpired = async () => {
  const result = await pool.query(
    `DELETE FROM cart_reservations WHERE expires_at < NOW() RETURNING id`
  );
  return result.rowCount;
};

module.exports = {
  RESERVATION_TTL_MINUTES,
  getAvailable, reserve, release, releaseAll, cleanupExpired,
};
