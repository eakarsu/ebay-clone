/**
 * Seller ROI Dashboard — combines seller earnings + price history with an
 * AI summary of "what would have netted you more".
 *
 * Implements NEW custom feature #5 from the audit.
 *
 * Endpoints:
 *   GET  /api/seller/roi?since=YYYY-MM-DD&limit=N            — paginated ROI rows
 *   POST /api/seller/roi/summary                              — AI summary of past N days
 */

const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimits');
const aiService = require('../services/aiService');
const aiResultsStore = require('../services/aiResultsStore');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
    const since  = req.query.since || '1970-01-01';
    const total = await pool.query(
      `SELECT COUNT(*)::int AS c
       FROM orders o
       WHERE o.seller_id = $1 AND o.created_at >= $2`,
      [req.user.id, since],
    );
    const rows = await pool.query(
      `SELECT o.id, oi.product_id, p.title, o.total AS total_amount, o.created_at,
              p.starting_price, p.current_price,
              p.ai_listing_score
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.seller_id = $1 AND o.created_at >= $2
       ORDER BY o.created_at DESC
       LIMIT $3 OFFSET $4`,
      [req.user.id, since, limit, offset],
    );
    let revenue = 0; let count = 0;
    for (const r of rows.rows) { revenue += Number(r.total_amount) || 0; count++; }
    res.json({
      items: rows.rows,
      total: total.rows[0].c,
      revenue: +revenue.toFixed(2),
      orders: count,
      limit, offset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/summary', authenticateToken, aiRateLimit, async (req, res) => {
  try {
    const { days = 30 } = req.body || {};
    const sinceDate = new Date(Date.now() - Math.max(1, Math.min(365, Number(days))) * 86400_000);
    const rows = await pool.query(
      `SELECT o.id, oi.product_id, p.title, o.total AS total_amount, o.created_at,
              p.starting_price, p.current_price,
              p.ai_listing_score
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN products p ON p.id = oi.product_id
       WHERE o.seller_id = $1 AND o.created_at >= $2
       ORDER BY o.created_at DESC
       LIMIT 200`,
      [req.user.id, sinceDate],
    );
    if (!rows.rows.length) {
      return res.json({ summary: 'No orders in the period.', orders: 0, revenue: 0 });
    }
    const revenue = rows.rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
    const lines = rows.rows.slice(0, 50).map((r) =>
      `${new Date(r.created_at).toISOString().slice(0, 10)} — ${r.title}: sold $${r.total_amount} (start $${r.starting_price}, current $${r.current_price}, AI listing score ${r.ai_listing_score ?? 'n/a'})`
    ).join('\n');
    const prompt = `You are a marketplace analyst. Below are the last ${rows.rows.length} sales for a seller (truncated to 50). Provide:\n` +
      `1) Total revenue summary and average ticket size\n` +
      `2) Two best-performing categories or items by ROI\n` +
      `3) Three concrete pricing/listing changes that would likely have netted more\n` +
      `4) A specific "you'd have netted +$X had you priced Y%" estimate\n\n` +
      `Sales:\n${lines}`;
    const out = await aiService.chatSupport([{ role: 'user', content: prompt }]);
    if (!out.success) return res.status(502).json({ error: out.error });
    await aiResultsStore.record({
      userId: req.user.id,
      resourceType: 'seller',
      resourceId: req.user.id,
      feature: 'roi-summary',
      model: out.model,
      usage: out.usage,
      payload: { summary: out.response, days, revenue, orders: rows.rows.length },
      raw: out.response,
    });
    res.json({
      summary: out.response,
      orders: rows.rows.length,
      revenue: +revenue.toFixed(2),
      model: out.model,
      usage: out.usage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
