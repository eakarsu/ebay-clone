// Global Shipping Program Controller
const { pool } = require('../config/database');

// Get supported GSP countries
const getSupportedCountries = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM gsp_countries WHERE is_supported = true ORDER BY country_name`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Calculate import duties and taxes
const calculateDuties = async (req, res) => {
  try {
    const { countryCode, itemValue, categoryId } = req.body;

    const country = await pool.query(
      `SELECT * FROM gsp_countries WHERE country_code = $1`,
      [countryCode]
    );

    if (country.rows.length === 0) {
      return res.status(404).json({ error: 'Country not supported' });
    }

    const { duty_rate_percent, tax_rate_percent, base_shipping_rate } = country.rows[0];

    const importDuties = itemValue * (duty_rate_percent / 100);
    const importTaxes = (itemValue + importDuties) * (tax_rate_percent / 100);
    const shippingCost = parseFloat(base_shipping_rate);
    const totalCost = itemValue + importDuties + importTaxes + shippingCost;

    res.json({
      itemValue,
      importDuties: parseFloat(importDuties.toFixed(2)),
      importTaxes: parseFloat(importTaxes.toFixed(2)),
      shippingCost,
      totalCost: parseFloat(totalCost.toFixed(2)),
      estimatedDays: `${country.rows[0].estimated_days_min}-${country.rows[0].estimated_days_max}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create GSP shipment
const createGspShipment = async (req, res) => {
  try {
    const { orderId, destinationCountry, destinationAddress, customsValue } = req.body;

    // Get order details
    const order = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get country rates
    const country = await pool.query(
      `SELECT * FROM gsp_countries WHERE country_code = $1`,
      [destinationCountry]
    );

    const importDuties = customsValue * (country.rows[0]?.duty_rate_percent || 0) / 100;
    const importTaxes = (customsValue + importDuties) * (country.rows[0]?.tax_rate_percent || 0) / 100;

    const result = await pool.query(
      `INSERT INTO gsp_shipments
       (order_id, seller_id, buyer_id, destination_country, destination_address, customs_value, import_duties, import_taxes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
       RETURNING *`,
      [orderId, order.rows[0].seller_id, order.rows[0].buyer_id, destinationCountry,
       JSON.stringify(destinationAddress), customsValue, importDuties, importTaxes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get GSP shipment status
const getGspShipment = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT g.*, o.order_number
       FROM gsp_shipments g
       JOIN orders o ON g.order_id = o.id
       WHERE g.id = $1 AND (g.buyer_id = $2 OR g.seller_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update GSP shipment (for sellers - ship to hub)
const updateDomesticShipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, carrier } = req.body;

    const result = await pool.query(
      `UPDATE gsp_shipments
       SET domestic_tracking_number = $1, domestic_carrier = $2,
           domestic_shipped_at = CURRENT_TIMESTAMP, status = 'shipped_to_hub',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND seller_id = $4
       RETURNING *`,
      [trackingNumber, carrier, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user's GSP shipments
const getUserGspShipments = async (req, res) => {
  try {
    const { type = 'buyer' } = req.query;
    const whereClause = type === 'seller' ? 'seller_id = $1' : 'buyer_id = $1';

    const result = await pool.query(
      `SELECT g.*, o.order_number
       FROM gsp_shipments g
       JOIN orders o ON g.order_id = o.id
       WHERE ${whereClause}
       ORDER BY g.created_at DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSupportedCountries,
  calculateDuties,
  createGspShipment,
  getGspShipment,
  updateDomesticShipment,
  getUserGspShipments
};
