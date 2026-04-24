const { pool } = require('../config/database');

// Sellers manage their own rules.
const listMyBundles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bundle_discounts WHERE seller_id = $1
        ORDER BY min_items ASC, created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List bundles error:', error.message);
    res.status(500).json({ error: 'Failed to fetch bundle discounts' });
  }
};

const createBundle = async (req, res) => {
  try {
    const { name, minItems, discountPercent, isActive } = req.body;
    const n = Math.max(parseInt(minItems) || 2, 2);
    const pct = Number(discountPercent);
    if (!name || pct <= 0 || pct > 100) {
      return res.status(400).json({ error: 'Valid name and discountPercent (0-100) required' });
    }
    const result = await pool.query(
      `INSERT INTO bundle_discounts (seller_id, name, min_items, discount_percent, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, name.trim(), n, pct, isActive !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create bundle error:', error.message);
    res.status(500).json({ error: 'Failed to create bundle discount' });
  }
};

const updateBundle = async (req, res) => {
  try {
    const { name, minItems, discountPercent, isActive } = req.body;
    const result = await pool.query(
      `UPDATE bundle_discounts
          SET name = COALESCE($1, name),
              min_items = COALESCE($2, min_items),
              discount_percent = COALESCE($3, discount_percent),
              is_active = COALESCE($4, is_active)
        WHERE id = $5 AND seller_id = $6
        RETURNING *`,
      [name || null, minItems || null, discountPercent || null,
       typeof isActive === 'boolean' ? isActive : null,
       req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update bundle error:', error.message);
    res.status(500).json({ error: 'Failed to update bundle' });
  }
};

const deleteBundle = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM bundle_discounts WHERE id = $1 AND seller_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bundle not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Delete bundle error:', error.message);
    res.status(500).json({ error: 'Failed to delete bundle' });
  }
};

// Public: which bundles does this seller offer? Useful for the Sell page preview
// or a "Save more when you bundle" banner on SellerStore.
const getSellerBundles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, min_items, discount_percent
         FROM bundle_discounts
        WHERE seller_id = $1 AND is_active = true
        ORDER BY min_items ASC`,
      [req.params.sellerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Public bundles error:', error.message);
    res.status(500).json({ error: 'Failed to fetch seller bundles' });
  }
};

// Compute the best discount that applies per seller for a given cart shape.
// Expects req.body.items = [{sellerId, price, quantity}].
// Returns [{sellerId, bundleName, discountPercent, matchingItemCount, subtotal, savings}]
const calculateForCart = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    const bySeller = {};
    for (const it of items) {
      if (!it.sellerId) continue;
      if (!bySeller[it.sellerId]) bySeller[it.sellerId] = { count: 0, subtotal: 0 };
      const q = Number(it.quantity) || 0;
      const p = Number(it.price) || 0;
      bySeller[it.sellerId].count += q;
      bySeller[it.sellerId].subtotal += q * p;
    }
    const sellerIds = Object.keys(bySeller);
    if (sellerIds.length === 0) return res.json([]);

    // Pull all active bundles for these sellers in one query.
    const rules = await pool.query(
      `SELECT seller_id, id, name, min_items, discount_percent
         FROM bundle_discounts
        WHERE is_active = true AND seller_id = ANY($1::uuid[])
        ORDER BY min_items DESC, discount_percent DESC`,
      [sellerIds]
    );

    const bestBySeller = {};
    for (const r of rules.rows) {
      const cart = bySeller[r.seller_id];
      if (!cart) continue;
      if (cart.count < r.min_items) continue;
      const current = bestBySeller[r.seller_id];
      // Pick the highest discount% rule that qualifies.
      if (!current || Number(r.discount_percent) > Number(current.discount_percent)) {
        bestBySeller[r.seller_id] = r;
      }
    }

    const out = Object.entries(bestBySeller).map(([sellerId, rule]) => {
      const { count, subtotal } = bySeller[sellerId];
      const savings = +(subtotal * (Number(rule.discount_percent) / 100)).toFixed(2);
      return {
        sellerId,
        bundleId: rule.id,
        bundleName: rule.name,
        discountPercent: Number(rule.discount_percent),
        matchingItemCount: count,
        subtotal: +subtotal.toFixed(2),
        savings,
      };
    });

    res.json(out);
  } catch (error) {
    console.error('Calculate bundle error:', error.message);
    res.status(500).json({ error: 'Failed to calculate bundle discounts' });
  }
};

module.exports = {
  listMyBundles, createBundle, updateBundle, deleteBundle,
  getSellerBundles, calculateForCart,
};
