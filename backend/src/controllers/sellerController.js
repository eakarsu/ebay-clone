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

// End listing early
const endListing = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Verify product belongs to seller and is active
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
      [productId, req.user.id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    if (product.status !== 'active') {
      return res.status(400).json({ error: 'Can only end active listings' });
    }

    // Update product status to ended
    await pool.query(
      `UPDATE products
       SET status = 'ended',
           auction_end = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [productId]
    );

    res.json({ success: true, message: 'Listing ended successfully' });
  } catch (error) {
    next(error);
  }
};

// Relist a product (create a copy)
const relistProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Get the original product
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
      [productId, req.user.id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const original = productResult.rows[0];

    // Create a new product based on the original
    const newProductResult = await pool.query(
      `INSERT INTO products (
        seller_id, category_id, subcategory_id, title, description, condition, condition_description,
        listing_type, starting_price, buy_now_price, reserve_price, auction_duration,
        quantity, shipping_cost, free_shipping, shipping_from_city, shipping_from_state, shipping_from_zip,
        estimated_delivery_days, brand, model, sku, weight, dimensions, color, size, material, upc,
        handling_time, shipping_service, package_weight, package_weight_unit, package_length, package_width, package_height, dimension_unit,
        allows_local_pickup, accepts_offers, minimum_offer_amount,
        accepts_returns, return_period, return_shipping_paid_by, free_returns,
        status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39,
        $40, $41, $42, $43, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING id`,
      [
        req.user.id, original.category_id, original.subcategory_id, original.title, original.description,
        original.condition, original.condition_description, original.listing_type, original.starting_price,
        original.buy_now_price, original.reserve_price, original.auction_duration, original.quantity,
        original.shipping_cost, original.free_shipping, original.shipping_from_city, original.shipping_from_state,
        original.shipping_from_zip, original.estimated_delivery_days, original.brand, original.model,
        original.sku, original.weight, original.dimensions, original.color, original.size, original.material,
        original.upc, original.handling_time, original.shipping_service, original.package_weight,
        original.package_weight_unit, original.package_length, original.package_width, original.package_height,
        original.dimension_unit, original.allows_local_pickup, original.accepts_offers, original.minimum_offer_amount,
        original.accepts_returns, original.return_period, original.return_shipping_paid_by, original.free_returns
      ]
    );

    const newProductId = newProductResult.rows[0].id;

    // Copy product images
    await pool.query(
      `INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, display_order, created_at)
       SELECT $1, image_url, thumbnail_url, is_primary, display_order, CURRENT_TIMESTAMP
       FROM product_images WHERE product_id = $2`,
      [newProductId, productId]
    );

    res.json({
      success: true,
      message: 'Product relisted as draft',
      newProductId
    });
  } catch (error) {
    next(error);
  }
};

// Delete a product
const deleteProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Verify product belongs to seller
    const productResult = await pool.query(
      'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
      [productId, req.user.id]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = productResult.rows[0];

    // Don't allow deleting products with active orders
    const ordersResult = await pool.query(
      `SELECT COUNT(*) as count FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = $1 AND o.status NOT IN ('completed', 'cancelled')`,
      [productId]
    );

    if (parseInt(ordersResult.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete product with pending orders' });
    }

    // Delete related records first
    await pool.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
    await pool.query('DELETE FROM watchlist WHERE product_id = $1', [productId]);
    await pool.query('DELETE FROM bids WHERE product_id = $1', [productId]);

    // Delete the product
    await pool.query('DELETE FROM products WHERE id = $1', [productId]);

    res.json({ success: true, message: 'Listing deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get bulk upload CSV template
const getBulkUploadTemplate = async (req, res, next) => {
  try {
    // Get categories for reference
    const categoriesResult = await pool.query('SELECT id, name FROM categories ORDER BY name');
    const categories = categoriesResult.rows;

    // CSV header row with all product fields including advanced eBay features
    const headers = [
      'title',
      'description',
      'category_id',
      'listing_type',
      'condition',
      'condition_description',
      'buy_now_price',
      'starting_price',
      'reserve_price',
      'quantity',
      'auction_duration_days',
      'brand',
      'model',
      'color',
      'size',
      'material',
      'weight_lb',
      'length_in',
      'width_in',
      'height_in',
      'upc',
      'sku',
      'item_location_zip',
      'shipping_service',
      'shipping_cost',
      'free_shipping',
      'handling_time_days',
      'package_weight_lb',
      'package_length_in',
      'package_width_in',
      'package_height_in',
      'accepts_returns',
      'return_period_days',
      'return_shipping_paid_by',
      'allows_local_pickup',
      'image_urls',
      'status',
      // Advanced eBay Features
      'accepts_best_offer',
      'auto_accept_price',
      'auto_decline_price',
      'gsp_enabled',
      'ships_internationally',
      'international_shipping_cost',
      'promoted_listing',
      'promotion_rate',
      'authenticity_guarantee',
      // Motors-specific fields
      'vehicle_type',
      'vin',
      'mileage',
      'year',
      'vehicle_make',
      'vehicle_model_name'
    ];

    // Example row with sample data (includes advanced features)
    const exampleRow = [
      'Sample Product Title',
      'This is a detailed product description with all the features and benefits.',
      categories[0]?.id || '1',
      'buy_now',
      'new',
      'Brand new in original packaging',
      '99.99',
      '',
      '',
      '10',
      '',
      'BrandName',
      'ModelXYZ',
      'Black',
      'Medium',
      'Cotton',
      '2.5',
      '12',
      '8',
      '4',
      '012345678901',
      'SKU-12345',
      '10001',
      'USPS Priority Mail',
      '5.99',
      'false',
      '1',
      '3',
      '14',
      '10',
      '6',
      'true',
      '30',
      'buyer',
      'false',
      'https://example.com/image1.jpg|https://example.com/image2.jpg',
      'active',
      // Advanced features
      'true',   // accepts_best_offer
      '85.00',  // auto_accept_price
      '50.00',  // auto_decline_price
      'true',   // gsp_enabled
      'true',   // ships_internationally
      '25.99',  // international_shipping_cost
      'true',   // promoted_listing
      '5',      // promotion_rate (%)
      'false',  // authenticity_guarantee
      // Motors fields (empty for non-vehicle)
      '', '', '', '', '', ''
    ];

    // Second example row for auction listing
    const auctionExampleRow = [
      'Vintage Item For Auction',
      'Rare vintage item in great condition. Perfect for collectors.',
      categories[1]?.id || '2',
      'auction',
      'used_good',
      'Minor wear consistent with age',
      '150.00',
      '50.00',
      '100.00',
      '1',
      '7',
      'VintageBrand',
      'ClassicModel',
      'Brown',
      'Large',
      'Leather',
      '1.5',
      '10',
      '6',
      '3',
      '',
      'VTG-001',
      '90210',
      'FedEx Ground',
      '12.99',
      'false',
      '2',
      '2',
      '12',
      '8',
      '5',
      'false',
      '',
      '',
      'true',
      'https://example.com/vintage1.jpg',
      'active',
      // Advanced features
      'false',  // accepts_best_offer
      '',       // auto_accept_price
      '',       // auto_decline_price
      'false',  // gsp_enabled
      'false',  // ships_internationally
      '',       // international_shipping_cost
      'false',  // promoted_listing
      '',       // promotion_rate
      'true',   // authenticity_guarantee (for luxury/collectibles)
      // Motors fields (empty for non-vehicle)
      '', '', '', '', '', ''
    ];

    // Third example row for Motors/Vehicle listing
    const vehicleExampleRow = [
      '2019 Honda Civic EX - Low Miles, Clean Title',
      'Excellent condition 2019 Honda Civic EX. One owner, all maintenance records available. Clean Carfax, no accidents. Non-smoker vehicle.',
      categories[2]?.id || '3',
      'buy_now',
      'used_good',
      'Normal wear, no mechanical issues',
      '22500.00',
      '',
      '',
      '1',
      '',
      'Honda',
      'Civic EX',
      'Blue',
      'Sedan',
      '',
      '2900',
      '182',
      '70',
      '55',
      '',
      'VEH-CIV-2019',
      '85001',
      'Local Pickup Only',
      '0',
      'true',
      '3',
      '',
      '',
      '',
      '',
      'false',
      '',
      '',
      'true',
      'https://example.com/car1.jpg|https://example.com/car2.jpg',
      'active',
      // Advanced features
      'true',       // accepts_best_offer
      '21000.00',   // auto_accept_price
      '18000.00',   // auto_decline_price
      'false',      // gsp_enabled
      'false',      // ships_internationally
      '',           // international_shipping_cost
      'true',       // promoted_listing
      '3',          // promotion_rate
      'false',      // authenticity_guarantee
      // Motors fields
      'car',        // vehicle_type (car, motorcycle, boat, rv, atv, etc)
      '2HGFC2F59KH123456', // vin
      '45230',      // mileage
      '2019',       // year
      'Honda',      // vehicle_make
      'Civic EX'    // vehicle_model_name
    ];

    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    csvContent += exampleRow.map(val => `"${val}"`).join(',') + '\n';
    csvContent += auctionExampleRow.map(val => `"${val}"`).join(',') + '\n';
    csvContent += vehicleExampleRow.map(val => `"${val}"`).join(',') + '\n';

    // Add instructions as comments
    const instructions = `
# BULK UPLOAD TEMPLATE INSTRUCTIONS
# ---------------------------------
# Remove these instruction lines before uploading
#
# REQUIRED FIELDS: title, description, category_id, listing_type, condition, quantity, status
#
# FIELD DESCRIPTIONS:
# - title: Product title (max 80 chars)
# - description: Full product description (HTML allowed)
# - category_id: Category ID from database (see categories list below)
# - listing_type: buy_now, auction, or both
# - condition: new, used_like_new, used_good, used_acceptable, refurbished, parts_only
# - condition_description: Additional details about item condition
# - buy_now_price: Fixed/Buy It Now price (required for buy_now and both)
# - starting_price: Auction starting price (required for auction and both)
# - reserve_price: Minimum price for auction (optional)
# - quantity: Number of items available
# - auction_duration_days: 1, 3, 5, 7, or 10 days (for auctions)
# - brand, model, color, size, material: Item specifics
# - weight_lb: Item weight in pounds
# - length_in, width_in, height_in: Item dimensions in inches
# - upc: Universal Product Code (12 digits)
# - sku: Your internal SKU
# - item_location_zip: ZIP code where item is located
# - shipping_service: e.g., USPS Priority Mail, FedEx Ground, UPS Ground
# - shipping_cost: Shipping price (0 for free shipping)
# - free_shipping: true or false
# - handling_time_days: Days to ship after payment (1, 2, 3, etc.)
# - package_weight_lb, package_length_in, package_width_in, package_height_in: Package dimensions
# - accepts_returns: true or false
# - return_period_days: 14, 30, 60 (if returns accepted)
# - return_shipping_paid_by: buyer or seller (if returns accepted)
# - allows_local_pickup: true or false
# - image_urls: Pipe-separated URLs (url1|url2|url3)
# - status: active, draft, or ended
#
# AVAILABLE CATEGORIES:
`;

    // Add categories list
    let categoriesList = categories.map(c => `# ${c.id}: ${c.name}`).join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bulk_upload_template.csv');

    // Send CSV with instructions
    res.send(instructions + categoriesList + '\n#\n' + csvContent);
  } catch (error) {
    next(error);
  }
};

