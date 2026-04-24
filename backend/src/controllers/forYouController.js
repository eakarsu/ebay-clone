const { pool } = require('../config/database');

/**
 * "For You" combines several recommendation slices into a single, sectioned
 * payload so the UI can render a personalized home-like feed with a single
 * round-trip. Each section is small (~8 items) to keep the payload lean.
 *
 * Sections returned (in order):
 *   - basedOnViews     — items similar to recently viewed (same category/brand)
 *   - fromWatchlist    — other listings from categories the user watches
 *   - flashSales       — currently active flash sales
 *   - trending         — global fallback
 *
 * Guest users still get something useful: flashSales + trending.
 */

const CARD = `
  p.id, p.title, p.slug, p.current_price, p.buy_now_price, p.listing_type,
  p.free_shipping, p.condition, p.brand, p.featured,
  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image
`;

const getForYou = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const sections = {};

    if (userId) {
      // Based on views — same category as the user's recent browsing.
      const views = await pool.query(
        `WITH sig AS (
           SELECT p.category_id, p.brand
             FROM recently_viewed rv
             JOIN products p ON p.id = rv.product_id
            WHERE rv.user_id = $1
            ORDER BY rv.last_viewed_at DESC
            LIMIT 30
         ),
         seen AS (SELECT product_id FROM recently_viewed WHERE user_id = $1)
         SELECT ${CARD}
           FROM products p
          WHERE p.status = 'active'
            AND p.id NOT IN (SELECT product_id FROM seen)
            AND (p.category_id IN (SELECT category_id FROM sig)
                 OR p.brand IN (SELECT brand FROM sig WHERE brand IS NOT NULL))
          ORDER BY p.view_count DESC
          LIMIT 8`,
        [userId]
      ).catch(() => ({ rows: [] }));
      sections.basedOnViews = views.rows;

      // From categories the user follows / watchlist items.
      const watch = await pool.query(
        `WITH watched_cats AS (
           SELECT DISTINCT p.category_id
             FROM watchlist w
             JOIN products p ON p.id = w.product_id
            WHERE w.user_id = $1
         ),
         in_watchlist AS (SELECT product_id FROM watchlist WHERE user_id = $1)
         SELECT ${CARD}
           FROM products p
          WHERE p.status = 'active'
            AND p.category_id IN (SELECT category_id FROM watched_cats)
            AND p.id NOT IN (SELECT product_id FROM in_watchlist)
          ORDER BY p.created_at DESC
          LIMIT 8`,
        [userId]
      ).catch(() => ({ rows: [] }));
      sections.fromWatchlist = watch.rows;
    }

    // Flash sales — works for both logged-in and guest users.
    const flash = await pool.query(
      `SELECT ${CARD}, fs.discount_pct, fs.ends_at
         FROM flash_sales fs
         JOIN products p ON p.id = fs.product_id
        WHERE fs.starts_at <= NOW() AND fs.ends_at > NOW()
          AND p.status = 'active'
        ORDER BY fs.discount_pct DESC
        LIMIT 8`
    ).catch(() => ({ rows: [] }));
    sections.flashSales = flash.rows;

    // Trending — global fallback always shown.
    const trend = await pool.query(
      `SELECT ${CARD}
         FROM products p
        WHERE p.status = 'active'
        ORDER BY p.view_count DESC NULLS LAST, p.created_at DESC
        LIMIT 8`
    ).catch(() => ({ rows: [] }));
    sections.trending = trend.rows;

    res.json(sections);
  } catch (err) {
    next(err);
  }
};

module.exports = { getForYou };
