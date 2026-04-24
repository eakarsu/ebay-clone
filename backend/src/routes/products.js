const express = require('express');
const router = express.Router();
const { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getFilters } = require('../controllers/productController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validations, handleValidation } = require('../middleware/validate');

router.get('/', optionalAuth, getAllProducts);
router.get('/filters', optionalAuth, getFilters);
router.get('/:id', optionalAuth, getProductById);
router.post('/', authenticateToken, validations.createProduct, handleValidation, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

module.exports = router;
