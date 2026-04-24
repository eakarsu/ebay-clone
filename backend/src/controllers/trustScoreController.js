const { pool } = require('../config/database');

/**
 * Trust score: a single 0-100 number summarizing a user's trustworthiness on
 * the marketplace. Computed on-demand — cheap enough (one query per user) and
 * keeps the ledger in sync without cache-invalidation headaches.
 *
 * Score is the sum of signal contributions, each capped so no single signal
 * dominates. Tiers map to displayable badges:
 *   90+  Excellent
 *   75+  Trusted
 *   50+  Established
 *   25+  New
 *   <25  Limited
 *
 * We intentionally DO NOT penalize brand-new users heavily — everyone starts
 * around 20 (the email-verified baseline). The score climbs as they transact
 * and get positive reviews.
 */

const tierFor = (score) => {
  if (score >= 90) return { label: 'Excellent', color: 'success' };
  if (score >= 75) return { label: 'Trusted', color: 'success' };
  if (score >= 50) return { label: 'Established', color: 'primary' };
  if (score >= 25) return { label: 'New', color: 'info' };
  return { label: 'Limited', color: 'warning' };
};

const computeTrustScore = async (userId) => {
  const r = await pool.query(
    `SELECT u.id, u.email_verified, u.is_verified, u.member_since,
            u.seller_rating, u.total_sales,
            (SELECT COUNT(*) FROM orders WHERE buyer_id = u.id AND status IN ('completed','delivered')) AS completed_purchases,
            (SELECT COUNT(*) FROM reviews WHERE reviewed_user_id = u.id) AS reviews_received,
            (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE reviewed_user_id = u.id) AS avg_rating,
            (SELECT COUNT(*) FROM disputes WHERE against_user = u.id AND status NOT IN ('dismissed','closed_buyer_win')) AS open_or_lost_disputes
       FROM users u
      WHERE u.id = $1`,
    [userId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];

  const signals = [];
  let score = 0;

  // Verified email — foundational.
  if (row.email_verified) {
    score += 15;
    signals.push({ name: 'Email verified', weight: 15 });
  }
  // Identity verification (if present).
  if (row.is_verified) {
    score += 10;
    signals.push({ name: 'Identity verified', weight: 10 });
  }
  // Tenure — 1 point per month of membership, capped at 20.
  const months = row.member_since
    ? Math.floor((Date.now() - new Date(row.member_since).getTime()) / (30 * 24 * 3600 * 1000))
    : 0;
  const tenurePts = Math.min(20, months);
  if (tenurePts > 0) {
    score += tenurePts;
    signals.push({ name: `${months} months on the platform`, weight: tenurePts });
  }
  // Transaction volume — 2 points per completed transaction, capped at 20.
  const txn = parseInt(row.completed_purchases, 10) + parseInt(row.total_sales || 0, 10);
  const txnPts = Math.min(20, txn * 2);
  if (txnPts > 0) {
    score += txnPts;
    signals.push({ name: `${txn} completed transactions`, weight: txnPts });
  }
  // Ratings — scale by count so 5 reviews at 5.0 ≠ 50 reviews at 5.0.
  const avg = parseFloat(row.avg_rating || 0);
  const revCount = parseInt(row.reviews_received, 10);
  if (revCount > 0 && avg > 0) {
    const ratingPts = Math.min(20, Math.round(((avg - 3) / 2) * Math.min(1, revCount / 10) * 20));
    if (ratingPts > 0) {
      score += ratingPts;
      signals.push({ name: `${avg.toFixed(1)}★ across ${revCount} review${revCount === 1 ? '' : 's'}`, weight: ratingPts });
    }
  }
  // Dispute penalty — -8 per unresolved/lost dispute, capped at -20.
  const bad = parseInt(row.open_or_lost_disputes || 0, 10);
  if (bad > 0) {
    const penalty = -Math.min(20, bad * 8);
    score += penalty;
    signals.push({ name: `${bad} unresolved dispute${bad === 1 ? '' : 's'}`, weight: penalty });
  }

  // Clamp and describe.
  score = Math.max(0, Math.min(100, score));
  const tier = tierFor(score);

  return {
    userId: row.id,
    score,
    tier: tier.label,
    color: tier.color,
    signals,
  };
};

// GET /api/users/:id/trust-score
const getTrustScore = async (req, res, next) => {
  try {
    const result = await computeTrustScore(req.params.id);
    if (!result) return res.status(404).json({ error: 'User not found' });
    res.json(result);
  } catch (err) {
    // Disputes table may not exist in all environments — degrade to score-without-penalty.
    if (err.code === '42P01') {
      console.warn('[trust-score] disputes table missing — computing without penalty');
      return res.status(503).json({ error: 'Trust score unavailable' });
    }
    next(err);
  }
};

module.exports = { computeTrustScore, getTrustScore, tierFor };
