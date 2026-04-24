const { pool } = require('../config/database');
const { generateKey } = require('../middleware/apiKey');

const listKeys = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT id, name, key_prefix, scopes, rate_limit_per_min,
              last_used_at, revoked_at, created_at
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json({ keys: r.rows });
  } catch (e) { next(e); }
};

const createKey = async (req, res, next) => {
  try {
    const { name, scopes, rateLimit } = req.body;
    const { raw, prefix, hash } = generateKey();
    const r = await pool.query(
      `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, scopes, rate_limit_per_min)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, key_prefix, scopes, rate_limit_per_min, created_at`,
      [
        req.user.id,
        name || 'Untitled key',
        hash,
        prefix,
        scopes && scopes.length ? scopes : ['public:read'],
        rateLimit || 120,
      ]
    );
    res.status(201).json({ key: r.rows[0], secret: raw, note: 'Save the secret now — it will not be shown again.' });
  } catch (e) { next(e); }
};

const rotateKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    const owned = await pool.query(
      'SELECT user_id FROM api_keys WHERE id = $1',
      [id]
    );
    if (owned.rows.length === 0 || owned.rows[0].user_id !== req.user.id) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { raw, prefix, hash } = generateKey();
    await pool.query(
      'UPDATE api_keys SET key_hash = $1, key_prefix = $2 WHERE id = $3',
      [hash, prefix, id]
    );
    res.json({ id, secret: raw, prefix });
  } catch (e) { next(e); }
};

const revokeKey = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query(
      'UPDATE api_keys SET revoked_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    res.json({ success: true });
  } catch (e) { next(e); }
};

module.exports = { listKeys, createKey, rotateKey, revokeKey };
