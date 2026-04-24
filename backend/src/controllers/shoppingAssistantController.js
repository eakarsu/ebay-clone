const { pool } = require('../config/database');
const aiService = require('../services/aiService');

/**
 * AI shopping assistant. Small RAG loop:
 *   1. Take the last user message from the conversation.
 *   2. Full-text search for relevant active products (top 8).
 *   3. Hand the model the catalog excerpt + conversation; ask for a concise reply
 *      plus structured product picks (JSON).
 *
 * Returns { reply, picks: [{id,title,price,reason}] } so the frontend can render
 * text + product cards side-by-side.
 */

const MAX_HISTORY = 8; // keep context small; this is shopping help, not therapy

// POST /api/shopping-assistant/chat
// Body: { messages: [{role:'user'|'assistant', content:string}, ...] }
const chat = async (req, res, next) => {
  try {
    const incoming = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (incoming.length === 0) {
      return res.status(400).json({ error: 'messages is required' });
    }

    const history = incoming
      .filter((m) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role))
      .slice(-MAX_HISTORY);

    const lastUser = [...history].reverse().find((m) => m.role === 'user');
    const userQuery = lastUser?.content?.slice(0, 500) || '';

    // --- RAG: retrieve candidate products for the latest user intent ---
    let products = [];
    if (userQuery) {
      const fts = await pool
        .query(
          `SELECT p.id, p.title, p.slug, p.buy_now_price, p.current_price, p.condition,
                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url,
                  ts_rank(p.search_vector, websearch_to_tsquery('english', $1)) AS rank
             FROM products p
            WHERE p.status = 'active'
              AND p.search_vector @@ websearch_to_tsquery('english', $1)
            ORDER BY rank DESC
            LIMIT 8`,
          [userQuery]
        )
        .catch(() => null);

      if (fts && fts.rows.length > 0) {
        products = fts.rows;
      } else {
        const r = await pool.query(
          `SELECT p.id, p.title, p.slug, p.buy_now_price, p.current_price, p.condition,
                  (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image_url
             FROM products p
            WHERE p.status = 'active' AND p.title ILIKE $1
            ORDER BY p.created_at DESC
            LIMIT 8`,
          [`%${userQuery.split(/\s+/).slice(0, 3).join(' ')}%`]
        );
        products = r.rows;
      }
    }

    const catalog = products.map((p, i) => ({
      idx: i + 1,
      id: p.id,
      title: p.title,
      price: parseFloat(p.buy_now_price || p.current_price || 0),
      condition: p.condition,
    }));

    // --- Compose prompt for the model ---
    const systemPrompt = `You are a helpful shopping assistant for an eBay-style marketplace.
Use ONLY the catalog below to recommend items. If the catalog is empty or unrelated, say so and
suggest refining the search — do not invent products.

CATALOG (JSON):
${JSON.stringify(catalog, null, 2)}

Respond in strict JSON:
{
  "reply": string (<= 120 words, conversational),
  "picks": [{ "idx": number, "reason": string }]   // idx refers to the CATALOG entry; omit if none relevant
}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await aiService.makeRequest(messages, {
      maxTokens: 600,
      temperature: 0.4,
    });
    const raw = response.choices?.[0]?.message?.content || '';
    const match = raw.match(/\{[\s\S]*\}/);

    let parsed;
    try {
      parsed = match ? JSON.parse(match[0]) : null;
    } catch (_) {
      parsed = null;
    }

    const picks = Array.isArray(parsed?.picks) ? parsed.picks : [];
    const reply = parsed?.reply || raw;

    res.json({
      reply,
      picks: picks
        .map((pk) => {
          const entry = catalog.find((c) => c.idx === pk.idx);
          if (!entry) return null;
          const meta = products.find((p) => p.id === entry.id);
          return {
            id: entry.id,
            title: entry.title,
            price: entry.price,
            slug: meta?.slug,
            imageUrl: meta?.image_url || null,
            reason: pk.reason || '',
          };
        })
        .filter(Boolean),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
