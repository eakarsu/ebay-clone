/**
 * Auction Sniping Protection — per-listing soft-close config.
 *
 * Endpoints (all require auth + ownership of the listing):
 *   GET    /api/sniping/:productId         — current config
 *   PUT    /api/sniping/:productId         — update soft-close config
 *
 * Implements the configurable surface for NEW custom feature #4
 * "Auction sniping protection" (last-N-second bids trigger soft extension).
 */

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/:productId', authenticateToken, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, seller_id, listing_type, auction_end,
              COALESCE(soft_extend_enabled, TRUE)        AS soft_extend_enabled,
              COALESCE(soft_extend_window_sec, 60)       AS soft_extend_window_sec,
              COALESCE(soft_extend_amount_sec, 120)      AS soft_extend_amount_sec,
              COALESCE(max_extensions, 10)               AS max_extensions,
              COALESCE(extensions_count, 0)              AS extensions_count
       FROM products WHERE id = $1`,
      [req.params.productId],
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Product not found' });
    const p = r.rows[0];
    if (p.seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden — not the seller' });
    if (p.listing_type !== 'auction') return res.status(400).json({ error: 'Not an auction listing' });
    res.json({
      productId: p.id,
      auctionEnd: p.auction_end,
      enabled: p.soft_extend_enabled,
      windowSec: p.soft_extend_window_sec,
      amountSec: p.soft_extend_amount_sec,
      maxExtensions: p.max_extensions,
      usedExtensions: p.extensions_count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:productId', authenticateToken, async (req, res) => {
  try {
    const { enabled, windowSec, amountSec, maxExtensions } = req.body || {};
    // Validate sensible bounds — refuse 0 windows or month-long extensions.
    if (windowSec != null && (windowSec < 5 || windowSec > 600)) {
      return res.status(400).json({ error: 'windowSec must be 5..600' });
    }
    if (amountSec != null && (amountSec < 10 || amountSec > 1800)) {
      return res.status(400).json({ error: 'amountSec must be 10..1800' });
    }
    if (maxExtensions != null && (maxExtensions < 0 || maxExtensions > 100)) {
      return res.status(400).json({ error: 'maxExtensions must be 0..100' });
    }
    const own = await pool.query('SELECT seller_id FROM products WHERE id = $1', [req.params.productId]);
    if (!own.rows.length) return res.status(404).json({ error: 'Product not found' });
    if (own.rows[0].seller_id !== req.user.id) return res.status(403).json({ error: 'Forbidden — not the seller' });

    await pool.query(
      `UPDATE products
       SET soft_extend_enabled    = COALESCE($1, soft_extend_enabled),
           soft_extend_window_sec = COALESCE($2, soft_extend_window_sec),
           soft_extend_amount_sec = COALESCE($3, soft_extend_amount_sec),
           max_extensions         = COALESCE($4, max_extensions),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [enabled, windowSec, amountSec, maxExtensions, req.params.productId],
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
