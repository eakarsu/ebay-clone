// Proxy/Automatic Bidding Controller
const { pool } = require('../config/database');

// Get bid increments table
const getBidIncrements = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM bid_increments ORDER BY price_from`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate bid increment for a price
const calculateIncrement = (currentPrice) => {
  const increments = [
    { from: 0, to: 0.99, increment: 0.05 },
    { from: 1, to: 4.99, increment: 0.25 },
    { from: 5, to: 24.99, increment: 0.50 },
    { from: 25, to: 99.99, increment: 1.00 },
    { from: 100, to: 249.99, increment: 2.50 },
    { from: 250, to: 499.99, increment: 5.00 },
    { from: 500, to: 999.99, increment: 10.00 },
    { from: 1000, to: Infinity, increment: 25.00 }
  ];

  const bracket = increments.find(b => currentPrice >= b.from && currentPrice <= b.to);
  return bracket ? bracket.increment : 25.00;
};

// Place proxy bid (set maximum bid)
const placeProxyBid = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { productId, maxBidAmount } = req.body;

    // Get current auction status
    const product = await client.query(
      `SELECT id, current_price, listing_type, auction_end, status
       FROM products WHERE id = $1 FOR UPDATE`,
      [productId]
    );

    if (product.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    const auction = product.rows[0];

    if (auction.listing_type !== 'auction') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This item is not an auction' });
    }

    if (auction.status !== 'active' || new Date(auction.auction_end) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Auction has ended' });
    }

    const currentPrice = parseFloat(auction.current_price);
    const increment = calculateIncrement(currentPrice);
    const minBid = currentPrice + increment;

    if (maxBidAmount < minBid) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Maximum bid must be at least $${minBid.toFixed(2)}`,
        minBid
      });
    }

    // Check for existing proxy bid by this user
    const existingProxy = await client.query(
      `SELECT * FROM proxy_bids WHERE product_id = $1 AND bidder_id = $2`,
      [productId, req.user.id]
    );

    let proxyBid;

    if (existingProxy.rows.length > 0) {
      // Update existing proxy bid
      proxyBid = await client.query(
        `UPDATE proxy_bids
         SET max_bid_amount = $1, is_active = true, updated_at = CURRENT_TIMESTAMP
         WHERE product_id = $2 AND bidder_id = $3
         RETURNING *`,
        [maxBidAmount, productId, req.user.id]
      );
    } else {
      // Create new proxy bid
      proxyBid = await client.query(
        `INSERT INTO proxy_bids (product_id, bidder_id, max_bid_amount, current_proxy_bid, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING *`,
        [productId, req.user.id, maxBidAmount, minBid]
      );
    }

    // Process proxy bidding (determine new high bidder)
    const result = await processProxyBidding(client, productId, req.user.id, maxBidAmount);

    await client.query('COMMIT');

    res.json({
      message: result.isWinning ? 'You are the high bidder!' : 'You have been outbid',
      proxyBid: proxyBid.rows[0],
      currentPrice: result.newPrice,
      isWinning: result.isWinning
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Process proxy bidding logic
const processProxyBidding = async (client, productId, newBidderId, newMaxBid) => {
  // Get all active proxy bids for this product
  const proxyBids = await client.query(
    `SELECT * FROM proxy_bids
     WHERE product_id = $1 AND is_active = true
     ORDER BY max_bid_amount DESC, created_at ASC`,
    [productId]
  );

  if (proxyBids.rows.length === 0) {
    return { newPrice: newMaxBid, isWinning: true };
  }

  const bids = proxyBids.rows;

  // If only one bidder
  if (bids.length === 1) {
    const product = await client.query(
      `SELECT current_price FROM products WHERE id = $1`,
      [productId]
    );
    const currentPrice = parseFloat(product.rows[0].current_price);
    const increment = calculateIncrement(currentPrice);
    const newPrice = Math.min(currentPrice + increment, bids[0].max_bid_amount);

    // Update product price and winning bidder
    await client.query(
      `UPDATE products SET current_price = $1 WHERE id = $2`,
      [newPrice, productId]
    );

    // Create bid record
    await client.query(
      `INSERT INTO bids (product_id, bidder_id, amount, is_proxy_bid)
       VALUES ($1, $2, $3, true)`,
      [productId, bids[0].bidder_id, newPrice]
    );

    // Mark as winning
    await client.query(
      `UPDATE proxy_bids SET is_winning = true, current_proxy_bid = $1 WHERE id = $2`,
      [newPrice, bids[0].id]
    );

    return { newPrice, isWinning: bids[0].bidder_id === newBidderId };
  }

  // Two or more bidders - compete
  const highestBid = bids[0];
  const secondHighest = bids[1];

  const increment = calculateIncrement(parseFloat(secondHighest.max_bid_amount));
  let newPrice;

  if (highestBid.max_bid_amount > secondHighest.max_bid_amount) {
    // Highest bidder wins, pays one increment above second highest
    newPrice = Math.min(
      parseFloat(secondHighest.max_bid_amount) + increment,
      parseFloat(highestBid.max_bid_amount)
    );
  } else {
    // Tie - first bidder wins at their max
    newPrice = parseFloat(highestBid.max_bid_amount);
  }

  // Update product price
  await client.query(
    `UPDATE products SET current_price = $1 WHERE id = $2`,
    [newPrice, productId]
  );

  // Create bid record
  await client.query(
    `INSERT INTO bids (product_id, bidder_id, amount, is_proxy_bid)
     VALUES ($1, $2, $3, true)`,
    [productId, highestBid.bidder_id, newPrice]
  );

  // Update proxy bid statuses
  await client.query(
    `UPDATE proxy_bids SET is_winning = false WHERE product_id = $1`,
    [productId]
  );

  await client.query(
    `UPDATE proxy_bids SET is_winning = true, current_proxy_bid = $1 WHERE id = $2`,
    [newPrice, highestBid.id]
  );

  return { newPrice, isWinning: highestBid.bidder_id === newBidderId };
};

// Get user's proxy bids
const getUserProxyBids = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT pb.*, p.title, p.current_price, p.auction_end,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM proxy_bids pb
       JOIN products p ON pb.product_id = p.id
       WHERE pb.bidder_id = $1 AND pb.is_active = true
       ORDER BY p.auction_end ASC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel proxy bid
const cancelProxyBid = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `UPDATE proxy_bids
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE product_id = $1 AND bidder_id = $2
       RETURNING *`,
      [productId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Proxy bid not found' });
    }

    res.json({ message: 'Proxy bid cancelled', proxyBid: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get current bid status for product
const getAuctionStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await pool.query(
      `SELECT id, title, current_price, starting_price, auction_end, status
       FROM products WHERE id = $1`,
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const auction = product.rows[0];
    const currentPrice = parseFloat(auction.current_price);
    const increment = calculateIncrement(currentPrice);

    // Get bid count
    const bidCount = await pool.query(
      `SELECT COUNT(*) as count FROM bids WHERE product_id = $1`,
      [productId]
    );

    // Check if user has a proxy bid
    let userProxyBid = null;
    if (req.user) {
      const proxy = await pool.query(
        `SELECT * FROM proxy_bids WHERE product_id = $1 AND bidder_id = $2 AND is_active = true`,
        [productId, req.user.id]
      );
      userProxyBid = proxy.rows[0] || null;
    }

    res.json({
      currentPrice,
      minimumBid: currentPrice + increment,
      bidIncrement: increment,
      bidCount: parseInt(bidCount.rows[0].count),
      auctionEnd: auction.auction_end,
      status: auction.status,
      userProxyBid: userProxyBid ? {
        maxBid: parseFloat(userProxyBid.max_bid_amount),
        isWinning: userProxyBid.is_winning
      } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getBidIncrements,
  placeProxyBid,
  getUserProxyBids,
  cancelProxyBid,
  getAuctionStatus
};
