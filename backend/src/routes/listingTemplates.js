const express = require('express');
const router = express.Router();
const { authenticateToken: authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/listingTemplateController');

router.get('/', authenticate, ctrl.listTemplates);
router.get('/:id', authenticate, ctrl.getTemplate);
router.post('/', authenticate, ctrl.createTemplate);
router.put('/:id', authenticate, ctrl.updateTemplate);
router.delete('/:id', authenticate, ctrl.deleteTemplate);
router.post('/:id/apply', authenticate, ctrl.applyTemplate);

module.exports = router;
