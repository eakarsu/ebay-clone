/**
 * Daily email digests + saved-search alerts.
 * Scheduler uses setInterval (every hour — each job decides if it should run "today").
 * Each job is idempotent per day via the digest_runs table.
 */
const { pool } = require('../config/database');
const { sendEmail } = require('../services/emailService');

const HOUR = 60 * 60 * 1000;

/** Runs once per day per job — claims the run via a unique (job_name, run_date). */
const claimRun = async (jobName) => {
  const today = new Date().toISOString().slice(0, 10);
  const r = await pool.query(
    `INSERT INTO digest_runs (job_name, run_date)
     VALUES ($1, $2)
     ON CONFLICT (job_name, run_date) DO NOTHING
     RETURNING id`,
    [jobName, today]
  );
  return r.rows[0]?.id || null;
};

const finishRun = async (runId, usersNotified) => {
  if (!runId) return;
  await pool.query(
    'UPDATE digest_runs SET finished_at = NOW(), users_notified = $2 WHERE id = $1',
    [runId, usersNotified]
  );
};

// ---------- Job 1: Watched-items daily digest ----------
const runWatchedDigest = async () => {
  const runId = await claimRun('watched_digest');
  if (!runId) return; // already ran today
  let notified = 0;

  const users = await pool.query(
    `SELECT DISTINCT u.id, u.email, u.first_name
     FROM watchlist w
     JOIN users u ON u.id = w.user_id
     WHERE u.email IS NOT NULL`
  );

  for (const user of users.rows) {
    const items = await pool.query(
      `SELECT p.id, p.title, p.slug, p.current_price, p.buy_now_price, p.auction_end
       FROM watchlist w
       JOIN products p ON p.id = w.product_id
       WHERE w.user_id = $1 AND p.status = 'active'
       ORDER BY p.auction_end ASC NULLS LAST
       LIMIT 10`,
      [user.id]
    );
    if (items.rows.length === 0) continue;

    const rows = items.rows.map(p => `
      <tr>
        <td style="padding:8px 0">${escapeHtml(p.title)}</td>
        <td style="padding:8px 0;text-align:right">$${(p.current_price || p.buy_now_price || 0)}</td>
      </tr>`).join('');

    const html = `<h2>Items you're watching</h2>
      <table style="width:100%;border-collapse:collapse">${rows}</table>
      <p style="color:#666">You're receiving this because you added items to your watchlist.</p>`;

    try {
      await sendEmail(user.email, 'Your watchlist digest', html, user.id, 'watched_digest');
      notified++;
    } catch (_) { /* keep going */ }
  }

  await finishRun(runId, notified);
  console.log(`[digest] watched_digest: ${notified} users notified`);
};

// ---------- Job 2: Price-drop digest ----------
const runPriceDropDigest = async () => {
  const runId = await claimRun('price_drop_digest');
  if (!runId) return;
  let notified = 0;

  // Target products whose buy_now_price dropped since yesterday (rough: updated_at within 24h)
  const drops = await pool.query(
    `SELECT DISTINCT pa.user_id, u.email, u.first_name,
            p.id AS product_id, p.title, p.slug, p.buy_now_price, p.current_price, pa.target_price
     FROM price_alerts pa
     JOIN products p ON p.id = pa.product_id
     JOIN users u ON u.id = pa.user_id
     WHERE p.status = 'active'
       AND p.updated_at > NOW() - INTERVAL '24 hours'
       AND (
         (pa.target_price IS NOT NULL AND COALESCE(p.current_price, p.buy_now_price) <= pa.target_price)
         OR pa.alert_on_any_drop = true
       )`
  ).catch(() => ({ rows: [] }));

  const byUser = new Map();
  for (const row of drops.rows) {
    if (!byUser.has(row.user_id)) byUser.set(row.user_id, { email: row.email, items: [] });
    byUser.get(row.user_id).items.push(row);
  }

  for (const [userId, bag] of byUser.entries()) {
    const rows = bag.items.map(p => `<li>${escapeHtml(p.title)} — $${p.current_price || p.buy_now_price}</li>`).join('');
    const html = `<h2>Price drops on items you track</h2><ul>${rows}</ul>`;
    try {
      await sendEmail(bag.email, 'Price drops on your tracked items', html, userId, 'price_drop_digest');
      notified++;
    } catch (_) { /* ignore */ }
  }

  await finishRun(runId, notified);
  console.log(`[digest] price_drop_digest: ${notified} users notified`);
};

