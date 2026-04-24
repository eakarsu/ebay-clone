const { body, param, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const validations = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('username').isLength({ min: 3, max: 30 }).trim().withMessage('Username must be between 3 and 30 characters'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').isLength({ min: 1, max: 50 }).trim().withMessage('First name is required'),
    body('lastName').isLength({ min: 1, max: 50 }).trim().withMessage('Last name is required'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  createProduct: [
    body('title').isLength({ min: 3, max: 200 }).trim().withMessage('Title must be between 3 and 200 characters'),
    body('price').isFloat({ min: 0.01, max: 999999.99 }).withMessage('Price must be between $0.01 and $999,999.99'),
    body('description').isLength({ min: 10, max: 10000 }).withMessage('Description must be between 10 and 10,000 characters'),
  ],
  createReview: [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').isLength({ min: 10, max: 2000 }).withMessage('Review must be between 10 and 2,000 characters'),
  ],
  sendMessage: [
    body('content').isLength({ min: 1, max: 5000 }).withMessage('Message must be between 1 and 5,000 characters'),
  ],
  placeBid: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Bid amount must be a positive number'),
  ],
  createOffer: [
    body('amount').isFloat({ min: 0.01 }).withMessage('Offer amount must be a positive number'),
  ],
  changePassword: [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  uuidParam: [
    param('id').isUUID().withMessage('Valid ID is required'),
  ],
};

module.exports = { validations, handleValidation };
