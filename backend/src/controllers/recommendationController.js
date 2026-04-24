const { pool } = require('../config/database');

/**
 * Shared projection for product cards returned by all recommendation endpoints.
 */
const PRODUCT_CARD_SELECT = `
  p.id, p.title, p.slug, p.current_price, p.buy_now_price, p.starting_price,
  p.listing_type, p.auction_end, p.bid_count, p.free_shipping, p.condition,
  p.brand, p.view_count, p.featured, p.status,
  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image
`;

/**
 * "Similar products" — content-based fallback using category + brand + price band.
 * Does NOT require any view history, so it always returns something on fresh DBs.
 * GET /api/recommendations/similar/:productId
 */
const getSimilarProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(24, parseInt(req.query.limit) || 12);

    // Pull the anchor product to know its category/brand/price range.
    const anchor = await pool.query(
      `SELECT category_id, subcategory_id, brand,
              COALESCE(current_price, buy_now_price) AS price
       FROM products WHERE id = $1`,
      [productId]
    );
    if (anchor.rows.length === 0) return res.json([]);
    const { category_id, subcategory_id, brand, price } = anchor.rows[0];

    const result = await pool.query(
      `SELECT ${PRODUCT_CARD_SELECT},
              (
                (CASE WHEN p.subcategory_id = $2 THEN 3 ELSE 0 END)
                + (CASE WHEN p.category_id = $3 THEN 2 ELSE 0 END)
                + (CASE WHEN p.brand IS NOT NULL AND p.brand = $4 THEN 2 ELSE 0 END)
                + (CASE WHEN $5::numeric IS NOT NULL
                        AND COALESCE(p.current_price, p.buy_now_price) BETWEEN $5::numeric * 0.5 AND $5::numeric * 1.5
                        THEN 1 ELSE 0 END)
              )::int AS score
       FROM products p
       WHERE p.id <> $1 AND p.status = 'active'
         AND (p.category_id = $3 OR p.brand = $4)
       ORDER BY score DESC, p.view_count DESC
       LIMIT $6`,
      [productId, subcategory_id, category_id, brand, price, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * "Customers who viewed this also viewed" — computed live from recently_viewed.
 * For every user who viewed the anchor product, find the other products they viewed,
 * and rank by number of co-viewers. Falls back to getSimilarProducts if too few.
 * GET /api/recommendations/also-viewed/:productId
 */
const getCustomersAlsoViewed = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(24, parseInt(req.query.limit) || 8);

    const result = await pool.query(
      `WITH viewers AS (
         SELECT DISTINCT user_id
         FROM recently_viewed
         WHERE product_id = $1
       )
       SELECT ${PRODUCT_CARD_SELECT},
              COUNT(DISTINCT rv.user_id)::int AS co_view_count
       FROM recently_viewed rv
       JOIN viewers v ON v.user_id = rv.user_id
       JOIN products p ON p.id = rv.product_id
       WHERE rv.product_id <> $1 AND p.status = 'active'
       GROUP BY p.id
       ORDER BY co_view_count DESC, p.view_count DESC
       LIMIT $2`,
      [productId, limit]
    );

    // If not enough signal yet, top up with similarity-based results.
    if (result.rows.length < Math.min(4, limit)) {
      const anchor = await pool.query(
        `SELECT category_id, brand FROM products WHERE id = $1`,
        [productId]
      );
      if (anchor.rows.length > 0) {
        const { category_id, brand } = anchor.rows[0];
        const seenIds = new Set(result.rows.map(r => r.id));
        seenIds.add(productId);
        const fill = await pool.query(
          `SELECT ${PRODUCT_CARD_SELECT}, 0 AS co_view_count
           FROM products p
           WHERE p.status = 'active' AND p.id <> ALL($1::uuid[])
             AND (p.category_id = $2 OR p.brand = $3)
           ORDER BY p.view_count DESC, p.created_at DESC
           LIMIT $4`,
          [Array.from(seenIds), category_id, brand, limit - result.rows.length]
        );
        return res.json([...result.rows, ...fill.rows]);
      }
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * "Frequently bought together" — market-basket over order_items.
 * Finds orders that contained the anchor product, then the other products in those orders.
 * GET /api/recommendations/bought-together/:productId
 */
const getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = Math.min(12, parseInt(req.query.limit) || 4);

    const result = await pool.query(
      `WITH baskets AS (
         SELECT DISTINCT order_id
         FROM order_items
         WHERE product_id = $1
       )
       SELECT ${PRODUCT_CARD_SELECT},
              COUNT(DISTINCT oi.order_id)::int AS co_purchase_count
       FROM order_items oi
       JOIN baskets b ON b.order_id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE oi.product_id <> $1 AND p.status = 'active'
       GROUP BY p.id
       ORDER BY co_purchase_count DESC, p.view_count DESC
       LIMIT $2`,
      [productId, limit]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Personalized for the authenticated user:
 * Look at products they recently viewed → recommend active products in the same
 * categories/brands that they haven't seen yet.
 * GET /api/recommendations/personalized
 */
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const limit = Math.min(40, parseInt(req.query.limit) || 20);

    const result = await pool.query(
      `WITH user_signals AS (
         SELECT p.category_id, p.subcategory_id, p.brand
         FROM recently_viewed rv
         JOIN products p ON p.id = rv.product_id
         WHERE rv.user_id = $1
         ORDER BY rv.last_viewed_at DESC
         LIMIT 50
       ),
       seen AS (
         SELECT product_id FROM recently_viewed WHERE user_id = $1
       )
       SELECT ${PRODUCT_CARD_SELECT},
              (
                (CASE WHEN p.subcategory_id IN (SELECT subcategory_id FROM user_signals WHERE subcategory_id IS NOT NULL) THEN 3 ELSE 0 END)
                + (CASE WHEN p.category_id IN (SELECT category_id FROM user_signals) THEN 2 ELSE 0 END)
                + (CASE WHEN p.brand IN (SELECT brand FROM user_signals WHERE brand IS NOT NULL) THEN 2 ELSE 0 END)
              )::int AS score,
              'based_on_your_views' AS recommendation_reason
       FROM products p
       WHERE p.status = 'active'
         AND p.id NOT IN (SELECT product_id FROM seen)
         AND (
           p.category_id IN (SELECT category_id FROM user_signals)
           OR p.brand IN (SELECT brand FROM user_signals WHERE brand IS NOT NULL)
         )
       ORDER BY score DESC, p.view_count DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    // Cold-start: user has no view history yet → fall back to trending.
    if (result.rows.length === 0) {
      const trending = await pool.query(
        `SELECT ${PRODUCT_CARD_SELECT}, 0 AS score, 'trending' AS recommendation_reason
         FROM products p
         WHERE p.status = 'active'
         ORDER BY p.view_count DESC, p.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return res.json(trending.rows);
    }

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Mark a recommended product as viewed so it stops being re-suggested.
 * Idempotent — also records/updates the recently_viewed row which drives future recs.
 */
const markViewed = async (req, res) => {
  try {
    const { productId } = req.params;
    await pool.query(
      `INSERT INTO recently_viewed (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET view_count = recently_viewed.view_count + 1,
                     last_viewed_at = NOW()`,
      [req.user.id, productId]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Trending — products with the most views in the last 7 days, weighted by bids/watches.
 * GET /api/recommendations/trending
 */
const getTrending = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 12);

    const result = await pool.query(
      `SELECT ${PRODUCT_CARD_SELECT},
              (p.view_count + p.bid_count * 5 + p.watch_count * 3) AS trend_score
       FROM products p
       WHERE p.status = 'active'
         AND p.created_at > NOW() - INTERVAL '30 days'
       ORDER BY trend_score DESC, p.created_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSimilarProducts,
  getPersonalizedRecommendations,
  getCustomersAlsoViewed,
  getFrequentlyBoughtTogether,
  markViewed,
  getTrending,
};