// ---------- Job 3: Saved-search new-match alerts ----------
const runSavedSearchAlerts = async () => {
  const runId = await claimRun('saved_search_alerts');
  if (!runId) return;
  let notified = 0;

  const searches = await pool.query(
    `SELECT s.id, s.user_id, u.email, s.query, s.filters
     FROM saved_searches s
     JOIN users u ON u.id = s.user_id
     WHERE COALESCE(s.email_alerts, true) = true`
  ).catch(() => ({ rows: [] }));

  for (const s of searches.rows) {
    // Simple implementation: run an FTS query for the saved query, find new matches since last run
    const lastRun = await pool.query(
      'SELECT last_run_at, last_seen_product_ids FROM saved_search_last_run WHERE saved_search_id = $1',
      [s.id]
    );
    const since = lastRun.rows[0]?.last_run_at || new Date(Date.now() - 7 * 24 * HOUR);
    const seen = lastRun.rows[0]?.last_seen_product_ids || [];

    const matches = await pool.query(
      `SELECT id, title, slug, current_price, buy_now_price
       FROM products
       WHERE status = 'active'
         AND created_at > $1
         AND (search_vector @@ websearch_to_tsquery('english', $2))
         AND id <> ALL($3::uuid[])
       ORDER BY created_at DESC
       LIMIT 10`,
      [since, s.query || '', seen]
    ).catch(() => ({ rows: [] }));

    if (matches.rows.length > 0) {
      const html = `<h2>New matches for "${escapeHtml(s.query)}"</h2><ul>` +
        matches.rows.map(m => `<li>${escapeHtml(m.title)} — $${m.current_price || m.buy_now_price}</li>`).join('') +
        '</ul>';
      try {
        await sendEmail(s.email, `New matches: ${s.query}`, html, s.user_id, 'saved_search_alert');
        notified++;
      } catch (_) { /* ignore */ }
    }

    // Record this run
    await pool.query(
      `INSERT INTO saved_search_last_run (saved_search_id, last_run_at, last_seen_product_ids)
       VALUES ($1, NOW(), $2)
       ON CONFLICT (saved_search_id)
       DO UPDATE SET last_run_at = NOW(),
                     last_seen_product_ids = EXCLUDED.last_seen_product_ids`,
      [s.id, matches.rows.map(m => m.id)]
    );
  }

  await finishRun(runId, notified);
  console.log(`[digest] saved_search_alerts: ${notified} users notified`);
};

// ---------- Job 4: Feedback (review) reminders ----------
// 3 days after delivery, nudge the buyer to leave a review for each purchased
// product they haven't reviewed. Tracked on orders.review_reminder_sent_at so
// we only remind once per order.
const runFeedbackReminders = async () => {
  const runId = await claimRun('feedback_reminders');
  if (!runId) return;
  let notified = 0;

  const due = await pool.query(
    `SELECT o.id AS order_id, o.order_number, o.buyer_id, u.email, u.first_name
       FROM orders o
       JOIN users u ON u.id = o.buyer_id
      WHERE o.status = 'delivered'
        AND o.delivered_at IS NOT NULL
        AND o.delivered_at < NOW() - INTERVAL '3 days'
        AND o.review_reminder_sent_at IS NULL
      LIMIT 500`
  );

  for (const row of due.rows) {
    // Products on this order that the buyer hasn't reviewed yet.
    const pending = await pool.query(
      `SELECT DISTINCT oi.product_id, p.title, p.slug
         FROM order_items oi
         JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = $1
          AND NOT EXISTS (
                SELECT 1 FROM reviews r
                 WHERE r.order_id = $1
                   AND r.reviewer_id = $2
                   AND r.product_id = oi.product_id
                   AND r.review_type = 'product'
              )`,
      [row.order_id, row.buyer_id]
    );

    if (pending.rows.length > 0) {
      // One in-app notification per pending product (cheap, ties directly to product page).
      for (const p of pending.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, type, title, message, link)
           VALUES ($1, 'review', $2, $3, $4)`,
          [
            row.buyer_id,
            'How was your purchase?',
            `Leave a review for "${p.title}" from order ${row.order_number}.`,
            `/products/${p.slug}?review=${row.order_id}`,
          ]
        );
      }

      // Best-effort email digest if we have an address.
      if (row.email) {
        const html = `<h2>How did your recent order go?</h2>
          <p>Your reviews help other shoppers. Tap below to rate the items you got.</p>
          <ul>${pending.rows.map(p => `<li>${escapeHtml(p.title)}</li>`).join('')}</ul>`;
        try {
          await sendEmail(row.email, 'Leave a review for your recent order', html, row.buyer_id, 'feedback_reminder');
        } catch (_) { /* ignore */ }
      }
      notified++;
    }

    // Mark the order reminded regardless of pending count so we don't retry daily.
    await pool.query(
      'UPDATE orders SET review_reminder_sent_at = NOW() WHERE id = $1',
      [row.order_id]
    );
  }

  await finishRun(runId, notified);
  console.log(`[digest] feedback_reminders: ${notified} buyers notified`);
};

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const runAll = async () => {
  // Only run between 08:00 and 10:00 local time to avoid spamming on boot
  const hour = new Date().getHours();
  if (hour < 8 || hour > 10) return;

  try { await runWatchedDigest(); } catch (e) { console.error('watched_digest failed:', e.message); }
  try { await runPriceDropDigest(); } catch (e) { console.error('price_drop_digest failed:', e.message); }
  try { await runSavedSearchAlerts(); } catch (e) { console.error('saved_search_alerts failed:', e.message); }
  try { await runFeedbackReminders(); } catch (e) { console.error('feedback_reminders failed:', e.message); }
};

const start = () => {
  // Check hourly; each job guards itself against multiple runs/day
  setInterval(runAll, HOUR);
  // Also run once ~20s after boot (harmless thanks to idempotency)
  setTimeout(() => { runAll().catch(() => {}); }, 20_000);
  console.log('[digest] scheduler started');
};

module.exports = { start, runWatchedDigest, runPriceDropDigest, runSavedSearchAlerts, runFeedbackReminders };
