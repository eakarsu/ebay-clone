const { pool } = require('../config/database');

// Get questions for a product
const getProductQuestions = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT q.*, u.username as asker_username, u.avatar_url as asker_avatar,
              json_agg(
                json_build_object(
                  'id', a.id,
                  'answer', a.answer,
                  'answerer_username', au.username,
                  'is_seller_answer', a.is_seller_answer,
                  'helpful_count', a.helpful_count,
                  'created_at', a.created_at
                )
              ) FILTER (WHERE a.id IS NOT NULL) as answers
       FROM product_questions q
       JOIN users u ON q.asker_id = u.id
       LEFT JOIN product_answers a ON q.id = a.question_id
       LEFT JOIN users au ON a.answerer_id = au.id
       WHERE q.product_id = $1 AND q.is_public = true
       GROUP BY q.id, u.username, u.avatar_url
       ORDER BY q.created_at DESC`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ask a question
const askQuestion = async (req, res) => {
  try {
    const { productId, question, isPublic } = req.body;

    const result = await pool.query(
      `INSERT INTO product_questions (product_id, asker_id, question, is_public)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, req.user.id, question, isPublic !== false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Answer a question
const answerQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer } = req.body;

    // Check if user is the seller
    const question = await pool.query(
      `SELECT q.*, p.seller_id
       FROM product_questions q
       JOIN products p ON q.product_id = p.id
       WHERE q.id = $1`,
      [questionId]
    );

    if (question.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const isSellerAnswer = question.rows[0].seller_id === req.user.id;

    const result = await pool.query(
      `INSERT INTO product_answers (question_id, answerer_id, answer, is_seller_answer)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [questionId, req.user.id, answer, isSellerAnswer]
    );

    // Update question status
    await pool.query(
      `UPDATE product_questions SET status = 'answered' WHERE id = $1`,
      [questionId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upvote a question or answer. Dedup-protected: each user can only upvote
// a given target once. The `qa_upvotes` row acts as the dedup guard; we
// only increment the target's `helpful_count` on a *new* insert so repeated
// calls from the same user are idempotent.
const upvoteQA = async (req, res, next) => {
  const { targetType, targetId } = req.params;
  if (!['question', 'answer'].includes(targetType)) {
    return res.status(400).json({ error: 'Invalid target type' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the upvote row; ON CONFLICT DO NOTHING means repeat votes are
    // silently swallowed. rowCount === 1 iff this is the first vote.
    const insert = await client.query(
      `INSERT INTO qa_upvotes (user_id, target_type, target_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, target_type, target_id) DO NOTHING`,
      [req.user.id, targetType, targetId]
    );

    if (insert.rowCount === 1) {
      const table = targetType === 'question' ? 'product_questions' : 'product_answers';
      const bump = await client.query(
        `UPDATE ${table} SET helpful_count = helpful_count + 1 WHERE id = $1
         RETURNING helpful_count`,
        [targetId]
      );
      if (bump.rowCount === 0) {
        // Target doesn't exist — the upvote row we just inserted is orphaned.
        // Roll back so we don't leave a dangling vote.
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `${targetType} not found` });
      }
      await client.query('COMMIT');
      return res.json({
        upvoted: true,
        alreadyVoted: false,
        helpfulCount: bump.rows[0].helpful_count,
      });
    }

    // Repeat vote — fetch current count for the response.
    const table = targetType === 'question' ? 'product_questions' : 'product_answers';
    const now = await client.query(
      `SELECT helpful_count FROM ${table} WHERE id = $1`,
      [targetId]
    );
    await client.query('COMMIT');
    res.json({
      upvoted: true,
      alreadyVoted: true,
      helpfulCount: now.rows[0]?.helpful_count ?? null,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// Mark answer as helpful
const markHelpful = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { type } = req.body; // 'question' or 'answer'

    if (type === 'question') {
      await pool.query(
        `UPDATE product_questions SET helpful_count = helpful_count + 1 WHERE id = $1`,
        [answerId]
      );
    } else {
      await pool.query(
        `UPDATE product_answers SET helpful_count = helpful_count + 1 WHERE id = $1`,
        [answerId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get my questions
const getMyQuestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*, p.title, p.slug
       FROM product_questions q
       JOIN products p ON q.product_id = p.id
       WHERE q.asker_id = $1
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get questions for seller's products
const getSellerQuestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT q.*, p.title, p.slug, u.username as asker_username
       FROM product_questions q
       JOIN products p ON q.product_id = p.id
       JOIN users u ON q.asker_id = u.id
       WHERE p.seller_id = $1
       ORDER BY q.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getProductQuestions,
  askQuestion,
  answerQuestion,
  markHelpful,
  upvoteQA,
  getMyQuestions,
  getSellerQuestions
};