// Process bulk upload
const bulkUpload = async (req, res, next) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'No products provided' });
    }

    if (products.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 products per upload' });
    }

    const results = {
      success: [],
      failed: []
    };

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!product.title || !product.description || !product.category_id || !product.listing_type || !product.condition) {
          throw new Error('Missing required fields: title, description, category_id, listing_type, condition');
        }

        // Validate listing type
        if (!['buy_now', 'auction', 'both'].includes(product.listing_type)) {
          throw new Error('Invalid listing_type. Must be: buy_now, auction, or both');
        }

        // Validate prices based on listing type
        if ((product.listing_type === 'buy_now' || product.listing_type === 'both') && !product.buy_now_price) {
          throw new Error('buy_now_price required for buy_now or both listing types');
        }
        if ((product.listing_type === 'auction' || product.listing_type === 'both') && !product.starting_price) {
          throw new Error('starting_price required for auction or both listing types');
        }

        // Calculate auction end date if auction
        let auctionEnd = null;
        if (product.listing_type === 'auction' || product.listing_type === 'both') {
          const days = parseInt(product.auction_duration_days) || 7;
          auctionEnd = new Date();
          auctionEnd.setDate(auctionEnd.getDate() + days);
        }

        // Insert product
        const insertQuery = `
          INSERT INTO products (
            seller_id, title, description, category_id, listing_type, condition,
            condition_description, buy_now_price, starting_price, current_price,
            reserve_price, quantity, auction_end, brand, model, color, size,
            material, weight, length, width, height, upc, sku, item_location_zip,
            shipping_service, shipping_cost, free_shipping, handling_time,
            package_weight, package_length, package_width, package_height,
            accepts_returns, return_period, return_shipping_paid_by,
            allows_local_pickup, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
            $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
            $29, $30, $31, $32, $33, $34, $35, $36, $37, $38
          ) RETURNING id
        `;

        const values = [
          req.user.id,
          product.title,
          product.description,
          product.category_id,
          product.listing_type,
          product.condition,
          product.condition_description || null,
          product.buy_now_price ? parseFloat(product.buy_now_price) : null,
          product.starting_price ? parseFloat(product.starting_price) : null,
          product.starting_price ? parseFloat(product.starting_price) : null,
          product.reserve_price ? parseFloat(product.reserve_price) : null,
          parseInt(product.quantity) || 1,
          auctionEnd,
          product.brand || null,
          product.model || null,
          product.color || null,
          product.size || null,
          product.material || null,
          product.weight_lb ? parseFloat(product.weight_lb) : null,
          product.length_in ? parseFloat(product.length_in) : null,
          product.width_in ? parseFloat(product.width_in) : null,
          product.height_in ? parseFloat(product.height_in) : null,
          product.upc || null,
          product.sku || null,
          product.item_location_zip || null,
          product.shipping_service || null,
          product.shipping_cost ? parseFloat(product.shipping_cost) : null,
          product.free_shipping === 'true' || product.free_shipping === true,
          product.handling_time_days ? parseInt(product.handling_time_days) : null,
          product.package_weight_lb ? parseFloat(product.package_weight_lb) : null,
          product.package_length_in ? parseFloat(product.package_length_in) : null,
          product.package_width_in ? parseFloat(product.package_width_in) : null,
          product.package_height_in ? parseFloat(product.package_height_in) : null,
          product.accepts_returns === 'true' || product.accepts_returns === true,
          product.return_period_days ? parseInt(product.return_period_days) : null,
          product.return_shipping_paid_by || null,
          product.allows_local_pickup === 'true' || product.allows_local_pickup === true,
          product.status || 'draft'
        ];

        const result = await pool.query(insertQuery, values);
        const productId = result.rows[0].id;

        // Handle image URLs if provided
        if (product.image_urls) {
          const imageUrls = product.image_urls.split('|').filter(url => url.trim());
          for (let j = 0; j < imageUrls.length; j++) {
            await pool.query(
              'INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES ($1, $2, $3, $4)',
              [productId, imageUrls[j].trim(), j === 0, j]
            );
          }
        }

        results.success.push({
          row: rowNumber,
          title: product.title,
          productId
        });
      } catch (error) {
        results.failed.push({
          row: rowNumber,
          title: product.title || 'Unknown',
          error: error.message
        });
      }
    }

    res.json({
      message: `Processed ${products.length} products`,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results
    });
  } catch (error) {
    next(error);
  }
};

