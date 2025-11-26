const { pool } = require('../config/database');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create or get Stripe customer
const getOrCreateStripeCustomer = async (userId, email) => {
  const existingCustomer = await pool.query(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [userId]
  );

  if (existingCustomer.rows[0]?.stripe_customer_id) {
    return existingCustomer.rows[0].stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await pool.query(
    'UPDATE users SET stripe_customer_id = $1 WHERE id = $2',
    [customer.id, userId]
  );

  return customer.id;
};

// Create payment intent for checkout
const createPaymentIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND buyer_id = $2',
      [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'completed') {
      return res.status(400).json({ error: 'Order already paid' });
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);

    // Calculate amount in cents
    const amount = Math.round(parseFloat(order.total) * 100);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        userId: req.user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Update order with payment intent ID
    await pool.query(
      'UPDATE orders SET stripe_payment_intent_id = $1, payment_status = $2 WHERE id = $3',
      [paymentIntent.id, 'processing', orderId]
    );

    // Log transaction
    await pool.query(
      `INSERT INTO payment_transactions (order_id, user_id, stripe_payment_intent_id, amount, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, req.user.id, paymentIntent.id, order.total, 'pending']
    );

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    next(error);
  }
};

// Confirm payment was successful
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const orderId = paymentIntent.metadata.orderId;

      // Update order
      await pool.query(
        'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed', orderId]
      );

      // Update transaction
      await pool.query(
        `UPDATE payment_transactions
         SET status = $1, stripe_charge_id = $2, updated_at = CURRENT_TIMESTAMP
         WHERE stripe_payment_intent_id = $3`,
        ['succeeded', paymentIntent.latest_charge, paymentIntentId]
      );

      // Get receipt URL
      if (paymentIntent.latest_charge) {
        const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
        await pool.query(
          'UPDATE payment_transactions SET receipt_url = $1 WHERE stripe_payment_intent_id = $2',
          [charge.receipt_url, paymentIntentId]
        );
      }

      res.json({ success: true, message: 'Payment confirmed' });
    } else {
      res.status(400).json({ error: 'Payment not completed', status: paymentIntent.status });
    }
  } catch (error) {
    next(error);
  }
};

// Process refund
const processRefund = async (req, res, next) => {
  try {
    const { orderId, amount, reason } = req.body;

    // Verify seller or admin
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check permissions (seller or admin)
    const isAdmin = req.user.is_admin;
    const isSeller = order.seller_id === req.user.id;

    if (!isAdmin && !isSeller) {
      return res.status(403).json({ error: 'Not authorized to process refund' });
    }

    if (!order.stripe_payment_intent_id) {
      return res.status(400).json({ error: 'No payment found for this order' });
    }

    // Get the payment intent to find the charge
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);

    if (!paymentIntent.latest_charge) {
      return res.status(400).json({ error: 'No charge found for this payment' });
    }

    // Calculate refund amount (in cents)
    const refundAmount = amount ? Math.round(amount * 100) : undefined;

    // Process refund
    const refund = await stripe.refunds.create({
      charge: paymentIntent.latest_charge,
      amount: refundAmount,
      reason: reason || 'requested_by_customer',
    });

    // Update transaction
    const refundAmountDollars = refund.amount / 100;
    await pool.query(
      `UPDATE payment_transactions
       SET status = $1, refund_amount = refund_amount + $2, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_payment_intent_id = $3`,
      [
        refund.amount === paymentIntent.amount ? 'refunded' : 'partially_refunded',
        refundAmountDollars,
        order.stripe_payment_intent_id,
      ]
    );

    // Update order
    await pool.query(
      `UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [refund.amount === paymentIntent.amount ? 'refunded' : 'partially_refunded', orderId]
    );

    res.json({
      success: true,
      refundId: refund.id,
      amount: refundAmountDollars,
      status: refund.status,
    });
  } catch (error) {
    next(error);
  }
};

// Get payment methods for user
const getPaymentMethods = async (req, res, next) => {
  try {
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!userResult.rows[0]?.stripe_customer_id) {
      return res.json({ paymentMethods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: userResult.rows[0].stripe_customer_id,
      type: 'card',
    });

    res.json({
      paymentMethods: paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Add payment method
const addPaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.body;

    const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);

    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    res.json({ success: true, message: 'Payment method added' });
  } catch (error) {
    next(error);
  }
};

// Remove payment method
const removePaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.params;

    await stripe.paymentMethods.detach(paymentMethodId);

    res.json({ success: true, message: 'Payment method removed' });
  } catch (error) {
    next(error);
  }
};

// Stripe webhook handler
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      await handlePaymentSuccess(paymentIntent);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailure(failedPayment);
      break;

    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Refund processed:', refund.id);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};

const handlePaymentSuccess = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  await pool.query(
    'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['completed', orderId]
  );

  await pool.query(
    `UPDATE payment_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE stripe_payment_intent_id = $2`,
    ['succeeded', paymentIntent.id]
  );
};

const handlePaymentFailure = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  if (!orderId) return;

  await pool.query(
    'UPDATE orders SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    ['failed', orderId]
  );

  await pool.query(
    `UPDATE payment_transactions SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE stripe_payment_intent_id = $2`,
    ['failed', paymentIntent.id]
  );
};

// Get payment history
const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT pt.*, o.order_number
       FROM payment_transactions pt
       JOIN orders o ON pt.order_id = o.id
       WHERE pt.user_id = $1
       ORDER BY pt.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM payment_transactions WHERE user_id = $1',
      [req.user.id]
    );

    res.json({
      transactions: result.rows.map((t) => ({
        id: t.id,
        orderNumber: t.order_number,
        amount: parseFloat(t.amount),
        status: t.status,
        receiptUrl: t.receipt_url,
        refundAmount: parseFloat(t.refund_amount),
        createdAt: t.created_at,
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

module.exports = {
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  handleWebhook,
  getPaymentHistory,
};
