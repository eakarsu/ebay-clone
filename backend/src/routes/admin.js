const express = require('express');
const router = express.Router();
const {
  requireAdmin,
  getDashboard,
  getUsers,
  getUserDetails,
  updateUser,
  deleteUser,
  getProducts,
  updateProductStatus,
  getOrders,
  getDisputes,
  getAdminLogs,
  createCategory,
  updateCategory,
  deleteCategory,
  getSystemStats,
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication and admin access
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', getDashboard);
router.get('/stats', getSystemStats);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Products
router.get('/products', getProducts);
router.put('/products/:id/status', updateProductStatus);

// Orders
router.get('/orders', getOrders);

// Disputes
router.get('/disputes', getDisputes);

// Logs
router.get('/logs', getAdminLogs);

// Categories
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

module.exports = router;
