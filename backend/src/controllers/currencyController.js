const { pool } = require('../config/database');

// Get all currencies
const getCurrencies = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM currencies WHERE is_active = true ORDER BY code`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's currency preference
const getMyPreference = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ucp.*, c.name, c.symbol
       FROM user_currency_preferences ucp
       JOIN currencies c ON ucp.preferred_currency = c.code
       WHERE ucp.user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.json({ preferred_currency: 'USD', display_converted_prices: true });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Set currency preference
const setPreference = async (req, res) => {
  try {
    const { currency, displayConverted } = req.body;

    const result = await pool.query(
      `INSERT INTO user_currency_preferences (user_id, preferred_currency, display_converted_prices)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id)
       DO UPDATE SET preferred_currency = $2, display_converted_prices = $3
       RETURNING *`,
      [req.user.id, currency, displayConverted !== false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Convert price
const convertPrice = async (req, res) => {
  try {
    const { amount, from, to } = req.query;

    const currencies = await pool.query(
      `SELECT code, exchange_rate_to_usd FROM currencies WHERE code IN ($1, $2)`,
      [from || 'USD', to || 'USD']
    );

    const fromRate = currencies.rows.find(c => c.code === (from || 'USD'))?.exchange_rate_to_usd || 1;
    const toRate = currencies.rows.find(c => c.code === (to || 'USD'))?.exchange_rate_to_usd || 1;

    // Convert to USD first, then to target currency
    const amountInUsd = parseFloat(amount) / fromRate;
    const convertedAmount = amountInUsd * toRate;

    res.json({
      original: { amount: parseFloat(amount), currency: from || 'USD' },
      converted: { amount: convertedAmount.toFixed(2), currency: to || 'USD' },
      rate: toRate / fromRate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update exchange rates (admin only)
const updateRates = async (req, res) => {
  try {
    const { rates } = req.body; // { EUR: 0.92, GBP: 0.79, ... }

    for (const [code, rate] of Object.entries(rates)) {
      await pool.query(
        `UPDATE currencies SET exchange_rate_to_usd = $1, last_updated = NOW() WHERE code = $2`,
        [rate, code]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getCurrencies,
  getMyPreference,
  setPreference,
  convertPrice,
  updateRates
};
