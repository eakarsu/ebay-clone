const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const { pool } = require('../config/database');

// Configure authenticator with a larger time window to handle clock drift
authenticator.options = {
  window: 2, // Allow codes from 1 step before and after (±30 seconds)
};
const emailService = require('../services/emailService');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, email_verification_token)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, first_name, last_name, is_seller, avatar_url, member_since`,
      [username, email, passwordHash, firstName, lastName, verificationToken]
    );

    const user = result.rows[0];

    // Create shopping cart for user
    await pool.query('INSERT INTO shopping_carts (user_id) VALUES ($1)', [user.id]);

    // Send welcome email
    await emailService.sendWelcomeEmail({
      id: user.id,
      email,
      firstName,
      username,
    });

    // Send verification email
    await emailService.sendVerificationEmail(
      { id: user.id, email, firstName, username },
      verificationToken
    );

    const token = generateToken(user.id);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isSeller: user.is_seller,
        avatarUrl: user.avatar_url,
        memberSince: user.member_since,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Find user
    const result = await pool.query(
      `SELECT id, username, email, password_hash, first_name, last_name,
              is_seller, is_admin, avatar_url, member_since, status, two_factor_enabled
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA if enabled
    if (user.two_factor_enabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          requiresTwoFactor: true,
          message: 'Please provide your 2FA code',
        });
      }

      const twoFactorResult = await pool.query(
        'SELECT secret FROM two_factor_auth WHERE user_id = $1 AND is_enabled = true',
        [user.id]
      );

      if (twoFactorResult.rows.length > 0) {
        const isValid = authenticator.verify({
          token: twoFactorCode,
          secret: twoFactorResult.rows[0].secret,
        });

        if (!isValid) {
          // Check backup codes
          const backupResult = await pool.query(
            'SELECT backup_codes FROM two_factor_auth WHERE user_id = $1',
            [user.id]
          );

          if (backupResult.rows[0]?.backup_codes?.includes(twoFactorCode)) {
            // Remove used backup code
            const newCodes = backupResult.rows[0].backup_codes.filter(c => c !== twoFactorCode);
            await pool.query(
              'UPDATE two_factor_auth SET backup_codes = $1 WHERE user_id = $2',
              [newCodes, user.id]
            );
          } else {
            return res.status(401).json({ error: 'Invalid 2FA code' });
          }
        }
      }
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        isSeller: user.is_seller,
        isAdmin: user.is_admin,
        avatarUrl: user.avatar_url,
        memberSince: user.member_since,
        twoFactorEnabled: user.two_factor_enabled,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, first_name, last_name, phone, avatar_url, bio,
              is_verified, is_seller, is_admin, seller_rating, total_sales, member_since,
              email_verified, two_factor_enabled
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      isVerified: user.is_verified,
      isSeller: user.is_seller,
      isAdmin: user.is_admin,
      sellerRating: parseFloat(user.seller_rating),
      totalSales: user.total_sales,
      memberSince: user.member_since,
      emailVerified: user.email_verified,
      twoFactorEnabled: user.two_factor_enabled,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, bio } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           bio = COALESCE($4, bio),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, first_name, last_name, phone, bio, avatar_url`,
      [firstName, lastName, phone, bio, req.user.id]
    );

    const user = result.rows[0];

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatar_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const result = await pool.query(
      'SELECT id, email FROM users WHERE email_verification_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await pool.query(
      `UPDATE users SET email_verified = true, email_verification_token = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [result.rows[0].id]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// Request password reset
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await pool.query(
      'SELECT id, username, email, first_name FROM users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration
    if (result.rows.length === 0) {
      return res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
    }

    const user = result.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // Send email
    await emailService.sendPasswordResetEmail(user, resetToken);

    res.json({ message: 'If an account exists with that email, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// Reset password with token
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = false`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const resetToken = result.rows[0];

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE id = $1',
      [resetToken.id]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

// Change password (when logged in)
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// Setup 2FA
const setup2FA = async (req, res, next) => {
  try {
    // Check if already enabled
    const existing = await pool.query(
      'SELECT * FROM two_factor_auth WHERE user_id = $1',
      [req.user.id]
    );

    if (existing.rows[0]?.is_enabled) {
      return res.status(400).json({ error: '2FA is already enabled' });
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Generate QR code
    const otpAuthUrl = authenticator.keyuri(
      req.user.email,
      process.env.TWO_FA_ISSUER || 'eBayClone',
      secret
    );

    const qrCode = await QRCode.toDataURL(otpAuthUrl);

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    // Store (not enabled yet)
    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE two_factor_auth SET secret = $1, backup_codes = $2, updated_at = CURRENT_TIMESTAMP WHERE user_id = $3',
        [secret, backupCodes, req.user.id]
      );
    } else {
      await pool.query(
        'INSERT INTO two_factor_auth (user_id, secret, backup_codes) VALUES ($1, $2, $3)',
        [req.user.id, secret, backupCodes]
      );
    }

    res.json({
      secret,
      qrCode,
      backupCodes,
      message: 'Scan the QR code with your authenticator app, then verify with a code',
    });
  } catch (error) {
    next(error);
  }
};

// Verify and enable 2FA
const verify2FA = async (req, res, next) => {
  try {
    const { code } = req.body;

    const result = await pool.query(
      'SELECT secret, backup_codes FROM two_factor_auth WHERE user_id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Please set up 2FA first' });
    }

    const secret = result.rows[0].secret;

    // In development mode, log the expected code for testing
    if (process.env.NODE_ENV !== 'production') {
      const expectedCode = authenticator.generate(secret);
      console.log(`[DEV] 2FA Expected code: ${expectedCode} (valid for ~30 seconds)`);
    }

    const isValid = authenticator.verify({
      token: code,
      secret: secret,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Enable 2FA
    await pool.query(
      'UPDATE two_factor_auth SET is_enabled = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [req.user.id]
    );

    await pool.query(
      'UPDATE users SET two_factor_enabled = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    // Return backup codes
    res.json({
      message: '2FA enabled successfully',
      backupCodes: result.rows[0].backup_codes || []
    });
  } catch (error) {
    next(error);
  }
};

// Disable 2FA
const disable2FA = async (req, res, next) => {
  try {
    const { code, password } = req.body;

    // Check if 2FA is enabled first
    const twoFaResult = await pool.query(
      'SELECT secret FROM two_factor_auth WHERE user_id = $1 AND is_enabled = true',
      [req.user.id]
    );

    if (twoFaResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    // If password and code provided, verify them (production mode)
    if (password && code) {
      // Verify password
      const userResult = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!userResult.rows[0]?.password_hash) {
        return res.status(400).json({ error: 'User not found' });
      }

      const isMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Invalid password' });
      }

      // Verify 2FA code
      const isValid = authenticator.verify({
        token: code,
        secret: twoFaResult.rows[0].secret,
      });

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid 2FA code' });
      }
    }
    // In development/demo mode, allow disabling without verification

    // Disable 2FA
    await pool.query(
      'UPDATE two_factor_auth SET is_enabled = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [req.user.id]
    );

    await pool.query(
      'UPDATE users SET two_factor_enabled = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [req.user.id]
    );

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    next(error);
  }
};

// Get new backup codes
const regenerateBackupCodes = async (req, res, next) => {
  try {
    const { code } = req.body;

    const twoFaResult = await pool.query(
      'SELECT secret FROM two_factor_auth WHERE user_id = $1 AND is_enabled = true',
      [req.user.id]
    );

    if (twoFaResult.rows.length === 0) {
      return res.status(400).json({ error: '2FA is not enabled' });
    }

    const isValid = authenticator.verify({
      token: code,
      secret: twoFaResult.rows[0].secret,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await pool.query(
      'UPDATE two_factor_auth SET backup_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [backupCodes, req.user.id]
    );

    res.json({ backupCodes, message: 'New backup codes generated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  setup2FA,
  verify2FA,
  disable2FA,
  regenerateBackupCodes,
};
