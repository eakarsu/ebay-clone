const { pool } = require('../config/database');
const { adjust: adjustWallet } = require('./walletController');

// Reward amounts. Configurable in one place.
const REWARD_SIGNUP = parseFloat(process.env.REFERRAL_REWARD_SIGNUP || '5.00');
const REWARD_FIRST_PURCHASE = parseFloat(process.env.REFERRAL_REWARD_FIRST_PURCHASE || '10.00');

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = (len = 8) => {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
};

/** Idempotent: returns the user's code, generating one if absent. */
const ensureReferralCode = async (userId) => {
  const cur = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
  if (cur.rows[0]?.referral_code) return cur.rows[0].referral_code;

  // Collision-safe loop — alphabet is large enough that 3 tries is plenty.
  for (let i = 0; i < 5; i++) {
    const code = randomCode(8);
    try {
      const r = await pool.query(
        'UPDATE users SET referral_code = $1 WHERE id = $2 AND referral_code IS NULL RETURNING referral_code',
        [code, userId]
      );
      if (r.rows.length > 0) return r.rows[0].referral_code;
      // Another tx set it — re-read.
      const again = await pool.query('SELECT referral_code FROM users WHERE id = $1', [userId]);
      if (again.rows[0]?.referral_code) return again.rows[0].referral_code;
    } catch (err) {
      if (err.code !== '23505') throw err; // unique violation → retry
    }
  }
  throw new Error('Could not allocate referral code');
};

// --- HTTP: GET /api/referrals/me  → { code, link, signups, rewardTotal }
const getMyReferral = async (req, res, next) => {
  try {
    const code = await ensureReferralCode(req.user.id);
    const stats = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE event = 'signup')         AS signups,
              COUNT(*) FILTER (WHERE event = 'first_purchase') AS purchases,
              COALESCE(SUM(amount), 0)                         AS total
         FROM referral_rewards
        WHERE referrer_id = $1`,
      [req.user.id]
    );
    const row = stats.rows[0];
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.json({
      code,
      link: `${base}/register?ref=${code}`,
      signups: parseInt(row.signups, 10),
      purchases: parseInt(row.purchases, 10),
      rewardTotal: parseFloat(row.total),
      rewards: {
        signup: REWARD_SIGNUP,
        firstPurchase: REWARD_FIRST_PURCHASE,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Apply referral at signup. Called from authController.register when the
 * request includes a `ref` code. Returns the referrer's user id if the code
 * resolved; null otherwise. This never throws — referral failure must not
 * block signup.
 */
const applyReferralOnSignup = async (newUserId, refCode) => {
  if (!refCode) return null;
  try {
    const r = await pool.query('SELECT id FROM users WHERE referral_code = $1', [refCode.toUpperCase()]);
    const referrerId = r.rows[0]?.id;
    if (!referrerId || referrerId === newUserId) return null;

    await pool.query('UPDATE users SET referred_by = $1 WHERE id = $2 AND referred_by IS NULL', [
      referrerId,
      newUserId,
    ]);

    // Credit the referrer with the signup reward (idempotent via unique index).
    const reward = await pool.query(
      `INSERT INTO referral_rewards (referrer_id, referred_id, event, amount)
       VALUES ($1, $2, 'signup', $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [referrerId, newUserId, REWARD_SIGNUP]
    );
    if (reward.rows.length > 0) {
      await adjustWallet(referrerId, REWARD_SIGNUP, {
        reason: 'credit:referral',
        referenceId: reward.rows[0].id,
        note: `Signup reward for referring ${newUserId}`,
      });
    }

    // Give the new user a welcome credit too (optional).
    const welcome = parseFloat(process.env.REFERRAL_WELCOME_CREDIT || '5.00');
    if (welcome > 0) {
      await adjustWallet(newUserId, welcome, {
        reason: 'credit:referral_welcome',
        note: `Welcome credit (joined with code ${refCode.toUpperCase()})`,
      }).catch(() => {}); // never block signup
    }

    return referrerId;
  } catch (err) {
    console.warn('[referral] apply-on-signup failed:', err.message);
    return null;
  }
};

/**
 * Credit the referrer's first-purchase bonus. Idempotent; safe to call after
 * every order — the unique index guarantees we only pay once per referred user.
 */
const applyReferralOnFirstPurchase = async (buyerId) => {
  try {
    const r = await pool.query('SELECT referred_by FROM users WHERE id = $1', [buyerId]);
    const referrerId = r.rows[0]?.referred_by;
    if (!referrerId) return;

    const reward = await pool.query(
      `INSERT INTO referral_rewards (referrer_id, referred_id, event, amount)
       VALUES ($1, $2, 'first_purchase', $3)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [referrerId, buyerId, REWARD_FIRST_PURCHASE]
    );
    if (reward.rows.length > 0) {
      await adjustWallet(referrerId, REWARD_FIRST_PURCHASE, {
        reason: 'credit:referral',
        referenceId: reward.rows[0].id,
        note: `First-purchase bonus for ${buyerId}`,
      });
    }
  } catch (err) {
    console.warn('[referral] first-purchase credit failed:', err.message);
  }
};

module.exports = {
  ensureReferralCode,
  getMyReferral,
  applyReferralOnSignup,
  applyReferralOnFirstPurchase,
};
