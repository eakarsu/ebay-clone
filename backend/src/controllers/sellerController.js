const { pool } = require('../config/database');

// Get seller dashboard overview
const getDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user.id;

    // Get various stats in parallel
    const [salesStats, productStats, orderStats, recentOrders, topProducts] = await Promise.all([
      // Sales statistics
      pool.query(
        `SELECT
           COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '7 days' THEN o.total ELSE 0 END), 0) as week_sales,
           COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.total ELSE 0 END), 0) as month_sales,
           COALESCE(SUM(o.total), 0) as total_sales,
           COUNT(CASE WHEN o.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as week_orders,
           COUNT(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as month_orders,
           COUNT(*) as total_orders
         FROM orders o
         WHERE o.seller_id = $1 AND o.payment_status = 'completed'`,
        [sellerId]
      ),

      // Product statistics
      pool.query(
        `SELECT
           COUNT(*) as total_products,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
           COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products,
           COUNT(CASE WHEN listing_type = 'auction' AND status = 'active' THEN 1 END) as active_auctions
         FROM products WHERE seller_id = $1`,
        [sellerId]
      ),

      // Pending orders
      pool.query(
        `SELECT COUNT(*) as pending_orders
         FROM orders WHERE seller_id = $1 AND status IN ('pending', 'processing')`,
        [sellerId]
      ),

      // Recent orders
      pool.query(
        `SELECT o.id, o.order_number, o.total, o.status, o.created_at,
                u.username as buyer_name
         FROM orders o
         JOIN users u ON o.buyer_id = u.id
         WHERE o.seller_id = $1
         ORDER BY o.created_at DESC
         LIMIT 10`,
        [sellerId]
      ),

      // Top selling products
      pool.query(
        `SELECT p.id, p.title, p.current_price, COUNT(oi.id) as sales_count,
                SUM(oi.total_price) as revenue
         FROM products p
         JOIN order_items oi ON p.id = oi.product_id
         JOIN orders o ON oi.order_id = o.id
         WHERE p.seller_id = $1 AND o.payment_status = 'completed'
         GROUP BY p.id
         ORDER BY sales_count DESC
         LIMIT 5`,
        [sellerId]
      ),
    ]);

    const sales = salesStats.rows[0];
    const products = productStats.rows[0];
    const pending = orderStats.rows[0];

    res.json({
      overview: {
        sales: {
          week: parseFloat(sales.week_sales),
          month: parseFloat(sales.month_sales),
          total: parseFloat(sales.total_sales),
        },
        orders: {
          week: parseInt(sales.week_orders),
          month: parseInt(sales.month_orders),
          total: parseInt(sales.total_orders),
          pending: parseInt(pending.pending_orders),
        },
        products: {
          total: parseInt(products.total_products),
          active: parseInt(products.active_products),
          sold: parseInt(products.sold_products),
          activeAuctions: parseInt(products.active_auctions),
        },
      },
      recentOrders: recentOrders.rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        total: parseFloat(o.total),
        status: o.status,
        buyerName: o.buyer_name,
        createdAt: o.created_at,
      })),
      topProducts: topProducts.rows.map((p) => ({
        id: p.id,
        title: p.title,
        price: parseFloat(p.current_price || 0),
        salesCount: parseInt(p.sales_count),
        revenue: parseFloat(p.revenue),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get seller's orders
const getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, u.username as buyer_name, u.email as buyer_email
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      WHERE o.seller_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      // 'pending' filter includes both pending and processing orders
      if (status === 'pending') {
        query += ` AND o.status IN ('pending', 'processing')`;
      } else {
        params.push(status);
        query += ` AND o.status = $${params.length}`;
      }
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.order_number ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM orders WHERE seller_id = $1',
      [req.user.id]
    );

    res.json({
      orders: result.rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        buyerName: o.buyer_name,
        buyerEmail: o.buyer_email,
        total: parseFloat(o.total),
        status: o.status,
        paymentStatus: o.payment_status,
        trackingNumber: o.tracking_number,
        createdAt: o.created_at,
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

// Get seller's products
const getSellerProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, search, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name,
             (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image_url,
             (SELECT COUNT(*) FROM bids WHERE product_id = p.id) as bid_count
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    if (type) {
      params.push(type);
      query += ` AND p.listing_type = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND p.category_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND p.title ILIKE $${params.length}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM products WHERE seller_id = $1',
      [req.user.id]
    );

    res.json({
      products: result.rows.map((p) => ({
        id: p.id,
        title: p.title,
        price: parseFloat(p.current_price || p.buy_now_price || 0),
        currentBid: p.current_price ? parseFloat(p.current_price) : null,
        bidCount: parseInt(p.bid_count),
        status: p.status,
        listingType: p.listing_type,
        condition: p.condition,
        quantity: p.quantity,
        categoryName: p.category_name,
        imageUrl: p.image_url,
        auctionEndTime: p.auction_end,
        createdAt: p.created_at,
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

// Get sales analytics
const getSalesAnalytics = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // Daily sales for the period
    const dailySales = await pool.query(
      `SELECT DATE(o.created_at) as date,
              COUNT(*) as orders,
              COALESCE(SUM(o.total), 0) as revenue
       FROM orders o
       WHERE o.seller_id = $1
         AND o.payment_status = 'completed'
         AND o.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(o.created_at)
       ORDER BY date`,
      [req.user.id]
    );

    // Category breakdown
    const categoryBreakdown = await pool.query(
      `SELECT c.name as category,
              COUNT(oi.id) as sales,
              COALESCE(SUM(oi.total_price), 0) as revenue
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.seller_id = $1
         AND o.payment_status = 'completed'
         AND o.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY c.id, c.name
       ORDER BY revenue DESC`,
      [req.user.id]
    );

    // Buyer locations (if shipping address available)
    const buyerLocations = await pool.query(
      `SELECT o.shipping_state as state, COUNT(*) as orders
       FROM orders o
       WHERE o.seller_id = $1
         AND o.payment_status = 'completed'
         AND o.shipping_state IS NOT NULL
         AND o.created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY o.shipping_state
       ORDER BY orders DESC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      dailySales: dailySales.rows.map((d) => ({
        date: d.date,
        orders: parseInt(d.orders),
        revenue: parseFloat(d.revenue),
      })),
      categoryBreakdown: categoryBreakdown.rows.map((c) => ({
        category: c.category,
        sales: parseInt(c.sales),
        revenue: parseFloat(c.revenue),
      })),
      buyerLocations: buyerLocations.rows.map((l) => ({
        state: l.state,
        orders: parseInt(l.orders),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Update order status (seller)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, shippingCarrier } = req.body;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND seller_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (trackingNumber) {
      params.push(trackingNumber);
      updateFields.push(`tracking_number = $${params.length}`);
    }

    if (shippingCarrier) {
      params.push(shippingCarrier);
      updateFields.push(`shipping_carrier = $${params.length}`);
    }

    params.push(orderId);

    const result = await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params
    );

    res.json({
      success: true,
      order: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        trackingNumber: result.rows[0].tracking_number,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get seller reviews
const getSellerReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT r.*, p.title as product_title, u.username as reviewer_name
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       JOIN users u ON r.user_id = u.id
       WHERE p.seller_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const statsResult = await pool.query(
      `SELECT COUNT(*) as total,
              AVG(r.rating) as avg_rating,
              COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star,
              COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star,
              COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star,
              COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star,
              COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star
       FROM reviews r
       JOIN products p ON r.product_id = p.id
       WHERE p.seller_id = $1`,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      reviews: result.rows.map((r) => ({
        id: r.id,
        productId: r.product_id,
        productTitle: r.product_title,
        reviewerName: r.reviewer_name,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        createdAt: r.created_at,
      })),
      stats: {
        total: parseInt(stats.total),
        averageRating: stats.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) : 0,
        breakdown: {
          5: parseInt(stats.five_star),
          4: parseInt(stats.four_star),
          3: parseInt(stats.three_star),
          2: parseInt(stats.two_star),
          1: parseInt(stats.one_star),
        },
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(stats.total),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory alerts (low stock, ending auctions)
const getInventoryAlerts = async (req, res, next) => {
  try {
    // Low stock products
    const lowStock = await pool.query(
      `SELECT id, title, quantity
       FROM products
       WHERE seller_id = $1 AND status = 'active' AND quantity > 0 AND quantity <= 5
       ORDER BY quantity ASC`,
      [req.user.id]
    );

    // Auctions ending soon (within 24 hours)
    const endingAuctions = await pool.query(
      `SELECT id, title, current_bid, auction_end_time
       FROM products
       WHERE seller_id = $1
         AND listing_type = 'auction'
         AND status = 'active'
         AND auction_end_time <= NOW() + INTERVAL '24 hours'
         AND auction_end_time > NOW()
       ORDER BY auction_end_time ASC`,
      [req.user.id]
    );

    // Out of stock
    const outOfStock = await pool.query(
      `SELECT id, title
       FROM products
       WHERE seller_id = $1 AND status = 'active' AND quantity = 0`,
      [req.user.id]
    );

    res.json({
      lowStock: lowStock.rows,
      endingAuctions: endingAuctions.rows.map((a) => ({
        ...a,
        current_bid: a.current_bid ? parseFloat(a.current_bid) : null,
      })),
      outOfStock: outOfStock.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getSellerOrders,
  getSellerProducts,
  getSalesAnalytics,
  updateOrderStatus,
  getSellerReviews,
  getInventoryAlerts,
};
