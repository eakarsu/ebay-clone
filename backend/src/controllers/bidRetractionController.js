const { pool } = require('../config/database');
const realtime = require('../realtime/socket');

// Allowed reason codes match the DB check constraint on bid_retractions.reason.
const REASONS = [
  'entered_wrong_amount',
  'seller_changed_description',
  'cannot_contact_seller',
  'other',
];

// Buyer submits a retraction request.
const requestRetraction = async (req, res) => {
  try {
    const { bidId, reason, explanation } = req.body;
    if (!bidId || !reason) return res.status(400).json({ error: 'bidId and reason required' });
    if (!REASONS.includes(reason)) {
      return res.status(400).json({ error: `Invalid reason. Must be one of: ${REASONS.join(', ')}` });
    }

    const bid = await pool.query(
      `SELECT b.id, b.bidder_id, b.bid_amount, b.is_retracted, b.product_id, p.auction_end
         FROM bids b
         JOIN products p ON b.product_id = p.id
        WHERE b.id = $1 AND b.bidder_id = $2`,
      [bidId, req.user.id]
    );
    if (bid.rows.length === 0) return res.status(404).json({ error: 'Bid not found' });
    const b = bid.rows[0];

    // Block retractions in the final 12 hours — too close to end, not fair to seller.
    const hoursLeft = (new Date(b.auction_end) - new Date()) / (1000 * 60 * 60);
    if (hoursLeft < 12) {
      return res.status(400).json({ error: 'Cannot retract bid within 12 hours of auction end' });
    }
    if (b.is_retracted) return res.status(400).json({ error: 'Bid already retracted' });

    // Prevent duplicate pending requests for the same bid.
    const existing = await pool.query(
      `SELECT 1 FROM bid_retractions WHERE bid_id = $1 AND status = 'pending'`,
      [bidId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A retraction request is already pending for this bid' });
    }

    const result = await pool.query(
      `INSERT INTO bid_retractions (bid_id, user_id, product_id, original_amount, reason, explanation)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [bidId, req.user.id, b.product_id, b.bid_amount, reason, explanation || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Request retraction error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Buyer's history — widen query so the UI doesn't need a second fetch.
const getMyRetractions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.id, br.bid_id, br.product_id, br.original_amount,
              br.reason, br.explanation, br.status, br.review_note,
              br.reviewed_at, br.created_at,
              p.title AS product_title, p.slug AS product_slug,
              (SELECT image_url FROM product_images
                WHERE product_id = p.id AND is_primary = true LIMIT 1) AS product_image
         FROM bid_retractions br
         JOIN products p ON br.product_id = p.id
        WHERE br.user_id = $1
        ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('getMyRetractions error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Seller/admin reviews a request. On approve we recompute the auction's current
// price from the surviving bids.
const reviewRetraction = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNote } = req.body;
    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'denied'" });
    }

    // Authorize: seller of the auction OR an admin.
    const retraction = await pool.query(
      `SELECT br.*, p.seller_id, p.starting_bid
         FROM bid_retractions br
         JOIN products p ON br.product_id = p.id
        WHERE br.id = $1`,
      [id]
    );
    if (retraction.rows.length === 0) return res.status(404).json({ error: 'Retraction request not found' });
    const r = retraction.rows[0];
    const isSeller = r.seller_id === req.user.id;
    const isAdmin = !!req.user.is_admin;
    if (!isSeller && !isAdmin) return res.status(403).json({ error: 'Not authorized' });
    if (r.status !== 'pending') return res.status(400).json({ error: 'Already reviewed' });

    const updated = await pool.query(
      `UPDATE bid_retractions
          SET status = $1, reviewed_by = $2, reviewed_at = NOW(), review_note = $3
        WHERE id = $4
        RETURNING *`,
      [status, req.user.id, reviewNote || null, id]
    );

    if (status === 'approved') {
      // Flag the bid, then recompute the auction's current price from surviving bids.
      await pool.query(
        `UPDATE bids SET is_retracted = true, retracted_at = NOW() WHERE id = $1`,
        [r.bid_id]
      );

      const newHigh = await pool.query(
        `SELECT MAX(bid_amount) AS max_bid FROM bids
          WHERE product_id = $1 AND is_retracted = false`,
        [r.product_id]
      );
      const newPrice = newHigh.rows[0].max_bid || r.starting_bid;
      await pool.query(
        `UPDATE products SET current_price = $1 WHERE id = $2`,
        [newPrice, r.product_id]
      );

      // Tell anyone watching the auction that the price changed.
      const io = realtime.getIO();
      if (io) {
        io.to(`auction:${r.product_id}`).emit('bid:retracted', {
          productId: r.product_id,
          currentPrice: Number(newPrice),
        });
      }
    }

    res.json(updated.rows[0]);
  } catch (error) {
    console.error('reviewRetraction error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// Pending requests on the current user's auctions.
const getPendingRetractions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.id, br.bid_id, br.product_id, br.original_amount,
              br.reason, br.explanation, br.status, br.created_at,
              p.title AS product_title, p.slug AS product_slug,
              (SELECT image_url FROM product_images
                WHERE product_id = p.id AND is_primary = true LIMIT 1) AS product_image,
              u.username AS bidder_username, u.id AS bidder_id
         FROM bid_retractions br
         JOIN products p ON br.product_id = p.id
         JOIN users u ON br.user_id = u.id
        WHERE p.seller_id = $1 AND br.status = 'pending'
        ORDER BY br.created_at ASC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('getPendingRetractions error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  requestRetraction, getMyRetractions, reviewRetraction, getPendingRetractions, REASONS,
};
