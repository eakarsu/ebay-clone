const { pool } = require('../config/database');

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get admin dashboard overview
const getDashboard = async (req, res, next) => {
  try {
    const [userStats, orderStats, productStats, revenueStats] = await Promise.all([
      // User statistics
      pool.query(`
        SELECT
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_month,
          COUNT(CASE WHEN is_admin = true THEN 1 END) as admin_count
        FROM users
      `),

      // Order statistics
      pool.query(`
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_orders,
          COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as orders_today
        FROM orders
      `),

      // Product statistics
      pool.query(`
        SELECT
          COUNT(*) as total_products,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_products,
          COUNT(CASE WHEN listing_type = 'auction' AND status = 'active' THEN 1 END) as active_auctions,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as new_listings_today
        FROM products
      `),

      // Revenue statistics
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN total ELSE 0 END), 0) as revenue_today,
          COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total ELSE 0 END), 0) as revenue_week,
          COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total ELSE 0 END), 0) as revenue_month,
          COALESCE(SUM(total), 0) as revenue_total
        FROM orders WHERE payment_status = 'completed'
      `),
    ]);

    // Recent activity
    const recentActivity = await pool.query(`
      (SELECT 'new_user' as type, username as title, created_at FROM users ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'new_order' as type, order_number as title, created_at FROM orders ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'new_product' as type, title, created_at FROM products ORDER BY created_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 15
    `);

    // Open disputes
    const openDisputes = await pool.query(`
      SELECT COUNT(*) as count FROM disputes WHERE status NOT IN ('resolved', 'closed')
    `);

    res.json({
      users: {
        total: parseInt(userStats.rows[0].total_users),
        newThisWeek: parseInt(userStats.rows[0].new_users_week),
        newThisMonth: parseInt(userStats.rows[0].new_users_month),
        admins: parseInt(userStats.rows[0].admin_count),
      },
      orders: {
        total: parseInt(orderStats.rows[0].total_orders),
        pending: parseInt(orderStats.rows[0].pending_orders),
        processing: parseInt(orderStats.rows[0].processing_orders),
        shipped: parseInt(orderStats.rows[0].shipped_orders),
        delivered: parseInt(orderStats.rows[0].delivered_orders),
        today: parseInt(orderStats.rows[0].orders_today),
      },
      products: {
        total: parseInt(productStats.rows[0].total_products),
        active: parseInt(productStats.rows[0].active_products),
        activeAuctions: parseInt(productStats.rows[0].active_auctions),
        newToday: parseInt(productStats.rows[0].new_listings_today),
      },
      revenue: {
        today: parseFloat(revenueStats.rows[0].revenue_today),
        week: parseFloat(revenueStats.rows[0].revenue_week),
        month: parseFloat(revenueStats.rows[0].revenue_month),
        total: parseFloat(revenueStats.rows[0].revenue_total),
      },
      openDisputes: parseInt(openDisputes.rows[0].count),
      recentActivity: recentActivity.rows,
    });
  } catch (error) {
    next(error);
  }
};

// Get all users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, status, role } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, username, email, first_name, last_name, is_admin, email_verified,
             status, created_at, updated_at,
             (SELECT COUNT(*) FROM products WHERE seller_id = users.id) as product_count,
             (SELECT COUNT(*) FROM orders WHERE buyer_id = users.id) as order_count
      FROM users WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (username ILIKE $${params.length} OR email ILIKE $${params.length} OR first_name ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (role === 'admin') {
      query += ` AND is_admin = true`;
    } else if (role === 'user') {
      query += ` AND is_admin = false`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');

    res.json({
      users: result.rows.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        isAdmin: u.is_admin,
        emailVerified: u.email_verified,
        status: u.status,
        productCount: parseInt(u.product_count),
        orderCount: parseInt(u.order_count),
        createdAt: u.created_at,
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

// Get user details
const getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get additional stats
    const [orders, products, reviews] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM orders WHERE buyer_id = $1', [id]),
      pool.query('SELECT COUNT(*) as count FROM products WHERE seller_id = $1', [id]),
      pool.query('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE user_id = $1', [id]),
    ]);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isAdmin: user.is_admin,
        emailVerified: user.email_verified,
        twoFactorEnabled: user.two_factor_enabled,
        status: user.status,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      stats: {
        orders: {
          count: parseInt(orders.rows[0].count),
          totalSpent: parseFloat(orders.rows[0].total),
        },
        products: parseInt(products.rows[0].count),
        reviews: {
          count: parseInt(reviews.rows[0].count),
          average: reviews.rows[0].avg ? parseFloat(reviews.rows[0].avg).toFixed(1) : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update user (admin)
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isAdmin } = req.body;

    const existingResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query(
      `UPDATE users
       SET status = COALESCE($1, status),
           is_admin = COALESCE($2, is_admin),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [status, isAdmin, id]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'update_user', 'user', id, JSON.stringify({ status, isAdmin })]
    );

    res.json({
      success: true,
      user: {
        id: result.rows[0].id,
        status: result.rows[0].status,
        isAdmin: result.rows[0].is_admin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, username', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'delete_user', 'user', id, JSON.stringify({ username: result.rows[0].username })]
    );

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

// Get all products (admin view)
const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, status, category } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, c.name as category_name, u.username as seller_name
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN users u ON p.seller_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.title ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      query += ` AND p.category_id = $${params.length}`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM products');

    res.json({
      products: result.rows.map((p) => ({
        id: p.id,
        title: p.title,
        price: parseFloat(p.price),
        status: p.status,
        listingType: p.listing_type,
        categoryName: p.category_name,
        sellerName: p.seller_name,
        sellerId: p.seller_id,
        quantity: p.quantity,
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

// Update product status (admin)
const updateProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE products SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'update_product_status', 'product', id, JSON.stringify({ status })]
    );

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// Get all orders (admin view)
const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, status, paymentStatus } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, b.username as buyer_name, s.username as seller_name
      FROM orders o
      JOIN users b ON o.buyer_id = b.id
      LEFT JOIN users s ON o.seller_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (o.order_number ILIKE $${params.length} OR b.username ILIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    if (paymentStatus) {
      params.push(paymentStatus);
      query += ` AND o.payment_status = $${params.length}`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM orders');

    res.json({
      orders: result.rows.map((o) => ({
        id: o.id,
        orderNumber: o.order_number,
        buyerName: o.buyer_name,
        sellerName: o.seller_name,
        total: parseFloat(o.total),
        status: o.status,
        paymentStatus: o.payment_status,
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

// Get all disputes (admin view)
const getDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, o.order_number,
             opener.username as opener_name,
             against.username as against_name
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      JOIN users opener ON d.opened_by = opener.id
      JOIN users against ON d.against_user = against.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM disputes');

    res.json({
      disputes: result.rows.map((d) => ({
        id: d.id,
        orderNumber: d.order_number,
        disputeType: d.dispute_type,
        status: d.status,
        openerName: d.opener_name,
        againstName: d.against_name,
        createdAt: d.created_at,
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

// Get admin action logs
const getAdminLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, adminId, actionType } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT al.*, u.username as admin_name
      FROM admin_actions al
      JOIN users u ON al.admin_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (adminId) {
      params.push(adminId);
      query += ` AND al.admin_id = $${params.length}`;
    }

    if (actionType) {
      params.push(actionType);
      query += ` AND al.action_type = $${params.length}`;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    const countResult = await pool.query('SELECT COUNT(*) as total FROM admin_actions');

    res.json({
      logs: result.rows.map((l) => ({
        id: l.id,
        adminId: l.admin_id,
        adminName: l.admin_name,
        actionType: l.action_type,
        targetType: l.target_type,
        targetId: l.target_id,
        details: l.details,
        ipAddress: l.ip_address,
        createdAt: l.created_at,
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

// Manage categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description, slug, imageUrl } = req.body;

    const result = await pool.query(
      `INSERT INTO categories (name, description, slug, image_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, slug, imageUrl]
    );

    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, slug, imageUrl } = req.body;

    const result = await pool.query(
      `UPDATE categories
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           slug = COALESCE($3, slug),
           image_url = COALESCE($4, image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [name, description, slug, imageUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCheck = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
      [id]
    );

    if (parseInt(productCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with existing products' });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
};

// Get system stats for charts
const getSystemStats = async (req, res, next) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);

    // Daily registrations
    const registrations = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Daily revenue
    const revenue = await pool.query(`
      SELECT DATE(created_at) as date, COALESCE(SUM(total), 0) as amount
      FROM orders
      WHERE payment_status = 'completed' AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    // Daily listings
    const listings = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM products
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);

    res.json({
      registrations: registrations.rows,
      revenue: revenue.rows.map((r) => ({ date: r.date, amount: parseFloat(r.amount) })),
      listings: listings.rows,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAdmin,
  getDashboard,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  getProducts,
  updateProductStatus,
  getOrders,
  getDisputes,
  getAdminLogs,
  createCategory,
  updateCategory,
  deleteCategory,
  getSystemStats,
};
