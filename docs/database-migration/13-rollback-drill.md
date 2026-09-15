# Rollback drill (run on staging)

1. Confirm app works with `VITE_DATA_BACKEND=supabase`.
2. Deploy a build with `VITE_DATA_BACKEND=convex` to staging only.
3. Smoke: login, dashboard load (expect Convex auth wiring).
4. Flip flag back to `supabase` and redeploy within 5 minutes.
5. Confirm login + PostgREST data still intact (Supabase untouched).
6. Record time-to-rollback and any errors in `12-post-migration-report.md`.

Never delete Supabase data during the drill.
