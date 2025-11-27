// Local Pickup Controller
const { pool } = require('../config/database');

// Get seller's local pickup settings
const getPickupSettings = async (req, res) => {
  try {
    const sellerId = req.params.sellerId || req.user.id;

    const result = await pool.query(
      `SELECT * FROM local_pickup_settings WHERE seller_id = $1`,
      [sellerId]
    );

    if (result.rows.length === 0) {
      return res.json({ hasLocalPickup: false, settings: null });
    }

    res.json({ hasLocalPickup: true, settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create or update pickup settings
const updatePickupSettings = async (req, res) => {
  try {
    const {
      pickupAddress, pickupCity, pickupState, pickupZip, pickupCountry,
      availableDays, availableHoursStart, availableHoursEnd,
      maxPickupRadius, specialInstructions, requiresAppointment
    } = req.body;

    const result = await pool.query(
      `INSERT INTO local_pickup_settings
       (seller_id, pickup_address, pickup_city, pickup_state, pickup_zip, pickup_country,
        available_days, available_hours_start, available_hours_end,
        max_pickup_radius, special_instructions, requires_appointment, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, true)
       ON CONFLICT (seller_id) DO UPDATE SET
        pickup_address = $2, pickup_city = $3, pickup_state = $4, pickup_zip = $5, pickup_country = $6,
        available_days = $7, available_hours_start = $8, available_hours_end = $9,
        max_pickup_radius = $10, special_instructions = $11, requires_appointment = $12,
        updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [req.user.id, pickupAddress, pickupCity, pickupState, pickupZip, pickupCountry || 'US',
       JSON.stringify(availableDays), availableHoursStart, availableHoursEnd,
       maxPickupRadius || 25, specialInstructions, requiresAppointment || false]
    );

    res.json({ message: 'Pickup settings updated', settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle local pickup availability
const togglePickupAvailability = async (req, res) => {
  try {
    const { isActive } = req.body;

    const result = await pool.query(
      `UPDATE local_pickup_settings
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE seller_id = $2
       RETURNING *`,
      [isActive, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pickup settings not found' });
    }

    res.json({ message: `Local pickup ${isActive ? 'enabled' : 'disabled'}`, settings: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check if local pickup is available for product
const checkPickupAvailability = async (req, res) => {
  try {
    const { productId } = req.params;
    const { buyerZip } = req.query;

    // Get product and seller info
    const product = await pool.query(
      `SELECT p.seller_id, lps.*
       FROM products p
       LEFT JOIN local_pickup_settings lps ON p.seller_id = lps.seller_id
       WHERE p.id = $1`,
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const settings = product.rows[0];

    if (!settings.is_active) {
      return res.json({
        available: false,
        message: 'Seller does not offer local pickup'
      });
    }

    // In production, calculate distance using geocoding
    // For now, simulate distance check based on zip code prefix
    let withinRange = true;
    if (buyerZip && settings.pickup_zip) {
      // Simple check: same zip prefix (first 3 digits)
      withinRange = buyerZip.substring(0, 3) === settings.pickup_zip.substring(0, 3);
    }

    res.json({
      available: withinRange,
      settings: {
        city: settings.pickup_city,
        state: settings.pickup_state,
        availableDays: JSON.parse(settings.available_days || '[]'),
        hoursStart: settings.available_hours_start,
        hoursEnd: settings.available_hours_end,
        requiresAppointment: settings.requires_appointment,
        specialInstructions: settings.special_instructions
      },
      message: withinRange
        ? `Local pickup available in ${settings.pickup_city}, ${settings.pickup_state}`
        : 'Outside seller\'s pickup radius'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Schedule pickup appointment
const schedulePickup = async (req, res) => {
  try {
    const { orderId, scheduledDate, scheduledTime, buyerPhone, buyerNotes } = req.body;

    // Get order details
    const order = await pool.query(
      `SELECT o.*, lps.*
       FROM orders o
       JOIN local_pickup_settings lps ON o.seller_id = lps.seller_id
       WHERE o.id = $1 AND o.buyer_id = $2`,
      [orderId, req.user.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const orderData = order.rows[0];

    // Validate scheduled time is within seller's available hours
    const availableDays = JSON.parse(orderData.available_days || '[]');
    const scheduledDay = new Date(scheduledDate).toLocaleDateString('en-US', { weekday: 'long' });

    if (!availableDays.includes(scheduledDay)) {
      return res.status(400).json({ error: 'Seller is not available on this day' });
    }

    const result = await pool.query(
      `INSERT INTO local_pickup_appointments
       (order_id, seller_id, buyer_id, scheduled_date, scheduled_time, buyer_phone, buyer_notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING *`,
      [orderId, orderData.seller_id, req.user.id, scheduledDate, scheduledTime, buyerPhone, buyerNotes]
    );

    // Update order status
    await pool.query(
      `UPDATE orders SET shipping_method = 'local_pickup', status = 'pickup_scheduled' WHERE id = $1`,
      [orderId]
    );

    res.status(201).json({
      message: 'Pickup appointment scheduled',
      appointment: result.rows[0],
      pickupLocation: {
        address: orderData.pickup_address,
        city: orderData.pickup_city,
        state: orderData.pickup_state,
        zip: orderData.pickup_zip,
        instructions: orderData.special_instructions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get pickup appointment details
const getPickupAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;

    const result = await pool.query(
      `SELECT lpa.*, o.order_number, p.title as product_title,
              lps.pickup_address, lps.pickup_city, lps.pickup_state, lps.pickup_zip, lps.special_instructions,
              seller.username as seller_name, buyer.username as buyer_name
       FROM local_pickup_appointments lpa
       JOIN orders o ON lpa.order_id = o.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       JOIN local_pickup_settings lps ON lpa.seller_id = lps.seller_id
       JOIN users seller ON lpa.seller_id = seller.id
       JOIN users buyer ON lpa.buyer_id = buyer.id
       WHERE lpa.id = $1 AND (lpa.buyer_id = $2 OR lpa.seller_id = $2)`,
      [appointmentId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update pickup appointment status (seller confirms/completes)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, sellerNotes } = req.body;

    const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];
    let paramCount = 1;

    if (status === 'confirmed') {
      updates.push('confirmed_at = CURRENT_TIMESTAMP');
    } else if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }

    if (sellerNotes) {
      paramCount++;
      updates.push(`seller_notes = $${paramCount}`);
      params.push(sellerNotes);
    }

    paramCount++;
    params.push(appointmentId);
    paramCount++;
    params.push(req.user.id);

    const result = await pool.query(
      `UPDATE local_pickup_appointments
       SET ${updates.join(', ')}
       WHERE id = $${paramCount - 1} AND seller_id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Update order status if pickup completed
    if (status === 'completed') {
      await pool.query(
        `UPDATE orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [result.rows[0].order_id]
      );
    }

    res.json({ message: `Appointment ${status}`, appointment: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller's pending pickups
const getSellerPickups = async (req, res) => {
  try {
    const { status } = req.query;

    let whereClause = 'lpa.seller_id = $1';
    const params = [req.user.id];

    if (status) {
      whereClause += ' AND lpa.status = $2';
      params.push(status);
    }

    const result = await pool.query(
      `SELECT lpa.*, o.order_number, buyer.username as buyer_name,
              p.title as product_title
       FROM local_pickup_appointments lpa
       JOIN orders o ON lpa.order_id = o.id
       JOIN users buyer ON lpa.buyer_id = buyer.id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE ${whereClause}
       ORDER BY lpa.scheduled_date ASC, lpa.scheduled_time ASC`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get buyer's pickup appointments
const getBuyerPickups = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lpa.*, o.order_number, seller.username as seller_name,
              lps.pickup_address, lps.pickup_city, lps.pickup_state, lps.pickup_zip,
              p.title as product_title
       FROM local_pickup_appointments lpa
       JOIN orders o ON lpa.order_id = o.id
       JOIN users seller ON lpa.seller_id = seller.id
       JOIN local_pickup_settings lps ON lpa.seller_id = lps.seller_id
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE lpa.buyer_id = $1
       ORDER BY lpa.scheduled_date DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPickupSettings,
  updatePickupSettings,
  togglePickupAvailability,
  checkPickupAvailability,
  schedulePickup,
  getPickupAppointment,
  updateAppointmentStatus,
  getSellerPickups,
  getBuyerPickups
};
