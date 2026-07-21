const { pool } = require('../config/database');
const Stripe = require('stripe');
const { createMoneyService } = require('../services/moneyLifecycle');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const money = createMoneyService({ pool });

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
    const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotencyKey;
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 180) {
      return res.status(400).json({ error: 'A stable Idempotency-Key is required' });
    }

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

    let operation = (await pool.query('SELECT * FROM payment_operations WHERE idempotency_key=$1', [idempotencyKey])).rows[0];
    if (operation && (operation.order_id !== order.id || Number(operation.requested_amount_cents) !== amount)) {
      return res.status(409).json({ error: 'Idempotency key conflicts with an earlier payment request' });
    }
    if (operation?.state === 'applied') {
      return res.json({
        clientSecret: operation.provider_response.clientSecret,
        paymentIntentId: operation.provider_object_id,
        operationId: operation.id,
        duplicate: true,
      });
    }
    if (!operation) operation = (await pool.query(
      `INSERT INTO payment_operations(order_id,operation_type,idempotency_key,requested_amount_cents,state,provider_request,created_by)
       VALUES($1,'payment_intent',$2,$3,'pending_provider',$4,$5) RETURNING *`,
      [order.id, idempotencyKey, amount, { customerId }, req.user.id],
    )).rows[0];

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
    }, { idempotencyKey });

    // Update order with payment intent ID
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE orders SET stripe_payment_intent_id=$1,payment_status=$2,lifecycle_version=lifecycle_version+1 WHERE id=$3', [paymentIntent.id, 'processing', orderId]);
      await client.query(
        `INSERT INTO payment_transactions(order_id,user_id,stripe_payment_intent_id,amount,status)
         VALUES($1,$2,$3,$4,'pending') ON CONFLICT(stripe_payment_intent_id) DO NOTHING`,
        [orderId, req.user.id, paymentIntent.id, order.total],
      );
      await client.query(`UPDATE payment_operations SET state='applied',provider_object_id=$1,provider_response=$2,attempts=attempts+1,updated_at=NOW() WHERE id=$3`, [paymentIntent.id, { clientSecret: paymentIntent.client_secret, status: paymentIntent.status }, operation.id]);
      await client.query(`INSERT INTO order_lifecycle_events(order_id,operation_id,source,source_event_id,event_type,from_state,to_state,amount_cents,detail) VALUES($1,$2,'checkout',$3,'payment_intent.created',$4,'processing',$5,$6) ON CONFLICT DO NOTHING`, [order.id, operation.id, paymentIntent.id, order.payment_status, amount, { provider: 'stripe' }]);
      await client.query(`INSERT INTO marketplace_outbox(aggregate_type,aggregate_id,event_type,idempotency_key,payload) VALUES('order',$1,'payment_intent.created',$2,$3) ON CONFLICT DO NOTHING`, [order.id, `intent:${operation.id}`, { operationId: operation.id, paymentIntentId: paymentIntent.id }]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      operationId: operation.id,
      duplicate: false,
    });
  } catch (error) {
    const idempotencyKey = req.get('Idempotency-Key') || req.body?.idempotencyKey;
    if (idempotencyKey) await pool.query(`UPDATE payment_operations SET state='retryable_failure',attempts=attempts+1,last_error=$1,next_attempt_at=NOW()+INTERVAL '5 minutes',updated_at=NOW() WHERE idempotency_key=$2 AND state<>'applied'`, [String(error.message).slice(0, 2000), idempotencyKey]).catch(() => {});
    next(error);
  }
};

// Confirm payment was successful
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await money.acceptWebhook({ id: `confirm:${paymentIntent.id}:succeeded`, type: 'payment_intent.succeeded', created: Math.floor(Date.now()/1000), data: { object: paymentIntent } });
      await pool.query('UPDATE payment_transactions SET stripe_charge_id=$1 WHERE stripe_payment_intent_id=$2', [paymentIntent.latest_charge, paymentIntentId]);

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
  res.status(410).json({
    error: 'Direct order refunds are retired. Approve and receive a return, then use POST /api/returns/:id/refund with an Idempotency-Key.',
  });
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
    if (process.env.ALLOW_DIRECT_PAYMENT_METHODS !== 'true' || process.env.NODE_ENV === 'production') {
      return res.status(410).json({ error: 'Direct payment-method entry is disabled; use a provider token.' });
    }
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

  try {
    const inbox = await money.acceptWebhook(event);
    res.json({ received: true, duplicate: inbox.duplicate, inboxId: inbox.id, state: inbox.state });
  } catch (error) {
    console.error('Webhook inbox failure:', error.message);
    res.status(503).json({ received: false, error: 'Webhook could not be durably recorded' });
  }
};

const retryMoneyOperation = async (req, res, next) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
    const operation = await money.retryOperation(req.params.id);
    res.json({ operation });
  } catch (error) { next(error); }
};

const reconciliationDashboard = async (req, res, next) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
    res.json(await money.dashboard());
  } catch (error) { next(error); }
};

const replayWebhook = async (req, res, next) => {
  try {
    if (!req.user.is_admin) return res.status(403).json({ error: 'Admin access required' });
    res.json({ webhook: await money.replayWebhook(req.params.id) });
  } catch (error) { next(error); }
};

