/**
 * AI Listing Optimizer Scheduler
 *
 * Nightly pass that re-scores active listings against `analyzeListingQuality`
 * and stores the score + suggestions on products + ai_results so sellers can
 * see "your listing dropped from 86 → 71 — check the new suggestions" deltas.
 *
 * Implements NEW custom feature #1 from the audit ("AI listing optimizer
 * scheduler — nightly pass that re-scores existing listings…").
 *
 * Scheduling:
 *   - Daily at 02:00 server time (controlled here, not via cron, so the job
 *     loop survives restarts without external infra).
 *   - Runs in batches of 10 to keep memory + token spend bounded.
 *   - Skips listings scored within the last 24h.
 */

const { pool } = require('../config/database');
const aiService = require('../services/aiService');
const aiResultsStore = require('../services/aiResultsStore');

const BATCH_SIZE = parseInt(process.env.LISTING_OPTIMIZER_BATCH || '10', 10);
const RUN_INTERVAL_MS = parseInt(process.env.LISTING_OPTIMIZER_INTERVAL_MS || `${24 * 60 * 60 * 1000}`, 10);

let timer = null;

async function scoreOne(product) {
  // analyzeListingQuality returns prose; extract a numeric score 1-100 from it.
  const result = await aiService.analyzeListingQuality({
    title: product.title,
    description: product.description,
    images: product.image_count || 0,
    price: product.current_price,
    category: product.category_id,
    condition: product.condition,
  });
  if (!result.success) return { ok: false, error: result.error };
  const text = result.analysis || '';
  // Heuristic: pull the first integer 1-100 we see in the response.
  const match = text.match(/\b(\d{1,3})\b/);
  let score = match ? Math.max(1, Math.min(100, parseInt(match[1], 10))) : 60;

  // Persist on the products row + drop a row in ai_results.
  await pool.query(
    `UPDATE products
     SET ai_listing_score = $1,
         ai_listing_suggestions = $2,
         ai_listing_scored_at = NOW()
     WHERE id = $3`,
    [score, JSON.stringify({ analysis: text }), product.id],
  );

  await aiResultsStore.record({
    userId: product.seller_id,
    resourceType: 'listing',
    resourceId: product.id,
    feature: 'listing-optimize',
    model: result.model,
    usage: result.usage,
    payload: { score, analysis: text },
    raw: text,
  });
  return { ok: true, score };
}

async function runOnce() {
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn('[listingOptimizer] OPENROUTER_API_KEY not set — skipping run');
    return { scanned: 0, scored: 0 };
  }
  let scanned = 0;
  let scored = 0;
  // Pick listings active in the last 30d that haven't been scored in the past day.
  const { rows } = await pool.query(
    `SELECT id, seller_id, title, description, current_price, category_id, condition
     FROM products
     WHERE status = 'active'
       AND (ai_listing_scored_at IS NULL OR ai_listing_scored_at < NOW() - INTERVAL '1 day')
     ORDER BY (ai_listing_score IS NULL) DESC, ai_listing_scored_at NULLS FIRST
     LIMIT $1`,
    [BATCH_SIZE],
  );
  for (const product of rows) {
    scanned++;
    try {
      const r = await scoreOne(product);
      if (r.ok) scored++;
    } catch (err) {
      console.warn('[listingOptimizer] failed to score', product.id, err.message);
    }
  }
  console.log(`[listingOptimizer] batch done: scanned=${scanned} scored=${scored}`);
  return { scanned, scored };
}

function start() {
  if (timer) return;
  // Fire after 60s to give the server a chance to settle, then on interval.
  setTimeout(() => {
    runOnce().catch((err) => console.warn('[listingOptimizer] runOnce failed:', err.message));
  }, 60_000);
  timer = setInterval(() => {
    runOnce().catch((err) => console.warn('[listingOptimizer] runOnce failed:', err.message));
  }, RUN_INTERVAL_MS);
  if (timer.unref) timer.unref();
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

module.exports = { start, stop, runOnce };
