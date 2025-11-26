const { pool } = require('../config/database');

const placeBid = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { productId, bidAmount, maxBidAmount } = req.body;

    // Get product details
    const productResult = await client.query(
      `SELECT id, seller_id, listing_type, current_price, starting_price, reserve_price,
              auction_end, bid_count, status
       FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Validation
    if (product.status !== 'active') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This listing is no longer active' });
    }

    if (product.listing_type === 'buy_now') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This is a Buy Now listing, not an auction' });
    }

    if (product.seller_id === req.user.id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You cannot bid on your own item' });
    }

    if (new Date(product.auction_end) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This auction has ended' });
    }

    const minimumBid = product.current_price
      ? parseFloat(product.current_price) + 1
      : parseFloat(product.starting_price);

    if (bidAmount < minimumBid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Minimum bid is $${minimumBid.toFixed(2)}` });
    }

    // Mark previous winning bid as not winning
    await client.query(
      'UPDATE bids SET is_winning = false WHERE product_id = $1 AND is_winning = true',
      [productId]
    );

    // Place the bid
    const bidResult = await client.query(
      `INSERT INTO bids (product_id, bidder_id, bid_amount, max_bid_amount, is_winning)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [productId, req.user.id, bidAmount, maxBidAmount || bidAmount]
    );

    // Update product
    await client.query(
      `UPDATE products SET current_price = $1, bid_count = bid_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [bidAmount, productId]
    );

    // Notify outbid users
    const outbidUsers = await client.query(
      `SELECT DISTINCT bidder_id FROM bids
       WHERE product_id = $1 AND bidder_id != $2`,
      [productId, req.user.id]
    );

    for (const row of outbidUsers.rows) {
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'bid_outbid', 'You have been outbid!', $2, $3)`,
        [
          row.bidder_id,
          `Someone has placed a higher bid of $${bidAmount.toFixed(2)} on an item you were bidding on.`,
          `/product/${productId}`,
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Bid placed successfully',
      bid: {
        id: bidResult.rows[0].id,
        amount: parseFloat(bidResult.rows[0].bid_amount),
        isWinning: true,
        time: bidResult.rows[0].created_at,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getBidsForProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT b.id, b.bid_amount, b.is_winning, b.created_at,
              u.username, u.avatar_url
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.product_id = $1
       ORDER BY b.bid_amount DESC
       LIMIT $2 OFFSET $3`,
      [productId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM bids WHERE product_id = $1',
      [productId]
    );

    res.json({
      bids: result.rows.map(bid => ({
        id: bid.id,
        amount: parseFloat(bid.bid_amount),
        isWinning: bid.is_winning,
        time: bid.created_at,
        bidder: {
          username: bid.username,
          avatarUrl: bid.avatar_url,
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

const getUserBids = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT b.id, b.bid_amount, b.is_winning, b.created_at,
              p.id as product_id, p.title, p.slug, p.current_price, p.auction_end, p.status,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as product_image
       FROM bids b
       JOIN products p ON b.product_id = p.id
       WHERE b.bidder_id = $1
       ORDER BY b.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM bids WHERE bidder_id = $1',
      [req.user.id]
    );

    res.json({
      bids: result.rows.map(row => ({
        id: row.id,
        amount: parseFloat(row.bid_amount),
        isWinning: row.is_winning,
        time: row.created_at,
        product: {
          id: row.product_id,
          title: row.title,
          slug: row.slug,
          currentPrice: parseFloat(row.current_price),
          auctionEnd: row.auction_end,
          status: row.status,
          image: row.product_image,
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

module.exports = { placeBid, getBidsForProduct, getUserBids };
