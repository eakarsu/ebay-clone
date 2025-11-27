const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const invoiceController = require('../controllers/invoiceController');

router.get('/my', authenticate, invoiceController.getMyInvoices);
router.get('/sent', authenticate, invoiceController.getSentInvoices);
router.get('/:id', authenticate, invoiceController.getInvoice);
router.post('/generate', authenticate, invoiceController.generateInvoice);
router.put('/:id/paid', authenticate, invoiceController.markPaid);

module.exports = router;
