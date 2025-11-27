const { pool } = require('../config/database');

// Validate coupon
const validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, categoryId } = req.body;

    const result = await pool.query(
      `SELECT * FROM coupons
       WHERE code = $1
         AND is_active = true
         AND start_date <= CURRENT_TIMESTAMP
         AND end_date >= CURRENT_TIMESTAMP`,
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    const coupon = result.rows[0];

    // Check usage limit
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({ error: 'Coupon usage limit reached' });
    }

    // Check per-user limit
    if (coupon.per_user_limit) {
      const userUsageResult = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
        [coupon.id, req.user.id]
      );

      if (parseInt(userUsageResult.rows[0].count) >= coupon.per_user_limit) {
        return res.status(400).json({ error: 'You have already used this coupon' });
      }
    }

    // Check minimum purchase amount
    if (coupon.min_purchase_amount && subtotal < parseFloat(coupon.min_purchase_amount)) {
      return res.status(400).json({
        error: `Minimum purchase of $${coupon.min_purchase_amount} required`,
      });
    }

    // Check category restriction
    if (coupon.category_id && categoryId && coupon.category_id !== categoryId) {
      return res.status(400).json({ error: 'Coupon not valid for this category' });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
      }
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = parseFloat(coupon.discount_value);
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: parseFloat(coupon.discount_value),
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: coupon.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Apply coupon to order (internal use)
const applyCouponToOrder = async (couponId, userId, orderId, discountApplied) => {
  // Record usage
  await pool.query(
    `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
     VALUES ($1, $2, $3, $4)`,
    [couponId, userId, orderId, discountApplied]
  );

  // Increment usage count
  await pool.query(
    'UPDATE coupons SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [couponId]
  );
};

// Get user's available coupons
const getAvailableCoupons = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.*
       FROM coupons c
       WHERE c.is_active = true
         AND c.start_date <= CURRENT_TIMESTAMP
         AND c.end_date >= CURRENT_TIMESTAMP
         AND (c.usage_limit IS NULL OR c.usage_count < c.usage_limit)
         AND (c.seller_id IS NULL OR c.seller_id = $1)
       ORDER BY c.end_date ASC`,
      [req.user.id]
    );

    // Filter out coupons user has already used up their limit
    const couponsWithUsage = await Promise.all(
      result.rows.map(async (coupon) => {
        if (coupon.per_user_limit) {
          const usageResult = await pool.query(
            'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
            [coupon.id, req.user.id]
          );
          if (parseInt(usageResult.rows[0].count) >= coupon.per_user_limit) {
            return null;
          }
        }
        return coupon;
      })
    );

    const availableCoupons = couponsWithUsage.filter((c) => c !== null);

    res.json({
      coupons: availableCoupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discount_type,
        discountValue: parseFloat(c.discount_value),
        minPurchaseAmount: c.min_purchase_amount ? parseFloat(c.min_purchase_amount) : null,
        maxDiscountAmount: c.max_discount_amount ? parseFloat(c.max_discount_amount) : null,
        endDate: c.end_date,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Create coupon (admin or seller)
const createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      usageLimit,
      perUserLimit,
      categoryId,
      startDate,
      endDate,
    } = req.body;

    // Check if code already exists
    const existingResult = await pool.query('SELECT id FROM coupons WHERE code = $1', [
      code.toUpperCase(),
    ]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const result = await pool.query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, usage_limit, per_user_limit, category_id, seller_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minPurchaseAmount,
        maxDiscountAmount,
        usageLimit,
        perUserLimit || 1,
        categoryId,
        req.user.is_admin ? null : req.user.id,
        startDate,
        endDate,
      ]
    );

    res.status(201).json({
      success: true,
      coupon: {
        id: result.rows[0].id,
        code: result.rows[0].code,
        discountType: result.rows[0].discount_type,
        discountValue: parseFloat(result.rows[0].discount_value),
        startDate: result.rows[0].start_date,
        endDate: result.rows[0].end_date,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get coupon by ID
const getCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, cat.name as category_name
       FROM coupons c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = $1 AND (c.seller_id = $2 OR c.seller_id IS NULL OR $3 = true)`,
      [id, req.user.id, req.user.is_admin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const c = result.rows[0];

    res.json({
      coupon: {
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discount_type,
        discountValue: parseFloat(c.discount_value),
        minPurchaseAmount: c.min_purchase_amount ? parseFloat(c.min_purchase_amount) : null,
        maxDiscountAmount: c.max_discount_amount ? parseFloat(c.max_discount_amount) : null,
        usageLimit: c.usage_limit,
        usageCount: c.usage_count,
        perUserLimit: c.per_user_limit,
        categoryId: c.category_id,
        categoryName: c.category_name,
        startDate: c.start_date,
        endDate: c.end_date,
        isActive: c.is_active,
        createdAt: c.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get seller's coupons
const getMyCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*, cat.name as category_name
      FROM coupons c
      LEFT JOIN categories cat ON c.category_id = cat.id
      WHERE c.seller_id = $1
    `;
    const params = [req.user.id];

    if (status === 'active') {
      query += ` AND c.is_active = true AND c.end_date >= CURRENT_TIMESTAMP`;
    } else if (status === 'expired') {
      query += ` AND c.end_date < CURRENT_TIMESTAMP`;
    } else if (status === 'inactive') {
      query += ` AND c.is_active = false`;
    }

    query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM coupons WHERE seller_id = $1',
      [req.user.id]
    );

    res.json({
      coupons: result.rows.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        discountType: c.discount_type,
        discountValue: parseFloat(c.discount_value),
        usageCount: c.usage_count,
        usageLimit: c.usage_limit,
        startDate: c.start_date,
        endDate: c.end_date,
        isActive: c.is_active,
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

// Update coupon
const updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, usageLimit, endDate, isActive } = req.body;

    const existingResult = await pool.query(
      'SELECT * FROM coupons WHERE id = $1 AND (seller_id = $2 OR $3 = true)',
      [id, req.user.id, req.user.is_admin]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const result = await pool.query(
      `UPDATE coupons
       SET description = COALESCE($1, description),
           usage_limit = COALESCE($2, usage_limit),
           end_date = COALESCE($3, end_date),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [description, usageLimit, endDate, isActive, id]
    );

    res.json({
      success: true,
      coupon: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Delete coupon
const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM coupons WHERE id = $1 AND (seller_id = $2 OR $3 = true) RETURNING id',
      [id, req.user.id, req.user.is_admin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  applyCouponToOrder,
  getAvailableCoupons,
  createCoupon,
  getCoupon,
  getMyCoupons,
  updateCoupon,
  deleteCoupon,
};
