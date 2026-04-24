const { pool } = require('../config/database');

/**
 * Wallet / store credit. Every money movement goes through `adjust()` so the
 * ledger stays authoritative — balance is always reconstructable from the sum
 * of ledger amounts.
 *
 * `adjust` is safe to call inside an existing transaction by passing `client`;
 * otherwise it opens its own.
 */

const ensureWalletRow = async (client, userId) => {
  await client.query(
    `INSERT INTO user_wallets (user_id, balance) VALUES ($1, 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId]
  );
};

/**
 * @param {number} delta - signed amount (positive = credit, negative = debit)
 */
const adjust = async (userId, delta, { reason, referenceId = null, note = null, client = null } = {}) => {
  const own = !client;
  const c = client || (await pool.connect());
  try {
    if (own) await c.query('BEGIN');
    await ensureWalletRow(c, userId);

    // Lock the row so concurrent debits can't oversell.
    const cur = await c.query(
      'SELECT balance FROM user_wallets WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    const before = parseFloat(cur.rows[0].balance);
    const after = before + parseFloat(delta);
    if (after < 0) {
      const err = new Error('Insufficient wallet balance');
      err.code = 'WALLET_INSUFFICIENT';
      throw err;
    }

    await c.query(
      'UPDATE user_wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
      [after.toFixed(2), userId]
    );
    await c.query(
      `INSERT INTO wallet_ledger (user_id, amount, balance_after, reason, reference_id, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, delta, after.toFixed(2), reason, referenceId, note]
    );

    if (own) await c.query('COMMIT');
    return { balance: after };
  } catch (err) {
    if (own) await c.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    if (own) c.release();
  }
};

// --- HTTP handlers ---

// GET /api/wallet — my balance + recent ledger
const getMyWallet = async (req, res, next) => {
  try {
    const bal = await pool.query(
      `SELECT COALESCE(balance, 0) AS balance FROM user_wallets WHERE user_id = $1`,
      [req.user.id]
    );
    const ledger = await pool.query(
      `SELECT amount, balance_after, reason, reference_id, note, created_at
         FROM wallet_ledger
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50`,
      [req.user.id]
    );
    res.json({
      balance: parseFloat(bal.rows[0]?.balance || 0),
      ledger: ledger.rows.map((r) => ({
        amount: parseFloat(r.amount),
        balanceAfter: parseFloat(r.balance_after),
        reason: r.reason,
        referenceId: r.reference_id,
        note: r.note,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/wallet/topup — dev helper (fake top-up; real flow would hit Stripe)
const topUp = async (req, res, next) => {
  try {
    const amount = parseFloat(req.body?.amount);
    if (!amount || amount <= 0 || amount > 1000) {
      return res.status(400).json({ error: 'amount must be between 0 and 1000' });
    }
    const result = await adjust(req.user.id, amount, {
      reason: 'credit:topup',
      note: req.body?.note || 'Manual top-up',
    });
    res.json({ success: true, balance: result.balance });
  } catch (err) {
    next(err);
  }
};

module.exports = { adjust, getMyWallet, topUp };
