const crypto = require('crypto');
const { pool } = require('../config/database');

/**
 * Deterministic variant assignment based on a hash of (experimentKey + subjectId).
 * Given the same subject+experiment, always returns the same variant — so we don't
 * need to persist assignments to keep users sticky. We DO persist the first assignment
 * for analytics traceability.
 */
const pickVariant = (experimentKey, subjectId, variants) => {
  const total = variants.reduce((s, v) => s + (v.weight || 1), 0);
  const hash = crypto.createHash('md5')
    .update(`${experimentKey}|${subjectId}`)
    .digest('hex');
  const n = parseInt(hash.slice(0, 8), 16) % total;
  let cum = 0;
  for (const v of variants) {
    cum += (v.weight || 1);
    if (n < cum) return v.key;
  }
  return variants[0].key;
};

/** GET /api/experiments/assign/:key?sessionId=... */
const assign = async (req, res, next) => {
  try {
    const key = req.params.key;
    const sessionId = req.query.sessionId;
    const subject = req.user?.id || sessionId;
    if (!subject) return res.status(400).json({ error: 'userId or sessionId required' });

    const exp = await pool.query(
      'SELECT variants, status FROM experiments WHERE key = $1',
      [key]
    );
    if (exp.rows.length === 0) return res.status(404).json({ error: 'experiment not found' });
    if (exp.rows[0].status !== 'running') {
      return res.json({ variant: 'control', experimentKey: key, status: exp.rows[0].status });
    }

    const variant = pickVariant(key, subject, exp.rows[0].variants);

    // Persist (first-write-wins via unique constraint)
    await pool.query(
      `INSERT INTO experiment_assignments (experiment_key, user_id, session_id, variant)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [key, req.user?.id || null, sessionId || null, variant]
    );

    res.json({ experimentKey: key, variant });
  } catch (e) { next(e); }
};

/** POST /api/experiments/convert */
const convert = async (req, res, next) => {
  try {
    const { experimentKey, goal, value, sessionId } = req.body;
    if (!experimentKey || !goal) return res.status(400).json({ error: 'experimentKey and goal required' });

    // Look up this subject's variant
    const subject = req.user?.id || sessionId;
    const assignmentRow = await pool.query(
      `SELECT variant FROM experiment_assignments
       WHERE experiment_key = $1 AND (user_id = $2 OR session_id = $3)
       LIMIT 1`,
      [experimentKey, req.user?.id || null, sessionId || null]
    );
    const variant = assignmentRow.rows[0]?.variant || 'unassigned';

    await pool.query(
      `INSERT INTO experiment_conversions (experiment_key, variant, user_id, session_id, goal, value)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [experimentKey, variant, req.user?.id || null, sessionId || null, goal, value || null]
    );
    res.json({ ok: true, variant });
  } catch (e) { next(e); }
};

/** GET /api/experiments/:key/results */
const results = async (req, res, next) => {
  try {
    const key = req.params.key;
    const r = await pool.query(
      `SELECT a.variant,
              COUNT(DISTINCT COALESCE(a.user_id::text, a.session_id))::int AS assigned,
              (
                SELECT COUNT(*)::int
                FROM experiment_conversions c
                WHERE c.experiment_key = a.experiment_key AND c.variant = a.variant
              ) AS conversions
       FROM experiment_assignments a
       WHERE a.experiment_key = $1
       GROUP BY a.variant, a.experiment_key
       ORDER BY a.variant`,
      [key]
    );
    const enriched = r.rows.map(row => ({
      variant: row.variant,
      assigned: row.assigned,
      conversions: row.conversions,
      conversion_rate: row.assigned ? +(row.conversions / row.assigned * 100).toFixed(2) : 0,
    }));
    res.json({ experimentKey: key, variants: enriched });
  } catch (e) { next(e); }
};

/** GET /api/experiments — admin list of all experiments */
const listExperiments = async (req, res, next) => {
  try {
    const r = await pool.query(
      `SELECT key, name, variants, status, starts_at, ends_at,
              (SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))::int
                 FROM experiment_assignments WHERE experiment_key = e.key) AS assigned,
              (SELECT COUNT(*)::int
                 FROM experiment_conversions WHERE experiment_key = e.key) AS conversions
         FROM experiments e
        ORDER BY starts_at DESC NULLS LAST`
    );
    res.json(r.rows);
  } catch (e) { next(e); }
};

module.exports = { assign, convert, results, listExperiments };
