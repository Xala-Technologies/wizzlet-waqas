# Final verification — Convex-only stack

Date: 2026-09-05

## Runtime stack

- **Auth:** Convex Auth (Password) — login / signup / password change
- **Database:** Convex
- **File storage:** Convex storage (avatars/banners)
- **Supabase:** removed (`@supabase/supabase-js` uninstalled; `supabase/` directory deleted)

## Checks

- [x] No `supabase.*` / `@supabase` imports under `src/`
- [x] No Supabase env vars required (`.env.example` is Convex-only)
- [x] `npx convex dev --once` succeeds with Auth schema
- [x] `npm test` passes
- [x] `npm run build` passes

## Smoke test (manual)

1. Sign up with email/password
2. Select role (creator / subscriber)
3. Log in again
4. Upload avatar (creator onboarding/settings)
5. Sandbox subscribe
