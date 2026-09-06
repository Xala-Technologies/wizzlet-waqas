# Migration / Remediation Plan

## Constraint

No live Supabase DDL. Do **not** rely on applying new Postgres migrations.

## Steps

1. Extend Convex schema (productId, result enums, sportEvents, paymentEvents, verification).
2. Wire Supabase JWT → Convex Auth (or Convex Auth if Supabase Auth dead).
3. Set `VITE_DATA_BACKEND=convex` after auth works.
4. Replace page data access via `src/data/*` adapters.
5. Fix AdminDashboard / CreatorEarnings / Creators landing to real queries.
6. Normalize pick results to `won|lost|push|pending`.
7. Payout request creates `payouts` row status=`requested`.
8. Notifications always use `users._id`.
9. Optional ETL if any Supabase dump becomes available later.
10. Remove PostgREST imports only after domain cutovers verified.

## Rollback

Keep flag `VITE_DATA_BACKEND=supabase` available until PostgREST is confirmed dead; document Auth-only residual.
