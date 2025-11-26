const express = require('express');
const router = express.Router();
const { getAllCategories, getCategoryBySlug, getCategoriesWithSubcategories } = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.get('/with-subcategories', getCategoriesWithSubcategories);
router.get('/:slug', getCategoryBySlug);

module.exports = router;
