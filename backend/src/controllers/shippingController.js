// Shipping Controller - Complete Implementation
const { pool } = require('../config/database');

// Initialize tables if they don't exist
const initializeTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_carriers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(20) UNIQUE NOT NULL,
        tracking_url_template VARCHAR(500),
        logo_url VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_rates (
        id SERIAL PRIMARY KEY,
        carrier_id INTEGER REFERENCES shipping_carriers(id) ON DELETE CASCADE,
        service_name VARCHAR(100) NOT NULL,
        service_code VARCHAR(50) NOT NULL,
        base_rate DECIMAL(10,2) NOT NULL,
        rate_per_lb DECIMAL(10,2) DEFAULT 0,
        estimated_days_min INTEGER DEFAULT 1,
        estimated_days_max INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_labels (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
        carrier_id INTEGER REFERENCES shipping_carriers(id),
        tracking_number VARCHAR(100),
        label_cost DECIMAL(10,2),
        weight DECIMAL(10,2),
        dimensions JSONB,
        from_address JSONB,
        to_address JSONB,
        label_data TEXT,
        status VARCHAR(20) DEFAULT 'purchased',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipping_tracking_events (
        id SERIAL PRIMARY KEY,
        tracking_number VARCHAR(100) NOT NULL,
        event_date TIMESTAMP DEFAULT NOW(),
        location VARCHAR(200),
        status VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Insert default carriers if none exist
    const existingCarriers = await pool.query('SELECT COUNT(*) FROM shipping_carriers');
    if (parseInt(existingCarriers.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO shipping_carriers (name, code, tracking_url_template, is_active)
        VALUES
          ('USPS', 'usps', 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking}', true),
          ('UPS', 'ups', 'https://www.ups.com/track?tracknum={tracking}', true),
          ('FedEx', 'fedex', 'https://www.fedex.com/fedextrack/?trknbr={tracking}', true),
          ('DHL', 'dhl', 'https://www.dhl.com/en/express/tracking.html?AWB={tracking}', true)
      `);

      // Insert default shipping rates
      await pool.query(`
        INSERT INTO shipping_rates (carrier_id, service_name, service_code, base_rate, rate_per_lb, estimated_days_min, estimated_days_max)
        VALUES
          (1, 'USPS Priority Mail', 'priority', 7.95, 0.50, 1, 3),
          (1, 'USPS First Class', 'first_class', 4.50, 0.30, 3, 5),
          (1, 'USPS Ground Advantage', 'ground', 5.95, 0.40, 2, 5),
          (1, 'USPS Priority Mail Express', 'express', 26.95, 0.75, 1, 2),
          (2, 'UPS Ground', 'ground', 9.99, 0.60, 3, 5),
          (2, 'UPS 3 Day Select', '3day', 15.99, 0.80, 2, 3),
          (2, 'UPS 2nd Day Air', '2day', 22.99, 1.00, 1, 2),
          (2, 'UPS Next Day Air', 'overnight', 39.99, 1.50, 1, 1),
          (3, 'FedEx Ground', 'ground', 9.49, 0.55, 3, 5),
          (3, 'FedEx Express Saver', 'express_saver', 16.99, 0.85, 2, 3),
          (3, 'FedEx 2Day', '2day', 24.99, 1.10, 1, 2),
          (3, 'FedEx Priority Overnight', 'overnight', 44.99, 1.75, 1, 1),
          (4, 'DHL Express', 'express', 29.99, 1.25, 2, 4),
          (4, 'DHL Express Worldwide', 'worldwide', 49.99, 2.00, 3, 7)
      `);
    }
  } catch (error) {
    console.error('Error initializing shipping tables:', error.message);
  }
};

// Initialize on module load
initializeTables();

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
        logoUrl: c.logo_url
      })),
    });
  } catch (error) {
    console.error('Get carriers error:', error.message);
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
    console.error('Get shipping rates error:', error.message);
    next(error);
  }
};

// Get all shipping rates
const getAllRates = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT sr.*, sc.name as carrier_name, sc.code as carrier_code
       FROM shipping_rates sr
       JOIN shipping_carriers sc ON sr.carrier_id = sc.id
       WHERE sr.is_active = true AND sc.is_active = true
       ORDER BY sr.base_rate`
    );

    res.json({
      rates: result.rows.map((r) => ({
        id: r.id,
        carrierId: r.carrier_id,
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
    console.error('Get all rates error:', error.message);
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
      const totalCost = baseRate + ratePerLb * Math.ceil(weightNum);

      return {
        carrierId: r.carrier_id,
        carrierName: r.carrier_name,
        carrierCode: r.carrier_code,
        serviceName: r.service_name,
        serviceCode: r.service_code,
        cost: Math.round(totalCost * 100) / 100,
        estimatedDays: `${r.estimated_days_min}-${r.estimated_days_max} business days`,
        estimatedDaysMin: r.estimated_days_min,
        estimatedDaysMax: r.estimated_days_max
      };
    });

    res.json({ rates });
  } catch (error) {
    console.error('Calculate shipping error:', error.message);
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
      return res.status(404).json({ error: 'Order not found or you are not the seller' });
    }

    const order = orderResult.rows[0];

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({ error: 'Order has already been shipped' });
    }

    // Get shipping rate
    const rateResult = await pool.query(
      'SELECT sr.*, sc.name as carrier_name FROM shipping_rates sr JOIN shipping_carriers sc ON sr.carrier_id = sc.id WHERE sr.carrier_id = $1 AND sr.service_code = $2',
      [carrierId, serviceCode]
    );

    if (rateResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid shipping rate' });
    }

    const rate = rateResult.rows[0];
    const labelCost = parseFloat(rate.base_rate) + parseFloat(rate.rate_per_lb) * Math.ceil(weight || 1);

    // Generate tracking number
    const carrierCode = rate.carrier_name.substring(0, 2).toUpperCase();
    const trackingNumber = `${carrierCode}${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO shipping_labels (order_id, carrier_id, tracking_number, label_cost, weight, dimensions, from_address, to_address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'purchased') RETURNING *`,
      [orderId, carrierId, trackingNumber, labelCost, weight, JSON.stringify(dimensions), JSON.stringify(fromAddress), JSON.stringify(toAddress)]
    );

    // Update order with tracking
    await pool.query(
      `UPDATE orders SET tracking_number = $1, shipping_carrier = $2, status = 'shipped', shipped_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [trackingNumber, rate.carrier_name, orderId]
    );

    // Create initial tracking event
    await pool.query(
      `INSERT INTO shipping_tracking_events (tracking_number, status, description, location)
       VALUES ($1, 'Label Created', 'Shipping label has been created', $2)`,
      [trackingNumber, fromAddress?.city || 'Origin']
    );

    res.status(201).json({
      success: true,
      label: {
        id: result.rows[0].id,
        trackingNumber,
        carrierName: rate.carrier_name,
        serviceName: rate.service_name,
        labelCost: Math.round(labelCost * 100) / 100,
        labelUrl: `/api/shipping/labels/${result.rows[0].id}/download`,
        estimatedDelivery: `${rate.estimated_days_min}-${rate.estimated_days_max} business days`
      },
    });
  } catch (error) {
    console.error('Create shipping label error:', error.message);
    next(error);
  }
};

// Get shipping label
const getShippingLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT sl.*, sc.name as carrier_name, sc.tracking_url_template,
              sr.service_name, sr.estimated_days_min, sr.estimated_days_max
       FROM shipping_labels sl
       JOIN shipping_carriers sc ON sl.carrier_id = sc.id
       LEFT JOIN shipping_rates sr ON sr.carrier_id = sc.id AND sr.service_code = (
         SELECT service_code FROM shipping_rates WHERE carrier_id = sl.carrier_id LIMIT 1
       )
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
        serviceName: label.service_name,
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
    console.error('Get shipping label error:', error.message);
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

    // Get tracking events from database
    const eventsResult = await pool.query(
      `SELECT * FROM shipping_tracking_events
       WHERE tracking_number = $1
       ORDER BY event_date ASC`,
      [trackingNumber]
    );

    let events = eventsResult.rows.map(e => ({
      date: e.event_date,
      location: e.location,
      status: e.status,
      description: e.description
    }));

    // If no events exist, create initial events based on shipment date
    if (events.length === 0) {
      events = [
        {
          date: shipment.created_at,
          location: 'Origin Facility',
          status: 'Label Created',
          description: 'Shipping label has been created',
        }
      ];

      // Add more events if order is delivered
      if (shipment.order_status === 'delivered') {
        events.push(
          {
            date: new Date(new Date(shipment.created_at).getTime() + 3600000),
            location: 'Origin Facility',
            status: 'Picked Up',
            description: 'Package picked up by carrier',
          },
          {
            date: new Date(new Date(shipment.created_at).getTime() + 86400000),
            location: 'In Transit',
            status: 'In Transit',
            description: 'Package in transit to destination',
          },
          {
            date: new Date(),
            location: 'Destination',
            status: 'Delivered',
            description: 'Package delivered',
          }
        );
      } else if (shipment.order_status === 'shipped') {
        events.push({
          date: new Date(new Date(shipment.created_at).getTime() + 3600000),
          location: 'Origin Facility',
          status: 'Picked Up',
          description: 'Package picked up by carrier',
        });
      }
    }

    res.json({
      tracking: {
        trackingNumber: shipment.tracking_number,
        carrierName: shipment.carrier_name,
        trackingUrl: shipment.tracking_url_template?.replace('{tracking}', shipment.tracking_number),
        status: shipment.order_status,
        currentStatus: events[events.length - 1]?.status || 'Label Created',
        events,
      },
    });
  } catch (error) {
    console.error('Track shipment error:', error.message);
    next(error);
  }
};

// Add tracking event (for testing/admin use)
const addTrackingEvent = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;
    const { status, location, description } = req.body;

    // Verify tracking number exists
    const labelResult = await pool.query(
      `SELECT sl.*, o.seller_id FROM shipping_labels sl
       JOIN orders o ON sl.order_id = o.id
       WHERE sl.tracking_number = $1`,
      [trackingNumber]
    );

    if (labelResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }

    // Verify user is seller or admin
    if (labelResult.rows[0].seller_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(
      `INSERT INTO shipping_tracking_events (tracking_number, status, location, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [trackingNumber, status, location, description]
    );

    // Update order status if delivered
    if (status.toLowerCase() === 'delivered') {
      await pool.query(
        `UPDATE orders SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [labelResult.rows[0].order_id]
      );
    }

    res.status(201).json({
      success: true,
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Add tracking event error:', error.message);
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
      `SELECT sl.*, sc.name as carrier_name, sc.tracking_url_template,
              sr.service_name, sr.estimated_days_min, sr.estimated_days_max
       FROM shipping_labels sl
       JOIN shipping_carriers sc ON sl.carrier_id = sc.id
       LEFT JOIN shipping_rates sr ON sr.carrier_id = sc.id
       WHERE sl.order_id = $1
       ORDER BY sl.created_at DESC
       LIMIT 1`,
      [orderId]
    );

    if (labelResult.rows.length === 0) {
      return res.json({ shipping: null });
    }

    const label = labelResult.rows[0];

    // Get latest tracking event
    const eventResult = await pool.query(
      `SELECT * FROM shipping_tracking_events
       WHERE tracking_number = $1
       ORDER BY event_date DESC LIMIT 1`,
      [label.tracking_number]
    );

    res.json({
      shipping: {
        trackingNumber: label.tracking_number,
        carrierName: label.carrier_name,
        serviceName: label.service_name,
        trackingUrl: label.tracking_url_template?.replace('{tracking}', label.tracking_number),
        labelCost: parseFloat(label.label_cost),
        estimatedDelivery: label.estimated_days_min && label.estimated_days_max
          ? `${label.estimated_days_min}-${label.estimated_days_max} business days`
          : null,
        currentStatus: eventResult.rows[0]?.status || 'Label Created',
        lastUpdate: eventResult.rows[0]?.event_date || label.created_at,
        createdAt: label.created_at,
      },
    });
  } catch (error) {
    console.error('Get order shipping error:', error.message);
    next(error);
  }
};

// Void shipping label
const voidShippingLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT sl.*, o.seller_id, o.status as order_status FROM shipping_labels sl
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

    if (result.rows[0].order_status === 'delivered') {
      return res.status(400).json({ error: 'Cannot void label for delivered order' });
    }

    await pool.query(
      'UPDATE shipping_labels SET status = $1 WHERE id = $2',
      ['voided', id]
    );

    // Reset order tracking info
    await pool.query(
      `UPDATE orders SET tracking_number = NULL, shipping_carrier = NULL, status = 'paid', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [result.rows[0].order_id]
    );

    res.json({ success: true, message: 'Shipping label voided. Refund will be processed within 24 hours.' });
  } catch (error) {
    console.error('Void shipping label error:', error.message);
    next(error);
  }
};

// Get seller's shipping labels
const getSellerLabels = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'o.seller_id = $1';
    const params = [req.user.id];

    if (status) {
      params.push(status);
      whereClause += ` AND sl.status = $${params.length}`;
    }

    const result = await pool.query(
      `SELECT sl.*, sc.name as carrier_name, o.order_number
       FROM shipping_labels sl
       JOIN shipping_carriers sc ON sl.carrier_id = sc.id
       JOIN orders o ON sl.order_id = o.id
       WHERE ${whereClause}
       ORDER BY sl.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM shipping_labels sl
       JOIN orders o ON sl.order_id = o.id
       WHERE ${whereClause}`,
      params
    );

    res.json({
      labels: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Get seller labels error:', error.message);
    next(error);
  }
};

module.exports = {
  getCarriers,
  getShippingRates,
  getAllRates,
  calculateShipping,
  createShippingLabel,
  getShippingLabel,
  trackShipment,
  addTrackingEvent,
  getOrderShipping,
  voidShippingLabel,
  getSellerLabels
};
