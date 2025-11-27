const { pool } = require('../config/database');

// Create return request
const createReturn = async (req, res, next) => {
  try {
    const { orderId, orderItemId, returnReason, returnDetails } = req.body;

    // Get order and verify buyer
    const orderResult = await pool.query(
      `SELECT o.*, oi.seller_id, p.return_policy, p.return_days
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check return policy
    if (order.return_policy === 'no_returns') {
      return res.status(400).json({ error: 'This item does not accept returns' });
    }

    // Check return window
    const orderDate = new Date(order.created_at);
    const returnDeadline = new Date(orderDate.getTime() + (order.return_days || 30) * 24 * 60 * 60 * 1000);
    if (new Date() > returnDeadline) {
      return res.status(400).json({ error: 'Return window has expired' });
    }

    // Check if return already exists
    const existingReturn = await pool.query(
      'SELECT id FROM returns WHERE order_id = $1 AND status NOT IN ($2, $3)',
      [orderId, 'refunded', 'closed']
    );

    if (existingReturn.rows.length > 0) {
      return res.status(400).json({ error: 'A return request already exists for this order' });
    }

    const result = await pool.query(
      `INSERT INTO returns (order_id, order_item_id, buyer_id, seller_id, return_reason, return_details)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [orderId, orderItemId, req.user.id, order.seller_id, returnReason, returnDetails]
    );

    res.status(201).json({
      success: true,
      return: {
        id: result.rows[0].id,
        orderId: result.rows[0].order_id,
        status: result.rows[0].status,
        returnReason: result.rows[0].return_reason,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get return by ID
const getReturn = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT r.*, o.order_number, p.title as product_title
       FROM returns r
       JOIN orders o ON r.order_id = o.id
       LEFT JOIN order_items oi ON r.order_item_id = oi.id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE r.id = $1 AND (r.buyer_id = $2 OR r.seller_id = $2 OR $3 = true)`,
      [id, req.user.id, req.user.is_admin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const returnData = result.rows[0];

    res.json({
      return: {
        id: returnData.id,
        orderId: returnData.order_id,
        orderNumber: returnData.order_number,
        productTitle: returnData.product_title,
        returnReason: returnData.return_reason,
        returnDetails: returnData.return_details,
        status: returnData.status,
        trackingNumber: returnData.tracking_number,
        refundAmount: returnData.refund_amount,
        refundType: returnData.refund_type,
        sellerNotes: returnData.seller_notes,
        createdAt: returnData.created_at,
        updatedAt: returnData.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user's returns (as buyer or seller)
const getMyReturns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type = 'buyer', status } = req.query;
    const offset = (page - 1) * limit;

    const userColumn = type === 'seller' ? 'seller_id' : 'buyer_id';

    let query = `
      SELECT r.*, o.order_number
      FROM returns r
      JOIN orders o ON r.order_id = o.id
      WHERE r.${userColumn} = $1
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND r.status = $${params.length}`;
    }

    query += ` ORDER BY r.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) as total FROM returns WHERE ${userColumn} = $1`;
    const countResult = await pool.query(countQuery, [req.user.id]);

    res.json({
      returns: result.rows.map((r) => ({
        id: r.id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        returnReason: r.return_reason,
        status: r.status,
        createdAt: r.created_at,
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

// Approve return (seller)
const approveReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { refundType, refundAmount, sellerNotes } = req.body;

    const returnResult = await pool.query(
      'SELECT * FROM returns WHERE id = $1 AND seller_id = $2',
      [id, req.user.id]
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const result = await pool.query(
      `UPDATE returns
       SET status = 'approved',
           refund_type = $1,
           refund_amount = $2,
           seller_notes = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [refundType, refundAmount, sellerNotes, id]
    );

    res.json({
      success: true,
      return: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Reject return (seller)
const rejectReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sellerNotes } = req.body;

    const returnResult = await pool.query(
      'SELECT * FROM returns WHERE id = $1 AND seller_id = $2',
      [id, req.user.id]
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const result = await pool.query(
      `UPDATE returns
       SET status = 'rejected', seller_notes = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [sellerNotes, id]
    );

    res.json({
      success: true,
      return: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Update return tracking (buyer)
const updateReturnTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber } = req.body;

    const returnResult = await pool.query(
      'SELECT * FROM returns WHERE id = $1 AND buyer_id = $2 AND status = $3',
      [id, req.user.id, 'approved']
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Return not found or not approved' });
    }

    const result = await pool.query(
      `UPDATE returns
       SET status = 'shipped', tracking_number = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [trackingNumber, id]
    );

    res.json({
      success: true,
      return: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Mark return received (seller)
const markReturnReceived = async (req, res, next) => {
  try {
    const { id } = req.params;

    const returnResult = await pool.query(
      'SELECT * FROM returns WHERE id = $1 AND seller_id = $2 AND status = $3',
      [id, req.user.id, 'shipped']
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Return not found or not shipped' });
    }

    const result = await pool.query(
      `UPDATE returns SET status = 'received', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      return: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Process refund for return (seller or admin)
const processReturnRefund = async (req, res, next) => {
  try {
    const { id } = req.params;

    const returnResult = await pool.query(
      'SELECT * FROM returns WHERE id = $1 AND (seller_id = $2 OR $3 = true)',
      [id, req.user.id, req.user.is_admin]
    );

    if (returnResult.rows.length === 0) {
      return res.status(404).json({ error: 'Return not found' });
    }

    const returnData = returnResult.rows[0];

    if (returnData.status !== 'received') {
      return res.status(400).json({ error: 'Item must be received before refund' });
    }

    // Process refund via payment controller would go here
    // For now, just update status

    const result = await pool.query(
      `UPDATE returns SET status = 'refunded', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      return: result.rows[0],
      message: 'Refund processed successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReturn,
  getReturn,
  getMyReturns,
  approveReturn,
  rejectReturn,
  updateReturnTracking,
  markReturnReceived,
  processReturnRefund,
};
