const { pool } = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, route_path, http_method, validation_type, is_active } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (route_path) { conditions.push(`route_path = $${paramIdx++}`); params.push(route_path); }
    if (http_method) { conditions.push(`http_method = $${paramIdx++}`); params.push(http_method); }
    if (validation_type) { conditions.push(`validation_type = $${paramIdx++}`); params.push(validation_type); }
    if (is_active !== undefined) { conditions.push(`is_active = $${paramIdx++}`); params.push(is_active === 'true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*) FROM validation_rules ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT * FROM validation_rules ${where} ORDER BY route_path, field_name LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({ rules: result.rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM validation_rules WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Validation rule not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { route_path, http_method, field_name, field_location, validation_type, validation_params, error_message, is_active } = req.body;

    const result = await pool.query(
      `INSERT INTO validation_rules (route_path, http_method, field_name, field_location, validation_type, validation_params, error_message, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [route_path, http_method, field_name, field_location || 'body', validation_type, validation_params || {}, error_message, is_active ?? true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { route_path, http_method, field_name, field_location, validation_type, validation_params, error_message, is_active } = req.body;

    const result = await pool.query(
      `UPDATE validation_rules SET
       route_path = COALESCE($1, route_path), http_method = COALESCE($2, http_method),
       field_name = COALESCE($3, field_name), field_location = COALESCE($4, field_location),
       validation_type = COALESCE($5, validation_type), validation_params = COALESCE($6, validation_params),
       error_message = COALESCE($7, error_message), is_active = COALESCE($8, is_active),
       updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *`,
      [route_path, http_method, field_name, field_location, validation_type, validation_params, error_message, is_active, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Validation rule not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM validation_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Validation rule not found' });
    res.json({ message: 'Validation rule deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
