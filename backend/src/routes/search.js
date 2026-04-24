const express = require('express');
const router = express.Router();
const { search, suggest } = require('../controllers/searchController');

router.get('/', search);
router.get('/suggest', suggest);

module.exports = router;
