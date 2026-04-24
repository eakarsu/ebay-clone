const { pool } = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, reason } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (reason) { conditions.push(`tb.reason = $${paramIdx++}`); params.push(reason); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM token_blacklist tb ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT tb.*, u.username FROM token_blacklist tb
       LEFT JOIN users u ON tb.user_id = u.id
       ${where} ORDER BY tb.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ tokens: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE reason = 'logout') as logout_count,
        COUNT(*) FILTER (WHERE reason = 'security_revoke') as revoked_count,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today_count
      FROM token_blacklist
    `);
    res.json(stats.rows[0]);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT tb.*, u.username FROM token_blacklist tb
       LEFT JOIN users u ON tb.user_id = u.id WHERE tb.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Token not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM token_blacklist WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Token not found' });
    res.json({ message: 'Blacklisted token removed' });
  } catch (error) { next(error); }
};

const cleanupExpired = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM token_blacklist WHERE expires_at < NOW()');
    res.json({ message: `Cleaned up ${result.rowCount} expired tokens` });
  } catch (error) { next(error); }
};

module.exports = { getAll, getStats, getById, remove, cleanupExpired };
