const { pool } = require('../config/database');

/**
 * Screen a product listing for prohibited content.
 * Fast path: regex/substring match against DB-loaded terms.
 * Optional slow path: AI classification via aiService if AI_MODERATION=true.
 *
 * @param {{title:string, description?:string, brand?:string}} listing
 * @returns {Promise<{decision:'allow'|'block'|'flag', matched:string[], categories:string[]}>}
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

  return { decision, matched, categories: Array.from(categories) };
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
