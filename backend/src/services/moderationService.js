const { pool } = require('../config/database');
const aiService = require('./aiService');

// Pick the stricter of two decisions. Ordering: allow < flag < block.
const severityRank = { allow: 0, flag: 1, block: 2 };
const stricterDecision = (a, b) =>
  (severityRank[a] ?? 0) >= (severityRank[b] ?? 0) ? a : b;

/**
 * Screen a product listing for prohibited content.
 * Fast path: regex/substring match against DB-loaded terms.
 * Slow path: AI classifier (Claude via aiService). Runs when AI_MODERATION=true.
 *           The final decision is the stricter of the two signals.
 *
 * @param {{title:string, description?:string, brand?:string, category?:string}} listing
 * @returns {Promise<{decision:'allow'|'block'|'flag', matched:string[], categories:string[], aiReason?:string, aiConfidence?:number}>}
 */
const screenListing = async (listing) => {
  const text = [listing.title, listing.description, listing.brand]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const terms = await pool.query('SELECT pattern, is_regex, category, severity FROM prohibited_terms');
  const matched = [];
  const categories = new Set();
  let decision = 'allow';

  for (const t of terms.rows) {
    const p = t.pattern.toLowerCase();
    let hit = false;
    if (t.is_regex) {
      try {
        hit = new RegExp(p, 'i').test(text);
      } catch (_) { /* bad regex — skip */ }
    } else {
      hit = text.includes(p);
    }
    if (hit) {
      matched.push(t.pattern);
      categories.add(t.category);
      if (t.severity === 'block') decision = 'block';
      else if (decision === 'allow') decision = 'flag';
    }
  }

  // AI classifier is opt-in (requires key + env flag) and skipped if the fast
  // path already blocked — no point spending a model call.
  let aiReason;
  let aiConfidence;
  if (
    process.env.AI_MODERATION === 'true' &&
    process.env.OPENROUTER_API_KEY &&
    decision !== 'block'
  ) {
    try {
      const ai = await aiService.classifyListingPolicy({
        title: listing.title,
        description: listing.description,
        category: listing.category,
      });
      if (ai.success) {
        decision = stricterDecision(decision, ai.decision);
        aiReason = ai.reason;
        aiConfidence = ai.confidence;
        (ai.categories || []).forEach((c) => categories.add(c));
      }
    } catch (_) {
      // AI failure never blocks a listing — degrade to the fast-path decision.
    }
  }

  return {
    decision,
    matched,
    categories: Array.from(categories),
    ...(aiReason !== undefined ? { aiReason } : {}),
    ...(aiConfidence !== undefined ? { aiConfidence } : {}),
  };
};

const recordReport = async (productId, result) => {
  await pool.query(
    `INSERT INTO moderation_reports (product_id, status, reason, matched_terms)
     VALUES ($1, $2, $3, $4)`,
    [
      productId,
      result.decision === 'block' ? 'blocked' : (result.decision === 'flag' ? 'pending' : 'approved'),
      result.categories.join(','),
      result.matched,
    ]
  );
};

module.exports = { screenListing, recordReport };
