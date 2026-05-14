/**
 * AI Results — read-only history per resource.
 *   GET /api/ai-results/:resourceType/:resourceId            paginated
 *   GET /api/ai-results/:resourceType/:resourceId/latest/:feature
 */
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const aiResultsStore = require('../services/aiResultsStore');

const router = express.Router();

router.get('/:resourceType/:resourceId', authenticateToken, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit  || '25', 10), 100);
  const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);
  const out = await aiResultsStore.listForResource(
    req.params.resourceType,
    req.params.resourceId,
    { limit, offset },
  );
  res.json(out);
});

router.get('/:resourceType/:resourceId/latest/:feature', authenticateToken, async (req, res) => {
  const row = await aiResultsStore.latestForResource(
    req.params.resourceType, req.params.resourceId, req.params.feature,
  );
  if (!row) return res.status(404).json({ error: 'No AI result yet for that feature' });
  res.json(row);
});

module.exports = router;
