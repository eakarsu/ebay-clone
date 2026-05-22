const express = require('express');

const router = express.Router();

router.post('/score', (req, res) => {
  const listings = Array.isArray(req.body?.listings)
    ? req.body.listings
    : [
        { title: 'Vintage camera', price: 220, categoryFeePct: 0.1325, promotedPct: 0.08, shippingSubsidy: 12 },
        { title: 'Sneakers', price: 145, categoryFeePct: 0.12, promotedPct: 0.04, shippingSubsidy: 0 },
      ];
  const scored = listings.map((listing) => {
    const price = Number(listing.price || 0);
    const fee = price * Number(listing.categoryFeePct || 0.13);
    const promoted = price * Number(listing.promotedPct || 0);
    const subsidy = Number(listing.shippingSubsidy || 0);
    const totalFees = fee + promoted + subsidy;
    const feePct = price ? (totalFees / price) * 100 : 0;
    return {
      title: listing.title || 'Listing',
      totalFees: Number(totalFees.toFixed(2)),
      feePct: Number(feePct.toFixed(1)),
      recommendation: feePct > 22 ? 'lower promoted rate or charge shipping' : feePct > 17 ? 'test promoted rate cap' : 'fee mix healthy',
    };
  });
  res.json({
    scored,
    averageFeePct: Number((scored.reduce((sum, row) => sum + row.feePct, 0) / Math.max(1, scored.length)).toFixed(1)),
  });
});

module.exports = router;
