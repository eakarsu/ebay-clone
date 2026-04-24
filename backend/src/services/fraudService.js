const { pool } = require('../config/database');

const MAX_BIDS_PER_MINUTE = parseInt(process.env.MAX_BIDS_PER_MINUTE || '10', 10);
const MAX_BIDS_PER_MINUTE_NEW_USER = 3;
const NEW_USER_AGE_HOURS = 24;

/**
 * Return an object describing a fraud decision for a bid attempt.
 *   decision: 'allow' | 'deny'
 *   reason: human-readable reason (if deny)
 */
const checkBidRisk = async ({ userId, productId, ip }) => {
  // 1) IP reputation
  if (ip) {
    const rep = await pool.query(
      'SELECT score, label FROM ip_reputation WHERE ip = $1',
      [ip]
    );
    if (rep.rows.length > 0 && rep.rows[0].score >= 80) {
      return { decision: 'deny', reason: `IP flagged: ${rep.rows[0].label || 'abusive'}` };
    }
  }

  // 2) User age + trust-level gating
  const userRes = await pool.query(
    'SELECT created_at, trust_level, is_active FROM users WHERE id = $1',
    [userId]
  );
  if (userRes.rows.length === 0) {
    return { decision: 'deny', reason: 'User not found' };
  }
  const user = userRes.rows[0];
  if (user.is_active === false) {
    return { decision: 'deny', reason: 'Account disabled' };
  }
  const ageHours = (Date.now() - new Date(user.created_at).getTime()) / 3_600_000;
  const newUser = ageHours < NEW_USER_AGE_HOURS && (user.trust_level || 0) < 1;

  // 3) Velocity — bids by this user in the last minute
  const velocity = await pool.query(
    `SELECT COUNT(*)::int AS n
     FROM bid_velocity_log
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 minute'`,
    [userId]
  );
  const n = velocity.rows[0].n;
  const ceiling = newUser ? MAX_BIDS_PER_MINUTE_NEW_USER : MAX_BIDS_PER_MINUTE;
  if (n >= ceiling) {
    return { decision: 'deny', reason: `Too many bids — slow down (${n}/${ceiling} per minute)` };
  }

  // Log this attempt so subsequent calls see it
  await pool.query(
    'INSERT INTO bid_velocity_log (user_id, product_id, ip) VALUES ($1, $2, $3::inet)',
    [userId, productId, ip || null]
  );

  return { decision: 'allow' };
};

module.exports = { checkBidRisk };
