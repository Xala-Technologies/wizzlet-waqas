# Resume checkpoint — after Wave 21 (exact admin aggregates)

## Open PR stack

- **#10–#23** through F-012 residual list pagination
- **#24** (this) `fix/admin-pagination-f012-w21` — exact dashboard/finance/fees/alerts + email/messaging

## Wave 21

- `adminScanAll` (5k/table take; no paginate — Convex one-paginate-per-fn) for aggregates
- `dashboardStats` raised from 500 → 5k/table exact-ish scans
- `admin/snapshots`: `financeOverview`, `feesOverview`, `alertsOverview`
- Customer Email: server-side audience resolve + `listCampaignsPage`
- Creator Messaging: `listCreatorsPage` + `listSupportMessagesPage`
- Residual: Admin Reports / Payouts top-panel still use capped `listAllAdmin`; Aggregate component for true unbounded exactness

## Still open

- Journey J8 (migration — BLOCKED)
- Referral cash commission productization
- Admin Reports export path (still take-based)
- Denormalized counters / Aggregate component for very large scale
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
