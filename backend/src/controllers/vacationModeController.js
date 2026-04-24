const { pool } = require('../config/database');

// Get current user's vacation status
const getStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vacation_mode, vacation_message, vacation_return_date
         FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get vacation status error:', error.message);
    res.status(500).json({ error: 'Failed to fetch vacation status' });
  }
};

// Update vacation mode for current user
const updateStatus = async (req, res) => {
  try {
    const { vacationMode, message, returnDate } = req.body;

    if (typeof vacationMode !== 'boolean') {
      return res.status(400).json({ error: 'vacationMode boolean is required' });
    }

    const result = await pool.query(
      `UPDATE users
          SET vacation_mode = $1,
              vacation_message = $2,
              vacation_return_date = $3
        WHERE id = $4
        RETURNING vacation_mode, vacation_message, vacation_return_date`,
      [vacationMode, message || null, returnDate || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update vacation status error:', error.message);
    res.status(500).json({ error: 'Failed to update vacation status' });
  }
};

// Public read: check if a seller is on vacation (used by ProductDetail / SellerStore).
const getSellerStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id AS seller_id, username, vacation_mode, vacation_message, vacation_return_date
         FROM users WHERE id = $1`,
      [req.params.sellerId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get seller vacation status error:', error.message);
    res.status(500).json({ error: 'Failed to fetch seller status' });
  }
};

module.exports = { getStatus, updateStatus, getSellerStatus };
