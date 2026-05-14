// // === Batch 09 Gaps & Frontend Mounts ===
// Auto-generated gap-ai endpoints for ebay.
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

// POST /api/gap-ai-ebay/ai-demand-prediction-by-skucategory
// AI demand-prediction by SKU/category
router.post('/ai-demand-prediction-by-skucategory', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: AI demand-prediction by SKU/category\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('ai-demand-prediction-by-skucategory', req.body, ai);
    res.json({ feature: 'ai-demand-prediction-by-skucategory', title: 'AI demand-prediction by SKU/category', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-ai-ebay/ai-seller-fraud-reputation-scoring
// AI seller-fraud reputation scoring
router.post('/ai-seller-fraud-reputation-scoring', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: AI seller-fraud reputation scoring\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('ai-seller-fraud-reputation-scoring', req.body, ai);
    res.json({ feature: 'ai-seller-fraud-reputation-scoring', title: 'AI seller-fraud reputation scoring', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

// POST /api/gap-ai-ebay/ai-predictive-logistics-eta
// AI predictive logistics ETA
router.post('/ai-predictive-logistics-eta', async (req, res) => {
  try {
    const ai = await runAI('You are an expert assistant. Reply concisely in JSON.',
      `Feature: AI predictive logistics ETA\nContext: ${JSON.stringify(req.body || {})}\nReturn JSON {"summary":"","key_points":[""],"recommendations":[""]}`);
    await persist('ai-predictive-logistics-eta', req.body, ai);
    res.json({ feature: 'ai-predictive-logistics-eta', title: 'AI predictive logistics ETA', result: ai });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message || 'error' });
  }
});

module.exports = router;
