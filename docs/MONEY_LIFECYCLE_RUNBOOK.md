# Money lifecycle runbook

## Deployment gate

1. Back up PostgreSQL and confirm restore time/objectives.
2. Run `cd backend && npm ci && npm test` with `TEST_DATABASE_URL` pointing only to a disposable database.
3. Run `npm run migrate`. Numbered migrations are transactional and checksum-locked.
4. Configure Stripe webhook signing, the HMAC event sink, tax, shipping, and KYC adapters. Production startup fails if these settings are absent.
5. Leave `ALLOW_DIRECT_PAYMENT_METHODS=false`. Never seed a production database.

## Reconciliation

- `GET /api/payment/reconciliation` is admin-only and reports operation, webhook, outbox, and issue queues.
- Retry a durable refund with `POST /api/payment/reconciliation/operations/:id/retry`.
- Replay a failed/dead-letter webhook with `POST /api/payment/reconciliation/webhooks/:id/replay`.
- Never edit `accounting_ledger` or `order_lifecycle_events`; database triggers make both append-only.
- Investigate all critical `paid_after_inventory_release`, `chargeback_received`, and dead-letter issues before allowing payout.

## Incident procedures

- Provider timeout: reuse the original idempotency key. Do not construct a new refund or payout request.
- Webhook backlog: check signature failures first, then replay retryable rows. Escalate after five attempts.
- Payment succeeded after failed inventory release: keep payout held, source replacement inventory or refund the buyer, and resolve the reconciliation issue with an audit note.
- Chargeback: keep payout held; if already paid, begin seller recovery and attach dispute evidence in Stripe.
- Lost shipment: open a dispute/return, keep payout held, and use the carrier claim result before refunding.
- Disaster recovery: restore the database, compare payment intents/refunds/transfers with `payment_operations`, replay unprocessed inbox rows, then resume outbox delivery.

## Privacy and secrets

Store live secrets in the deployment secret manager, rotate them after exposure, and redact provider payloads from logs. Limit webhook/payment metadata to opaque IDs. Define retention jobs for addresses, support attachments, audit logs, and provider inbox payloads according to applicable legal requirements; legal/compliance owners must approve the schedule before launch.
