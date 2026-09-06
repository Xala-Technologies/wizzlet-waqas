# Executive Summary — Supabase → Convex (Wizzlet)

## Goal

Migrate Wizzlet’s **application database** from Supabase PostgreSQL to Convex while:

- Keeping **Supabase Auth** and **Supabase Storage**
- Preserving product behavior, security, and money invariants
- Remaining reversible until stabilization is proven

## Product

Sports creator subscription SaaS: public profiles, member feeds, creator tools, admin finance. React SPA talks directly to PostgREST today (no separate API).

## Scope

| In scope | Out of scope (this program) |
|----------|-------------------------------|
| Postgres tables → Convex | Replacing Supabase Auth |
| RLS → Convex authz | Replacing Supabase Storage |
| Fee trigger → mutation logic | Live Stripe cutover |
| Sandbox checkout → Convex action | Demo route rewrites |
| Realtime notifications → Convex queries | Deleting Supabase production data |

## Strategy

Documentation → Convex foundation → domain modules on `dev` → resumable ETL → shadow validation → flagged cutover → stabilize → separate decommission approval.

## Success criteria

Convex holds reconciled production data; authz ≥ prior RLS hardening; critical flows work; rollback via `VITE_DATA_BACKEND=supabase` remains available; no unexplained record deltas.
