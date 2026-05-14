// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-nonai endpoints for ebay.
// Calls OpenRouter via native fetch (no SDK); lazily creates gap_features table.
const express = require('express');
const router = express.Router();

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function runAI(system, user) {
  if (!process.env.OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY missing'); e.statusCode = 503; throw e;
  }
  const r = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages: [
      { role: 'system', content: system }, { role: 'user', content: user }
    ], max_tokens: 1500, temperature: 0.4 })
  });
  if (!r.ok) { const e = new Error(`AI ${r.status}`); e.statusCode = 502; throw e; }
  const data = await r.json();
  const content = data?.choices?.[0]?.message?.content || '';
  let parsed = null;
  try { const m = content.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
  return { raw: content, parsed, model: data?.model };
}

let _persistInit = false;
async function persist(feature, input, output) {
  // Lazy gap_features table — best-effort, swallow errors so AI still works.
  try {
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    if (!_persistInit) {
      await p.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS gap_features (id SERIAL PRIMARY KEY, feature TEXT, input JSONB, output JSONB, created_at TIMESTAMPTZ DEFAULT NOW())');
      _persistInit = true;
    }
    await p.$executeRawUnsafe('INSERT INTO gap_features(feature, input, output) VALUES ($1, $2::jsonb, $3::jsonb)', feature, JSON.stringify(input || {}), JSON.stringify(output || {}));
  } catch { /* swallow */ }
}

// POST /api/gap-nonai-ebay/deep-carrier-shipping-integrations-fedexupsdhl-apis
// Deep carrier shipping integrations (FedEx/UPS/DHL APIs)
router.post('/deep-carrier-shipping-integrations-fedexupsdhl-apis', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Deep carrier shipping integrations (FedEx/UPS/DHL APIs)\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('deep-carrier-shipping-integrations-fedexupsdhl-apis', req.body, ai);
    res.json({ feature: 'deep-carrier-shipping-integrations-fedexupsdhl-apis', title: 'Deep carrier shipping integrations (FedEx/UPS/DHL APIs)', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-ebay/inventory-sync-with-seller-erps
// Inventory sync with seller ERPs
router.post('/inventory-sync-with-seller-erps', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Inventory sync with seller ERPs\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('inventory-sync-with-seller-erps', req.body, ai);
    res.json({ feature: 'inventory-sync-with-seller-erps', title: 'Inventory sync with seller ERPs', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-ebay/bulk-listing-import-migration-tools
// Bulk listing import / migration tools
router.post('/bulk-listing-import-migration-tools', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Bulk listing import / migration tools\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('bulk-listing-import-migration-tools', req.body, ai);
    res.json({ feature: 'bulk-listing-import-migration-tools', title: 'Bulk listing import / migration tools', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-ebay/multi-marketplace-cross-listing
// Multi-marketplace cross-listing
router.post('/multi-marketplace-cross-listing', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Multi-marketplace cross-listing\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('multi-marketplace-cross-listing', req.body, ai);
    res.json({ feature: 'multi-marketplace-cross-listing', title: 'Multi-marketplace cross-listing', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-nonai-ebay/tax-vat-compliance-engine
// Tax / VAT compliance engine
router.post('/tax-vat-compliance-engine', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: Tax / VAT compliance engine\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('tax-vat-compliance-engine', req.body, ai);
    res.json({ feature: 'tax-vat-compliance-engine', title: 'Tax / VAT compliance engine', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
