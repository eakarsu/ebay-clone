const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
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
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validations, handleValidation } = require('../middleware/validate');

// Public routes
router.post('/register', validations.register, handleValidation, register);
router.post('/login', validations.login, handleValidation, login);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/profile', authenticateToken, getProfile);
router.get('/me', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.post('/change-password', authenticateToken, validations.changePassword, handleValidation, changePassword);

// 2FA routes
router.post('/2fa/setup', authenticateToken, setup2FA);
router.post('/2fa/verify', authenticateToken, verify2FA);
router.post('/2fa/disable', authenticateToken, disable2FA);
router.post('/2fa/regenerate-backup-codes', authenticateToken, regenerateBackupCodes);

module.exports = router;
