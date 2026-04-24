const { pool } = require('../config/database');
const realtime = require('../realtime/socket');
const { checkBidRisk } = require('../services/fraudService');

const SOFT_CLOSE_WINDOW_SECONDS = 60;   // extend auction if bid lands within this many seconds of end
const SOFT_CLOSE_EXTENSION_SECONDS = 120; // extend by this much

const placeBid = async (req, res, next) => {
  const { productId, bidAmount, maxBidAmount } = req.body;

  // Fraud / velocity check BEFORE opening a transaction
  const risk = await checkBidRisk({
    userId: req.user.id,
    productId,
    ip: req.ip,
  });
  if (risk.decision === 'deny') {
    return res.status(429).json({ error: risk.reason });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

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

    // Soft close: if auction ends within the soft-close window, extend it.
    const msToEnd = new Date(product.auction_end).getTime() - Date.now();
    const extend = msToEnd > 0 && msToEnd < SOFT_CLOSE_WINDOW_SECONDS * 1000;

    // Update product (optionally extending auction_end)
    if (extend) {
      await client.query(
        `UPDATE products
         SET current_price = $1,
             bid_count = bid_count + 1,
             auction_end = auction_end + ($3 || ' seconds')::interval,
             extensions_count = COALESCE(extensions_count, 0) + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [bidAmount, productId, String(SOFT_CLOSE_EXTENSION_SECONDS)]
      );
    } else {
      await client.query(
        `UPDATE products SET current_price = $1, bid_count = bid_count + 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [bidAmount, productId]
      );
    }

    // Notify outbid users — we surface the *previous winning bidder* (the one
    // actually outbid by this bid) with a live socket push. All other prior
    // bidders still get a notification row.
    const prevWinner = await client.query(
      `SELECT bidder_id FROM bids
        WHERE product_id = $1 AND id != $2
        ORDER BY bid_amount DESC, created_at DESC
        LIMIT 1`,
      [productId, bidResult.rows[0].id]
    );
    const prevWinnerId = prevWinner.rows[0]?.bidder_id || null;

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

    // Title for the socket payload — fetched once, cheap.
    const titleResult = await client.query(
      'SELECT title FROM products WHERE id = $1',
      [productId]
    );
    const productTitle = titleResult.rows[0]?.title || 'an item';

    await client.query('COMMIT');

    // Live push to the *previous* winner so a toast appears wherever they are.
    // Only push if they aren't the same user as the new bidder (which is
    // already excluded above but belt-and-suspenders).
    if (prevWinnerId && prevWinnerId !== req.user.id) {
      realtime.emitToUser(prevWinnerId, 'user:outbid', {
        productId,
        productTitle,
        newBidAmount: parseFloat(bidResult.rows[0].bid_amount),
        link: `/product/${productId}`,
        at: new Date().toISOString(),
      });
    }

    // Lookup bidder username for broadcast (outside transaction)
    const bidderResult = await pool.query(
      'SELECT username, avatar_url FROM users WHERE id = $1',
      [req.user.id]
    );
    const bidder = bidderResult.rows[0] || {};

    // Fetch the (possibly extended) auction_end and seq for catch-up clients
    const after = await pool.query(
      'SELECT auction_end FROM products WHERE id = $1',
      [productId]
    );

    // Broadcast to everyone watching this auction
    realtime.emitBid(productId, {
      productId,
      bidId: bidResult.rows[0].id,
      bidSeq: bidResult.rows[0].seq,
      amount: parseFloat(bidResult.rows[0].bid_amount),
      bidCount: parseInt(product.bid_count) + 1,
      time: bidResult.rows[0].created_at,
      auctionEnd: after.rows[0]?.auction_end,
      extended: extend,
      extensionSeconds: extend ? SOFT_CLOSE_EXTENSION_SECONDS : 0,
      bidder: {
        id: req.user.id,
        username: bidder.username,
        avatarUrl: bidder.avatar_url,
      },
    });

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

/**
 * Offline catch-up: returns all bids for a product with seq > cursor.
 * Clients that were disconnected rejoin, ask for this, and merge into state.
 */
const getBidsSince = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const sinceSeq = parseInt(req.query.sinceSeq || '0', 10);
    const result = await pool.query(
      `SELECT b.id, b.seq, b.bid_amount, b.created_at, u.username, u.avatar_url
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.product_id = $1 AND b.seq > $2
       ORDER BY b.seq ASC
       LIMIT 200`,
      [productId, sinceSeq]
    );

    const prod = await pool.query(
      'SELECT current_price, bid_count, auction_end FROM products WHERE id = $1',
      [productId]
    );

    res.json({
      bids: result.rows.map(r => ({
        id: r.id,
        seq: parseInt(r.seq),
        amount: parseFloat(r.bid_amount),
        time: r.created_at,
        bidder: { username: r.username, avatarUrl: r.avatar_url },
      })),
      currentPrice: prod.rows[0] ? parseFloat(prod.rows[0].current_price) : null,
      bidCount: prod.rows[0] ? parseInt(prod.rows[0].bid_count) : 0,
      auctionEnd: prod.rows[0]?.auction_end || null,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { placeBid, getBidsForProduct, getUserBids, getBidsSince };
