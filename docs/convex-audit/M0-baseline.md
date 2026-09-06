# Release baseline / containment (M0)

**Date:** 2026-09-06  
**Release candidate SHA:** `4ad800119b7caf6decc14d0e10b50c8a711b820f` (`feat/convex-cutover-stripe`)  
**Gate:** `NOT READY` until WZ-01 and payment P1s (WZ-02/03) are fixed and tested.

## Environments

| Env | Deployment | Notes |
|-----|------------|--------|
| Dev (app data) | `combative-mongoose-559` | Convex Auth + Stripe test |
| Prod (read-only MCP) | `ceaseless-weasel-494` | Do not promote RC without gate |
| App origin (local) | `http://localhost:8080` | `SITE_URL` on Convex |

## Required Convex env (dev)

- `SITE_URL`
- `JWT_PRIVATE_KEY` / `JWKS` (Convex Auth)
- `STRIPE_SECRET_KEY` (test)
- `STRIPE_WEBHOOK_SECRET`
- `ALLOW_SANDBOX_CHECKOUT=true` (dev only — never on live)

## Production change boundary

Until WZ-01 is cleared:

- Do **not** merge to `production` / promote live Stripe.
- Do **not** enable `ALLOW_SANDBOX_CHECKOUT` on any live deployment.
- Do **not** claim historical migration parity (greenfield baseline — see ADR).

## Package baseline

- `convex` ^1.45.0, `@convex-dev/auth` ^0.0.95, `stripe` (npm), Vitest
- Lockfile: `package-lock.json` (npm)
