const { pool } = require('../config/database');

// Follow a category so new listings show up in the user's personal feed.
const follow = async (req, res) => {
  try {
    const { categoryId } = req.body;
    if (!categoryId) return res.status(400).json({ error: 'categoryId required' });

    const cat = await pool.query('SELECT id FROM categories WHERE id = $1', [categoryId]);
    if (cat.rows.length === 0) return res.status(404).json({ error: 'Category not found' });

    await pool.query(
      `INSERT INTO category_follows (user_id, category_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, category_id) DO NOTHING`,
      [req.user.id, categoryId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Follow category error:', error.message);
    res.status(500).json({ error: 'Failed to follow category' });
  }
};

const unfollow = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM category_follows WHERE user_id = $1 AND category_id = $2',
      [req.user.id, req.params.categoryId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Unfollow category error:', error.message);
    res.status(500).json({ error: 'Failed to unfollow category' });
  }
};

// List categories the current user follows.
const listMyFollows = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.slug, c.icon, cf.created_at AS followed_at
         FROM category_follows cf
         JOIN categories c ON c.id = cf.category_id
        WHERE cf.user_id = $1
        ORDER BY cf.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('List follows error:', error.message);
    res.status(500).json({ error: 'Failed to list followed categories' });
  }
};

// Aggregate feed: recent active listings across all followed categories.
// Paginated by created_at cursor (descending), falls back to LIMIT/OFFSET.
const getFeed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = Math.max(parseInt(req.query.offset) || 0, 0);

    const result = await pool.query(
      `SELECT p.id, p.title, p.slug, p.current_price, p.buy_now_price,
              p.listing_type, p.created_at, p.category_id,
              c.name AS category_name, c.slug AS category_slug,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image,
              u.username AS seller_username
         FROM category_follows cf
         JOIN products p ON p.category_id = cf.category_id
         JOIN categories c ON c.id = p.category_id
         JOIN users u ON u.id = p.seller_id
        WHERE cf.user_id = $1
          AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    res.json({
      items: result.rows,
      pagination: { limit, offset, hasMore: result.rows.length === limit },
    });
  } catch (error) {
    console.error('Get feed error:', error.message);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

// Cheap check for a Follow button: is the current user following this category?
const isFollowing = async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT 1 FROM category_follows WHERE user_id = $1 AND category_id = $2',
      [req.user.id, req.params.categoryId]
    );
    res.json({ following: r.rows.length > 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check follow status' });
  }
};

module.exports = { follow, unfollow, listMyFollows, getFeed, isFollowing };
