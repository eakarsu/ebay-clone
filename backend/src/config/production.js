function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return;
  const required = [
    'DATABASE_URL', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET', 'EVENT_SINK_URL', 'EVENT_SINK_SECRET',
    'TAX_PROVIDER_BASE_URL', 'SHIPPING_PROVIDER_BASE_URL', 'KYC_PROVIDER_BASE_URL',
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Production configuration missing: ${missing.join(', ')}`);
  if (process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters in production');
  if (process.env.ALLOW_DIRECT_PAYMENT_METHODS === 'true') throw new Error('Direct payment methods cannot be enabled in production');
}

module.exports = { validateProductionConfig };
