# Database Architecture Audit — Overview

**Product:** Wizzlet — sports tipster / creator subscription SaaS  
**Date:** 2026-09-05  
**Constraint:** Live Supabase management access unavailable. Inventory from repo migrations + `types.ts`. **Authoritative persistence target: Convex** (`combative-mongoose-559`).

## Architecture (as-built)

```text
React SPA (Vite)
  ├─ Supabase Auth — login/signup/password + JWT for Convex
  ├─ Supabase Storage — avatars/banners only
  └─ Convex — ALL business data (default; PostgREST cut over)
```

## Tenancy model

Not org-multi-tenant. Isolation is by:

- **Platform admin** (`userRoles.role = admin`)
- **Creator ownership** (`creators.userId`)
- **Subscriber relationship** (active `subscriptions`)

## Critical finding

Product UI is largely built, but:

1. ~~Many pages still call Supabase PostgREST~~ — **cutover in progress**; Convex is default (`VITE_DATA_BACKEND=convex`). Residual PostgREST call sites remain on some dashboards.
2. ~~placeholder KPIs / fake lists~~ — Admin dashboard, Creator earnings, Creators landing, sport events fixed to Convex/empty.
3. Dual ID model resolved on Convex (`users.externalAuthId` → `users._id` for all FKs).
4. Convex is the authoritative persistence target.

See `INVESTIGATION-SUMMARY.md` for the required 15-section investigation response.
