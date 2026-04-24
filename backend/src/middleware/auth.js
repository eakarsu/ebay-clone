const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');

const checkTokenBlacklist = async (token) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await pool.query(
    'SELECT id FROM token_blacklist WHERE token_hash = $1 AND expires_at > NOW()',
    [tokenHash]
  );
  return result.rows.length > 0;
};

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token is blacklisted
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }

    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, is_seller, is_admin, avatar_url FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, 'active']
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    // Invalid/untrusted token is an authentication failure (401), not authorization (403).
    // The frontend interceptor clears the stale token and redirects to /login on 401.
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Silently skip blacklisted tokens for optional auth
    const isBlacklisted = await checkTokenBlacklist(token);
    if (isBlacklisted) {
      return next();
    }

    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, is_seller, is_admin, avatar_url FROM users WHERE id = $1 AND status = $2',
      [decoded.userId, 'active']
    );

    if (result.rows.length > 0) {
      req.user = result.rows[0];
    }
  } catch (error) {
    // Ignore token errors for optional auth
  }

  next();
};

module.exports = { authenticateToken, optionalAuth };