// Seller payout via Stripe Connect transfer
const sellerPayout = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotencyKey;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }
    if (!idempotencyKey || idempotencyKey.length < 12 || idempotencyKey.length > 180) {
      return res.status(400).json({ error: 'A stable Idempotency-Key is required' });
    }

    // Only admins can trigger payouts (or automate this via webhook)
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Only admins can trigger seller payouts' });
    }

    // Get the order with seller info
    const orderResult = await pool.query(
      `SELECT o.*, u.stripe_account_id as seller_stripe_account_id, u.email as seller_email
       FROM orders o
       JOIN users u ON o.seller_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    if (order.payment_status !== 'completed' || order.status !== 'delivered') {
      return res.status(409).json({ error: 'Only paid and delivered orders are eligible for payout' });
    }

    if (!order.seller_stripe_account_id) {
      return res.status(400).json({
        error: 'Seller does not have a connected Stripe account (stripe_account_id missing)',
      });
    }

    const blockingCase = await pool.query(
      `SELECT 1 FROM returns WHERE order_id=$1 AND status NOT IN ('rejected','closed')
       UNION ALL SELECT 1 FROM disputes WHERE order_id=$1 AND status NOT IN ('resolved','closed') LIMIT 1`,
      [orderId],
    );
    if (blockingCase.rows[0]) {
      return res.status(409).json({ error: 'Payout is held while a return or dispute is open' });
    }

    // Platform fee: 10% (adjust as needed)
    const platformFeeRate = parseFloat(process.env.PLATFORM_FEE_RATE || '0.10');
    const grossAmount = parseFloat(order.total);
    const platformFee = Math.round(grossAmount * platformFeeRate * 100); // cents
    const transferAmount = Math.round(grossAmount * 100) - platformFee; // cents

    if (transferAmount <= 0) {
      return res.status(400).json({ error: 'Transfer amount after fees must be positive' });
    }

    let operation = (await pool.query('SELECT * FROM payment_operations WHERE idempotency_key=$1', [idempotencyKey])).rows[0];
    if (operation && (operation.order_id !== order.id || operation.operation_type !== 'payout')) {
      return res.status(409).json({ error: 'Idempotency key conflicts with an earlier money operation' });
    }
    if (operation?.state === 'applied') {
      return res.json({ success: true, transferId: operation.provider_object_id, duplicate: true });
    }
    const existingPayout = (await pool.query("SELECT id FROM seller_payouts WHERE order_id=$1 AND status='succeeded'", [order.id])).rows[0];
    if (existingPayout) return res.status(409).json({ error: 'This order already has a successful payout' });
    if (!operation) operation = (await pool.query(
      `INSERT INTO payment_operations(order_id,operation_type,idempotency_key,requested_amount_cents,seller_amount_cents,platform_amount_cents,state,provider_request,created_by)
       VALUES($1,'payout',$2,$3,$4,$5,'pending_provider',$6,$7) RETURNING *`,
      [order.id, idempotencyKey, Math.round(grossAmount * 100), transferAmount, platformFee, { destination: order.seller_stripe_account_id }, req.user.id],
    )).rows[0];

    // Create Stripe Connect transfer
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: 'usd',
      destination: order.seller_stripe_account_id,
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        sellerId: order.seller_id,
      },
    }, { idempotencyKey });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO seller_payouts (order_id,seller_id,stripe_transfer_id,gross_amount,platform_fee,net_amount,status,created_at)
         VALUES($1,$2,$3,$4,$5,$6,'succeeded',NOW()) ON CONFLICT(order_id) DO NOTHING`,
        [orderId, order.seller_id, transfer.id, grossAmount, platformFee / 100, transferAmount / 100],
      );
      await client.query("UPDATE orders SET payout_status='paid',lifecycle_version=lifecycle_version+1,updated_at=NOW() WHERE id=$1", [orderId]);
      await client.query("UPDATE payment_operations SET state='applied',provider_object_id=$1,provider_response=$2,attempts=attempts+1,last_error=NULL,updated_at=NOW() WHERE id=$3", [transfer.id, transfer, operation.id]);
      await client.query(`INSERT INTO order_lifecycle_events(order_id,operation_id,source,source_event_id,event_type,from_state,to_state,amount_cents) VALUES($1,$2,'payout',$3,'payout.paid',$4,'paid',$5) ON CONFLICT DO NOTHING`, [orderId, operation.id, transfer.id, order.payout_status, transferAmount]);
      await client.query(`INSERT INTO marketplace_outbox(aggregate_type,aggregate_id,event_type,idempotency_key,payload) VALUES('order',$1,'payout.paid',$2,$3) ON CONFLICT DO NOTHING`, [orderId, `payout:${operation.id}`, { operationId: operation.id, transferId: transfer.id }]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }

    res.json({
      success: true,
      transferId: transfer.id,
      grossAmount,
      platformFee: platformFee / 100,
      netAmount: transferAmount / 100,
      destination: order.seller_stripe_account_id,
    });
  } catch (error) {
    const idempotencyKey = req.get('Idempotency-Key') || req.body?.idempotencyKey;
    if (idempotencyKey) await pool.query("UPDATE payment_operations SET state='retryable_failure',attempts=attempts+1,last_error=$1,next_attempt_at=NOW()+INTERVAL '5 minutes',updated_at=NOW() WHERE idempotency_key=$2 AND state<>'applied'", [String(error.message).slice(0, 2000), idempotencyKey]).catch(() => {});
    next(error);
  }
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
  sellerPayout,
  retryMoneyOperation,
  reconciliationDashboard,
  replayWebhook,
};
