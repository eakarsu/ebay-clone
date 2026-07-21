const Stripe = require('stripe');
let stripe;
function client() {
  if (!process.env.STRIPE_SECRET_KEY) throw Object.assign(new Error('Stripe is not configured'), { status: 503, retryable: false });
  if (!stripe) stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripe;
}
async function createRefund({ paymentIntentId, chargeId, amountCents, reason, idempotencyKey }) {
  let charge = chargeId;
  if (!charge) {
    const intent = await client().paymentIntents.retrieve(paymentIntentId);
    charge = intent.latest_charge;
  }
  if (!charge) throw Object.assign(new Error('No settled charge exists for this order'), { status: 409, retryable: false });
  return client().refunds.create({ charge, amount: amountCents, reason: reason || 'requested_by_customer' }, { idempotencyKey });
}
async function createPaymentIntent(args, idempotencyKey) { return client().paymentIntents.create(args, { idempotencyKey }); }
async function retrievePaymentIntent(id) { return client().paymentIntents.retrieve(id); }
function constructWebhook(body, signature) { return client().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET); }
module.exports = { createPaymentIntent, createRefund, retrievePaymentIntent, constructWebhook };
