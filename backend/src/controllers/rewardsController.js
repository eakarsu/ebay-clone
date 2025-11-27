const { pool } = require('../config/database');

// Get user's rewards status
const getMyRewards = async (req, res) => {
  try {
    const rewards = await pool.query(
      `SELECT rp.*, rt.earn_rate, rt.bonus_multiplier, rt.perks
       FROM rewards_program rp
       LEFT JOIN rewards_tiers rt ON rp.tier = rt.tier
       WHERE rp.user_id = $1`,
      [req.user.id]
    );

    if (rewards.rows.length === 0) {
      // Auto-enroll user
      const newRewards = await pool.query(
        `INSERT INTO rewards_program (user_id, tier, total_points, available_points)
         VALUES ($1, 'bronze', 0, 0)
         RETURNING *`,
        [req.user.id]
      );
      return res.json(newRewards.rows[0]);
    }

    res.json(rewards.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get rewards transactions
const getTransactions = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT rt.*, o.order_number
       FROM rewards_transactions rt
       LEFT JOIN orders o ON rt.order_id = o.id
       WHERE rt.user_id = $1
       ORDER BY rt.created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Redeem points
const redeemPoints = async (req, res) => {
  try {
    const { points, orderId } = req.body;

    // Check available points
    const rewards = await pool.query(
      `SELECT * FROM rewards_program WHERE user_id = $1`,
      [req.user.id]
    );

    if (rewards.rows.length === 0 || rewards.rows[0].available_points < points) {
      return res.status(400).json({ error: 'Insufficient points' });
    }

    // Deduct points
    await pool.query(
      `UPDATE rewards_program
       SET available_points = available_points - $1
       WHERE user_id = $2`,
      [points, req.user.id]
    );

    // Record transaction
    const result = await pool.query(
      `INSERT INTO rewards_transactions (user_id, order_id, transaction_type, points, description)
       VALUES ($1, $2, 'redeemed', $3, 'Points redeemed for discount')
       RETURNING *`,
      [req.user.id, orderId, -points]
    );

    res.json({
      transaction: result.rows[0],
      discount: points / 100 // $1 per 100 points
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Earn points (called after purchase)
const earnPoints = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Get user's earn rate
    const rewards = await pool.query(
      `SELECT rp.*, rt.earn_rate, rt.bonus_multiplier
       FROM rewards_program rp
       LEFT JOIN rewards_tiers rt ON rp.tier = rt.tier
       WHERE rp.user_id = $1`,
      [req.user.id]
    );

    const earnRate = rewards.rows[0]?.earn_rate || 0.01;
    const multiplier = rewards.rows[0]?.bonus_multiplier || 1;
    const pointsEarned = Math.floor(amount * earnRate * multiplier * 100);

    // Add points
    await pool.query(
      `UPDATE rewards_program
       SET total_points = total_points + $1,
           available_points = available_points + $1,
           lifetime_points = lifetime_points + $1
       WHERE user_id = $2`,
      [pointsEarned, req.user.id]
    );

    // Record transaction
    await pool.query(
      `INSERT INTO rewards_transactions (user_id, order_id, transaction_type, points, description, expires_at)
       VALUES ($1, $2, 'earned', $3, 'Points earned from purchase', $4)`,
      [req.user.id, orderId, pointsEarned, new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)]
    );

    // Check for tier upgrade
    const totalPoints = rewards.rows[0]?.lifetime_points + pointsEarned || pointsEarned;
    let newTier = 'bronze';
    if (totalPoints >= 20000) newTier = 'platinum';
    else if (totalPoints >= 5000) newTier = 'gold';
    else if (totalPoints >= 1000) newTier = 'silver';

    if (newTier !== rewards.rows[0]?.tier) {
      await pool.query(
        `UPDATE rewards_program SET tier = $1, tier_updated_at = NOW() WHERE user_id = $2`,
        [newTier, req.user.id]
      );
    }

    res.json({ pointsEarned, newTier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get rewards tiers
const getTiers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM rewards_tiers ORDER BY min_points ASC`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getMyRewards,
  getTransactions,
  redeemPoints,
  earnPoints,
  getTiers
};
