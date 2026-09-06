# Resume checkpoint — after Wave 20 (F-012 residual)

## Open PR stack

- **#10–#22** through primary admin pagination
- **#23** (this) `fix/admin-pagination-f012-w20` — F-012 residual admin pages

## Wave 20 / F-012 residual

- Extended `convex/admin/paginatedLists.ts`: `listCustomersPage`, `listCasesPage`, `listSupportMessagesPage`, `listTransactionsPage`
- Wired: Admin Customers, Resolution Cases, Growth Manager Inbox, Transactions → `usePaginatedQuery` + Load more
- Residual: Finance / Fees / Alerts / Reports / Customer Email / Creator Messaging + `dashboardStats` still capped

## Still open

- Journey J8 (migration — BLOCKED)
- Referral cash commission productization
- Remaining admin pages on capped `listAllAdmin`
- Exact dashboard aggregates (not take-based)
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
