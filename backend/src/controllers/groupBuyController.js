const { pool } = require('../config/database');

/**
 * Group buys / tiered pricing. A seller defines quantity tiers; buyers commit
 * quantities; the unit price for everyone is determined by the highest tier
 * whose `min_qty` is met by the sum of commitments.
 *
 * Tiers are stored as JSONB: [{ min_qty: 5, price: 19.99 }, ...]. We keep the
 * math in the controller so the DB stays a dumb store of commitments.
 */

// Pick the best tier (lowest price) whose min_qty threshold is met by totalQty.
// Returns { minQty, price } or null if no tier met.
const tierForQuantity = (tiers, totalQty) => {
  if (!Array.isArray(tiers) || tiers.length === 0) return null;
  const sorted = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
  let hit = null;
  for (const t of sorted) {
    if (totalQty >= t.min_qty) hit = t;
  }
  return hit ? { minQty: hit.min_qty, price: parseFloat(hit.price) } : null;
};

const summarizeGroupBuy = async (groupBuyId) => {
  const r = await pool.query(
    `SELECT gb.*, p.title AS product_title, u.username AS seller_username,
            COALESCE(SUM(c.quantity), 0) AS total_quantity,
            COUNT(c.id) AS commitment_count
       FROM group_buys gb
       JOIN products p ON p.id = gb.product_id
       JOIN users u ON u.id = gb.seller_id
  LEFT JOIN group_buy_commitments c ON c.group_buy_id = gb.id
      WHERE gb.id = $1
      GROUP BY gb.id, p.title, u.username`,
    [groupBuyId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  const totalQty = parseInt(row.total_quantity, 10);
  const current = tierForQuantity(row.tiers, totalQty);
  const nextTier = (Array.isArray(row.tiers) ? row.tiers : [])
    .filter((t) => t.min_qty > totalQty)
    .sort((a, b) => a.min_qty - b.min_qty)[0];
  return {
    id: row.id,
    productId: row.product_id,
    productTitle: row.product_title,
    sellerId: row.seller_id,
    sellerUsername: row.seller_username,
    tiers: row.tiers,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    totalQuantity: totalQty,
    commitmentCount: parseInt(row.commitment_count, 10),
    currentTier: current,
    nextTier: nextTier
      ? { minQty: nextTier.min_qty, price: parseFloat(nextTier.price), qtyNeeded: nextTier.min_qty - totalQty }
      : null,
  };
};

// --- HTTP ---

// GET /api/group-buys — public list of open group buys
const listOpen = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT gb.id FROM group_buys gb
        WHERE gb.status = 'open' AND gb.ends_at > NOW()
        ORDER BY gb.ends_at ASC
        LIMIT 100`
    );
    const buys = await Promise.all(r.rows.map((row) => summarizeGroupBuy(row.id)));
    res.json({ groupBuys: buys.filter(Boolean) });
  } catch (err) {
    next(err);
  }
};

// GET /api/group-buys/:id — public details of a group buy
const getGroupBuy = async (req, res, next) => {
  try {
    const gb = await summarizeGroupBuy(req.params.id);
    if (!gb) return res.status(404).json({ error: 'Group buy not found' });
    res.json(gb);
  } catch (err) {
    next(err);
  }
};

// POST /api/group-buys — seller creates a group buy
const createGroupBuy = async (req, res, next) => {
  try {
    const { productId, tiers, startsAt, endsAt } = req.body;
    if (!productId || !Array.isArray(tiers) || tiers.length === 0 || !startsAt || !endsAt) {
      return res.status(400).json({ error: 'productId, tiers[], startsAt, endsAt are required' });
    }
    // Validate tiers shape.
    for (const t of tiers) {
      if (typeof t.min_qty !== 'number' || t.min_qty < 1 || typeof t.price !== 'number' || t.price <= 0) {
        return res.status(400).json({ error: 'each tier must have min_qty >=1 and price > 0' });
      }
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return res.status(400).json({ error: 'endsAt must be after startsAt' });
    }

    const owner = await pool.query('SELECT seller_id FROM products WHERE id = $1', [productId]);
    if (owner.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (owner.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const r = await pool.query(
      `INSERT INTO group_buys (product_id, seller_id, tiers, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [productId, req.user.id, JSON.stringify(tiers), startsAt, endsAt]
    );
    const gb = await summarizeGroupBuy(r.rows[0].id);
    res.status(201).json(gb);
  } catch (err) {
    next(err);
  }
};

// POST /api/group-buys/:id/commit — user commits a quantity
const commitQuantity = async (req, res, next) => {
  try {
    const quantity = parseInt(req.body?.quantity, 10);
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be >= 1' });

    const gb = await pool.query(
      `SELECT id, status, ends_at FROM group_buys WHERE id = $1`,
      [req.params.id]
    );
    if (gb.rows.length === 0) return res.status(404).json({ error: 'Group buy not found' });
    if (gb.rows[0].status !== 'open' || new Date(gb.rows[0].ends_at) <= new Date()) {
      return res.status(400).json({ error: 'Group buy is closed' });
    }

    // Upsert: one commitment per (group_buy_id, user_id); second call updates.
    await pool.query(
      `INSERT INTO group_buy_commitments (group_buy_id, user_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_buy_id, user_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [req.params.id, req.user.id, quantity]
    );

    const updated = await summarizeGroupBuy(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/group-buys/:id/commit — user withdraws their commitment
const withdrawCommitment = async (req, res, next) => {
  try {
    await pool.query(
      `DELETE FROM group_buy_commitments WHERE group_buy_id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const updated = await summarizeGroupBuy(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  tierForQuantity,
  summarizeGroupBuy,
  listOpen,
  getGroupBuy,
  createGroupBuy,
  commitQuantity,
  withdrawCommitment,
};
