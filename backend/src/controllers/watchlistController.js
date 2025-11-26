const { pool } = require('../config/database');

const getWatchlist = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT w.id, w.created_at as added_at,
              p.id as product_id, p.title, p.slug, p.current_price, p.buy_now_price,
              p.listing_type, p.auction_end, p.bid_count, p.status,
              p.shipping_cost, p.free_shipping,
              u.id as seller_id, u.username as seller_username, u.seller_rating,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM watchlist w
       JOIN products p ON w.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM watchlist WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      items: result.rows.map(row => ({
        id: row.id,
        addedAt: row.added_at,
        product: {
          id: row.product_id,
          title: row.title,
          slug: row.slug,
          currentPrice: parseFloat(row.current_price) || null,
          buyNowPrice: parseFloat(row.buy_now_price) || null,
          listingType: row.listing_type,
          auctionEnd: row.auction_end,
          bidCount: row.bid_count,
          status: row.status,
          shippingCost: parseFloat(row.shipping_cost),
          freeShipping: row.free_shipping,
          image: row.image,
        },
        seller: {
          id: row.seller_id,
          username: row.seller_username,
          rating: parseFloat(row.seller_rating),
        },
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.body;

    // Check product exists
    const productResult = await pool.query(
      'SELECT id, seller_id, status FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    if (product.seller_id === req.user.id) {
      return res.status(400).json({ error: 'You cannot watch your own product' });
    }

    // Add to watchlist
    await pool.query(
      'INSERT INTO watchlist (user_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, productId]
    );

    // Update watch count
    await pool.query(
      'UPDATE products SET watch_count = watch_count + 1 WHERE id = $1',
      [productId]
    );

    res.json({ message: 'Added to watchlist' });
  } catch (error) {
    next(error);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [req.user.id, productId]
    );

    if (result.rows.length > 0) {
      // Update watch count
      await pool.query(
        'UPDATE products SET watch_count = GREATEST(watch_count - 1, 0) WHERE id = $1',
        [productId]
      );
    }

    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    next(error);
  }
};

const checkWatchlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      'SELECT id FROM watchlist WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    res.json({ isWatching: result.rows.length > 0 });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist, checkWatchlist };
