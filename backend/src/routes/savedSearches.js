const express = require('express');
const router = express.Router();
const {
  createSavedSearch,
  getSavedSearches,
  getSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
  runSavedSearch,
  triggerAlerts,
} = require('../controllers/savedSearchController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/', createSavedSearch);
router.post('/run-alerts', triggerAlerts);
router.get('/', getSavedSearches);
router.get('/:id', getSavedSearch);
router.put('/:id', updateSavedSearch);
router.delete('/:id', deleteSavedSearch);
router.get('/:id/run', runSavedSearch);

module.exports = router;
