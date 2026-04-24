const { pool } = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, error_type, severity, is_resolved } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (error_type) { conditions.push(`error_type = $${paramIdx++}`); params.push(error_type); }
    if (severity) { conditions.push(`severity = $${paramIdx++}`); params.push(severity); }
    if (is_resolved !== undefined) { conditions.push(`is_resolved = $${paramIdx++}`); params.push(is_resolved === 'true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM error_logs ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT el.*, u.username FROM error_logs el
       LEFT JOIN users u ON el.user_id = u.id
       ${where} ORDER BY el.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ errorLogs: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getStats = async (req, res, next) => {
  try {
    const stats = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'error') as error_count,
        COUNT(*) FILTER (WHERE NOT is_resolved) as unresolved_count,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as today_count
      FROM error_logs
    `);
    res.json(stats.rows[0]);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT el.*, u.username FROM error_logs el
       LEFT JOIN users u ON el.user_id = u.id WHERE el.id = $1`, [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Error log not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { error_type, error_message, error_stack, component_name, page_url, browser_info, severity } = req.body;
    const userId = req.user?.id || null;

    const result = await pool.query(
      `INSERT INTO error_logs (error_type, error_message, error_stack, component_name, page_url, user_id, browser_info, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [error_type, error_message, error_stack, component_name, page_url, userId, browser_info || {}, severity || 'error']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { is_resolved, severity } = req.body;
    const result = await pool.query(
      `UPDATE error_logs SET is_resolved = COALESCE($1, is_resolved), severity = COALESCE($2, severity),
       updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *`,
      [is_resolved, severity, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Error log not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM error_logs WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Error log not found' });
    res.json({ message: 'Error log deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getStats, getById, create, update, remove };
