/**
 * GDPR / Right-to-be-Forgotten — data deletion endpoint.
 * POST /api/users/:id/delete-data
 *
 * - Users can only request deletion of their own data.
 * - Admins can request deletion for any user.
 *
 * What happens:
 *  1. User record: name/email replaced with anonymized placeholders.
 *  2. Addresses: full_name / phone replaced; street addresses redacted.
 *  3. Messages: body replaced with [deleted].
 *  4. An audit log entry is created in security_audit_logs.
 *  5. HTTP 200 confirmation returned.
 *
 * Note: orders, reviews, bids etc. retain non-personal aggregate data
 * (amounts, timestamps, product ids) so marketplace history integrity is
 * preserved — only PII is removed.
 */

const { pool } = require('../config/database');

const deleteUserData = async (req, res, next) => {
  const { id: targetUserId } = req.params;

  // Authorization check
  if (!req.user.is_admin && req.user.id !== targetUserId) {
    return res.status(403).json({ error: 'You can only request deletion of your own data' });
  }

  // Start a transaction so we don't end up in a partial state
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check user exists
    const userCheck = await client.query(
      'SELECT id, email, username FROM users WHERE id = $1',
      [targetUserId]
    );
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userCheck.rows[0];
    const anonSuffix = targetUserId.replace(/-/g, '').slice(0, 12); // 12-char hex fragment
    const anonUsername = `deleted_user_${anonSuffix}`;
    const anonEmail = `deleted_${anonSuffix}@deleted.invalid`;

    // 2. Anonymize the user record
    await client.query(
      `UPDATE users SET
         username    = $1,
         email       = $2,
         first_name  = 'Deleted',
         last_name   = 'User',
         phone       = NULL,
         avatar_url  = NULL,
         bio         = NULL,
         status      = 'inactive',
         updated_at  = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [anonUsername, anonEmail, targetUserId]
    );

    // 3. Anonymize addresses (keep record structure so orders still reference them)
    await client.query(
      `UPDATE addresses SET
         full_name        = 'Deleted User',
         street_address   = '[redacted]',
         street_address_2 = NULL,
         phone            = NULL,
         updated_at       = CURRENT_TIMESTAMP
       WHERE user_id = $1`,
      [targetUserId]
    );

    // 4. Anonymize message content (both sent and received)
    await client.query(
      `UPDATE messages SET
         body       = '[This message has been deleted per GDPR request]',
         updated_at = CURRENT_TIMESTAMP
       WHERE sender_id = $1 OR recipient_id = $1`,
      [targetUserId]
    );

    // 5. Nullify Stripe customer/account links so no billing data can be retrieved
    await client.query(
      `UPDATE users SET stripe_customer_id = NULL WHERE id = $1`,
      [targetUserId]
    );

    // 6. Write audit log entry
    const requestIp = req.ip || req.headers['x-forwarded-for'] || null;
    await client.query(
      `INSERT INTO security_audit_logs
         (event_type, severity, source_ip, user_agent, user_id, request_url, details, created_at)
       VALUES
         ('gdpr_data_deletion', 'info', $1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [
        requestIp,
        req.headers['user-agent'] || null,
        req.user.id, // who triggered the deletion (may differ from target in admin case)
        req.originalUrl,
        JSON.stringify({
          targetUserId,
          requestedBy: req.user.id,
          originalEmail: user.email,
          originalUsername: user.username,
          anonymizedAs: anonUsername,
        }),
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'User data has been anonymized in accordance with GDPR right-to-erasure.',
      userId: targetUserId,
      anonymizedAs: anonUsername,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

module.exports = { deleteUserData };
