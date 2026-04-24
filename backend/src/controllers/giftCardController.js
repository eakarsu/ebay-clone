const crypto = require('crypto');
const { pool } = require('../config/database');

// Generate a readable code like "GIFT-XXXX-XXXX-XXXX".
const genCode = () => {
  const chunk = () => crypto.randomBytes(2).toString('hex').toUpperCase();
  return `GIFT-${chunk()}-${chunk()}-${chunk()}`;
};

// Purchase a gift card (mock — no real payment; in production this would be wired
// to Stripe checkout.session and the gift card would only be issued on payment_intent.succeeded).
const purchaseGiftCard = async (req, res) => {
  try {
    const { amount, recipientEmail, message } = req.body;
    const n = Number(amount);
    if (!n || n < 5 || n > 1000) {
      return res.status(400).json({ error: 'Amount must be between $5 and $1000' });
    }

    let code;
    // Loop on rare collision of random code.
    for (let i = 0; i < 5; i++) {
      code = genCode();
      const existing = await pool.query(`SELECT 1 FROM gift_cards WHERE code = $1`, [code]);
      if (existing.rows.length === 0) break;
    }

    const result = await pool.query(
      `INSERT INTO gift_cards (code, amount, purchased_by, recipient_email, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [code, n, req.user.id, recipientEmail || null, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Purchase gift card error:', error.message);
    res.status(500).json({ error: 'Failed to purchase gift card' });
  }
};

// Redeem a gift card into the user's store credit balance.
const redeemGiftCard = async (req, res) => {
  const client = await pool.connect();
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Gift card code is required' });
    }

    await client.query('BEGIN');
    const card = await client.query(
      `SELECT * FROM gift_cards WHERE code = $1 FOR UPDATE`,
      [code.trim().toUpperCase()]
    );
    if (card.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Gift card not found' });
    }
    if (card.rows[0].redeemed_by) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Gift card already redeemed' });
    }

    // Mark redeemed.
    await client.query(
      `UPDATE gift_cards SET redeemed_by = $1, redeemed_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [req.user.id, card.rows[0].id]
    );

    // Upsert credit balance.
    await client.query(
      `INSERT INTO user_credit (user_id, balance)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE
       SET balance = user_credit.balance + EXCLUDED.balance,
           updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, card.rows[0].amount]
    );

    // Write transaction history.
    await client.query(
      `INSERT INTO credit_transactions (user_id, amount, reason, gift_card_id)
       VALUES ($1, $2, 'gift_card_redeem', $3)`,
      [req.user.id, card.rows[0].amount, card.rows[0].id]
    );

    const bal = await client.query(
      `SELECT balance FROM user_credit WHERE user_id = $1`, [req.user.id]
    );
    await client.query('COMMIT');

    res.json({
      message: 'Gift card redeemed successfully',
      credited: Number(card.rows[0].amount),
      balance: Number(bal.rows[0].balance),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Redeem gift card error:', error.message);
    res.status(500).json({ error: 'Failed to redeem gift card' });
  } finally {
    client.release();
  }
};

// Current user's store-credit balance + recent transactions.
const getBalance = async (req, res) => {
  try {
    const bal = await pool.query(
      `SELECT balance, updated_at FROM user_credit WHERE user_id = $1`,
      [req.user.id]
    );
    const tx = await pool.query(
      `SELECT id, amount, reason, created_at
         FROM credit_transactions
        WHERE user_id = $1
        ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({
      balance: Number(bal.rows[0]?.balance || 0),
      updatedAt: bal.rows[0]?.updated_at || null,
      transactions: tx.rows,
    });
  } catch (error) {
    console.error('Get credit balance error:', error.message);
    res.status(500).json({ error: 'Failed to fetch credit balance' });
  }
};

// List gift cards purchased by the user (so they can see codes they sent).
const myPurchased = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, code, amount, recipient_email, message,
              redeemed_by IS NOT NULL AS redeemed, redeemed_at, created_at
         FROM gift_cards
        WHERE purchased_by = $1
        ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('My gift cards error:', error.message);
    res.status(500).json({ error: 'Failed to fetch purchased gift cards' });
  }
};

module.exports = { purchaseGiftCard, redeemGiftCard, getBalance, myPurchased };
