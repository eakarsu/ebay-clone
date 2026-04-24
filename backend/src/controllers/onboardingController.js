const { pool } = require('../config/database');

const STEPS = ['account', 'identity', 'payout', 'tax', 'policies', 'first_listing'];

const getMyOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT user_id, current_step, completed_steps, data, completed_at, created_at, updated_at FROM seller_onboarding WHERE user_id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO seller_onboarding (user_id, current_step, completed_steps, data)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
         RETURNING user_id, current_step, completed_steps, data, completed_at, created_at, updated_at`,
        [userId, STEPS[0], [], {}]
      );
      return res.json({ onboarding: insert.rows[0], steps: STEPS });
    }
    res.json({ onboarding: result.rows[0], steps: STEPS });
  } catch (err) {
    console.error('getMyOnboarding error:', err);
    res.status(500).json({ error: 'Failed to load onboarding state' });
  }
};

const updateMyOnboarding = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_step, completed_steps, data } = req.body || {};

    if (current_step && !STEPS.includes(current_step)) {
      return res.status(400).json({ error: 'Invalid step', steps: STEPS });
    }

    const allComplete = Array.isArray(completed_steps) &&
      STEPS.every(s => completed_steps.includes(s));

    const result = await pool.query(
      `INSERT INTO seller_onboarding (user_id, current_step, completed_steps, data, completed_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $5::boolean THEN NOW() ELSE NULL END)
       ON CONFLICT (user_id) DO UPDATE SET
         current_step    = COALESCE(EXCLUDED.current_step, seller_onboarding.current_step),
         completed_steps = COALESCE(EXCLUDED.completed_steps, seller_onboarding.completed_steps),
         data            = COALESCE(seller_onboarding.data, '{}'::jsonb) || COALESCE(EXCLUDED.data, '{}'::jsonb),
         completed_at    = CASE WHEN $5::boolean THEN NOW() ELSE seller_onboarding.completed_at END,
         updated_at      = NOW()
       RETURNING user_id, current_step, completed_steps, data, completed_at, created_at, updated_at`,
      [userId, current_step || null, completed_steps || null, data || {}, allComplete]
    );

    if (allComplete) {
      await pool.query(
        `UPDATE users SET is_seller = TRUE WHERE id = $1 AND is_seller = FALSE`,
        [userId]
      );
    }

    res.json({ onboarding: result.rows[0], steps: STEPS });
  } catch (err) {
    console.error('updateMyOnboarding error:', err);
    res.status(500).json({ error: 'Failed to update onboarding' });
  }
};

module.exports = { getMyOnboarding, updateMyOnboarding, STEPS };
