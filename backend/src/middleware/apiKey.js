const crypto = require('crypto');
const { pool } = require('../config/database');

/**
 * API key format: ek_<prefix>_<secret>
 * - prefix (8 chars) is stored in clear for fast lookup/display
 * - secret (≥32 chars) is stored as sha256 hash only
 */

const hashKey = (raw) =>
  crypto.createHash('sha256').update(raw, 'utf8').digest('hex');

const generateKey = () => {
  const prefix = crypto.randomBytes(4).toString('hex'); // 8 chars
  const secret = crypto.randomBytes(24).toString('base64url');
  return { raw: `ek_${prefix}_${secret}`, prefix, hash: hashKey(`ek_${prefix}_${secret}`) };
};

/**
 * Middleware: authenticate via X-API-Key header and enforce per-key rate limit.
 */
const requireApiKey = (requiredScope = 'public:read') => {
  return async (req, res, next) => {
    const raw = req.header('x-api-key') || req.query.api_key;
    if (!raw) return res.status(401).json({ error: 'Missing API key' });

    const row = await pool.query(
      `SELECT id, user_id, scopes, rate_limit_per_min, revoked_at
       FROM api_keys WHERE key_hash = $1`,
      [hashKey(raw)]
    );
    if (row.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    const key = row.rows[0];
    if (key.revoked_at) return res.status(401).json({ error: 'API key revoked' });
    if (!(key.scopes || []).includes(requiredScope)) {
      return res.status(403).json({ error: `Missing scope: ${requiredScope}` });
    }

    // Per-minute usage bucket
    const bucket = new Date(Math.floor(Date.now() / 60_000) * 60_000);
    const usage = await pool.query(
      `INSERT INTO api_key_usage (key_id, endpoint, bucket_start, request_count)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (key_id, endpoint, bucket_start)
       DO UPDATE SET request_count = api_key_usage.request_count + 1
       RETURNING request_count`,
      [key.id, req.path, bucket]
    );
    const used = usage.rows[0].request_count;
    const limit = key.rate_limit_per_min || 120;
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - used));
    if (used > limit) {
      return res.status(429).json({ error: 'API rate limit exceeded' });
    }

    // Best-effort last_used_at
    pool.query('UPDATE api_keys SET last_used_at = NOW() WHERE id = $1', [key.id])
      .catch(() => {});

    req.apiKey = key;
    next();
  };
};

module.exports = { requireApiKey, generateKey, hashKey };
