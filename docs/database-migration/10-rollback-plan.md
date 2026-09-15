# Rollback Plan

## Immediate rollback

1. Redeploy with `VITE_DATA_BACKEND=supabase`.
2. Auth + Storage unchanged — login and avatars keep working.
3. Re-enable sandbox edge for payments if Convex payments were live.

## Writes during Convex-primary window

- Mutation log / documents include `legacyId` and `updatedAt`.
- Reverse sync only rows touched after cutover timestamp T0.
- Do not blindly overwrite older Supabase rows.

## Forbidden

- DROP Supabase tables during rollback window
- “Restore from backup and hope” as the only plan

## Retention

Keep Supabase DB available until explicit decommission approval after stabilization.
