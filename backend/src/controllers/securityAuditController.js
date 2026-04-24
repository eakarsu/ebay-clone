const { pool } = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, event_type, severity, blocked, resolved } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (event_type) { conditions.push(`event_type = $${paramIdx++}`); params.push(event_type); }
    if (severity) { conditions.push(`severity = $${paramIdx++}`); params.push(severity); }
    if (blocked !== undefined) { conditions.push(`blocked = $${paramIdx++}`); params.push(blocked === 'true'); }
    if (resolved !== undefined) { conditions.push(`resolved = $${paramIdx++}`); params.push(resolved === 'true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM security_audit_logs ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT sal.*, u.username FROM security_audit_logs sal
       LEFT JOIN users u ON sal.user_id = u.id
       ${where} ORDER BY sal.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ auditLogs: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'high') as high_count,
        COUNT(*) FILTER (WHERE NOT resolved) as unresolved_count,
        COUNT(*) FILTER (WHERE blocked) as blocked_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today_count
      FROM security_audit_logs
    `);
    res.json(stats.rows[0]);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT sal.*, u.username FROM security_audit_logs sal
       LEFT JOIN users u ON sal.user_id = u.id WHERE sal.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit log not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { resolved } = req.body;
    const result = await pool.query(
      `UPDATE security_audit_logs SET resolved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [resolved, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit log not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM security_audit_logs WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Audit log not found' });
    res.json({ message: 'Audit log deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getStats, getById, update, remove };
