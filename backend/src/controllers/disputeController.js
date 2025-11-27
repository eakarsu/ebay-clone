const { pool } = require('../config/database');
const { sendDisputeOpenedEmail } = require('../services/emailService');

// Create a new dispute
const createDispute = async (req, res, next) => {
  try {
    const { orderId, orderItemId, disputeType, reason, desiredResolution } = req.body;

    // Get order details
    const orderResult = await pool.query(
      `SELECT o.*, oi.seller_id as item_seller_id
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];
    const againstUser = order.seller_id || order.item_seller_id;

    // Check if dispute already exists
    const existingDispute = await pool.query(
      'SELECT id FROM disputes WHERE order_id = $1 AND status NOT IN ($2, $3)',
      [orderId, 'resolved', 'closed']
    );

    if (existingDispute.rows.length > 0) {
      return res.status(400).json({ error: 'An active dispute already exists for this order' });
    }

    // Create dispute
    const result = await pool.query(
      `INSERT INTO disputes (order_id, order_item_id, opened_by, against_user, dispute_type, reason, desired_resolution)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [orderId, orderItemId, req.user.id, againstUser, disputeType, reason, desiredResolution]
    );

    const dispute = result.rows[0];

    // Get seller info and send email
    const sellerResult = await pool.query(
      'SELECT id, email, username, first_name as "firstName" FROM users WHERE id = $1',
      [againstUser]
    );

    if (sellerResult.rows.length > 0) {
      await sendDisputeOpenedEmail(sellerResult.rows[0], dispute, order);
    }

    res.status(201).json({
      success: true,
      dispute: {
        id: dispute.id,
        orderId: dispute.order_id,
        disputeType: dispute.dispute_type,
        status: dispute.status,
        reason: dispute.reason,
        createdAt: dispute.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get dispute by ID
const getDispute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT d.*,
              o.order_number,
              opener.username as opener_username,
              against.username as against_username
       FROM disputes d
       JOIN orders o ON d.order_id = o.id
       JOIN users opener ON d.opened_by = opener.id
       JOIN users against ON d.against_user = against.id
       WHERE d.id = $1 AND (d.opened_by = $2 OR d.against_user = $2 OR $3 = true)`,
      [id, req.user.id, req.user.is_admin]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const dispute = result.rows[0];

    // Get messages
    const messagesResult = await pool.query(
      `SELECT dm.*, u.username, u.avatar_url
       FROM dispute_messages dm
       JOIN users u ON dm.sender_id = u.id
       WHERE dm.dispute_id = $1
       ORDER BY dm.created_at ASC`,
      [id]
    );

    res.json({
      dispute: {
        id: dispute.id,
        orderId: dispute.order_id,
        orderNumber: dispute.order_number,
        disputeType: dispute.dispute_type,
        status: dispute.status,
        reason: dispute.reason,
        desiredResolution: dispute.desired_resolution,
        resolutionType: dispute.resolution_type,
        resolutionNotes: dispute.resolution_notes,
        refundAmount: dispute.refund_amount,
        openerUsername: dispute.opener_username,
        againstUsername: dispute.against_username,
        createdAt: dispute.created_at,
        resolvedAt: dispute.resolved_at,
      },
      messages: messagesResult.rows.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        senderUsername: m.username,
        senderAvatar: m.avatar_url,
        message: m.message,
        attachments: m.attachments,
        isAdmin: m.is_admin,
        createdAt: m.created_at,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get user's disputes
const getMyDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT d.*, o.order_number
      FROM disputes d
      JOIN orders o ON d.order_id = o.id
      WHERE (d.opened_by = $1 OR d.against_user = $1)
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM disputes WHERE opened_by = $1 OR against_user = $1`,
      [req.user.id]
    );

    res.json({
      disputes: result.rows.map((d) => ({
        id: d.id,
        orderId: d.order_id,
        orderNumber: d.order_number,
        disputeType: d.dispute_type,
        status: d.status,
        reason: d.reason,
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

// Add message to dispute
const addDisputeMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;

    // Verify access
    const disputeResult = await pool.query(
      'SELECT * FROM disputes WHERE id = $1 AND (opened_by = $2 OR against_user = $2 OR $3 = true)',
      [id, req.user.id, req.user.is_admin]
    );

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const dispute = disputeResult.rows[0];

    if (['resolved', 'closed'].includes(dispute.status)) {
      return res.status(400).json({ error: 'Cannot add messages to a closed dispute' });
    }

    const result = await pool.query(
      `INSERT INTO dispute_messages (dispute_id, sender_id, message, attachments, is_admin)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, req.user.id, message, attachments || [], req.user.is_admin]
    );

    // Update dispute status
    let newStatus = dispute.status;
    if (req.user.id === dispute.opened_by) {
      newStatus = 'pending_seller_response';
    } else if (req.user.id === dispute.against_user) {
      newStatus = 'pending_buyer_response';
    } else if (req.user.is_admin) {
      newStatus = 'under_review';
    }

    await pool.query(
      'UPDATE disputes SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStatus, id]
    );

    res.status(201).json({
      success: true,
      message: {
        id: result.rows[0].id,
        message: result.rows[0].message,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resolve dispute (admin only)
const resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionType, resolutionNotes, refundAmount } = req.body;

    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const disputeResult = await pool.query('SELECT * FROM disputes WHERE id = $1', [id]);

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const result = await pool.query(
      `UPDATE disputes
       SET status = 'resolved',
           resolution_type = $1,
           resolution_notes = $2,
           refund_amount = $3,
           admin_id = $4,
           resolved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [resolutionType, resolutionNotes, refundAmount, req.user.id, id]
    );

    // Log admin action
    await pool.query(
      `INSERT INTO admin_actions (admin_id, action_type, target_type, target_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'resolve_dispute', 'dispute', id, JSON.stringify({ resolutionType, refundAmount })]
    );

    res.json({
      success: true,
      dispute: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// Escalate dispute
const escalateDispute = async (req, res, next) => {
  try {
    const { id } = req.params;

    const disputeResult = await pool.query(
      'SELECT * FROM disputes WHERE id = $1 AND (opened_by = $2 OR against_user = $2)',
      [id, req.user.id]
    );

    if (disputeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    await pool.query(
      `UPDATE disputes SET status = 'escalated', escalated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    res.json({ success: true, message: 'Dispute escalated to admin review' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDispute,
  getDispute,
  getMyDisputes,
  addDisputeMessage,
  resolveDispute,
  escalateDispute,
};
