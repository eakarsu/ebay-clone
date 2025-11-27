const { pool } = require('../config/database');

// Get all shipping carriers
const getCarriers = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM shipping_carriers WHERE is_active = true ORDER BY name'
    );

    res.json({
      carriers: result.rows.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        trackingUrlTemplate: c.tracking_url_template,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get shipping rates for a carrier
const getShippingRates = async (req, res, next) => {
  try {
    const { carrierId } = req.params;

    const result = await pool.query(
      `SELECT sr.*, sc.name as carrier_name, sc.code as carrier_code
       FROM shipping_rates sr
       JOIN shipping_carriers sc ON sr.carrier_id = sc.id
       WHERE sr.carrier_id = $1 AND sr.is_active = true
       ORDER BY sr.base_rate`,
      [carrierId]
    );

    res.json({
      rates: result.rows.map((r) => ({
        id: r.id,
        carrierName: r.carrier_name,
        carrierCode: r.carrier_code,
        serviceName: r.service_name,
        serviceCode: r.service_code,
        baseRate: parseFloat(r.base_rate),
        ratePerLb: parseFloat(r.rate_per_lb),
        estimatedDaysMin: r.estimated_days_min,
        estimatedDaysMax: r.estimated_days_max,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Calculate shipping cost
const calculateShipping = async (req, res, next) => {
  try {
    const { weight, fromZip, toZip, carrierId, serviceCode } = req.body;

    let query = `
      SELECT sr.*, sc.name as carrier_name, sc.code as carrier_code
      FROM shipping_rates sr
      JOIN shipping_carriers sc ON sr.carrier_id = sc.id
      WHERE sr.is_active = true AND sc.is_active = true
    `;
    const params = [];

    if (carrierId) {
      params.push(carrierId);
      query += ` AND sr.carrier_id = $${params.length}`;
    }

    if (serviceCode) {
      params.push(serviceCode);
      query += ` AND sr.service_code = $${params.length}`;
    }

    query += ' ORDER BY sr.base_rate';

    const result = await pool.query(query, params);

    const rates = result.rows.map((r) => {
      const weightNum = parseFloat(weight) || 1;
      const baseRate = parseFloat(r.base_rate);
      const ratePerLb = parseFloat(r.rate_per_lb);
      const totalCost = baseRate + ratePerLb * weightNum;

      return {
        carrierId: r.carrier_id,
        carrierName: r.carrier_name,
        carrierCode: r.carrier_code,
        serviceName: r.service_name,
        serviceCode: r.service_code,
        cost: Math.round(totalCost * 100) / 100,
        estimatedDays: `${r.estimated_days_min}-${r.estimated_days_max} business days`,
      };
    });

    res.json({ rates });
  } catch (error) {
    next(error);
  }
};

// Create shipping label
const createShippingLabel = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { carrierId, serviceCode, weight, dimensions, fromAddress, toAddress } = req.body;

    // Verify order ownership (seller)
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND seller_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get shipping rate
    const rateResult = await pool.query(
      'SELECT * FROM shipping_rates WHERE carrier_id = $1 AND service_code = $2',
      [carrierId, serviceCode]
    );

    if (rateResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid shipping rate' });
    }

    const rate = rateResult.rows[0];
    const labelCost = parseFloat(rate.base_rate) + parseFloat(rate.rate_per_lb) * (weight || 1);

    // Generate tracking number (in production, this would come from carrier API)
    const trackingNumber = `TRK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO shipping_labels (order_id, carrier_id, tracking_number, label_cost, weight, dimensions, from_address, to_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'purchased') RETURNING *`,
      [orderId, carrierId, trackingNumber, labelCost, weight, dimensions, JSON.stringify(fromAddress), JSON.stringify(toAddress)]
    );

    // Update order with tracking
    await pool.query(
      `UPDATE orders SET tracking_number = $1, shipping_carrier = $2, status = 'shipped', updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [trackingNumber, rate.carrier_id, orderId]
    );

    res.status(201).json({
      success: true,
      label: {
        id: result.rows[0].id,
        trackingNumber,
        labelCost: Math.round(labelCost * 100) / 100,
        labelUrl: `/api/shipping/labels/${result.rows[0].id}/download`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get shipping label
const getShippingLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT sl.*, sc.name as carrier_name, sc.tracking_url_template
       FROM shipping_labels sl
       JOIN shipping_carriers sc ON sl.carrier_id = sc.id
       WHERE sl.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }

    const label = result.rows[0];

    res.json({
      label: {
        id: label.id,
        orderId: label.order_id,
        carrierName: label.carrier_name,
        trackingNumber: label.tracking_number,
        trackingUrl: label.tracking_url_template?.replace('{tracking}', label.tracking_number),
        labelCost: parseFloat(label.label_cost),
        weight: parseFloat(label.weight),
        dimensions: label.dimensions,
        fromAddress: label.from_address,
        toAddress: label.to_address,
        status: label.status,
        createdAt: label.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Track shipment
const trackShipment = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;

    const result = await pool.query(
      `SELECT sl.*, sc.name as carrier_name, sc.tracking_url_template, o.status as order_status
       FROM shipping_labels sl
       JOIN shipping_carriers sc ON sl.carrier_id = sc.id
       JOIN orders o ON sl.order_id = o.id
       WHERE sl.tracking_number = $1`,
      [trackingNumber]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }

    const shipment = result.rows[0];

    // In production, this would call carrier API for real tracking events
    const mockEvents = [
      {
        date: shipment.created_at,
        location: 'Origin Facility',
        status: 'Label Created',
        description: 'Shipping label has been created',
      },
      {
        date: new Date(new Date(shipment.created_at).getTime() + 3600000),
        location: 'Origin Facility',
        status: 'Picked Up',
        description: 'Package picked up by carrier',
      },
    ];

    if (shipment.order_status === 'delivered') {
      mockEvents.push({
        date: new Date(),
        location: 'Destination',
        status: 'Delivered',
        description: 'Package delivered',
      });
    }

    res.json({
      tracking: {
        trackingNumber: shipment.tracking_number,
        carrierName: shipment.carrier_name,
        trackingUrl: shipment.tracking_url_template?.replace('{tracking}', shipment.tracking_number),
        status: shipment.order_status,
        events: mockEvents,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get order shipping info
const getOrderShipping = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND (buyer_id = $2 OR seller_id = $2)',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const labelResult = await pool.query(
      `SELECT sl.*, sc.name as carrier_name, sc.tracking_url_template
       FROM shipping_labels sl
       JOIN shipping_carriers sc ON sl.carrier_id = sc.id
       WHERE sl.order_id = $1
       ORDER BY sl.created_at DESC
       LIMIT 1`,
      [orderId]
    );

    if (labelResult.rows.length === 0) {
      return res.json({ shipping: null });
    }

    const label = labelResult.rows[0];

    res.json({
      shipping: {
        trackingNumber: label.tracking_number,
        carrierName: label.carrier_name,
        trackingUrl: label.tracking_url_template?.replace('{tracking}', label.tracking_number),
        labelCost: parseFloat(label.label_cost),
        createdAt: label.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Void shipping label
const voidShippingLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT sl.*, o.seller_id FROM shipping_labels sl
       JOIN orders o ON sl.order_id = o.id
       WHERE sl.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Label not found' });
    }

    if (result.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (result.rows[0].status === 'voided') {
      return res.status(400).json({ error: 'Label already voided' });
    }

    await pool.query(
      'UPDATE shipping_labels SET status = $1 WHERE id = $2',
      ['voided', id]
    );

    res.json({ success: true, message: 'Shipping label voided' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCarriers,
  getShippingRates,
  calculateShipping,
  createShippingLabel,
  getShippingLabel,
  trackShipment,
  getOrderShipping,
  voidShippingLabel,
};
