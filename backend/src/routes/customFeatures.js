// Custom feature endpoints (batch_09 audit suggestions)
const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const { parseAIJson } = require('../utils/parseAIJson');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { aiRateLimit } = require('../middleware/rateLimits');

router.use(aiRateLimit);

async function ask(system, user, label, res, opts = {}) {
  try {
    if (!process.env.OPENROUTER_API_KEY) return res.status(503).json({ error: 'AI not configured' });
    const r = await aiService.makeRequest([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], { maxTokens: opts.maxTokens || 1600, temperature: opts.temperature || 0.4 });
    const content = r?.choices?.[0]?.message?.content || r?.content || '';
    const parsed = parseAIJson ? parseAIJson(content) : null;
    res.json({ type: label, result: (parsed && parsed.data) || parsed || { raw: content }, model: r?.model });
  } catch (e) {
    console.error(`${label} error:`, e.message);
    res.status(500).json({ error: e.message });
  }
}

// 1. Predictive demand and seasonality scoring
router.post('/demand-seasonality', optionalAuth, (req, res) =>
  ask(
    'You score demand and seasonality for an eBay product. JSON only.',
    `PRODUCT: ${JSON.stringify(req.body?.product || {})}\nCATEGORY: ${req.body?.category || 'unknown'}\nWINDOW_DAYS: ${req.body?.window_days || 90}\nReturn JSON {"demand_score":0,"seasonality":{"peak_months":[""],"trough_months":[""]},"forecast_units_30d":0,"confidence":0,"signals":[""]}`,
    'demand-seasonality', res
  )
);

// 2. Seller reputation forecasting
router.post('/seller-reputation-forecast', optionalAuth, (req, res) =>
  ask(
    'You forecast seller reputation trajectory from recent behaviors. JSON only.',
    `SELLER: ${JSON.stringify(req.body?.seller || {})}\nRECENT_TX: ${JSON.stringify((req.body?.recent_transactions || []).slice(0,40))}\nReturn JSON {"current_score":0,"forecast_30d":0,"drivers":[""],"at_risk":false,"actions":[""]}`,
    'seller-reputation-forecast', res
  )
);

// 3. Counterfeit detection from images + seller patterns
// TODO: configure credentials for IMAGE_AUTH_API_KEY (Entrupy / SaaS).
router.post('/counterfeit-detect', optionalAuth, (req, res) =>
  ask(
    `You assess counterfeit likelihood from image captions + seller pattern. Image-auth API: ${Boolean(process.env.IMAGE_AUTH_API_KEY)}. JSON only.`,
    `LISTING: ${JSON.stringify(req.body?.listing || {})}\nIMAGE_CAPTIONS: ${JSON.stringify(req.body?.image_captions || [])}\nSELLER_PATTERN: ${JSON.stringify(req.body?.seller_pattern || {})}\nReturn JSON {"counterfeit_probability":0,"red_flags":[""],"recommended_action":"review|allow|block","trust_score":0}`,
    'counterfeit-detect', res
  )
);

// 4. Dynamic shipping suggestions by buyer location
router.post('/dynamic-shipping', optionalAuth, (req, res) =>
  ask(
    'You suggest shipping options by buyer location, item weight, and SLA. JSON only.',
    `ITEM: ${JSON.stringify(req.body?.item || {})}\nBUYER_LOCATION: ${JSON.stringify(req.body?.buyer_location || {})}\nReturn JSON {"options":[{"carrier":"","service":"","cost_usd":0,"transit_days":0,"insurance_usd":0}],"recommended":"","caveats":[""]}`,
    'dynamic-shipping', res
  )
);

// 5. Buyer repeat-purchase prediction
router.post('/repeat-purchase', authenticateToken, (req, res) =>
  ask(
    'You predict a buyer\'s next purchase and best follow-up offer. JSON only.',
    `BUYER_ID: ${req.body?.buyer_id || 'me'}\nHISTORY: ${JSON.stringify((req.body?.history || []).slice(0,30))}\nReturn JSON {"next_category":"","probability_30d":0,"recommended_offer":{"sku":"","discount_pct":0},"send_at":""}`,
    'repeat-purchase', res
  )
);

// 6. Supplier marketplace auto-sourcing
// TODO: configure credentials for SUPPLIER_DIRECTORY_API_KEY (Alibaba/SaleHoo).
router.post('/auto-source', optionalAuth, (req, res) =>
  ask(
    `You match a needed SKU to upstream suppliers. Supplier directory API: ${Boolean(process.env.SUPPLIER_DIRECTORY_API_KEY)}. JSON only.`,
    `SKU: ${req.body?.sku || ''}\nQTY: ${req.body?.qty || 1}\nMARGIN_TARGET_PCT: ${req.body?.margin_target_pct || 30}\nReturn JSON {"matches":[{"supplier":"","price_usd":0,"moq":0,"lead_time_days":0,"trust":0}],"top_pick":"","fallback_options":[""]}`,
    'auto-source', res
  )
);

// 7. Auction-ending strategy recommendations
router.post('/auction-ending', authenticateToken, (req, res) =>
  ask(
    'You suggest the optimal auction end time + strategy for an item. JSON only.',
    `ITEM: ${JSON.stringify(req.body?.item || {})}\nMARKET: ${JSON.stringify(req.body?.market_snapshot || {})}\nReturn JSON {"recommended_end_time":"","recommended_duration_days":0,"reserve_price_usd":0,"snipe_defense":[""],"projected_final_usd":0}`,
    'auction-ending', res
  )
);

// 8. Buyer payment fraud detection
router.post('/payment-fraud', authenticateToken, (req, res) =>
  ask(
    'You score payment fraud risk for an order. JSON only.',
    `ORDER: ${JSON.stringify(req.body?.order || {})}\nBUYER_SIGNALS: ${JSON.stringify(req.body?.buyer_signals || {})}\nReturn JSON {"fraud_score":0,"tier":"low|med|high","flags":[""],"recommended_action":"allow|review|block","verification_steps":[""]}`,
    'payment-fraud', res
  )
);

module.exports = router;
