// Seller vacation auto-responder.
// When a user messages a seller who has vacation_mode=true, we auto-insert a
// reply from the seller with their vacation_message. We dedup so one sender
// gets at most one auto-reply per recipient in a 24h window — otherwise every
// follow-up during a long vacation would be spammed.
const { pool } = require('../config/database');

const DEDUP_HOURS = 24;

const maybeAutoReply = async ({ senderId, recipientId, productId, orderId }) => {
  try {
    // Recipient must be on vacation and have a message set.
    const r = await pool.query(
      `SELECT id, vacation_mode, vacation_message, vacation_return_date
         FROM users WHERE id = $1`,
      [recipientId]
    );
    if (r.rows.length === 0) return null;
    const u = r.rows[0];
    if (!u.vacation_mode) return null;

    const baseMsg = (u.vacation_message && u.vacation_message.trim()) ||
      "I'm currently away and will respond when I return.";
    const returnDate = u.vacation_return_date
      ? ` Expected return: ${new Date(u.vacation_return_date).toISOString().slice(0, 10)}.`
      : '';
    const body = `[Auto-reply] ${baseMsg}${returnDate}`;

    // Dedup: skip if we already auto-replied this sender recently.
    const recent = await pool.query(
      `SELECT 1 FROM messages
        WHERE sender_id = $1
          AND recipient_id = $2
          AND is_auto_reply = true
          AND created_at > NOW() - ($3 || ' hours')::interval
        LIMIT 1`,
      [recipientId, senderId, DEDUP_HOURS]
    );
    if (recent.rows.length > 0) return null;

    const inserted = await pool.query(
      `INSERT INTO messages
          (sender_id, recipient_id, product_id, order_id, body, is_auto_reply)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, created_at`,
      [recipientId, senderId, productId || null, orderId || null, body]
    );
    return inserted.rows[0];
  } catch (err) {
    // Auto-reply failure must never break the original send.
    console.error('Vacation auto-reply failed:', err.message);
    return null;
  }
};

module.exports = { maybeAutoReply, DEDUP_HOURS };
