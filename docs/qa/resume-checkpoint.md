# Resume checkpoint — after Wave 16 (J5)

## Open PR stack

- **#10–#18** through J4 messaging
- **#19** (this) `test/qa-j5-payouts-w16` — J5 payout balance + UI fix

## Wave 16 / J5

- Shared `payoutBalance` helpers: settled Stripe `test`/`live` count; `sandbox` excluded
- UI: Lifetime / Available / Pending / Paid out — Paid out no longer uses reserved
- `requestPayout` / settings use `ConvexError` codes
- Unit: `payoutBalance.test.ts` — 5 cases PASS
- Browser: creator `/creator/payouts` shows earned ≈ $18.98; after min=$10 + request: Available $0 / Pending $18.98 / History `requested`

## Still open

- Journeys J6–J8
- F-012 residual cursor pagination
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
