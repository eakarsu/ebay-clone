const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { deleteUserData } = require('../controllers/gdprController');

// GDPR right-to-erasure — users can delete their own data; admins can delete any user's data
router.post('/:id/delete-data', authenticateToken, deleteUserData);

module.exports = router;
