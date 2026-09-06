# Resume checkpoint — after Wave 13 (F-012 partial)

## Open PR stack

- **#10–#15** auth → portal → F-011 returns W9–W12
- **#16** (this) `fix/admin-pagination-f012-w13` — admin list hard caps (F-012 interim)

## Wave 13 / F-012

- `convex/lib/adminLists.ts` — `ADMIN_LIST_LIMIT` (500) + `adminTakeNewest`
- Admin full-table reads use `.take(500)` instead of unbounded `.collect()`
- Dashboard stats expose `truncated` / `listLimit` with UI notice
- True cursor pagination + admin UI load-more still deferred (join-heavy pages)

## Still open

- F-012 residual: cursor pagination / `usePaginatedQuery` for admin join pages; aggregate counters for exact dashboard stats
- Journeys J2/J4–J8
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
