const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const feedbackService = require('../services/feedbackService');
const { checkAndNotifyLowStock } = require('./lowStockController');

// Validate a coupon code against a running subtotal (and optional seller scope).
// Returns { coupon, discountAmount } or throws a user-facing Error.
// Uses the supplied client so it's part of the same transaction as order creation.
const validateCouponForOrder = async (client, code, userId, subtotal, sellerId) => {
  const result = await client.query(
    `SELECT * FROM coupons
      WHERE code = $1
        AND is_active = true
        AND start_date <= CURRENT_TIMESTAMP
        AND end_date >= CURRENT_TIMESTAMP`,
    [code.toUpperCase()]
  );
  if (result.rows.length === 0) throw new Error('Invalid or expired coupon code');
  const coupon = result.rows[0];

  if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
    throw new Error('Coupon usage limit reached');
  }
  if (coupon.per_user_limit) {
    const used = await client.query(
      'SELECT COUNT(*) AS c FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
      [coupon.id, userId]
    );
    if (parseInt(used.rows[0].c, 10) >= coupon.per_user_limit) {
      throw new Error('You have already used this coupon');
    }
  }
  if (coupon.min_purchase_amount && subtotal < parseFloat(coupon.min_purchase_amount)) {
    throw new Error(`Minimum purchase of $${coupon.min_purchase_amount} required`);
  }
  // Seller-issued coupons only apply to that seller's items.
  if (coupon.seller_id && sellerId && coupon.seller_id !== sellerId) {
    throw new Error('Coupon not valid for this seller');
  }

  let discountAmount = 0;
  if (coupon.discount_type === 'percentage') {
    discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
    }
  } else if (coupon.discount_type === 'fixed_amount') {
    discountAmount = Math.min(parseFloat(coupon.discount_value), subtotal);
  }
  discountAmount = Math.round(discountAmount * 100) / 100;
  return { coupon, discountAmount };
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EB-${timestamp}-${random}`;
};

const createOrder = async (req, res, next) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { items, shippingAddressId, billingAddressId, paymentMethodId, couponCode } = req.body;

    // Group items by seller
    const itemsByS = {};
    for (const item of items) {
      const productResult = await client.query(
        `SELECT id, seller_id, title, current_price, buy_now_price, listing_type,
                quantity, quantity_sold, shipping_cost, free_shipping, status
         FROM products WHERE id = $1 FOR UPDATE`,
        [item.productId]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product ${item.productId} not found` });
      }

      const product = productResult.rows[0];

      if (product.status !== 'active') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product "${product.title}" is no longer available` });
      }

      const availableQty = product.quantity - product.quantity_sold;
      if (item.quantity > availableQty) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Only ${availableQty} of "${product.title}" available` });
      }

      const sellerId = product.seller_id;
      if (!itemsByS[sellerId]) {
        itemsByS[sellerId] = [];
      }
      itemsByS[sellerId].push({ ...item, product });
    }

    const orders = [];
    const stockChangedProductIds = [];

    // Create order for each seller
    for (const [sellerId, sellerItems] of Object.entries(itemsByS)) {
      let subtotal = 0;
      let shippingTotal = 0;

      for (const item of sellerItems) {
        const price = item.product.buy_now_price || item.product.current_price;
        subtotal += parseFloat(price) * item.quantity;
        if (!item.product.free_shipping) {
          shippingTotal += parseFloat(item.product.shipping_cost) || 0;
        }
      }

      const tax = subtotal * 0.08; // 8% tax

      // Apply coupon per-seller. Seller-scoped coupons only hit their own seller's
      // order; admin-issued (seller_id = null) coupons apply to every sub-order.
      let couponRow = null;
      let discountApplied = 0;
      if (couponCode) {
        try {
          const { coupon, discountAmount } = await validateCouponForOrder(
            client, couponCode, req.user.id, subtotal, sellerId
          );
          couponRow = coupon;
          discountApplied = discountAmount;
        } catch (e) {
          // Seller-scope mismatch isn't fatal — just skip for this sub-order.
          if (!/not valid for this seller/.test(e.message)) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: e.message });
          }
        }
      }

      const total = Math.max(0, subtotal + shippingTotal + tax - discountApplied);

      const orderResult = await client.query(
        `INSERT INTO orders (order_number, buyer_id, seller_id, subtotal, shipping_cost, tax, total,
                             shipping_address_id, billing_address_id, payment_method_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed')
         RETURNING *`,
        [
          generateOrderNumber(), req.user.id, sellerId, subtotal, shippingTotal, tax, total,
          shippingAddressId, billingAddressId || shippingAddressId, paymentMethodId,
        ]
      );

      const order = orderResult.rows[0];

      // Create order items and update product quantities
      for (const item of sellerItems) {
        const price = item.product.buy_now_price || item.product.current_price;
        const itemTotal = parseFloat(price) * item.quantity;

        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.productId, item.quantity, price, itemTotal]
        );

        // Update product quantity
        await client.query(
          `UPDATE products SET quantity_sold = quantity_sold + $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.productId]
        );
        stockChangedProductIds.push(item.productId);

        // Check if sold out
        const updatedProduct = await client.query(
          'SELECT quantity, quantity_sold FROM products WHERE id = $1',
          [item.productId]
        );
        if (updatedProduct.rows[0].quantity <= updatedProduct.rows[0].quantity_sold) {
          await client.query("UPDATE products SET status = 'sold' WHERE id = $1", [item.productId]);
        }
      }

      // Record coupon usage for this sub-order (if one was applied).
      if (couponRow && discountApplied > 0) {
        await client.query(
          `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_applied)
           VALUES ($1, $2, $3, $4)`,
          [couponRow.id, req.user.id, order.id, discountApplied]
        );
        await client.query(
          `UPDATE coupons SET usage_count = usage_count + 1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1`,
          [couponRow.id]
        );
      }

      // Update seller stats
      await client.query(
        `UPDATE users SET total_sales = total_sales + $1 WHERE id = $2`,
        [sellerItems.length, sellerId]
      );

      // Notify seller
      await client.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'item_sold', 'You made a sale!', $2, $3)`,
        [
          sellerId,
          `Order #${order.order_number} - Total: $${total.toFixed(2)}`,
          `/orders/${order.id}`,
        ]
      );

      orders.push({
        id: order.id,
        orderNumber: order.order_number,
        subtotal: parseFloat(order.subtotal),
        shippingCost: parseFloat(order.shipping_cost),
        tax: parseFloat(order.tax),
        total: parseFloat(order.total),
        status: order.status,
        createdAt: order.created_at,
      });
    }

    // Clear cart
    await client.query(
      `DELETE FROM cart_items
       WHERE cart_id = (SELECT id FROM shopping_carts WHERE user_id = $1)`,
      [req.user.id]
    );

    await client.query('COMMIT');

    // Fire low-stock alerts after COMMIT so a notification insert failure
    // never rolls back the order. Non-blocking.
    Promise.all(stockChangedProductIds.map((id) => checkAndNotifyLowStock(id))).catch(() => {});

    res.status(201).json({
      message: 'Order(s) placed successfully',
      orders,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { type = 'purchases', status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause;
    if (type === 'sales') {
      whereClause = 'o.seller_id = $1';
    } else {
      whereClause = 'o.buyer_id = $1';
    }

    const params = [req.user.id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      whereClause += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    params.push(limit, offset);

    const result = await pool.query(
      `SELECT o.*, u.username as other_party_username, u.id as other_party_id
       FROM orders o
       JOIN users u ON u.id = ${type === 'sales' ? 'o.buyer_id' : 'o.seller_id'}
       WHERE ${whereClause}
       ORDER BY o.created_at DESC
       LIMIT $${limitParam} OFFSET $${offsetParam}`,
      params
    );

    // Get order items
    const orders = await Promise.all(
      result.rows.map(async (order) => {
        const itemsResult = await pool.query(
          `SELECT oi.*, p.title, p.slug,
                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [order.id]
        );

        return {
          id: order.id,
          orderNumber: order.order_number,
          subtotal: parseFloat(order.subtotal),
          shippingCost: parseFloat(order.shipping_cost),
          tax: parseFloat(order.tax),
          total: parseFloat(order.total),
          status: order.status,
          paymentStatus: order.payment_status,
          trackingNumber: order.tracking_number,
          shippedAt: order.shipped_at,
          deliveredAt: order.delivered_at,
          createdAt: order.created_at,
          otherParty: order.other_party_username,
          otherPartyId: order.other_party_id,
          items: itemsResult.rows.map(item => ({
            id: item.id,
            productId: item.product_id,
            title: item.title,
            slug: item.slug,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unit_price),
            totalPrice: parseFloat(item.total_price),
            image: item.image,
          })),
        };
      })
    );

    const countParams = type === 'sales'
      ? [req.user.id]
      : [req.user.id];
    if (status) countParams.push(status);

    const countQuery = status
      ? `SELECT COUNT(*) as total FROM orders o WHERE ${type === 'sales' ? 'o.seller_id' : 'o.buyer_id'} = $1 AND o.status = $2`
      : `SELECT COUNT(*) as total FROM orders o WHERE ${type === 'sales' ? 'o.seller_id' : 'o.buyer_id'} = $1`;

    const countResult = await pool.query(countQuery, countParams);

    res.json({
      orders,
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

const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT o.*,
              buyer.username as buyer_username, buyer.email as buyer_email,
              seller.username as seller_username, seller.email as seller_email,
              sa.full_name as ship_name, sa.street_address as ship_street,
              sa.city as ship_city, sa.state as ship_state, sa.postal_code as ship_zip,
              sa.country as ship_country
       FROM orders o
       JOIN users buyer ON o.buyer_id = buyer.id
       JOIN users seller ON o.seller_id = seller.id
       LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
       WHERE o.id = $1 AND (o.buyer_id = $2 OR o.seller_id = $2)`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = result.rows[0];

    const itemsResult = await pool.query(
      `SELECT oi.*, p.title, p.slug, p.condition,
              (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as image
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      id: order.id,
      orderNumber: order.order_number,
      subtotal: parseFloat(order.subtotal),
      shippingCost: parseFloat(order.shipping_cost),
      tax: parseFloat(order.tax),
      total: parseFloat(order.total),
      status: order.status,
      paymentStatus: order.payment_status,
      shippingMethod: order.shipping_method,
      trackingNumber: order.tracking_number,
      shippedAt: order.shipped_at,
      estimatedDelivery: order.estimated_delivery,
      deliveredAt: order.delivered_at,
      buyerNotes: order.buyer_notes,
      sellerNotes: order.seller_notes,
      createdAt: order.created_at,
      buyer: { username: order.buyer_username, email: order.buyer_email },
      seller: { username: order.seller_username, email: order.seller_email },
      shippingAddress: order.ship_name ? {
        fullName: order.ship_name,
        street: order.ship_street,
        city: order.ship_city,
        state: order.ship_state,
        postalCode: order.ship_zip,
        country: order.ship_country,
      } : null,
      items: itemsResult.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        title: item.title,
        slug: item.slug,
        condition: item.condition,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price),
        image: item.image,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, shippingMethod } = req.body;

    // Verify seller ownership
    const checkResult = await pool.query(
      'SELECT seller_id, buyer_id, status as current_status FROM orders WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (checkResult.rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this order' });
    }

    const updates = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      updates.push(`status = $${paramCount}`);
      values.push(status);

      if (status === 'shipped') {
        updates.push('shipped_at = CURRENT_TIMESTAMP');
      } else if (status === 'delivered') {
        updates.push('delivered_at = CURRENT_TIMESTAMP');
      }
    }

    if (trackingNumber) {
      paramCount++;
      updates.push(`tracking_number = $${paramCount}`);
      values.push(trackingNumber);
    }

    if (shippingMethod) {
      paramCount++;
      updates.push(`shipping_method = $${paramCount}`);
      values.push(shippingMethod);
    }

    paramCount++;
    values.push(id);

    const result = await pool.query(
      `UPDATE orders SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    // Notify buyer
    await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'order_update', 'Order Update', $2, $3)`,
      [
        checkResult.rows[0].buyer_id,
        `Your order has been updated to: ${status}${trackingNumber ? `. Tracking: ${trackingNumber}` : ''}`,
        `/orders/${id}`,
      ]
    );

    // Trigger automatic feedback when order is delivered
    if (status === 'delivered') {
      try {
        await feedbackService.processDeliveredOrder(id);
      } catch (feedbackError) {
        console.error('Error processing automatic feedback:', feedbackError);
        // Don't fail the order update if feedback fails
      }
    }

    res.json({
      message: 'Order updated successfully',
      order: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };
