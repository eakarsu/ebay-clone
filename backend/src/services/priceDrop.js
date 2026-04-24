// Detects price drops on a product and notifies watchers.
// Called after a seller updates a listing's price. Fires and forgets — errors
// only log, never propagate, since this is a non-critical side effect.
const { pool } = require('../config/database');
const { emitToUser } = require('../realtime/socket');

const notifyPriceDrop = async (productId) => {
  try {
    const prod = await pool.query(
      `SELECT id, title, slug,
              COALESCE(current_price, buy_now_price, starting_price) AS price
         FROM products WHERE id = $1`,
      [productId]
    );
    if (prod.rows.length === 0) return;
    const p = prod.rows[0];
    const newPrice = Number(p.price);
    if (!newPrice || Number.isNaN(newPrice)) return;

    // Find watchers whose saved price_at_watch is higher than the new price.
    const watchers = await pool.query(
      `SELECT user_id, price_at_watch FROM watchlist
        WHERE product_id = $1 AND price_at_watch IS NOT NULL AND price_at_watch > $2`,
      [productId, newPrice]
    );

    for (const w of watchers.rows) {
      const was = Number(w.price_at_watch);
      const drop = was - newPrice;
      const pct = Math.round((drop / was) * 100);
      const title = `Price drop: ${p.title.slice(0, 60)}`;
      const message = `Now $${newPrice.toFixed(2)} — down $${drop.toFixed(2)} (${pct}%) from when you added it.`;
      const link = `/product/${p.id}`;

      const inserted = await pool.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'price_drop', $2, $3, $4)
         RETURNING id, user_id, type, title, message, link, is_read, created_at`,
        [w.user_id, title, message, link]
      );

      // Update the user's recorded watch price so they don't get repeatedly
      // notified about the same drop — only further drops will trigger again.
      await pool.query(
        `UPDATE watchlist SET price_at_watch = $1 WHERE user_id = $2 AND product_id = $3`,
        [newPrice, w.user_id, productId]
      );

      emitToUser(w.user_id, 'notification:new', inserted.rows[0]);
    }

    return watchers.rows.length;
  } catch (err) {
    console.error('notifyPriceDrop error:', err.message);
  }
};

module.exports = { notifyPriceDrop };
