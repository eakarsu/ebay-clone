const { pool } = require('../config/database');

// Get user's collections
const getMyCollections = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              (SELECT json_agg(json_build_object('url', pi.image_url))
               FROM collection_items ci
               JOIN product_images pi ON ci.product_id = pi.product_id AND pi.is_primary = true
               WHERE ci.collection_id = c.id
               LIMIT 4) as preview_images
       FROM collections c
       WHERE c.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get public collection by ID
const getCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await pool.query(
      `SELECT c.*, u.username as owner_username
       FROM collections c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1 AND (c.is_public = true OR c.user_id = $2)`,
      [id, req.user?.id]
    );

    if (collection.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const items = await pool.query(
      `SELECT ci.*, p.title, p.slug, p.buy_now_price, p.current_price, p.condition,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM collection_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.collection_id = $1
       ORDER BY ci.added_at DESC`,
      [id]
    );

    res.json({
      ...collection.rows[0],
      items: items.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create collection
const createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const result = await pool.query(
      `INSERT INTO collections (user_id, name, description, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, name, description, isPublic || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update collection
const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    const result = await pool.query(
      `UPDATE collections
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           is_public = COALESCE($3, is_public),
           updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [name, description, isPublic, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete collection
const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM collections WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add item to collection
const addItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, notes } = req.body;

    // Verify ownership
    const collection = await pool.query(
      `SELECT * FROM collections WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (collection.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const result = await pool.query(
      `INSERT INTO collection_items (collection_id, product_id, notes)
       VALUES ($1, $2, $3)
       ON CONFLICT (collection_id, product_id) DO UPDATE SET notes = $3
       RETURNING *`,
      [id, productId, notes]
    );

    // Update item count
    await pool.query(
      `UPDATE collections SET item_count = (SELECT COUNT(*) FROM collection_items WHERE collection_id = $1) WHERE id = $1`,
      [id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove item from collection
const removeItem = async (req, res) => {
  try {
    const { id, productId } = req.params;

    // Verify ownership
    const collection = await pool.query(
      `SELECT * FROM collections WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    if (collection.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await pool.query(
      `DELETE FROM collection_items WHERE collection_id = $1 AND product_id = $2`,
      [id, productId]
    );

    // Update item count
    await pool.query(
      `UPDATE collections SET item_count = (SELECT COUNT(*) FROM collection_items WHERE collection_id = $1) WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Follow collection
const followCollection = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `INSERT INTO collection_followers (collection_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, req.user.id]
    );

    // Update follower count
    await pool.query(
      `UPDATE collections SET follower_count = (SELECT COUNT(*) FROM collection_followers WHERE collection_id = $1) WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unfollow collection
const unfollowCollection = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM collection_followers WHERE collection_id = $1 AND user_id = $2`,
      [id, req.user.id]
    );

    // Update follower count
    await pool.query(
      `UPDATE collections SET follower_count = (SELECT COUNT(*) FROM collection_followers WHERE collection_id = $1) WHERE id = $1`,
      [id]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get public collections
const getPublicCollections = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT c.*, u.username as owner_username
       FROM collections c
       JOIN users u ON c.user_id = u.id
       WHERE c.is_public = true AND c.item_count > 0
       ORDER BY c.follower_count DESC, c.item_count DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addItem,
  removeItem,
  followCollection,
  unfollowCollection,
  getPublicCollections
};
