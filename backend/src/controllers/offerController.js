const { pool } = require('../config/database');

// Get all offers for a product
const getProductOffers = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT o.*, u.username as buyer_username, u.avatar_url as buyer_avatar
       FROM offers o
       JOIN users u ON o.buyer_id = u.id
       WHERE o.product_id = $1
       ORDER BY o.created_at DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's offers (as buyer)
const getMyOffers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.product_id as "productId", o.offer_amount as "offerAmount",
              o.counter_amount as "counterAmount", o.status, o.message,
              o.created_at as "createdAt", o.responded_at as "respondedAt",
              p.title, p.slug, p.buy_now_price,
              s.username as seller_username,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM offers o
       JOIN products p ON o.product_id = p.id
       JOIN users s ON o.seller_id = s.id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Format response for frontend
    const offers = result.rows.map(row => ({
      ...row,
      product: {
        title: row.title,
        slug: row.slug,
        buyNowPrice: parseFloat(row.buy_now_price),
        images: row.image ? [{ url: row.image }] : []
      },
      seller: { username: row.seller_username }
    }));

    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get offers received (as seller)
const getReceivedOffers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.id, o.product_id as "productId", o.offer_amount as "offerAmount",
              o.counter_amount as "counterAmount", o.status, o.message,
              o.created_at as "createdAt", o.responded_at as "respondedAt",
              p.title, p.slug, p.buy_now_price,
              u.username as buyer_username,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM offers o
       JOIN products p ON o.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       WHERE o.seller_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    // Format response for frontend
    const offers = result.rows.map(row => ({
      ...row,
      product: {
        title: row.title,
        slug: row.slug,
        buyNowPrice: parseFloat(row.buy_now_price),
        images: row.image ? [{ url: row.image }] : []
      },
      buyer: { username: row.buyer_username }
    }));

    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create an offer
const createOffer = async (req, res) => {
  try {
    const { productId, offerAmount, quantity, message } = req.body;

    // Get product details
    const product = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const p = product.rows[0];

    if (!p.accepts_offers) {
      return res.status(400).json({ error: 'This product does not accept offers' });
    }

    // Check auto-decline
    if (p.auto_decline_price && offerAmount < p.auto_decline_price) {
      return res.status(400).json({ error: 'Offer is below minimum acceptable price' });
    }

    // Check if auto-accept
    let status = 'pending';
    if (p.auto_accept_price && offerAmount >= p.auto_accept_price) {
      status = 'accepted';
    }

    const result = await pool.query(
      `INSERT INTO offers (product_id, buyer_id, seller_id, offer_amount, quantity, message, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [productId, req.user.id, p.seller_id, offerAmount, quantity || 1, message, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Respond to offer (accept/decline/counter)
const respondToOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, counterAmount, counterMessage } = req.body;

    const offer = await pool.query(
      'SELECT * FROM offers WHERE id = $1 AND seller_id = $2',
      [id, req.user.id]
    );

    if (offer.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found' });
    }

    let status;
    let updates = { responded_at: new Date() };

    if (action === 'accept') {
      status = 'accepted';
    } else if (action === 'decline') {
      status = 'declined';
    } else if (action === 'counter') {
      status = 'countered';
      updates.counter_amount = counterAmount;
      updates.counter_message = counterMessage;
    }

    const result = await pool.query(
      `UPDATE offers
       SET status = $1, responded_at = $2, counter_amount = $3, counter_message = $4
       WHERE id = $5
       RETURNING *`,
      [status, updates.responded_at, updates.counter_amount || null, updates.counter_message || null, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Withdraw offer
const withdrawOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE offers SET status = 'withdrawn' WHERE id = $1 AND buyer_id = $2 AND status = 'pending'
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Offer not found or cannot be withdrawn' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProductOffers,
  getMyOffers,
  getReceivedOffers,
  createOffer,
  respondToOffer,
  withdrawOffer
};
