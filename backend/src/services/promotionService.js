const { pool } = require('../config/database');

/**
 * Pick up to N promoted products for a given context (category optional).
 * Second-price auction: winners pay the (N+1)th-highest CPC bid (or their min
 * reserve if there isn't one). Returns enriched product objects plus the
 * actual charge that would apply on a click.
 */
const selectPromotedSlots = async ({ categoryId = null, slots = 2 } = {}) => {
  const params = [slots];
  let where = "pb.status = 'active' AND (pb.daily_budget IS NULL OR pb.spent_today < pb.daily_budget) AND p.status = 'active'";
  if (categoryId) {
    params.push(categoryId);
    where += ` AND p.category_id = $${params.length}`;
  }

  // Top (slots + 1) bids ordered by cpc_bid DESC — we need the N+1th for pricing
  const r = await pool.query(
    `SELECT pb.id AS promo_id, pb.cpc_bid, pb.seller_id,
            p.id, p.title, p.slug, p.current_price, p.buy_now_price, p.condition,
            p.listing_type, p.auction_end, p.bid_count, p.free_shipping,
            (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) AS image
     FROM promotion_bids pb
     JOIN products p ON p.id = pb.product_id
     WHERE ${where}
     ORDER BY pb.cpc_bid DESC
     LIMIT $1 + 1`,
    params
  );

  if (r.rows.length === 0) return [];

  const rows = r.rows;
  // Second-price: clearing price is the (slots+1)th bid, or 0.01 if absent
  const clearing = parseFloat(
    rows.length > slots ? rows[slots].cpc_bid : (rows[rows.length - 1].cpc_bid * 0.5)
  ) || 0.01;

  return rows.slice(0, slots).map(row => ({
    ...row,
    promoted: true,
    promo_id: row.promo_id,
    charge_on_click: Math.min(parseFloat(row.cpc_bid), clearing),
  }));
};

/**
 * Log an impression (no charge) or a click (charged). Updates spent_today atomically.
 */
const recordEvent = async (promoId, kind, cost = 0) => {
  await pool.query(
    `INSERT INTO promotion_events (promotion_bid_id, kind, cost)
     VALUES ($1, $2, $3)`,
    [promoId, kind, cost]
  );
  if (kind === 'click' && cost > 0) {
    await pool.query(
      `UPDATE promotion_bids
       SET spent_today = spent_today + $1,
           status = CASE
             WHEN daily_budget IS NOT NULL AND spent_today + $1 >= daily_budget THEN 'exhausted'
             ELSE status
           END
       WHERE id = $2`,
      [cost, promoId]
    );
  }
};

module.exports = { selectPromotedSlots, recordEvent };
