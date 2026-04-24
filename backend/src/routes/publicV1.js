const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { requireApiKey } = require('../middleware/apiKey');
const { search } = require('../controllers/searchController');

router.use(requireApiKey('public:read'));

// GET /api/v1/public/products?page&limit&category
router.get('/products', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const categorySlug = req.query.category;

    const params = [];
    let where = "p.status = 'active'";
    if (categorySlug) {
      params.push(categorySlug);
      where += ` AND c.slug = $${params.length}`;
    }
    params.push(limit, offset);
    const r = await pool.query(
      `SELECT p.id, p.title, p.slug, p.current_price, p.buy_now_price, p.condition,
              p.listing_type, p.auction_end, p.bid_count, p.free_shipping,
              c.slug AS category_slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ products: r.rows, page, limit });
  } catch (e) { next(e); }
});

// GET /api/v1/public/products/:id
router.get('/products/:id', async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT id, title, slug, description, current_price, buy_now_price, starting_price,
              condition, listing_type, auction_end, bid_count, free_shipping,
              brand, model, created_at
       FROM products
       WHERE id = $1 AND status = 'active'`,
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { next(e); }
});

// GET /api/v1/public/search?q=...
router.get('/search', search);

// GET /api/v1/public/categories
router.get('/categories', async (req, res, next) => {
  try {
    const r = await pool.query(
      'SELECT id, name, slug FROM categories ORDER BY name'
    );
    res.json({ categories: r.rows });
  } catch (e) { next(e); }
});

module.exports = router;
