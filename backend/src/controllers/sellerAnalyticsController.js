/**
 * Seller Analytics with AI Insights
 * GET /api/sellers/:id/analytics
 *
 * Aggregates sales data for a seller and generates an AI narrative insight
 * using the existing aiService / OpenRouter integration.
 */

const { pool } = require('../config/database');
const aiService = require('../services/aiService');

const getSellerAnalytics = async (req, res, next) => {
  try {
    const { id: sellerId } = req.params;

    // Authorization: sellers can only view their own analytics; admins see all.
    if (!req.user.is_admin && req.user.id !== sellerId) {
      return res.status(403).json({ error: 'You can only view your own analytics' });
    }

    // Verify seller exists
    const sellerResult = await pool.query(
      'SELECT id, username, is_seller FROM users WHERE id = $1',
      [sellerId]
    );
    if (sellerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Run all aggregation queries in parallel
    const [
      totalsResult,
      categoryResult,
      dowResult,
      topProductsResult,
      recentTrendResult,
    ] = await Promise.all([
      // Total sales, order count, average order value
      pool.query(
        `SELECT
           COUNT(o.id)                                     AS total_orders,
           COALESCE(SUM(o.total), 0)                       AS total_revenue,
           COALESCE(AVG(o.total), 0)                       AS avg_order_value,
           COALESCE(SUM(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN o.total ELSE 0 END), 0) AS revenue_last_30d,
           COUNT(CASE WHEN o.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS orders_last_30d
         FROM orders o
         WHERE o.seller_id = $1 AND o.payment_status = 'completed'`,
        [sellerId]
      ),

      // Best-selling categories
      pool.query(
        `SELECT
           c.name                          AS category,
           COUNT(oi.id)                    AS items_sold,
           COALESCE(SUM(oi.total_price), 0) AS category_revenue
         FROM order_items oi
         JOIN orders o   ON oi.order_id   = o.id
         JOIN products p ON oi.product_id = p.id
         JOIN categories c ON p.category_id = c.id
         WHERE o.seller_id = $1 AND o.payment_status = 'completed'
         GROUP BY c.name
         ORDER BY items_sold DESC
         LIMIT 5`,
        [sellerId]
      ),

      // Day-of-week performance (0=Sunday … 6=Saturday)
      pool.query(
        `SELECT
           EXTRACT(DOW FROM o.created_at)::int          AS day_of_week,
           TO_CHAR(o.created_at, 'Day')                  AS day_name,
           COUNT(o.id)                                   AS order_count,
           COALESCE(SUM(o.total), 0)                     AS revenue
         FROM orders o
         WHERE o.seller_id = $1 AND o.payment_status = 'completed'
         GROUP BY EXTRACT(DOW FROM o.created_at), TO_CHAR(o.created_at, 'Day')
         ORDER BY day_of_week`,
        [sellerId]
      ),

      // Top 5 products by revenue
      pool.query(
        `SELECT
           p.id,
           p.title,
           COUNT(oi.id)                    AS units_sold,
           COALESCE(SUM(oi.total_price), 0) AS revenue
         FROM products p
         JOIN order_items oi ON oi.product_id = p.id
         JOIN orders o        ON oi.order_id   = o.id
         WHERE p.seller_id = $1 AND o.payment_status = 'completed'
         GROUP BY p.id, p.title
         ORDER BY revenue DESC
         LIMIT 5`,
        [sellerId]
      ),

      // Month-over-month trend (last 6 months)
      pool.query(
        `SELECT
           TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') AS month,
           COUNT(o.id)                                            AS order_count,
           COALESCE(SUM(o.total), 0)                             AS revenue
         FROM orders o
         WHERE o.seller_id = $1
           AND o.payment_status = 'completed'
           AND o.created_at >= NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', o.created_at)
         ORDER BY month`,
        [sellerId]
      ),
    ]);

    const totals = totalsResult.rows[0];
    const categories = categoryResult.rows;
    const dowPerformance = dowResult.rows;
    const topProducts = topProductsResult.rows;
    const monthlyTrend = recentTrendResult.rows;

    // Build the raw stats object
    const stats = {
      totals: {
        totalOrders: parseInt(totals.total_orders),
        totalRevenue: parseFloat(totals.total_revenue),
        avgOrderValue: parseFloat(totals.avg_order_value),
        revenueLast30Days: parseFloat(totals.revenue_last_30d),
        ordersLast30Days: parseInt(totals.orders_last_30d),
      },
      topCategories: categories.map((c) => ({
        category: c.category,
        itemsSold: parseInt(c.items_sold),
        revenue: parseFloat(c.category_revenue),
      })),
      dayOfWeekPerformance: dowPerformance.map((d) => ({
        dayOfWeek: d.day_of_week,
        dayName: d.day_name.trim(),
        orderCount: parseInt(d.order_count),
        revenue: parseFloat(d.revenue),
      })),
      topProducts: topProducts.map((p) => ({
        id: p.id,
        title: p.title,
        unitsSold: parseInt(p.units_sold),
        revenue: parseFloat(p.revenue),
      })),
      monthlyTrend: monthlyTrend.map((m) => ({
        month: m.month,
        orderCount: parseInt(m.order_count),
        revenue: parseFloat(m.revenue),
      })),
    };

    // Build AI prompt from the aggregated stats
    const bestDow = dowPerformance.length
      ? dowPerformance.reduce((a, b) => (parseFloat(a.revenue) > parseFloat(b.revenue) ? a : b))
      : null;
    const worstDow = dowPerformance.length
      ? dowPerformance.reduce((a, b) => (parseFloat(a.revenue) < parseFloat(b.revenue) ? a : b))
      : null;
    const topCategory = categories[0] || null;

    const promptContext = `
Seller performance summary:
- Total revenue (all time): $${stats.totals.totalRevenue.toFixed(2)}
- Total orders (all time): ${stats.totals.totalOrders}
- Average order value: $${stats.totals.avgOrderValue.toFixed(2)}
- Revenue last 30 days: $${stats.totals.revenueLast30Days.toFixed(2)}
- Orders last 30 days: ${stats.totals.ordersLast30Days}
- Top category: ${topCategory ? `${topCategory.category} (${topCategory.items_sold || topCategory.itemsSold} items, $${parseFloat(topCategory.category_revenue || topCategory.revenue || 0).toFixed(2)})` : 'N/A'}
- Best performing day: ${bestDow ? `${bestDow.day_name.trim()} ($${parseFloat(bestDow.revenue).toFixed(2)} revenue)` : 'N/A'}
- Worst performing day: ${worstDow ? `${worstDow.day_name.trim()} ($${parseFloat(worstDow.revenue).toFixed(2)} revenue)` : 'N/A'}
- Monthly trend (last 6 months): ${monthlyTrend.map((m) => `${m.month}: $${parseFloat(m.revenue).toFixed(2)}`).join(', ') || 'No data'}
- Top products: ${topProducts.slice(0, 3).map((p) => `"${p.title}" ($${parseFloat(p.revenue).toFixed(2)})`).join(', ') || 'None'}
`.trim();

    // Call AI for narrative insight
    let aiInsight = null;
    try {
      const aiMessages = [
        {
          role: 'system',
          content:
            'You are a business analyst for an e-commerce marketplace. ' +
            'Given a seller\'s sales data, produce a concise (3-5 sentences) actionable narrative insight. ' +
            'Highlight standout patterns (e.g. best day, top category, trend direction) and give one concrete recommendation. ' +
            'Be specific and friendly. Do not invent numbers beyond what is given.',
        },
        {
          role: 'user',
          content: promptContext,
        },
      ];

      const aiResponse = await aiService.makeRequest(aiMessages, { maxTokens: 300, temperature: 0.5 });
      aiInsight = aiResponse.choices?.[0]?.message?.content?.trim() || null;
    } catch (aiErr) {
      // Non-fatal — return stats even if AI call fails
      console.error('Seller analytics AI call failed:', aiErr.message);
      aiInsight = null;
    }

    res.json({
      sellerId,
      stats,
      aiInsight,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSellerAnalytics };
