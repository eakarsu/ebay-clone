const { pool } = require('../config/database');

/** POST /api/analytics/track - anyone can emit events */
const track = async (req, res, next) => {
  try {
    const { event, sessionId, productId, properties } = req.body;
    if (!event) return res.status(400).json({ error: 'event required' });

    await pool.query(
      `INSERT INTO events (event_name, user_id, session_id, product_id, properties)
       VALUES ($1, $2, $3, $4, $5)`,
      [event, req.user?.id || null, sessionId || null, productId || null, properties || {}]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
};

/** GET /api/analytics/funnel?steps=view_product,add_to_cart,purchase&days=7 */
const funnel = async (req, res, next) => {
  try {
    const steps = (req.query.steps || 'view_product,add_to_cart,checkout_start,purchase')
      .split(',').map(s => s.trim()).filter(Boolean);
    const days = Math.min(90, parseInt(req.query.days) || 7);

    const results = [];
    for (const step of steps) {
      const r = await pool.query(
        `SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))::int AS users
         FROM events
         WHERE event_name = $1 AND occurred_at > NOW() - ($2 || ' days')::interval`,
        [step, String(days)]
      );
      results.push({ step, users: r.rows[0].users });
    }
    res.json({ days, funnel: results });
  } catch (e) { next(e); }
};

/** GET /api/analytics/retention?cohortDays=7 - simple D1/D7/D30 retention */
const retention = async (req, res, next) => {
  try {
    const r = await pool.query(
      `WITH first_seen AS (
         SELECT COALESCE(user_id::text, session_id) AS uid,
                MIN(occurred_at)::date AS day0
         FROM events
         WHERE occurred_at > NOW() - INTERVAL '60 days'
         GROUP BY COALESCE(user_id::text, session_id)
       ),
       revisits AS (
         SELECT fs.uid,
                MAX(CASE WHEN e.occurred_at::date = fs.day0 + 1 THEN 1 ELSE 0 END) AS d1,
                MAX(CASE WHEN e.occurred_at::date = fs.day0 + 7 THEN 1 ELSE 0 END) AS d7,
                MAX(CASE WHEN e.occurred_at::date = fs.day0 + 30 THEN 1 ELSE 0 END) AS d30
         FROM first_seen fs
         JOIN events e ON COALESCE(e.user_id::text, e.session_id) = fs.uid
         GROUP BY fs.uid
       )
       SELECT
         COUNT(*)::int AS cohort_size,
         ROUND(AVG(d1)::numeric * 100, 1) AS d1_pct,
         ROUND(AVG(d7)::numeric * 100, 1) AS d7_pct,
         ROUND(AVG(d30)::numeric * 100, 1) AS d30_pct
       FROM revisits`
    );
    res.json(r.rows[0]);
  } catch (e) { next(e); }
};

/** GET /api/analytics/top-events?days=7 */
const topEvents = async (req, res, next) => {
  try {
    const days = Math.min(90, parseInt(req.query.days) || 7);
    const r = await pool.query(
      `SELECT event_name, COUNT(*)::int AS count
       FROM events
       WHERE occurred_at > NOW() - ($1 || ' days')::interval
       GROUP BY event_name
       ORDER BY count DESC
       LIMIT 30`,
      [String(days)]
    );
    res.json({ events: r.rows });
  } catch (e) { next(e); }
};

/** GET /api/analytics/seller-dashboard - real SQL for the logged-in seller */
const sellerDashboard = async (req, res, next) => {
  try {
    const sellerId = req.user.id;
    const days = Math.min(90, parseInt(req.query.days) || 30);

    const [viewsByDay, revenueByDay, topProducts, totals, conversion] = await Promise.all([
      pool.query(
        `SELECT date_trunc('day', e.occurred_at)::date AS day, COUNT(*)::int AS views
         FROM events e
         JOIN products p ON p.id = e.product_id
         WHERE p.seller_id = $1
           AND e.event_name IN ('product_view','view_product')
           AND e.occurred_at > NOW() - ($2 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [sellerId, String(days)]
      ),
      pool.query(
        `SELECT date_trunc('day', o.created_at)::date AS day,
                COALESCE(SUM(oi.total_price), 0)::numeric AS revenue,
                COUNT(DISTINCT o.id)::int AS orders
         FROM orders o
         JOIN order_items oi ON oi.order_id = o.id
         JOIN products p ON p.id = oi.product_id
         WHERE p.seller_id = $1
           AND o.created_at > NOW() - ($2 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [sellerId, String(days)]
      ),
      pool.query(
        `SELECT p.id, p.title,
                COALESCE(SUM(oi.total_price), 0)::numeric AS gmv,
                COUNT(DISTINCT o.id)::int AS orders
         FROM products p
         LEFT JOIN order_items oi ON oi.product_id = p.id
         LEFT JOIN orders o ON o.id = oi.order_id
           AND o.created_at > NOW() - ($2 || ' days')::interval
         WHERE p.seller_id = $1
         GROUP BY p.id, p.title
         ORDER BY gmv DESC NULLS LAST
         LIMIT 10`,
        [sellerId, String(days)]
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*)::int FROM products WHERE seller_id = $1) AS listings,
           (SELECT COALESCE(SUM(oi.total_price), 0)::numeric
              FROM orders o
              JOIN order_items oi ON oi.order_id = o.id
              JOIN products p ON p.id = oi.product_id
              WHERE p.seller_id = $1
                AND o.created_at > NOW() - ($2 || ' days')::interval) AS revenue,
           (SELECT COUNT(DISTINCT o.id)::int
              FROM orders o
              JOIN order_items oi ON oi.order_id = o.id
              JOIN products p ON p.id = oi.product_id
              WHERE p.seller_id = $1
                AND o.created_at > NOW() - ($2 || ' days')::interval) AS orders`,
        [sellerId, String(days)]
      ),
      pool.query(
        `WITH v AS (
           SELECT COUNT(*)::int AS views
           FROM events e JOIN products p ON p.id = e.product_id
           WHERE p.seller_id = $1
             AND e.event_name IN ('product_view','view_product')
             AND e.occurred_at > NOW() - ($2 || ' days')::interval
         ),
         o AS (
           SELECT COUNT(DISTINCT o.id)::int AS orders
           FROM orders o
           JOIN order_items oi ON oi.order_id = o.id
           JOIN products p ON p.id = oi.product_id
           WHERE p.seller_id = $1
             AND o.created_at > NOW() - ($2 || ' days')::interval
         )
         SELECT v.views, o.orders,
                CASE WHEN v.views > 0
                     THEN ROUND((o.orders::numeric / v.views) * 100, 2)
                     ELSE 0 END AS conversion_pct
         FROM v, o`,
        [sellerId, String(days)]
      ),
    ]);

    res.json({
      days,
      totals: totals.rows[0],
      conversion: conversion.rows[0],
      viewsByDay: viewsByDay.rows,
      revenueByDay: revenueByDay.rows,
      topProducts: topProducts.rows,
    });
  } catch (e) { next(e); }
};

module.exports = { track, funnel, retention, topEvents, sellerDashboard };
