const express = require('express');
const router = express.Router();
const { compareProducts } = require('../controllers/compareController');

router.post('/', compareProducts);

module.exports = router;
