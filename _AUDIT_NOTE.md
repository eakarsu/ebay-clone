# Audit Apply Notes — ebay

Source: `_AUDIT/reports/batch_09.md` § ebay

## Original audit recommendations

Audit verdict: **SUBSTANTIVE** — 81 routes, 13 AI endpoints. The "Missing AI Counterparts" section was not raised; only forward-looking ideas were listed.

### Missing non-AI features
- Carrier shipping integrations
- Inventory sync with external systems
- Bulk listing import

### Custom feature ideas
- Predictive demand (trending categories, seasonal patterns)
- Seller reputation prediction
- Counterfeit detection from product images + seller patterns
- Dynamic shipping suggestions by buyer location
- Buyer behaviour prediction (repeat purchase likelihood)
- Integration with supplier marketplaces (auto-sourcing)
- Auction-ending strategy recommendations
- Buyer payment fraud detection

## Implemented this pass

- `POST /api/ai/predict-demand` — wired through `aiController.predictDemand` and new `aiService.predictDemand`. Returns JSON forecast (demand_level, expected_unit_sales, confidence, drivers, risks, recommended_actions). Mechanical implementation of "Predictive demand (trending categories, seasonal patterns)".
- `POST /api/ai/seller-reputation` — wired through `aiController.predictSellerReputation` and new `aiService.predictSellerReputation`. Returns JSON analysis (current score, predicted 90d score, trend, risk/growth signals, interventions). Auth-required because it traffics seller-internal stats. Mechanical implementation of "Seller reputation prediction".

Both reuse the existing `makeRequest`, `parseAIJson`, and `aiResultsStore.record` patterns from the rest of the controller, and ride the `aiRateLimit` middleware mounted on the router. `node --check` passes for all three changed files.

## Backlog (not implemented)

### Needs creds / external deps
- Carrier shipping integrations (FedEx, UPS, USPS APIs).
- Inventory sync with external systems (channel-management vendors).
- Bulk listing import (CSV/eBay legacy formats — needs format choice).
- Supplier marketplace integrations (auto-sourcing).

### Needs product decision
- Counterfeit detection — overlaps existing `authenticityRoutes.js`; needs decision on combining vs separate ML pipeline.
- Dynamic shipping suggestions — needs zone/carrier rate cards.
- Buyer behaviour / repeat-purchase prediction — needs labelled outcomes dataset and segmentation policy.
- Auction-ending strategy recs — depends on bid feed + observability.
- Buyer payment fraud detection — overlaps existing `securityAudit.js` and fraud-analysis endpoint; needs scoping decision.

## Categorisation

- MECHANICAL: predict-demand, seller-reputation (both done).
- NEEDS-CREDS: carrier APIs, inventory-sync, supplier feeds.
- NEEDS-PRODUCT-DECISION: counterfeit pipeline, shipping zones, buyer behaviour, auction strategy, fraud-scoring scope.

## Apply pass 3 (frontend)

**Action:** UPDATED-FE — page existed but was orphaned (not imported, no route). Wired in `App.js`.

- `frontend/src/pages/AIDemandReputation.js` (already existed, 188 lines, MUI tabs for demand + reputation, uses `aiService.predictDemand` / `aiService.predictSellerReputation`).
- `frontend/src/services/api.js` already exposed both methods; axios interceptor attaches `Bearer ${localStorage.getItem('token')}`.
- Edit: `frontend/src/App.js` — added import and `<Route path="/ai-demand-reputation" element={<AIDemandReputation />} />`.
- 503 handling: page surfaces `err.response?.data?.error` in an MUI `Alert`.

Syntax check: `@babel/parser` parse on `App.js` and `AIDemandReputation.js` → both OK.

Log: `_AUDIT/apply3_logs/ab3_54.md`.
