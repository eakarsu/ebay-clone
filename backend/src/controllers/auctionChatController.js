const { pool } = require('../config/database');
const realtime = require('../realtime/socket');

// Hard cap to prevent runaway chat loads; live clients only need recent context.
const MAX_LIMIT = 100;

// Get recent chat for an auction. Anyone can read, returned oldest→newest so
// the UI can append straight into the scroll.
const getChat = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, MAX_LIMIT);

    const result = await pool.query(
      `SELECT c.id, c.product_id, c.user_id, c.message, c.created_at,
              u.username, u.avatar_url
         FROM auction_chat_messages c
         JOIN users u ON u.id = c.user_id
        WHERE c.product_id = $1
        ORDER BY c.created_at DESC
        LIMIT $2`,
      [productId, limit]
    );
    // Reverse so consumers see chronological order.
    res.json({ messages: result.rows.reverse() });
  } catch (error) {
    console.error('Get auction chat error:', error.message);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

// Post a message. Persists then broadcasts to everyone in the auction room.
// We don't allow the seller to chat in their own auction's room to keep
// buyer-facing chat free of sales pitches (seller still gets Q&A for that).
const postMessage = async (req, res) => {
  try {
    const { productId } = req.params;
    const raw = (req.body.message || '').toString().trim();
    if (!raw) return res.status(400).json({ error: 'Message is required' });
    if (raw.length > 500) return res.status(400).json({ error: 'Message too long (max 500)' });

    const product = await pool.query(
      `SELECT id, listing_type, status, seller_id, auction_end
         FROM products WHERE id = $1`,
      [productId]
    );
    if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const p = product.rows[0];

    if (p.listing_type !== 'auction') {
      return res.status(400).json({ error: 'Chat is only available on auction listings' });
    }
    if (p.status !== 'active') {
      return res.status(400).json({ error: 'Auction is no longer active' });
    }
    if (p.auction_end && new Date(p.auction_end) < new Date()) {
      return res.status(400).json({ error: 'Auction has ended' });
    }
    if (p.seller_id === req.user.id) {
      return res.status(403).json({ error: 'Seller cannot chat in their own auction' });
    }

    const inserted = await pool.query(
      `INSERT INTO auction_chat_messages (product_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, product_id, user_id, message, created_at`,
      [productId, req.user.id, raw]
    );

    const row = inserted.rows[0];
    const payload = {
      id: row.id,
      product_id: row.product_id,
      user_id: row.user_id,
      message: row.message,
      created_at: row.created_at,
      username: req.user.username,
      avatar_url: req.user.avatar_url || null,
    };

    // Fanout to all clients in the auction room (bid room is reused).
    const io = realtime.getIO();
    if (io) io.to(`auction:${productId}`).emit('auction:chat', payload);

    res.status(201).json(payload);
  } catch (error) {
    console.error('Post auction chat error:', error.message);
    res.status(500).json({ error: 'Failed to post message' });
  }
};

module.exports = { getChat, postMessage };
