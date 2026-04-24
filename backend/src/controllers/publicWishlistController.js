const crypto = require('crypto');
const { pool } = require('../config/database');

// Turn wishlist visibility on (creates a share token if missing) or off.
const setWishlistVisibility = async (req, res) => {
  try {
    const { isPublic } = req.body;
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic boolean required' });
    }

    let token = null;
    if (isPublic) {
      // Reuse existing token if any, otherwise mint a new 16-byte urlsafe one.
      const existing = await pool.query(
        `SELECT wishlist_share_token FROM users WHERE id = $1`, [req.user.id]
      );
      token = existing.rows[0]?.wishlist_share_token
        || crypto.randomBytes(12).toString('base64url');
    }

    const result = await pool.query(
      `UPDATE users
          SET wishlist_public = $1,
              wishlist_share_token = CASE WHEN $1 THEN COALESCE(wishlist_share_token, $2) ELSE wishlist_share_token END
        WHERE id = $3
        RETURNING wishlist_public, wishlist_share_token`,
      [isPublic, token, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Set wishlist visibility error:', error.message);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
};

// Rotate the share token, invalidating any previous share URLs.
const rotateShareToken = async (req, res) => {
  try {
    const token = crypto.randomBytes(12).toString('base64url');
    const result = await pool.query(
      `UPDATE users SET wishlist_share_token = $1 WHERE id = $2
       RETURNING wishlist_public, wishlist_share_token`,
      [token, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Rotate wishlist token error:', error.message);
    res.status(500).json({ error: 'Failed to rotate token' });
  }
};

// Public read: by share token. Only returns data if the owner has wishlist_public = true.
const getPublicWishlist = async (req, res) => {
  try {
    const user = await pool.query(
      `SELECT id, username, avatar_url, wishlist_public
         FROM users
        WHERE wishlist_share_token = $1`,
      [req.params.token]
    );
    if (user.rows.length === 0 || !user.rows[0].wishlist_public) {
      return res.status(404).json({ error: 'Wishlist not found or not public' });
    }

    const items = await pool.query(
      `SELECT p.id, p.title, p.slug, p.condition,
              COALESCE(p.current_price, p.buy_now_price, p.starting_price) AS price,
              (SELECT image_url FROM product_images
                WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image,
              w.created_at AS added_at
         FROM watchlist w
         JOIN products p ON w.product_id = p.id
        WHERE w.user_id = $1 AND p.status = 'active'
        ORDER BY w.created_at DESC`,
      [user.rows[0].id]
    );

    res.json({
      owner: {
        username: user.rows[0].username,
        avatarUrl: user.rows[0].avatar_url,
      },
      items: items.rows,
    });
  } catch (error) {
    console.error('Get public wishlist error:', error.message);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
};

module.exports = { setWishlistVisibility, rotateShareToken, getPublicWishlist };
