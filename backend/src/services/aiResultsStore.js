/**
 * Persistence helper for the cross-project `ai_results` JSONB pattern.
 *
 * Every AI call records (resource_type, resource_id, feature, model, usage,
 * payload). UI uses this to render "last AI analysis" badges + the seller
 * dashboard reads it for the listing optimizer score history.
 */

const { pool } = require('../config/database');

async function record({
  userId = null,
  resourceType,
  resourceId,
  feature,
  model = null,
  usage = null,
  payload = {},
  raw = null,
}) {
  if (!resourceType || !resourceId || !feature) return null;
  const promptTokens = usage?.prompt_tokens || 0;
  const completionTokens = usage?.completion_tokens || 0;
  const totalTokens = usage?.total_tokens || (promptTokens + completionTokens);
  try {
    const res = await pool.query(
      `INSERT INTO ai_results
        (user_id, resource_type, resource_id, feature, model,
         prompt_tokens, completion_tokens, total_tokens, payload, raw)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, created_at`,
      [
        userId, String(resourceType), String(resourceId), String(feature), model,
        promptTokens, completionTokens, totalTokens,
        JSON.stringify(payload || {}),
        raw ? String(raw).slice(0, 4000) : null,
      ],
    );
    return res.rows[0];
  } catch (err) {
    // Table may not exist yet (migration not applied) — never let recording
    // failure break the AI request itself.
    if (process.env.DEBUG_AI) console.warn('aiResults.record failed:', err.message);
    return null;
  }
}

async function listForResource(resourceType, resourceId, { limit = 25, offset = 0 } = {}) {
  try {
    const total = await pool.query(
      'SELECT COUNT(*)::int AS c FROM ai_results WHERE resource_type = $1 AND resource_id = $2',
      [String(resourceType), String(resourceId)],
    );
    const rows = await pool.query(
      `SELECT id, user_id, feature, model, prompt_tokens, completion_tokens, total_tokens,
              payload, created_at
       FROM ai_results
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [String(resourceType), String(resourceId), limit, offset],
    );
    return { items: rows.rows, total: total.rows[0].c, limit, offset };
  } catch (err) {
    return { items: [], total: 0, limit, offset, error: err.message };
  }
}

async function latestForResource(resourceType, resourceId, feature) {
  try {
    const rows = await pool.query(
      `SELECT id, feature, model, payload, created_at
       FROM ai_results
       WHERE resource_type = $1 AND resource_id = $2 AND feature = $3
       ORDER BY created_at DESC LIMIT 1`,
      [String(resourceType), String(resourceId), String(feature)],
    );
    return rows.rows[0] || null;
  } catch {
    return null;
  }
}

module.exports = { record, listForResource, latestForResource };
