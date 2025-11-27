// Authenticity Guarantee Controller
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get authenticity categories
const getAuthenticityCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM authenticity_categories ORDER BY category_name`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if item requires authenticity verification
const checkAuthenticityRequired = async (req, res) => {
  try {
    const { categoryName, itemValue, brand } = req.query;

    const result = await pool.query(
      `SELECT * FROM authenticity_categories
       WHERE category_name ILIKE $1
       AND (min_value_threshold <= $2 OR is_mandatory = true)`,
      [categoryName, itemValue]
    );

    const required = result.rows.length > 0;

    res.json({
      required,
      category: result.rows[0] || null,
      message: required
        ? 'This item requires Authenticity Guarantee verification'
        : 'Authenticity Guarantee not required for this item'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create authenticity request
const createAuthenticityRequest = async (req, res) => {
  try {
    const { orderId, productId, itemCategory, brand, model, declaredValue } = req.body;

    // Get order details
    const order = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await pool.query(
      `INSERT INTO authenticity_requests
       (order_id, product_id, seller_id, buyer_id, item_category, brand, model, declared_value, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [orderId, productId, order.rows[0].seller_id, order.rows[0].buyer_id,
       itemCategory, brand, model, declaredValue]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update authenticity status (for internal use / admin)
const updateAuthenticityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isAuthentic, authenticityScore, notes, issuesFound } = req.body;

    let updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let params = [status];
    let paramCount = 1;

    if (status === 'inspecting') {
      updates.push('inspection_date = CURRENT_TIMESTAMP');
    }

    if (isAuthentic !== undefined) {
      paramCount++;
      updates.push(`is_authentic = $${paramCount}`);
      params.push(isAuthentic);

      if (isAuthentic) {
        // Generate certificate
        const certNumber = `AG-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const nfcTagId = uuidv4().substring(0, 8).toUpperCase();

        paramCount++;
        updates.push(`certificate_number = $${paramCount}`);
        params.push(certNumber);

        paramCount++;
        updates.push(`nfc_tag_id = $${paramCount}`);
        params.push(nfcTagId);
      }
    }

    if (authenticityScore !== undefined) {
      paramCount++;
      updates.push(`authenticity_score = $${paramCount}`);
      params.push(authenticityScore);
    }

    if (notes) {
      paramCount++;
      updates.push(`inspection_notes = $${paramCount}`);
      params.push(notes);
    }

    if (issuesFound) {
      paramCount++;
      updates.push(`issues_found = $${paramCount}`);
      params.push(JSON.stringify(issuesFound));
    }

    paramCount++;
    params.push(id);

    const result = await pool.query(
      `UPDATE authenticity_requests
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get authenticity request details
const getAuthenticityRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT ar.*, p.title as product_title, o.order_number,
              seller.username as seller_name, buyer.username as buyer_name
       FROM authenticity_requests ar
       JOIN products p ON ar.product_id = p.id
       JOIN orders o ON ar.order_id = o.id
       JOIN users seller ON ar.seller_id = seller.id
       JOIN users buyer ON ar.buyer_id = buyer.id
       WHERE ar.id = $1 AND (ar.buyer_id = $2 OR ar.seller_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's authenticity requests
const getUserAuthenticityRequests = async (req, res) => {
  try {
    const { type = 'buyer' } = req.query;
    const whereClause = type === 'seller' ? 'ar.seller_id = $1' : 'ar.buyer_id = $1';

    const result = await pool.query(
      `SELECT ar.*, p.title as product_title, o.order_number
       FROM authenticity_requests ar
       JOIN products p ON ar.product_id = p.id
       JOIN orders o ON ar.order_id = o.id
       WHERE ${whereClause}
       ORDER BY ar.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify authenticity certificate
const verifyCertificate = async (req, res) => {
  try {
    const { certificateNumber, nfcTagId } = req.query;

    let whereClause = '';
    const params = [];

    if (certificateNumber) {
      whereClause = 'certificate_number = $1';
      params.push(certificateNumber);
    } else if (nfcTagId) {
      whereClause = 'nfc_tag_id = $1';
      params.push(nfcTagId);
    } else {
      return res.status(400).json({ error: 'Certificate number or NFC tag ID required' });
    }

    const result = await pool.query(
      `SELECT ar.*, p.title as product_title, p.id as product_id
       FROM authenticity_requests ar
       JOIN products p ON ar.product_id = p.id
       WHERE ${whereClause} AND ar.is_authentic = true`,
      params
    );

    if (result.rows.length === 0) {
      return res.json({
        verified: false,
        message: 'Certificate not found or item not authenticated'
      });
    }

    const item = result.rows[0];
    res.json({
      verified: true,
      item: {
        brand: item.brand,
        model: item.model,
        category: item.item_category,
        authenticatedDate: item.inspection_date,
        certificateNumber: item.certificate_number,
        productTitle: item.product_title
      },
      message: 'This item has been verified as authentic'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAuthenticityCategories,
  checkAuthenticityRequired,
  createAuthenticityRequest,
  updateAuthenticityStatus,
  getAuthenticityRequest,
  getUserAuthenticityRequests,
  verifyCertificate
};
