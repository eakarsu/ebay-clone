const { pool } = require('../config/database');
const aiService = require('../services/aiService');

/**
 * Server-side smart pricing. The existing /api/ai/suggest-price accepts
 * client-provided "comparableItems"; here we ground the recommendation in
 * real DB listings so sellers get actionable numbers without trusting the
 * client to supply comparables.
 *
 * Falls back to a pure statistical recommendation when OpenRouter is
 * unconfigured or the call fails — the seller always gets *something*.
 */

const percentile = (arr, p) => {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
};

// Look up active listings whose search_vector matches the title. We cap at 20
// so the prompt stays small and the token cost stays predictable.
const fetchComparables = async (title, categoryId, condition) => {
  const params = [title];
  let where = `status = 'active' AND search_vector @@ websearch_to_tsquery('english', $1)`;
  if (categoryId) {
    params.push(categoryId);
    where += ` AND category_id = $${params.length}`;
  }
  if (condition) {
    params.push(condition);
    where += ` AND condition = $${params.length}`;
  }
  const r = await pool.query(
    `SELECT id, title, condition, buy_now_price, current_price
       FROM products
      WHERE ${where}
      ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', $1)) DESC
      LIMIT 20`,
    params
  );
  return r.rows
    .map((p) => ({
      id: p.id,
      title: p.title,
      condition: p.condition,
      price: parseFloat(p.buy_now_price || p.current_price || 0),
    }))
    .filter((p) => p.price > 0);
};

// Statistical fallback: p25/p50/p75 from comparable prices. Returns null if
// we don't have enough signal to make a recommendation.
const statisticalRecommendation = (comparables) => {
  const prices = comparables.map((c) => c.price);
  if (prices.length < 3) return null;
  return {
    min: percentile(prices, 0.25),
    suggested: percentile(prices, 0.5),
    max: percentile(prices, 0.75),
    sampleSize: prices.length,
    reasoning: `Based on ${prices.length} active comparable listings: 25th/50th/75th percentile pricing.`,
    source: 'statistical',
  };
};

// POST /api/ai/smart-price
// Body: { title, categoryId?, condition? }
const suggestSmartPrice = async (req, res, next) => {
  try {
    const { title, categoryId, condition } = req.body;
    if (!title || title.length < 3) {
      return res.status(400).json({ error: 'title is required (min 3 chars)' });
    }

    const comparables = await fetchComparables(title, categoryId, condition);
    const stat = statisticalRecommendation(comparables);

    // If we have no comparables at all, tell the seller — AI can't help without data.
    if (comparables.length === 0) {
      return res.json({
        comparables: [],
        recommendation: null,
        message: 'No comparable active listings found. Try broader keywords.',
      });
    }

    // Try AI-enhanced reasoning; fall back to statistical if the call fails.
    let aiResult = null;
    if (process.env.OPENROUTER_API_KEY) {
      try {
        const prompt = [
          {
            role: 'system',
            content:
              'You help marketplace sellers price items. Given comparable listings, recommend a price range. Respond ONLY with JSON: {"min":number,"suggested":number,"max":number,"reasoning":"one sentence"}. No markdown, no prose.',
          },
          {
            role: 'user',
            content: `Item to price: ${title}${condition ? ` (condition: ${condition})` : ''}

Comparable active listings:
${comparables
  .slice(0, 15)
  .map((c, i) => `${i + 1}. "${c.title}" — $${c.price.toFixed(2)} [${c.condition || 'unknown'}]`)
  .join('\n')}

Recommend a competitive price range.`,
          },
        ];
        const resp = await aiService.makeRequest(prompt, { maxTokens: 250, temperature: 0.3 });
        const raw = resp?.choices?.[0]?.message?.content || '';
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (typeof parsed.suggested === 'number') {
            aiResult = {
              min: parseFloat(parsed.min),
              suggested: parseFloat(parsed.suggested),
              max: parseFloat(parsed.max),
              reasoning: String(parsed.reasoning || '').slice(0, 280),
              sampleSize: comparables.length,
              source: 'ai',
            };
          }
        }
      } catch (e) {
        console.warn('[smart-price] AI call failed, falling back:', e.message);
      }
    }

    res.json({
      comparables: comparables.slice(0, 10),
      recommendation: aiResult || stat,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { suggestSmartPrice };
