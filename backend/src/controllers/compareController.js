const { pool } = require('../config/database');

// POST /api/compare  { productIds: [uuid,...] }  (2-4 products)
// Returns raw product rows + an aligned attribute matrix suitable for a compare grid.
const compareProducts = async (req, res) => {
  try {
    const ids = Array.isArray(req.body.productIds) ? req.body.productIds : [];
    if (ids.length < 2 || ids.length > 4) {
      return res.status(400).json({ error: 'Provide between 2 and 4 product IDs' });
    }

    const result = await pool.query(
      `SELECT p.id, p.title, p.slug, p.condition, p.brand, p.model,
              p.current_price, p.buy_now_price, p.starting_price,
              p.free_shipping, p.shipping_cost,
              p.shipping_from_city, p.shipping_from_state, p.shipping_from_country,
              p.quantity, p.view_count,
              p.listing_type, p.auction_end,
              c.name AS category_name,
              u.id AS seller_id, u.username AS seller_username, u.seller_rating,
              (SELECT image_url FROM product_images
                WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN users u ON p.seller_id = u.id
        WHERE p.id = ANY($1::uuid[]) AND p.status = 'active'`,
      [ids]
    );

    // Preserve the input order.
    const byId = Object.fromEntries(result.rows.map(r => [r.id, r]));
    const products = ids.map(id => byId[id]).filter(Boolean);

    // Build attribute matrix — list of { label, values:[...] } for easy grid rendering.
    const attr = (label, fn) => ({ label, values: products.map(fn) });
    const money = (v) => (v == null ? null : Number(v));
    const price = (p) => money(p.current_price ?? p.buy_now_price ?? p.starting_price);
    const shipping = (p) => (p.free_shipping ? 'Free' : money(p.shipping_cost) ?? 'N/A');

    const matrix = [
      attr('Price', price),
      attr('Condition', p => p.condition),
      attr('Brand', p => p.brand || '—'),
      attr('Model', p => p.model || '—'),
      attr('Category', p => p.category_name || '—'),
      attr('Listing type', p => p.listing_type),
      attr('Shipping', shipping),
      attr('Ships from', p => [p.shipping_from_city, p.shipping_from_state, p.shipping_from_country]
        .filter(Boolean).join(', ') || '—'),
      attr('Seller', p => p.seller_username),
      attr('Seller rating', p => p.seller_rating ? Number(p.seller_rating).toFixed(2) : '—'),
      attr('Quantity available', p => p.quantity),
      attr('Views', p => p.view_count || 0)
    ];

    res.json({ products, matrix });
  } catch (error) {
    console.error('Compare products error:', error.message);
    res.status(500).json({ error: 'Failed to compare products' });
  }
};

module.exports = { compareProducts };
