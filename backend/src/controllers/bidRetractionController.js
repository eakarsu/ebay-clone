const { pool } = require('../config/database');

// Request bid retraction
const requestRetraction = async (req, res) => {
  try {
    const { bidId, reason, explanation } = req.body;

    // Get bid details
    const bid = await pool.query(
      `SELECT b.*, p.auction_end
       FROM bids b
       JOIN products p ON b.product_id = p.id
       WHERE b.id = $1 AND b.bidder_id = $2`,
      [bidId, req.user.id]
    );

    if (bid.rows.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const b = bid.rows[0];

    // Check if auction is ending soon (within 12 hours)
    const hoursLeft = (new Date(b.auction_end) - new Date()) / (1000 * 60 * 60);
    if (hoursLeft < 12) {
      return res.status(400).json({ error: 'Cannot retract bid within 12 hours of auction end' });
    }

    // Check if already retracted
    if (b.is_retracted) {
      return res.status(400).json({ error: 'Bid already retracted' });
    }

    const result = await pool.query(
      `INSERT INTO bid_retractions (bid_id, user_id, product_id, original_amount, reason, explanation)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [bidId, req.user.id, b.product_id, b.bid_amount, reason, explanation]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my retraction requests
const getMyRetractions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, p.title, p.slug
       FROM bid_retractions br
       JOIN products p ON br.product_id = p.id
       WHERE br.user_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Review retraction (admin/seller)
const reviewRetraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'denied'

    const retraction = await pool.query(
      `SELECT br.*, b.product_id
       FROM bid_retractions br
       JOIN bids b ON br.bid_id = b.id
       JOIN products p ON b.product_id = p.id
       WHERE br.id = $1 AND (p.seller_id = $2 OR $3 = true)`,
      [id, req.user.id, req.user.is_admin]
    );

    if (retraction.rows.length === 0) {
      return res.status(404).json({ error: 'Retraction request not found' });
    }

    const result = await pool.query(
      `UPDATE bid_retractions
       SET status = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, req.user.id, id]
    );

    // If approved, mark bid as retracted
    if (status === 'approved') {
      await pool.query(
        `UPDATE bids SET is_retracted = true, retracted_at = NOW() WHERE id = $1`,
        [retraction.rows[0].bid_id]
      );

      // Recalculate current price
      const newHighBid = await pool.query(
        `SELECT MAX(bid_amount) as max_bid FROM bids
         WHERE product_id = $1 AND is_retracted = false`,
        [retraction.rows[0].product_id]
      );

      await pool.query(
        `UPDATE products SET current_price = $1 WHERE id = $2`,
        [newHighBid.rows[0].max_bid, retraction.rows[0].product_id]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pending retractions (for sellers)
const getPendingRetractions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, p.title, p.slug, u.username as bidder_username
       FROM bid_retractions br
       JOIN products p ON br.product_id = p.id
       JOIN users u ON br.user_id = u.id
       WHERE p.seller_id = $1 AND br.status = 'pending'
       ORDER BY br.created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  requestRetraction,
  getMyRetractions,
  reviewRetraction,
  getPendingRetractions
};
