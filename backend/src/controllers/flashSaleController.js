const { pool } = require('../config/database');

/**
 * Flash sales: short-window percentage discounts on a product. Checkout/listing
 * code calls `getActiveForProduct` to get the current effective price.
 */

// Only one active flash sale per product at a time (business rule). We don't
// enforce with a DB constraint since end_at can overlap briefly during edits,
// but we always pick the one with the highest discount.
const getActiveForProduct = async (productId) => {
  const r = await pool.query(
    `SELECT id, discount_pct, starts_at, ends_at, max_uses, uses_count
       FROM flash_sales
      WHERE product_id = $1
        AND starts_at <= NOW()
        AND ends_at > NOW()
        AND (max_uses IS NULL OR uses_count < max_uses)
      ORDER BY discount_pct DESC
      LIMIT 1`,
    [productId]
  );
  return r.rows[0] || null;
};

// Apply discount to a base price. Returns { price, discountPct } — price is
// unchanged when no active sale exists. Callers can show both in the UI.
const applyFlashSaleToPrice = async (productId, basePrice) => {
  const sale = await getActiveForProduct(productId);
  if (!sale) return { price: parseFloat(basePrice), discountPct: 0, saleId: null };
  const pct = parseFloat(sale.discount_pct);
  const discounted = (parseFloat(basePrice) * (100 - pct)) / 100;
  return { price: Math.round(discounted * 100) / 100, discountPct: pct, saleId: sale.id };
};

// --- HTTP ---

// GET /api/flash-sales/active — all currently-live sales (public)
const listActive = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT fs.id, fs.product_id, fs.discount_pct, fs.starts_at, fs.ends_at,
              fs.max_uses, fs.uses_count,
              p.title, p.buy_now_price, p.current_price,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url
         FROM flash_sales fs
         JOIN products p ON p.id = fs.product_id
        WHERE fs.starts_at <= NOW() AND fs.ends_at > NOW()
          AND (fs.max_uses IS NULL OR fs.uses_count < fs.max_uses)
        ORDER BY fs.ends_at ASC
        LIMIT 100`
    );
    res.json({
      sales: r.rows.map((row) => {
        const base = parseFloat(row.current_price || row.buy_now_price || 0);
        const pct = parseFloat(row.discount_pct);
        return {
          id: row.id,
          productId: row.product_id,
          productTitle: row.title,
          imageUrl: row.image_url,
          basePrice: base,
          salePrice: Math.round(base * (100 - pct)) / 100,
          discountPct: pct,
          startsAt: row.starts_at,
          endsAt: row.ends_at,
          maxUses: row.max_uses,
          usesCount: row.uses_count,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/flash-sales — seller creates a sale on their product
const createFlashSale = async (req, res, next) => {
  try {
    const { productId, discountPct, startsAt, endsAt, maxUses } = req.body;
    if (!productId || !discountPct || !startsAt || !endsAt) {
      return res.status(400).json({ error: 'productId, discountPct, startsAt, endsAt are required' });
    }
    const pct = parseFloat(discountPct);
    if (isNaN(pct) || pct <= 0 || pct >= 90) {
      return res.status(400).json({ error: 'discountPct must be between 1 and 89' });
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return res.status(400).json({ error: 'endsAt must be after startsAt' });
    }

    // Verify seller owns the product.
    const owner = await pool.query('SELECT seller_id FROM products WHERE id = $1', [productId]);
    if (owner.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    if (owner.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to create sales for this product' });
    }

    const r = await pool.query(
      `INSERT INTO flash_sales (product_id, seller_id, discount_pct, starts_at, ends_at, max_uses)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, req.user.id, pct, startsAt, endsAt, maxUses || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) {
    next(err);
  }
};

// GET /api/flash-sales/mine — seller's own sales (past + future + active)
const listMine = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT fs.*, p.title AS product_title
         FROM flash_sales fs
         JOIN products p ON p.id = fs.product_id
        WHERE fs.seller_id = $1
        ORDER BY fs.starts_at DESC
        LIMIT 100`,
      [req.user.id]
    );
    res.json({ sales: r.rows });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/flash-sales/:id — seller cancels (ends_at = NOW())
const cancelFlashSale = async (req, res, next) => {
  try {
    const r = await pool.query(
      `UPDATE flash_sales SET ends_at = NOW()
        WHERE id = $1 AND seller_id = $2 AND ends_at > NOW()
        RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Sale not found or already ended' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActiveForProduct,
  applyFlashSaleToPrice,
  listActive,
  createFlashSale,
  listMine,
  cancelFlashSale,
};
