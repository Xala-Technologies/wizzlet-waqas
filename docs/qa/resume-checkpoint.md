# Resume checkpoint — after Wave 19 (F-012)

## Open PR stack

- **#10–#21** through J7 identity
- **#22** (this) `fix/admin-pagination-f012-w19` — F-012 cursor pagination for admin lists

## Wave 19 / F-012

- `convex/admin/paginatedLists.ts`: `listUsersPage`, `listCreatorsPage`, `listPayoutsPage`, `listSubscriptionsPage`
- Admin Users / Creators / Payouts history use `usePaginatedQuery` + Load more
- Per-row enrichment via indexes (no full-table client joins on those pages)
- Residual: join-heavy admin pages + `dashboardStats` still use capped `adminTakeNewest` (500)

## Still open

- Journey J8 (migration — BLOCKED)
- Referral cash commission productization
- Remaining admin pages on capped `listAllAdmin`
- Exact dashboard aggregates (not take-based)
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
