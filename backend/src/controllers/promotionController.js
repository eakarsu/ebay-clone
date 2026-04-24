const { pool } = require('../config/database');
const { selectPromotedSlots, recordEvent } = require('../services/promotionService');

/** GET /api/promotions/slots?categoryId=&slots=2 */
const getSlots = async (req, res, next) => {
  try {
    const slots = Math.min(6, parseInt(req.query.slots) || 2);
    const categoryId = req.query.categoryId || null;
    const result = await selectPromotedSlots({ categoryId, slots });
    // Log impressions
    for (const row of result) {
      recordEvent(row.promo_id, 'impression', 0).catch(() => {});
    }
    res.json({ slots: result });
  } catch (e) { next(e); }
};

/** POST /api/promotions/click {promoId} */
const click = async (req, res, next) => {
  try {
    const { promoId } = req.body;
    // Re-derive the charge for this click at present
    const r = await pool.query(
      `SELECT pb.cpc_bid, pb.product_id, p.category_id
       FROM promotion_bids pb
       JOIN products p ON p.id = pb.product_id
       WHERE pb.id = $1`,
      [promoId]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const row = r.rows[0];

    // Recompute what they'd pay right now
    const slots = await selectPromotedSlots({ categoryId: row.category_id, slots: 2 });
    const match = slots.find(s => s.promo_id === promoId);
    const charge = match ? match.charge_on_click : parseFloat(row.cpc_bid);
    await recordEvent(promoId, 'click', charge);
    res.json({ ok: true, charged: charge });
  } catch (e) { next(e); }
};

/** Seller creates/updates a promotion for one of their listings. */
const upsert = async (req, res, next) => {
  try {
    const { productId, cpcBid, dailyBudget } = req.body;
    const owns = await pool.query(
      'SELECT seller_id FROM products WHERE id = $1',
      [productId]
    );
    if (!owns.rows.length || owns.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your product' });
    }
    const r = await pool.query(
      `INSERT INTO promotion_bids (product_id, seller_id, cpc_bid, daily_budget)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [productId, req.user.id, cpcBid, dailyBudget || null]
    );
    if (r.rows[0]) return res.status(201).json(r.rows[0]);

    const upd = await pool.query(
      `UPDATE promotion_bids
       SET cpc_bid = $1, daily_budget = $2, status = 'active'
       WHERE product_id = $3 AND seller_id = $4
       RETURNING *`,
      [cpcBid, dailyBudget || null, productId, req.user.id]
    );
    res.json(upd.rows[0]);
  } catch (e) { next(e); }
};

const listMine = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT pb.*, p.title
       FROM promotion_bids pb
       JOIN products p ON p.id = pb.product_id
       WHERE pb.seller_id = $1
       ORDER BY pb.created_at DESC`,
      [req.user.id]
    );
    res.json({ promotions: r.rows });
  } catch (e) { next(e); }
};

/** PATCH /api/promotions/:id — change status (active | paused). Seller-owner only. */
const setStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'paused'].includes(status)) {
      return res.status(400).json({ error: "status must be 'active' or 'paused'" });
    }
    const owned = await pool.query(
      'SELECT seller_id FROM promotion_bids WHERE id = $1',
      [id]
    );
    if (!owned.rows.length) return res.status(404).json({ error: 'Not found' });
    if (owned.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your promotion' });
    }
    const r = await pool.query(
      `UPDATE promotion_bids SET status = $1 WHERE id = $2 RETURNING *`,
      [status, id]
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
};

module.exports = { getSlots, click, upsert, listMine, setStatus };
