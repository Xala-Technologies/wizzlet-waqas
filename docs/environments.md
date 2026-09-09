# Environments

Responsibilities for Prizelet. These are **roles**, not a requirement to buy five permanent hosts. Reuse Vercel previews and Convex development deployments where possible.

Companion docs: [environment-findings.md](./environment-findings.md), [release-process.md](./release-process.md).

## Map

| Environment | Purpose | Reuse | Required evidence |
|-------------|---------|-------|-------------------|
| **local** | Developer feedback | Vite `http://localhost:8080` + `npx convex dev` + `.env.local` | Origin, `VITE_CONVEX_URL`, `CONVEX_DEPLOYMENT` |
| **development** | Combined testing on `dev` | Convex **dev** deployment; Vercel git/`dev` or preview | Branch SHA, Convex deployment id, synthetic data only |
| **preview** | Isolated change verification | Vercel PR preview; Convex URL baked at **build** time | Candidate SHA, frontend↔backend pair |
| **staging** | Release rehearsal (optional label) | Same build recipe on RC SHA against non-prod Convex | Manifest + checks PASS |
| **production** | Customers | `https://www.prizelet.com` / `https://prizelet.com` + Convex **prod** | Approved release id, deployed revisions, protected credentials |

`VITE_APP_ENV` is the explicit deployment-environment identity. It is independent of Vite `MODE` (`development` vs `production` build). Never treat a client-supplied label as security evidence — server gates enforce money and admin.

### Convex mapping

| App env | Convex CLI / target |
|---------|---------------------|
| local / development | `npx convex dev` → development deployment |
| preview / staging | Non-prod deployment URL baked into the client; only use a separate Convex deploy if provisioned |
| production | `npx convex deploy` with a **production** deploy key |

There is no invented Convex CLI type named “staging”. Deploy behavior depends on the configured deploy key — see [Convex deploy key types](https://docs.convex.dev/cli/deploy-key-types).

## Configuration precedence

### Vite (browser)

1. Process / shell environment  
2. `.env.local` (gitignored)  
3. `.env` (gitignored)  
4. `.env.[mode].local` / `.env.[mode]` per [Vite env docs](https://vite.dev/guide/env-and-mode)

Only `VITE_*` keys are exposed to the browser. Vite **replaces** them at build time — a staging bundle will **not** pick up production URLs when hosted elsewhere.

### Convex (server)

Dashboard **Settings → Environment Variables** on the target deployment. These are **not** loaded from the Vite `.env*` files. Local `npx convex dev` uses the linked development deployment’s dashboard vars (and `CONVEX_DEPLOYMENT` in `.env.local` for CLI targeting).

## Variable inventory

### Browser-safe (`VITE_*`)

| Variable | Purpose | Sensitivity | Environments | Owner |
|----------|---------|-------------|--------------|-------|
| `VITE_APP_ENV` | Deployment identity | Low | All builds | Platform |
| `VITE_CONVEX_URL` | Convex cloud URL | Medium (public) | Required all | Platform |
| `VITE_CONVEX_SITE_URL` | Auth HTTP site URL (optional) | Medium | Optional | Platform |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Checkout pk | Low–medium | Checkout envs | Payments |
| `VITE_ALLOW_SANDBOX_CHECKOUT` | Client UI gate only (`=== "true"`) | Medium | Non-prod | Payments |
| `VITE_RELEASE_SHA` | Build stamp (optional; set at CI/build) | Low | Builds | Release |
| `VITE_RELEASE_CHANNEL` | Channel label | Low | Builds | Release |

### Server-only (Convex dashboard)

| Variable | Purpose | Sensitivity | Production rule |
|----------|---------|-------------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe API | Critical | Live keys only with live `SITE_URL` |
| `STRIPE_WEBHOOK_SECRET` | Webhook verify | Critical | Webhook URL = this deployment |
| `SITE_URL` | Redirect / portal base | High | `https://www.prizelet.com` — never localhost with live Stripe |
| `ALLOW_SANDBOX_CHECKOUT` | Server sandbox gate | Critical | **Unset / not `true`** |
| `ALLOW_DEV_ADMIN_GRANT` | Mint admin | Critical | **Unset / not `true`** |
| `MIGRATION_SECRET` | ETL gate | Critical | Prefer unset after cutover |
| `AUTH_TWITTER_*` / `AUTH_DISCORD_*` | OAuth | High | Prod credentials + prod callback URLs |
| `DISCORD_BOT_TOKEN` | Role sync | High | Prod bot |

Booleans are enabled **only** when the value is exactly the string `true`. The string `"false"` must not enable a feature.

## Permitted differences

- Credentials, URLs, datasets, webhook destinations  
- Feature flags stored in Convex platform settings (document owner + review)  
- Sandbox checkout and dev-admin grant on **non-production** only  

## Forbidden accidental divergence

- Separate `src-dev/` / `src-prod/` trees  
- Different authorization implementations per environment  
- Production frontend pointed at a development Convex URL  
- Live Stripe with localhost `SITE_URL`  
- Relying on a hidden UI button instead of server authorization  

## Local setup

```bash
cp .env.example .env.local
# Set VITE_APP_ENV=local and VITE_CONVEX_URL for your Convex development deployment
npm install
npx convex dev   # terminal 1
npm run dev      # terminal 2
npm run env:validate
```

Missing required services must fail validation clearly — do not silently connect to another environment’s backend.