// Generate comprehensive sample data CSV with 300 products and real images
const generateSampleData = async (req, res, next) => {
  try {
    // Get all categories
    const categoriesResult = await pool.query('SELECT id, name FROM categories ORDER BY name');
    const categories = categoriesResult.rows;

    // CSV headers - including ALL advanced eBay features
    const headers = [
      'title', 'description', 'category_id', 'listing_type', 'condition',
      'condition_description', 'buy_now_price', 'starting_price', 'reserve_price',
      'quantity', 'auction_duration_days', 'brand', 'model', 'color', 'size',
      'material', 'weight_lb', 'length_in', 'width_in', 'height_in', 'upc', 'sku',
      'item_location_zip', 'shipping_service', 'shipping_cost', 'free_shipping',
      'handling_time_days', 'package_weight_lb', 'package_length_in', 'package_width_in',
      'package_height_in', 'accepts_returns', 'return_period_days', 'return_shipping_paid_by',
      'allows_local_pickup', 'image_urls', 'status',
      // Advanced eBay Features
      'accepts_best_offer', 'auto_accept_price', 'auto_decline_price',
      'gsp_enabled', 'ships_internationally', 'international_shipping_cost',
      'promoted_listing', 'promotion_rate', 'authenticity_guarantee',
      // Motors-specific fields
      'vehicle_type', 'vin', 'mileage', 'year', 'vehicle_make', 'vehicle_model_name'
    ];

    // Product categories with image keywords and sample products
    const productData = {
      electronics: {
        imageKeywords: ['smartphone', 'laptop', 'headphones', 'tablet', 'camera', 'smartwatch', 'gaming-console', 'speaker', 'drone', 'tv'],
        products: [
          { title: 'Apple iPhone 15 Pro Max 256GB', brand: 'Apple', model: 'iPhone 15 Pro Max', price: 1199, condition: 'new' },
          { title: 'Samsung Galaxy S24 Ultra 512GB', brand: 'Samsung', model: 'Galaxy S24 Ultra', price: 1299, condition: 'new' },
          { title: 'Google Pixel 8 Pro 128GB', brand: 'Google', model: 'Pixel 8 Pro', price: 999, condition: 'new' },
          { title: 'Sony PlayStation 5 Console', brand: 'Sony', model: 'PlayStation 5', price: 499, condition: 'new' },
          { title: 'Microsoft Xbox Series X', brand: 'Microsoft', model: 'Xbox Series X', price: 499, condition: 'new' },
          { title: 'Nintendo Switch OLED Model', brand: 'Nintendo', model: 'Switch OLED', price: 349, condition: 'new' },
          { title: 'Apple MacBook Pro 16" M3 Max', brand: 'Apple', model: 'MacBook Pro 16', price: 3499, condition: 'new' },
          { title: 'Dell XPS 15 Laptop i7 32GB', brand: 'Dell', model: 'XPS 15', price: 1799, condition: 'refurbished' },
          { title: 'HP Spectre x360 14" 2-in-1', brand: 'HP', model: 'Spectre x360', price: 1499, condition: 'new' },
          { title: 'Lenovo ThinkPad X1 Carbon Gen 11', brand: 'Lenovo', model: 'ThinkPad X1', price: 1899, condition: 'new' },
          { title: 'ASUS ROG Zephyrus G16 Gaming Laptop', brand: 'ASUS', model: 'ROG Zephyrus G16', price: 2299, condition: 'new' },
          { title: 'Apple iPad Pro 12.9" M2 256GB', brand: 'Apple', model: 'iPad Pro 12.9', price: 1099, condition: 'new' },
          { title: 'Samsung Galaxy Tab S9 Ultra', brand: 'Samsung', model: 'Tab S9 Ultra', price: 1199, condition: 'new' },
          { title: 'Apple Watch Ultra 2', brand: 'Apple', model: 'Watch Ultra 2', price: 799, condition: 'new' },
          { title: 'Samsung Galaxy Watch 6 Classic', brand: 'Samsung', model: 'Watch 6 Classic', price: 399, condition: 'new' },
          { title: 'Sony WH-1000XM5 Headphones', brand: 'Sony', model: 'WH-1000XM5', price: 349, condition: 'new' },
          { title: 'Apple AirPods Pro 2nd Gen', brand: 'Apple', model: 'AirPods Pro 2', price: 249, condition: 'new' },
          { title: 'Bose QuietComfort Ultra', brand: 'Bose', model: 'QC Ultra', price: 429, condition: 'new' },
          { title: 'Canon EOS R5 Mirrorless Camera', brand: 'Canon', model: 'EOS R5', price: 3899, condition: 'new' },
          { title: 'Sony A7 IV Full Frame Camera', brand: 'Sony', model: 'A7 IV', price: 2498, condition: 'new' },
          { title: 'DJI Mavic 3 Pro Drone', brand: 'DJI', model: 'Mavic 3 Pro', price: 2199, condition: 'new' },
          { title: 'GoPro Hero 12 Black', brand: 'GoPro', model: 'Hero 12', price: 399, condition: 'new' },
          { title: 'LG C3 65" OLED 4K Smart TV', brand: 'LG', model: 'C3 OLED 65', price: 1796, condition: 'new' },
          { title: 'Samsung 75" Neo QLED 8K TV', brand: 'Samsung', model: 'Neo QLED 8K', price: 3299, condition: 'new' },
          { title: 'Sonos Arc Premium Soundbar', brand: 'Sonos', model: 'Arc', price: 899, condition: 'new' },
        ]
      },
      clothing: {
        imageKeywords: ['jacket', 'dress', 'sneakers', 'jeans', 'sweater', 'coat', 'shirt', 'handbag', 'boots', 'watch'],
        products: [
          { title: 'Nike Air Jordan 1 Retro High OG', brand: 'Nike', model: 'Air Jordan 1', price: 180, condition: 'new', authenticity: true },
          { title: 'Adidas Yeezy Boost 350 V2', brand: 'Adidas', model: 'Yeezy 350 V2', price: 230, condition: 'new', authenticity: true },
          { title: 'New Balance 550 White Green', brand: 'New Balance', model: '550', price: 130, condition: 'new' },
          { title: 'Nike Dunk Low Panda', brand: 'Nike', model: 'Dunk Low', price: 115, condition: 'new' },
          { title: 'Converse Chuck Taylor All Star', brand: 'Converse', model: 'Chuck Taylor', price: 65, condition: 'new' },
          { title: 'Louis Vuitton Neverfull MM Tote', brand: 'Louis Vuitton', model: 'Neverfull MM', price: 2030, condition: 'used_like_new', authenticity: true },
          { title: 'Gucci GG Marmont Shoulder Bag', brand: 'Gucci', model: 'GG Marmont', price: 2450, condition: 'new', authenticity: true },
          { title: 'Chanel Classic Flap Medium', brand: 'Chanel', model: 'Classic Flap', price: 8800, condition: 'used_good', authenticity: true },
          { title: 'Hermes Birkin 25 Togo Leather', brand: 'Hermes', model: 'Birkin 25', price: 12500, condition: 'used_like_new', authenticity: true },
          { title: 'Prada Re-Nylon Backpack', brand: 'Prada', model: 'Re-Nylon', price: 1490, condition: 'new', authenticity: true },
          { title: 'Canada Goose Expedition Parka', brand: 'Canada Goose', model: 'Expedition', price: 1595, condition: 'new' },
          { title: 'The North Face Nuptse Jacket', brand: 'The North Face', model: 'Nuptse', price: 330, condition: 'new' },
          { title: 'Patagonia Better Sweater Fleece', brand: 'Patagonia', model: 'Better Sweater', price: 139, condition: 'new' },
          { title: 'Moncler Maya Down Jacket', brand: 'Moncler', model: 'Maya', price: 1695, condition: 'new', authenticity: true },
          { title: 'Arc\'teryx Beta AR Jacket', brand: 'Arc\'teryx', model: 'Beta AR', price: 599, condition: 'new' },
          { title: 'Supreme Box Logo Hoodie', brand: 'Supreme', model: 'Box Logo', price: 650, condition: 'new', authenticity: true },
          { title: 'Off-White Arrow Hoodie', brand: 'Off-White', model: 'Arrow', price: 545, condition: 'new' },
          { title: 'Balenciaga Track Sneakers', brand: 'Balenciaga', model: 'Track', price: 995, condition: 'new', authenticity: true },
          { title: 'Rolex Submariner Date 41mm', brand: 'Rolex', model: 'Submariner', price: 14500, condition: 'used_good', authenticity: true },
          { title: 'Omega Seamaster Diver 300M', brand: 'Omega', model: 'Seamaster', price: 5500, condition: 'new', authenticity: true },
          { title: 'Tag Heuer Carrera Chronograph', brand: 'Tag Heuer', model: 'Carrera', price: 4950, condition: 'new', authenticity: true },
          { title: 'Cartier Tank Francaise Watch', brand: 'Cartier', model: 'Tank', price: 7200, condition: 'used_like_new', authenticity: true },
          { title: 'Levis 501 Original Fit Jeans', brand: 'Levis', model: '501', price: 69, condition: 'new' },
          { title: 'Ralph Lauren Polo Shirt Classic', brand: 'Ralph Lauren', model: 'Polo', price: 98, condition: 'new' },
          { title: 'Burberry Trench Coat Classic', brand: 'Burberry', model: 'Trench', price: 2290, condition: 'used_like_new', authenticity: true },
        ]
      },
      home: {
        imageKeywords: ['furniture', 'sofa', 'lamp', 'kitchen', 'bedding', 'rug', 'chair', 'table', 'decor', 'appliance'],
        products: [
          { title: 'KitchenAid Artisan Stand Mixer 5Qt', brand: 'KitchenAid', model: 'Artisan', price: 379, condition: 'new' },
          { title: 'Dyson V15 Detect Vacuum', brand: 'Dyson', model: 'V15 Detect', price: 749, condition: 'new' },
          { title: 'iRobot Roomba j7+ Robot Vacuum', brand: 'iRobot', model: 'Roomba j7+', price: 799, condition: 'new' },
          { title: 'Vitamix A3500 Blender', brand: 'Vitamix', model: 'A3500', price: 649, condition: 'new' },
          { title: 'Breville Oracle Touch Espresso', brand: 'Breville', model: 'Oracle Touch', price: 2499, condition: 'new' },
          { title: 'Le Creuset Dutch Oven 5.5Qt', brand: 'Le Creuset', model: 'Dutch Oven', price: 395, condition: 'new' },
          { title: 'All-Clad D5 Cookware Set 10pc', brand: 'All-Clad', model: 'D5', price: 899, condition: 'new' },
          { title: 'Staub Cast Iron Cocotte 4Qt', brand: 'Staub', model: 'Cocotte', price: 299, condition: 'new' },
          { title: 'Instant Pot Duo Plus 8Qt', brand: 'Instant Pot', model: 'Duo Plus', price: 119, condition: 'new' },
          { title: 'Ninja Foodi 14-in-1 Cooker', brand: 'Ninja', model: 'Foodi', price: 179, condition: 'new' },
          { title: 'Herman Miller Aeron Chair', brand: 'Herman Miller', model: 'Aeron', price: 1395, condition: 'new' },
          { title: 'Steelcase Leap V2 Office Chair', brand: 'Steelcase', model: 'Leap V2', price: 1099, condition: 'refurbished' },
          { title: 'West Elm Mid-Century Sofa 80"', brand: 'West Elm', model: 'Mid-Century', price: 1599, condition: 'new' },
          { title: 'CB2 Avec Sectional Sofa', brand: 'CB2', model: 'Avec', price: 2799, condition: 'new' },
          { title: 'Restoration Hardware Cloud Sofa', brand: 'RH', model: 'Cloud', price: 4995, condition: 'used_like_new' },
          { title: 'Casper Original Mattress Queen', brand: 'Casper', model: 'Original', price: 1095, condition: 'new' },
          { title: 'Purple Hybrid Premier Mattress', brand: 'Purple', model: 'Hybrid Premier', price: 2599, condition: 'new' },
          { title: 'Tempur-Pedic ProAdapt King', brand: 'Tempur-Pedic', model: 'ProAdapt', price: 3699, condition: 'new' },
          { title: 'Pottery Barn Lorraine Dining Table', brand: 'Pottery Barn', model: 'Lorraine', price: 1499, condition: 'new' },
          { title: 'Article Sven Leather Sofa', brand: 'Article', model: 'Sven', price: 1799, condition: 'new' },
          { title: 'IKEA Billy Bookcase White', brand: 'IKEA', model: 'Billy', price: 79, condition: 'new' },
          { title: 'Philips Hue Starter Kit 4 Bulbs', brand: 'Philips', model: 'Hue', price: 199, condition: 'new' },
          { title: 'Dyson Pure Cool Air Purifier', brand: 'Dyson', model: 'Pure Cool', price: 549, condition: 'new' },
          { title: 'Nespresso Vertuo Next Coffee', brand: 'Nespresso', model: 'Vertuo Next', price: 179, condition: 'new' },
          { title: 'Crate & Barrel Axis II Sectional', brand: 'Crate & Barrel', model: 'Axis II', price: 3199, condition: 'new' },
        ]
      },
      sports: {
        imageKeywords: ['golf', 'tennis', 'bicycle', 'fitness', 'running', 'yoga', 'basketball', 'football', 'skiing', 'surfing'],
        products: [
          { title: 'Callaway Paradym X Driver 10.5', brand: 'Callaway', model: 'Paradym X', price: 549, condition: 'new' },
          { title: 'TaylorMade Stealth 2 Driver', brand: 'TaylorMade', model: 'Stealth 2', price: 579, condition: 'new' },
          { title: 'Titleist Pro V1 Golf Balls 12pk', brand: 'Titleist', model: 'Pro V1', price: 54, condition: 'new' },
          { title: 'Ping G430 Max Iron Set', brand: 'Ping', model: 'G430 Max', price: 1149, condition: 'new' },
          { title: 'Scotty Cameron Special Select', brand: 'Titleist', model: 'Scotty Cameron', price: 429, condition: 'new' },
          { title: 'Wilson Pro Staff RF97 Tennis', brand: 'Wilson', model: 'Pro Staff', price: 269, condition: 'new' },
          { title: 'Babolat Pure Aero Tennis Racket', brand: 'Babolat', model: 'Pure Aero', price: 229, condition: 'new' },
          { title: 'Head Graphene 360+ Speed Pro', brand: 'Head', model: 'Speed Pro', price: 249, condition: 'new' },
          { title: 'Trek Domane SL 6 Road Bike', brand: 'Trek', model: 'Domane SL 6', price: 4499, condition: 'new' },
          { title: 'Specialized Tarmac SL7 Expert', brand: 'Specialized', model: 'Tarmac SL7', price: 5500, condition: 'new' },
          { title: 'Cannondale SuperSix EVO Hi-MOD', brand: 'Cannondale', model: 'SuperSix EVO', price: 6500, condition: 'used_like_new' },
          { title: 'Peloton Bike+ Indoor Cycling', brand: 'Peloton', model: 'Bike+', price: 2495, condition: 'new' },
          { title: 'NordicTrack Commercial 2950', brand: 'NordicTrack', model: '2950', price: 2799, condition: 'new' },
          { title: 'Bowflex SelectTech 552 Dumbbells', brand: 'Bowflex', model: 'SelectTech 552', price: 429, condition: 'new' },
          { title: 'Rogue Echo Bike Air Resistance', brand: 'Rogue', model: 'Echo Bike', price: 795, condition: 'new' },
          { title: 'Theragun Pro Massage Gun', brand: 'Therabody', model: 'Theragun Pro', price: 599, condition: 'new' },
          { title: 'Lululemon Yoga Mat 5mm', brand: 'Lululemon', model: 'The Mat', price: 98, condition: 'new' },
          { title: 'Manduka PRO Yoga Mat 6mm', brand: 'Manduka', model: 'PRO', price: 120, condition: 'new' },
          { title: 'Nike React Infinity Run 4', brand: 'Nike', model: 'React Infinity', price: 160, condition: 'new' },
          { title: 'ASICS Gel-Kayano 30 Running', brand: 'ASICS', model: 'Gel-Kayano 30', price: 160, condition: 'new' },
          { title: 'Brooks Ghost 15 Running Shoes', brand: 'Brooks', model: 'Ghost 15', price: 140, condition: 'new' },
          { title: 'Garmin Forerunner 965 GPS Watch', brand: 'Garmin', model: 'Forerunner 965', price: 599, condition: 'new' },
          { title: 'Whoop 4.0 Fitness Tracker', brand: 'Whoop', model: '4.0', price: 239, condition: 'new' },
          { title: 'Spalding NBA Official Basketball', brand: 'Spalding', model: 'NBA Official', price: 169, condition: 'new' },
          { title: 'Wilson NFL Official Football', brand: 'Wilson', model: 'NFL Official', price: 129, condition: 'new' },
        ]
      },
      collectibles: {
        imageKeywords: ['coins', 'stamps', 'cards', 'antique', 'vintage', 'art', 'memorabilia', 'figurine', 'comic', 'vinyl'],
        products: [
          { title: 'Pokemon Charizard VMAX Rainbow', brand: 'Pokemon', model: 'Charizard VMAX', price: 350, condition: 'new', authenticity: true },
          { title: 'Magic The Gathering Black Lotus', brand: 'MTG', model: 'Black Lotus', price: 25000, condition: 'used_good', authenticity: true },
          { title: 'Yu-Gi-Oh Blue Eyes White Dragon', brand: 'Konami', model: 'Blue Eyes', price: 199, condition: 'used_like_new' },
          { title: 'PSA 10 Pikachu Illustrator Card', brand: 'Pokemon', model: 'Illustrator', price: 45000, condition: 'used_like_new', authenticity: true },
          { title: 'Topps Mickey Mantle 1952 PSA 7', brand: 'Topps', model: 'Mantle 1952', price: 125000, condition: 'used_good', authenticity: true },
          { title: 'LEGO Star Wars Millennium Falcon', brand: 'LEGO', model: '75192', price: 849, condition: 'new' },
          { title: 'LEGO Technic Lamborghini Sian', brand: 'LEGO', model: '42115', price: 449, condition: 'new' },
          { title: 'Hot Wheels RLC 67 Camaro', brand: 'Hot Wheels', model: 'RLC Camaro', price: 299, condition: 'new' },
          { title: 'Funko Pop Freddy Funko Prototype', brand: 'Funko', model: 'Freddy', price: 5000, condition: 'new' },
          { title: 'Star Wars Black Series Boba Fett', brand: 'Hasbro', model: 'Black Series', price: 79, condition: 'new' },
          { title: 'American Silver Eagle 2024 MS70', brand: 'US Mint', model: 'Silver Eagle', price: 89, condition: 'new' },
          { title: 'Gold American Buffalo 1oz BU', brand: 'US Mint', model: 'Buffalo', price: 2150, condition: 'new' },
          { title: 'Morgan Silver Dollar 1881-S MS65', brand: 'US Mint', model: 'Morgan', price: 275, condition: 'used_like_new' },
          { title: 'Ancient Roman Denarius Silver', brand: 'Roman', model: 'Denarius', price: 450, condition: 'used_acceptable' },
          { title: 'Beatles White Album 1968 Vinyl', brand: 'Apple Records', model: 'White Album', price: 350, condition: 'used_good' },
          { title: 'Pink Floyd DSOTM First Press', brand: 'Harvest', model: 'Dark Side', price: 599, condition: 'used_good' },
          { title: 'Amazing Spider-Man #300 CGC 9.8', brand: 'Marvel', model: 'ASM 300', price: 2500, condition: 'used_like_new', authenticity: true },
          { title: 'Action Comics #1 CGC 3.0', brand: 'DC', model: 'Action 1', price: 850000, condition: 'used_acceptable', authenticity: true },
          { title: 'Michael Jordan Signed Jersey', brand: 'Mitchell & Ness', model: 'Bulls Jersey', price: 12500, condition: 'new', authenticity: true },
          { title: 'Tom Brady Autograph Football', brand: 'Wilson', model: 'NFL Ball', price: 1999, condition: 'new', authenticity: true },
          { title: 'Banksy Girl with Balloon Print', brand: 'Banksy', model: 'Girl Balloon', price: 25000, condition: 'new', authenticity: true },
          { title: 'KAWS Companion Figure Grey', brand: 'KAWS', model: 'Companion', price: 899, condition: 'new' },
          { title: 'Bearbrick 1000% Medicom Toy', brand: 'Medicom', model: 'Bearbrick', price: 1200, condition: 'new' },
          { title: 'Swatch x Omega MoonSwatch Mars', brand: 'Swatch', model: 'MoonSwatch', price: 399, condition: 'new' },
          { title: 'Vintage Coca-Cola Sign 1950s', brand: 'Coca-Cola', model: 'Metal Sign', price: 450, condition: 'used_good' },
        ]
      },
      tools: {
        imageKeywords: ['drill', 'saw', 'hammer', 'toolbox', 'wrench', 'power-tool', 'screwdriver', 'workbench', 'ladder', 'garden'],
        products: [
          { title: 'Milwaukee M18 FUEL Drill Kit', brand: 'Milwaukee', model: 'M18 FUEL', price: 279, condition: 'new' },
          { title: 'DeWalt 20V MAX Combo Kit 10pc', brand: 'DeWalt', model: '20V MAX', price: 599, condition: 'new' },
          { title: 'Makita 18V LXT Circular Saw', brand: 'Makita', model: '18V LXT', price: 199, condition: 'new' },
          { title: 'Bosch 12V Max Drill Driver Kit', brand: 'Bosch', model: '12V Max', price: 149, condition: 'new' },
          { title: 'Ryobi ONE+ 18V 6-Tool Combo', brand: 'Ryobi', model: 'ONE+', price: 299, condition: 'new' },
          { title: 'Festool Domino DF 500 Joiner', brand: 'Festool', model: 'Domino DF 500', price: 1095, condition: 'new' },
          { title: 'SawStop Professional Cabinet Saw', brand: 'SawStop', model: 'PCS', price: 3599, condition: 'new' },
          { title: 'Jet JWBS-14DXPRO Bandsaw', brand: 'Jet', model: 'JWBS-14DX', price: 1699, condition: 'new' },
          { title: 'Snap-On Mechanics Tool Set 450pc', brand: 'Snap-On', model: '450pc Set', price: 4999, condition: 'new' },
          { title: 'Craftsman 450pc Mechanics Set', brand: 'Craftsman', model: '450pc', price: 399, condition: 'new' },
          { title: 'Stanley FatMax Tool Box', brand: 'Stanley', model: 'FatMax', price: 89, condition: 'new' },
          { title: 'Werner 24ft Fiberglass Ladder', brand: 'Werner', model: 'D6224-2', price: 449, condition: 'new' },
          { title: 'Little Giant 22ft Multi Ladder', brand: 'Little Giant', model: 'Velocity', price: 389, condition: 'new' },
          { title: 'Honda EU2200i Generator', brand: 'Honda', model: 'EU2200i', price: 1199, condition: 'new' },
          { title: 'Generac GP3500iO Inverter Gen', brand: 'Generac', model: 'GP3500iO', price: 899, condition: 'new' },
          { title: 'Husqvarna 460 Rancher Chainsaw', brand: 'Husqvarna', model: '460 Rancher', price: 549, condition: 'new' },
          { title: 'Stihl MS 271 Farm Boss Chain', brand: 'Stihl', model: 'MS 271', price: 429, condition: 'new' },
          { title: 'EGO Power+ 21" Self-Propelled', brand: 'EGO', model: 'LM2156SP', price: 749, condition: 'new' },
          { title: 'Honda HRX217VKA Lawn Mower', brand: 'Honda', model: 'HRX217VKA', price: 869, condition: 'new' },
          { title: 'John Deere S130 Lawn Tractor', brand: 'John Deere', model: 'S130', price: 2499, condition: 'new' },
          { title: 'Kobalt 80V Leaf Blower', brand: 'Kobalt', model: '80V Max', price: 199, condition: 'new' },
          { title: 'Worx 40V Trimmer Edger Combo', brand: 'Worx', model: 'WG184', price: 149, condition: 'new' },
          { title: 'Black+Decker 20V Hedge Trimmer', brand: 'Black+Decker', model: 'LHT2220', price: 79, condition: 'new' },
          { title: 'Greenworks 40V Snow Blower', brand: 'Greenworks', model: '2600402', price: 399, condition: 'new' },
          { title: 'RIDGID 12 Gallon Shop Vacuum', brand: 'RIDGID', model: 'HD1200', price: 149, condition: 'new' },
        ]
      },
      toys: {
        imageKeywords: ['toy', 'game', 'puzzle', 'doll', 'action-figure', 'board-game', 'plush', 'remote-control', 'building-blocks', 'train'],
        products: [
          { title: 'LEGO Icons Eiffel Tower 10307', brand: 'LEGO', model: '10307', price: 629, condition: 'new' },
          { title: 'LEGO Harry Potter Hogwarts', brand: 'LEGO', model: '71043', price: 469, condition: 'new' },
          { title: 'LEGO Creator Expert Taj Mahal', brand: 'LEGO', model: '10256', price: 399, condition: 'new' },
          { title: 'Barbie Dreamhouse 2024 Edition', brand: 'Mattel', model: 'Dreamhouse', price: 199, condition: 'new' },
          { title: 'American Girl Doll of the Year', brand: 'American Girl', model: '2024', price: 175, condition: 'new' },
          { title: 'Hot Wheels Ultimate Garage', brand: 'Mattel', model: 'Ultimate', price: 179, condition: 'new' },
          { title: 'Nerf Elite 2.0 Commander RD-6', brand: 'Nerf', model: 'Elite 2.0', price: 24, condition: 'new' },
          { title: 'Nintendo Switch Lite Yellow', brand: 'Nintendo', model: 'Switch Lite', price: 199, condition: 'new' },
          { title: 'PlayStation VR2 Horizon Bundle', brand: 'Sony', model: 'PSVR2', price: 599, condition: 'new' },
          { title: 'Monopoly Disney 100 Edition', brand: 'Hasbro', model: 'Monopoly', price: 39, condition: 'new' },
          { title: 'Settlers of Catan Board Game', brand: 'Catan Studio', model: 'Catan', price: 49, condition: 'new' },
          { title: 'Ticket to Ride Europe Edition', brand: 'Days of Wonder', model: 'TTR Europe', price: 54, condition: 'new' },
          { title: 'Pandemic Legacy Season 1', brand: 'Z-Man Games', model: 'Pandemic', price: 79, condition: 'new' },
          { title: 'Risk Game of Thrones Edition', brand: 'Hasbro', model: 'Risk GOT', price: 74, condition: 'new' },
          { title: 'Ravensburger Disney Castle 18K', brand: 'Ravensburger', model: '18000pc', price: 249, condition: 'new' },
          { title: 'TRAXXAS Slash 4X4 VXL RC Truck', brand: 'Traxxas', model: 'Slash 4X4', price: 449, condition: 'new' },
          { title: 'DJI Mini 3 Pro Drone', brand: 'DJI', model: 'Mini 3 Pro', price: 759, condition: 'new' },
          { title: 'Hornby Flying Scotsman Train', brand: 'Hornby', model: 'Flying Scot', price: 199, condition: 'new' },
          { title: 'Lionel Polar Express Train Set', brand: 'Lionel', model: 'Polar Express', price: 299, condition: 'new' },
          { title: 'Build-A-Bear Star Wars Grogu', brand: 'Build-A-Bear', model: 'Grogu', price: 65, condition: 'new' },
          { title: 'Squishmallows 16" Axolotl', brand: 'Jazwares', model: 'Squishmallow', price: 29, condition: 'new' },
          { title: 'Jellycat Bashful Bunny Large', brand: 'Jellycat', model: 'Bashful', price: 35, condition: 'new' },
          { title: 'Fisher-Price Little People Farm', brand: 'Fisher-Price', model: 'Little People', price: 44, condition: 'new' },
          { title: 'VTech KidiZoom Creator Cam', brand: 'VTech', model: 'KidiZoom', price: 59, condition: 'new' },
          { title: 'Magna-Tiles Clear Colors 100pc', brand: 'Magna-Tiles', model: '100pc', price: 119, condition: 'new' },
        ]
      },
      vehicles: {
        imageKeywords: ['car', 'motorcycle', 'boat', 'rv', 'truck', 'suv', 'sports-car', 'classic-car', 'atv', 'jet-ski'],
        products: [
          { title: '2024 Toyota Camry SE - New', brand: 'Toyota', model: 'Camry SE', price: 28500, condition: 'new', isVehicle: true, vehicleType: 'car' },
          { title: '2023 Honda Accord Sport - Low Miles', brand: 'Honda', model: 'Accord Sport', price: 31000, condition: 'used_like_new', isVehicle: true, vehicleType: 'car' },
          { title: '2022 Ford F-150 XLT 4x4', brand: 'Ford', model: 'F-150 XLT', price: 45000, condition: 'used_good', isVehicle: true, vehicleType: 'car' },
          { title: '2023 Tesla Model 3 Long Range', brand: 'Tesla', model: 'Model 3 LR', price: 42000, condition: 'used_like_new', isVehicle: true, vehicleType: 'car' },
          { title: '2021 BMW X5 xDrive40i', brand: 'BMW', model: 'X5', price: 52000, condition: 'used_good', isVehicle: true, vehicleType: 'car' },
          { title: '2020 Mercedes-Benz E350 4MATIC', brand: 'Mercedes', model: 'E350', price: 44000, condition: 'used_good', isVehicle: true, vehicleType: 'car' },
          { title: '2023 Porsche 911 Carrera S', brand: 'Porsche', model: '911 Carrera', price: 145000, condition: 'used_like_new', isVehicle: true, vehicleType: 'car' },
          { title: '2019 Chevrolet Corvette Stingray', brand: 'Chevrolet', model: 'Corvette', price: 59000, condition: 'used_good', isVehicle: true, vehicleType: 'car' },
          { title: '1969 Ford Mustang Boss 302', brand: 'Ford', model: 'Mustang Boss', price: 125000, condition: 'used_good', isVehicle: true, vehicleType: 'car' },
          { title: '1970 Chevrolet Chevelle SS 454', brand: 'Chevrolet', model: 'Chevelle SS', price: 95000, condition: 'used_acceptable', isVehicle: true, vehicleType: 'car' },
          { title: '2023 Harley-Davidson Street Glide', brand: 'Harley-Davidson', model: 'Street Glide', price: 28999, condition: 'new', isVehicle: true, vehicleType: 'motorcycle' },
          { title: '2022 Ducati Panigale V4 S', brand: 'Ducati', model: 'Panigale V4', price: 27995, condition: 'used_like_new', isVehicle: true, vehicleType: 'motorcycle' },
          { title: '2021 BMW R 1250 GS Adventure', brand: 'BMW', model: 'R 1250 GS', price: 21500, condition: 'used_good', isVehicle: true, vehicleType: 'motorcycle' },
          { title: '2023 Kawasaki Ninja ZX-10R', brand: 'Kawasaki', model: 'Ninja ZX-10R', price: 17999, condition: 'new', isVehicle: true, vehicleType: 'motorcycle' },
          { title: '2020 Indian Chief Vintage', brand: 'Indian', model: 'Chief Vintage', price: 19500, condition: 'used_like_new', isVehicle: true, vehicleType: 'motorcycle' },
          { title: '2022 Sea Ray SLX 280 Bowrider', brand: 'Sea Ray', model: 'SLX 280', price: 185000, condition: 'used_like_new', isVehicle: true, vehicleType: 'boat' },
          { title: '2021 Boston Whaler 230 Outrage', brand: 'Boston Whaler', model: '230 Outrage', price: 135000, condition: 'used_good', isVehicle: true, vehicleType: 'boat' },
          { title: '2023 Yamaha WaveRunner FX SVHO', brand: 'Yamaha', model: 'WaveRunner', price: 18999, condition: 'new', isVehicle: true, vehicleType: 'boat' },
          { title: '2020 Mastercraft X24 Wakeboard', brand: 'Mastercraft', model: 'X24', price: 145000, condition: 'used_good', isVehicle: true, vehicleType: 'boat' },
          { title: '2023 Airstream Interstate 24GT', brand: 'Airstream', model: 'Interstate', price: 215000, condition: 'new', isVehicle: true, vehicleType: 'rv' },
          { title: '2022 Winnebago View 24D', brand: 'Winnebago', model: 'View 24D', price: 165000, condition: 'used_like_new', isVehicle: true, vehicleType: 'rv' },
          { title: '2021 Thor Motor Coach Ace 30.3', brand: 'Thor', model: 'Ace 30.3', price: 125000, condition: 'used_good', isVehicle: true, vehicleType: 'rv' },
          { title: '2023 Grand Design Reflection 337RLS', brand: 'Grand Design', model: 'Reflection', price: 78000, condition: 'new', isVehicle: true, vehicleType: 'rv' },
          { title: '2022 Polaris RZR Pro XP Premium', brand: 'Polaris', model: 'RZR Pro XP', price: 24999, condition: 'used_like_new', isVehicle: true, vehicleType: 'atv' },
          { title: '2023 Can-Am Maverick X3 X RS', brand: 'Can-Am', model: 'Maverick X3', price: 32999, condition: 'new', isVehicle: true, vehicleType: 'atv' },
        ]
      },
      music: {
        imageKeywords: ['guitar', 'piano', 'drums', 'violin', 'saxophone', 'microphone', 'amplifier', 'keyboard', 'turntable', 'speaker'],
        products: [
          { title: 'Gibson Les Paul Standard 60s', brand: 'Gibson', model: 'Les Paul', price: 2499, condition: 'new' },
          { title: 'Fender American Ultra Strat', brand: 'Fender', model: 'Ultra Strat', price: 2099, condition: 'new' },
          { title: 'PRS Custom 24 10 Top', brand: 'PRS', model: 'Custom 24', price: 4299, condition: 'new' },
          { title: 'Martin D-28 Acoustic Guitar', brand: 'Martin', model: 'D-28', price: 3299, condition: 'new' },
          { title: 'Taylor 814ce Acoustic-Electric', brand: 'Taylor', model: '814ce', price: 3999, condition: 'new' },
          { title: 'Yamaha C3X Conservatory Grand', brand: 'Yamaha', model: 'C3X', price: 65000, condition: 'new' },
          { title: 'Roland RD-2000 Stage Piano', brand: 'Roland', model: 'RD-2000', price: 2799, condition: 'new' },
          { title: 'Nord Stage 4 88 Keyboard', brand: 'Nord', model: 'Stage 4', price: 5999, condition: 'new' },
          { title: 'Korg Kronos 2 88 Workstation', brand: 'Korg', model: 'Kronos 2', price: 3999, condition: 'new' },
          { title: 'DW Collectors Series Drum Kit', brand: 'DW', model: 'Collectors', price: 7999, condition: 'new' },
          { title: 'Pearl Masters Maple Complete', brand: 'Pearl', model: 'Masters Maple', price: 3299, condition: 'new' },
          { title: 'Tama Starclassic Walnut/Birch', brand: 'Tama', model: 'Starclassic', price: 4199, condition: 'new' },
          { title: 'Zildjian K Custom Cymbal Pack', brand: 'Zildjian', model: 'K Custom', price: 1899, condition: 'new' },
          { title: 'Fender Rumble 500 Bass Amp', brand: 'Fender', model: 'Rumble 500', price: 699, condition: 'new' },
          { title: 'Marshall JCM800 Tube Head', brand: 'Marshall', model: 'JCM800', price: 2299, condition: 'used_good' },
          { title: 'Mesa Boogie Dual Rectifier', brand: 'Mesa', model: 'Dual Rec', price: 2099, condition: 'used_like_new' },
          { title: 'Shure SM7B Vocal Microphone', brand: 'Shure', model: 'SM7B', price: 399, condition: 'new' },
          { title: 'Neumann U87 Ai Studio Mic', brand: 'Neumann', model: 'U87 Ai', price: 3599, condition: 'new' },
          { title: 'Audio-Technica AT4050 Condenser', brand: 'Audio-Technica', model: 'AT4050', price: 699, condition: 'new' },
          { title: 'Technics SL-1200GR Turntable', brand: 'Technics', model: 'SL-1200GR', price: 1699, condition: 'new' },
          { title: 'Pro-Ject Debut Carbon EVO', brand: 'Pro-Ject', model: 'Debut Carbon', price: 599, condition: 'new' },
          { title: 'Universal Audio Apollo Twin X', brand: 'Universal Audio', model: 'Apollo Twin', price: 1099, condition: 'new' },
          { title: 'Focusrite Scarlett 2i2 4th Gen', brand: 'Focusrite', model: 'Scarlett 2i2', price: 179, condition: 'new' },
          { title: 'Native Instruments Komplete 14', brand: 'Native Instruments', model: 'Komplete 14', price: 599, condition: 'new' },
          { title: 'JBL LSR305P MkII Studio Monitor', brand: 'JBL', model: 'LSR305P', price: 299, condition: 'new' },
        ]
      }
    };

    const listingTypes = ['buy_now', 'auction', 'both'];
    const conditions = ['new', 'used_like_new', 'used_good', 'used_acceptable', 'refurbished'];
    const auctionDurations = ['1', '3', '5', '7', '10'];
    const shippingServices = ['USPS Priority Mail', 'USPS First Class', 'FedEx Ground', 'FedEx Express', 'UPS Ground', 'UPS 2nd Day Air', 'Free Economy Shipping'];
    const returnPeriods = ['14', '30', '60'];
    const returnPayers = ['buyer', 'seller'];
    const zipCodes = ['10001', '90210', '60601', '33101', '78701', '85001', '98101', '30301', '02115', '19103'];
    const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Green', 'Gold', 'Gray', 'Navy', 'Brown'];

    // Generate random VIN
    const generateVIN = () => {
      const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
      let vin = '';
      for (let i = 0; i < 17; i++) vin += chars.charAt(Math.floor(Math.random() * chars.length));
      return vin;
    };

    // Generate random UPC
    const generateUPC = () => {
      let upc = '';
      for (let i = 0; i < 12; i++) upc += Math.floor(Math.random() * 10);
      return upc;
    };

    // Generate SKU
    const generateSKU = (brand, index) => {
      return `${brand.substring(0, 3).toUpperCase()}-${String(index).padStart(5, '0')}`;
    };

    const sampleProducts = [];
    let productIndex = 0;
    const categoryKeys = Object.keys(productData);

    // Generate 300 products
    while (sampleProducts.length < 300) {
      for (const categoryKey of categoryKeys) {
        if (sampleProducts.length >= 300) break;

        const category = productData[categoryKey];
        const products = category.products;
        const imageKeywords = category.imageKeywords;

        for (const product of products) {
          if (sampleProducts.length >= 300) break;

          productIndex++;
          const catId = categories[productIndex % categories.length]?.id || '1';
          const listingType = product.isVehicle ? (Math.random() > 0.5 ? 'buy_now' : 'auction') : listingTypes[Math.floor(Math.random() * listingTypes.length)];
          const condition = product.condition || conditions[Math.floor(Math.random() * conditions.length)];
          const auctionDuration = listingType !== 'buy_now' ? auctionDurations[Math.floor(Math.random() * auctionDurations.length)] : '';
          const freeShipping = Math.random() > 0.4;
          const shippingCost = freeShipping ? '0' : (Math.random() * 30 + 5).toFixed(2);
          const acceptsReturns = Math.random() > 0.2;
          const returnPeriod = acceptsReturns ? returnPeriods[Math.floor(Math.random() * returnPeriods.length)] : '';
          const returnPayer = acceptsReturns ? returnPayers[Math.floor(Math.random() * returnPayers.length)] : '';
          const localPickup = product.isVehicle || Math.random() > 0.7;
          const color = colors[Math.floor(Math.random() * colors.length)];
          const zipCode = zipCodes[Math.floor(Math.random() * zipCodes.length)];

          // Pricing
          const basePrice = product.price;
          const buyNowPrice = listingType !== 'auction' ? basePrice.toFixed(2) : '';
          const startingPrice = listingType !== 'buy_now' ? (basePrice * 0.4).toFixed(2) : '';
          const reservePrice = listingType !== 'buy_now' && Math.random() > 0.5 ? (basePrice * 0.7).toFixed(2) : '';

          // Advanced features
          const acceptsBestOffer = listingType !== 'auction' && Math.random() > 0.4;
          const autoAccept = acceptsBestOffer ? (basePrice * 0.9).toFixed(2) : '';
          const autoDecline = acceptsBestOffer ? (basePrice * 0.7).toFixed(2) : '';
          const gspEnabled = !product.isVehicle && Math.random() > 0.6;
          const shipsInternationally = gspEnabled;
          const internationalCost = gspEnabled ? (Math.random() * 50 + 15).toFixed(2) : '';
          const promotedListing = Math.random() > 0.5;
          const promotionRate = promotedListing ? String(Math.floor(Math.random() * 8) + 1) : '';
          const authenticity = product.authenticity || false;

          // Image URLs from Unsplash - use category-specific keywords
          const imgKeyword = imageKeywords[productIndex % imageKeywords.length];
          const imgUrl1 = `https://source.unsplash.com/800x600/?${imgKeyword},product`;
          const imgUrl2 = `https://source.unsplash.com/800x600/?${imgKeyword}`;

          // Condition descriptions
          const conditionDescs = {
            'new': 'Brand new in original packaging with full manufacturer warranty',
            'used_like_new': 'Excellent condition, barely used, works perfectly',
            'used_good': 'Good condition with minor signs of use, fully functional',
            'used_acceptable': 'Shows wear but fully functional, sold as-is',
            'refurbished': 'Professionally refurbished to like-new condition'
          };

          // Status - mostly active, some drafts
          const status = Math.random() > 0.95 ? 'draft' : 'active';

          // Build product row
          const row = [
            product.title,
            `${product.title}. ${conditionDescs[condition]}. Fast shipping and excellent customer service.`,
            catId,
            listingType,
            condition,
            conditionDescs[condition],
            buyNowPrice,
            startingPrice,
            reservePrice,
            product.isVehicle ? '1' : String(Math.floor(Math.random() * 20) + 1),
            auctionDuration,
            product.brand,
            product.model,
            color,
            '',
            '',
            (Math.random() * 50 + 0.5).toFixed(2),
            (Math.random() * 20 + 2).toFixed(1),
            (Math.random() * 15 + 2).toFixed(1),
            (Math.random() * 10 + 1).toFixed(1),
            generateUPC(),
            generateSKU(product.brand, productIndex),
            zipCode,
            product.isVehicle ? 'Local Pickup Only' : shippingServices[Math.floor(Math.random() * shippingServices.length)],
            shippingCost,
            freeShipping ? 'true' : 'false',
            String(Math.floor(Math.random() * 3) + 1),
            (Math.random() * 10 + 1).toFixed(1),
            (Math.random() * 20 + 4).toFixed(1),
            (Math.random() * 15 + 3).toFixed(1),
            (Math.random() * 8 + 2).toFixed(1),
            acceptsReturns ? 'true' : 'false',
            returnPeriod,
            returnPayer,
            localPickup ? 'true' : 'false',
            `${imgUrl1}|${imgUrl2}`,
            status,
            // Advanced features
            acceptsBestOffer ? 'true' : 'false',
            autoAccept,
            autoDecline,
            gspEnabled ? 'true' : 'false',
            shipsInternationally ? 'true' : 'false',
            internationalCost,
            promotedListing ? 'true' : 'false',
            promotionRate,
            authenticity ? 'true' : 'false',
            // Motors fields
            product.isVehicle ? product.vehicleType : '',
            product.isVehicle ? generateVIN() : '',
            product.isVehicle ? String(Math.floor(Math.random() * 100000)) : '',
            product.isVehicle ? String(2018 + Math.floor(Math.random() * 7)) : '',
            product.isVehicle ? product.brand : '',
            product.isVehicle ? product.model : ''
          ];

          sampleProducts.push(row);
        }
      }
    }

    // Build CSV content
    let csvContent = headers.join(',') + '\n';
    sampleProducts.forEach(row => {
      csvContent += row.map(val => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
    });

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sample_products_300.csv');
    res.send(csvContent);
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
  endListing,
  relistProduct,
  deleteProduct,
  getBulkUploadTemplate,
  bulkUpload,
  generateSampleData,
};
