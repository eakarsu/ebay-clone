const { pool } = require('../config/database');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get Stripe publishable key for frontend
const getStripeConfig = async (req, res, next) => {
  try {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    next(error);
  }
};

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
    // First, get saved payment methods from database
    const dbResult = await pool.query(
      `SELECT id, payment_type, is_default, card_last_four, card_brand,
              card_exp_month, card_exp_year, paypal_email, bank_name, bank_account_last_four
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );

    const paymentMethods = dbResult.rows.map((pm) => ({
      id: pm.id,
      paymentType: pm.payment_type,
      isDefault: pm.is_default,
      cardLastFour: pm.card_last_four,
      cardBrand: pm.card_brand,
      cardExpMonth: pm.card_exp_month,
      cardExpYear: pm.card_exp_year,
      paypalEmail: pm.paypal_email,
      bankName: pm.bank_name,
      bankAccountLastFour: pm.bank_account_last_four,
    }));

    res.json({ paymentMethods });
  } catch (error) {
    next(error);
  }
};

// Add payment method directly (without Stripe - for demo purposes)
const addPaymentMethodDirect = async (req, res, next) => {
  try {
    const {
      paymentType,
      cardBrand,
      cardLastFour,
      cardExpMonth,
      cardExpYear,
      bankName,
      bankAccountLastFour,
      paypalEmail,
      isDefault
    } = req.body;

    // If setting as default, unset other defaults first
    if (isDefault) {
      await pool.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1 AND payment_type = $2',
        [req.user.id, paymentType]
      );
    }

    // Check if this is the first payment method of this type
    const existingCount = await pool.query(
      'SELECT COUNT(*) as count FROM payment_methods WHERE user_id = $1 AND payment_type = $2',
      [req.user.id, paymentType]
    );
    const isFirstOfType = parseInt(existingCount.rows[0].count) === 0;

    // Insert the payment method
    const result = await pool.query(
      `INSERT INTO payment_methods (
        user_id, payment_type, is_default,
        card_last_four, card_brand, card_exp_month, card_exp_year,
        bank_name, bank_account_last_four, paypal_email
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id`,
      [
        req.user.id,
        paymentType,
        isDefault || isFirstOfType,
        cardLastFour || null,
        cardBrand || null,
        cardExpMonth || null,
        cardExpYear || null,
        bankName || null,
        bankAccountLastFour || null,
        paypalEmail || null
      ]
    );

    res.json({
      success: true,
      message: 'Payment method added successfully',
      paymentMethodId: result.rows[0].id
    });
  } catch (error) {
    next(error);
  }
};

// Add payment method
const addPaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId, setAsDefault } = req.body;

    const customerId = await getOrCreateStripeCustomer(req.user.id, req.user.email);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Retrieve the payment method details from Stripe
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    // If setting as default, unset other defaults first
    if (setAsDefault) {
      await pool.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1 AND payment_type = $2',
        [req.user.id, paymentMethod.type]
      );
    }

    // Check if this is the first payment method of this type
    const existingCount = await pool.query(
      'SELECT COUNT(*) as count FROM payment_methods WHERE user_id = $1 AND payment_type = $2',
      [req.user.id, paymentMethod.type]
    );
    const isFirstOfType = parseInt(existingCount.rows[0].count) === 0;

    // Save to database
    let result;
    if (paymentMethod.type === 'card') {
      result = await pool.query(
        `INSERT INTO payment_methods (user_id, stripe_payment_method_id, payment_type, is_default,
         card_last_four, card_brand, card_exp_month, card_exp_year)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          req.user.id,
          paymentMethodId,
          'card',
          setAsDefault || isFirstOfType,
          paymentMethod.card.last4,
          paymentMethod.card.brand,
          paymentMethod.card.exp_month,
          paymentMethod.card.exp_year,
        ]
      );
    } else if (paymentMethod.type === 'us_bank_account') {
      result = await pool.query(
        `INSERT INTO payment_methods (user_id, stripe_payment_method_id, payment_type, is_default,
         bank_name, bank_account_last_four)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          req.user.id,
          paymentMethodId,
          'bank',
          setAsDefault || isFirstOfType,
          paymentMethod.us_bank_account.bank_name,
          paymentMethod.us_bank_account.last4,
        ]
      );
    }

    res.json({
      success: true,
      message: 'Payment method added',
      paymentMethodId: result?.rows[0]?.id
    });
  } catch (error) {
    next(error);
  }
};

// Remove payment method
const removePaymentMethod = async (req, res, next) => {
  try {
    const { paymentMethodId } = req.params;

    // Get the payment method from database to find Stripe ID
    const dbResult = await pool.query(
      'SELECT stripe_payment_method_id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [paymentMethodId, req.user.id]
    );

    if (dbResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }

    const stripePaymentMethodId = dbResult.rows[0].stripe_payment_method_id;

    // Detach from Stripe if we have a Stripe ID
    if (stripePaymentMethodId) {
      try {
        await stripe.paymentMethods.detach(stripePaymentMethodId);
      } catch (stripeError) {
        console.error('Stripe detach error:', stripeError.message);
      }
    }

    // Delete from database
    await pool.query(
      'DELETE FROM payment_methods WHERE id = $1 AND user_id = $2',
      [paymentMethodId, req.user.id]
    );

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
  getStripeConfig,
  createPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentMethods,
  addPaymentMethod,
  addPaymentMethodDirect,
  removePaymentMethod,
  handleWebhook,
  getPaymentHistory,
};
