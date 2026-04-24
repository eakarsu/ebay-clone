const { pool } = require('../config/database');

/**
 * Seller follows. Lightweight table (follower_id, seller_id) — every
 * endpoint here is a thin query on top of it.
 *
 * The "feed" endpoint surfaces new listings from followed sellers, ordered
 * by recency. It's cheap: one SELECT with a join and a LIMIT.
 */

// POST /api/sellers/:id/follow
const followSeller = async (req, res, next) => {
  try {
    const sellerId = req.params.id;
    if (sellerId === req.user.id) {
      return res.status(400).json({ error: "You can't follow yourself" });
    }
    await pool.query(
      `INSERT INTO seller_follows (follower_id, seller_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, seller_id) DO NOTHING`,
      [req.user.id, sellerId]
    );
    const count = await pool.query(
      'SELECT COUNT(*)::int AS n FROM seller_follows WHERE seller_id = $1',
      [sellerId]
    );
    res.json({ following: true, followers: count.rows[0].n });
  } catch (err) {
    // Foreign-key violation when the target user doesn't exist.
    if (err.code === '23503') return res.status(404).json({ error: 'Seller not found' });
    // Check constraint violation (follower === seller).
    if (err.code === '23514') return res.status(400).json({ error: "You can't follow yourself" });
    next(err);
  }
};

// DELETE /api/sellers/:id/follow
const unfollowSeller = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM seller_follows WHERE follower_id = $1 AND seller_id = $2',
      [req.user.id, req.params.id]
    );
    const count = await pool.query(
      'SELECT COUNT(*)::int AS n FROM seller_follows WHERE seller_id = $1',
      [req.params.id]
    );
    res.json({ following: false, followers: count.rows[0].n });
  } catch (err) {
    next(err);
  }
};

// GET /api/sellers/:id/follow-status  → { followers, following(me?) }
// Public — we just omit the `following` flag for guests.
const getFollowStatus = async (req, res, next) => {
  try {
    const count = await pool.query(
      'SELECT COUNT(*)::int AS n FROM seller_follows WHERE seller_id = $1',
      [req.params.id]
    );
    let following = false;
    if (req.user) {
      const me = await pool.query(
        'SELECT 1 FROM seller_follows WHERE follower_id = $1 AND seller_id = $2',
        [req.user.id, req.params.id]
      );
      following = me.rows.length > 0;
    }
    res.json({ followers: count.rows[0].n, following });
  } catch (err) {
    next(err);
  }
};

// GET /api/feed — recent listings from sellers the user follows.
const getFollowingFeed = async (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const r = await pool.query(
      `SELECT p.id, p.title, p.slug, p.buy_now_price, p.current_price,
              p.condition, p.free_shipping, p.created_at,
              u.id AS seller_id, u.username AS seller_username, u.avatar_url AS seller_avatar,
              (SELECT image_url FROM product_images
                 WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url
         FROM seller_follows sf
         JOIN products p ON p.seller_id = sf.seller_id
         JOIN users u ON u.id = p.seller_id
        WHERE sf.follower_id = $1
          AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT $2`,
      [req.user.id, limit]
    );
    res.json({ items: r.rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/me/following — list of sellers I follow (for a "Following" page).
const getMyFollowing = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.seller_rating, u.total_sales,
              sf.created_at AS followed_at,
              (SELECT COUNT(*)::int FROM products WHERE seller_id = u.id AND status = 'active') AS active_listings
         FROM seller_follows sf
         JOIN users u ON u.id = sf.seller_id
        WHERE sf.follower_id = $1
        ORDER BY sf.created_at DESC`,
      [req.user.id]
    );
    res.json({ following: r.rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  followSeller,
  unfollowSeller,
  getFollowStatus,
  getFollowingFeed,
  getMyFollowing,
};
