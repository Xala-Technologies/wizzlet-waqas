# Cutover Plan

## Preconditions

- [ ] Convex prod schema + indexes deployed
- [ ] ETL reconciled (0 unexplained deltas)
- [ ] Auth bridge verified
- [ ] Authz negative tests green
- [ ] Fee totals match
- [ ] Rollback procedure rehearsed on staging
- [ ] Supabase backup verified by humans

## Steps

1. Freeze subscription **writes** briefly if needed.
2. Final incremental ETL catch-up.
3. Set `VITE_DATA_BACKEND=convex` for staff, then % traffic.
4. Switch payment action to Convex (disable sandbox edge writes).
5. Monitor 24–72h.
6. Expand to all users.

## Domains order for read cutover

Identity → creators/posts → member social → admin → **subscriptions last for writes**.
