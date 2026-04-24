const express = require('express');
const router = express.Router();
const { searchByImage, upload } = require('../controllers/imageSearchController');

// Single route — accepts multipart image OR JSON { imageUrl }.
router.post('/', upload.single('image'), searchByImage);

module.exports = router;
