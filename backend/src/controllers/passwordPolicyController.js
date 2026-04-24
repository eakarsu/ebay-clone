const { pool } = require('../config/database');
const { validatePassword } = require('../utils/passwordValidator');

const getAll = async (req, res, next) => {
  try {
    const { applies_to, is_active } = req.query;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (applies_to) { conditions.push(`applies_to = $${paramIdx++}`); params.push(applies_to); }
    if (is_active !== undefined) { conditions.push(`is_active = $${paramIdx++}`); params.push(is_active === 'true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`SELECT * FROM password_policies ${where} ORDER BY created_at DESC`, params);

    res.json({ policies: result.rows, total: result.rows.length });
  } catch (error) { next(error); }
};

const getActive = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM password_policies WHERE is_active = true ORDER BY policy_name');
    res.json({ policies: result.rows });
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM password_policies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Password policy not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const { policy_name, description, min_length, max_length, require_uppercase, require_lowercase,
            require_number, require_special_char, max_age_days, password_history_count, applies_to, is_active } = req.body;

    const result = await pool.query(
      `INSERT INTO password_policies (policy_name, description, min_length, max_length, require_uppercase,
       require_lowercase, require_number, require_special_char, max_age_days, password_history_count, applies_to, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [policy_name, description, min_length || 8, max_length || 128, require_uppercase ?? true,
       require_lowercase ?? true, require_number ?? true, require_special_char ?? true,
       max_age_days || 90, password_history_count || 5, applies_to || 'all', is_active ?? true]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const { policy_name, description, min_length, max_length, require_uppercase, require_lowercase,
            require_number, require_special_char, max_age_days, password_history_count, applies_to, is_active } = req.body;

    const result = await pool.query(
      `UPDATE password_policies SET
       policy_name = COALESCE($1, policy_name), description = COALESCE($2, description),
       min_length = COALESCE($3, min_length), max_length = COALESCE($4, max_length),
       require_uppercase = COALESCE($5, require_uppercase), require_lowercase = COALESCE($6, require_lowercase),
       require_number = COALESCE($7, require_number), require_special_char = COALESCE($8, require_special_char),
       max_age_days = COALESCE($9, max_age_days), password_history_count = COALESCE($10, password_history_count),
       applies_to = COALESCE($11, applies_to), is_active = COALESCE($12, is_active),
       updated_at = CURRENT_TIMESTAMP WHERE id = $13 RETURNING *`,
      [policy_name, description, min_length, max_length, require_uppercase, require_lowercase,
       require_number, require_special_char, max_age_days, password_history_count, applies_to, is_active, req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Password policy not found' });
    res.json(result.rows[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM password_policies WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Password policy not found' });
    res.json({ message: 'Password policy deleted' });
  } catch (error) { next(error); }
};

const validatePw = async (req, res, next) => {
  try {
    const { password, username } = req.body;
    const result = validatePassword(password, username);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getAll, getActive, getById, create, update, remove, validate: validatePw };
