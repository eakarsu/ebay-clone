/**
 * Per-user (and per-IP) rate limiters for sensitive endpoints.
 *
 * Per-user key function: falls back to IP if the user is not yet identified
 * (e.g. auth endpoints where the token may not be validated yet).
 */

const rateLimit = require('express-rate-limit');

/**
 * Returns a key derived from the authenticated user id when available,
 * otherwise falls back to the client IP.
 */
const userOrIpKey = (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return req.ip;
};

/**
 * Bid rate limiter — 10 bids per minute per user.
 * Must be applied AFTER authenticateToken so req.user is populated.
 */
const bidRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many bids. You can place at most 10 bids per minute.' },
  skipFailedRequests: false,
});

/**
 * Cart rate limiter — 30 operations per minute per user.
 * Must be applied AFTER authenticateToken so req.user is populated.
 */
const cartRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many cart requests. Limit is 30 operations per minute.' },
  skipFailedRequests: false,
});

/**
 * Auth rate limiter — 5 attempts per 15 minutes per IP.
 * Applied to login/register/forgot-password which don't have an authenticated user yet.
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: false,
});

/**
 * AI rate limiter — 20 calls per user per hour.
 * Cross-project standard "aiRateLimiter (20/hr by user)". Closes the audit
 * gap "AI has no token budget / per-user quota — abuseable for cost".
 */
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.AI_HOURLY_LIMIT, 10) || 20,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI hourly budget exhausted (20/hr). Try again later.' },
});

module.exports = { bidRateLimit, cartRateLimit, authRateLimit, aiRateLimit };
