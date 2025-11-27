const { pool } = require('../config/database');

// Get invoice by ID
const getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT i.*, o.order_number, o.status as order_status,
              bu.username as buyer_username, bu.email as buyer_email,
              su.username as seller_username, su.email as seller_email
       FROM invoices i
       JOIN orders o ON i.order_id = o.id
       JOIN users bu ON i.buyer_id = bu.id
       JOIN users su ON i.seller_id = su.id
       WHERE i.id = $1 AND (i.buyer_id = $2 OR i.seller_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get order items
    const items = await pool.query(
      `SELECT oi.*, p.title, p.slug
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [result.rows[0].order_id]
    );

    res.json({
      ...result.rows[0],
      items: items.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my invoices (as buyer)
const getMyInvoices = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, o.order_number, su.username as seller_username
       FROM invoices i
       JOIN orders o ON i.order_id = o.id
       JOIN users su ON i.seller_id = su.id
       WHERE i.buyer_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoices sent (as seller)
const getSentInvoices = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, o.order_number, bu.username as buyer_username
       FROM invoices i
       JOIN orders o ON i.order_id = o.id
       JOIN users bu ON i.buyer_id = bu.id
       WHERE i.seller_id = $1
       ORDER BY i.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate invoice for order
const generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check if invoice already exists
    const existing = await pool.query(
      `SELECT * FROM invoices WHERE order_id = $1`,
      [orderId]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Get order details
    const order = await pool.query(
      `SELECT * FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)`,
      [orderId, req.user.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const o = order.rows[0];
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO invoices (order_id, invoice_number, buyer_id, seller_id, subtotal, tax_amount, shipping_amount, discount_amount, total_amount, status, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [orderId, invoiceNumber, o.buyer_id, o.seller_id, o.subtotal, o.tax, o.shipping_cost, o.discount_amount || 0, o.total, 'issued', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark invoice as paid
const markPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE invoices SET status = 'paid', paid_at = NOW() WHERE id = $1 AND seller_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getInvoice,
  getMyInvoices,
  getSentInvoices,
  generateInvoice,
  markPaid
};
