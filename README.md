# Prizelet

Private betting infrastructure for sports creators — subscriptions, gated content, performance tracking, and payouts in one product.

| Layer | Stack |
|-------|--------|
| App | Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | [Convex](https://convex.dev) (Auth, database, file storage, HTTP actions) |
| Payments | Stripe Checkout + webhooks |

## Features

- **Members** — discover creators, subscribe, feed, results tracker, billing
- **Creators** — posts & products, subscribers, performance tracker, payouts
- **Admins** — users, creators, transactions, fees, platform settings

## Prerequisites

- Node.js **20+**
- **npm** (this repo uses `package-lock.json` — do not switch to yarn/pnpm without regenerating the lockfile)
- A [Convex](https://dashboard.convex.dev) project
- Stripe account (optional for local UI work; required for real checkout)

## Quick start

```bash
cp .env.example .env.local
# Set VITE_CONVEX_URL to your Convex deployment URL

npm install

# Terminal 1 — Convex sync (keep running during development)
npx convex dev

# Terminal 2 — Vite app
npm run dev
```

App: [http://localhost:8080](http://localhost:8080)

### Local platform owner

On development builds, sign in at `/login` with:

| | |
|--|--|
| Email | `admin@prizelet.dev` |
| Password | `AdminPrizelet1!` |

Or use **Sign in as platform owner** on the login page. That account receives the Convex `admin` role and opens `/admin`.

> Use `npx convex dev` for local development. Reserve `npx convex deploy` for production only.

## Environment

### Client (`.env` / `.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_CONVEX_URL` | Yes | Convex deployment URL |
| `VITE_CONVEX_SITE_URL` | No | Convex Auth HTTP site URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | For Checkout | Stripe publishable key (`pk_…`) |
| `VITE_ALLOW_SANDBOX_CHECKOUT` | No | Client gate for sandbox checkout UI |

Never put Stripe **secret** keys in Vite env files.

### Convex deployments (dev vs prod)

Prizelet uses **two** Convex deployments. Do not share one for local and www — `SITE_URL` is a single origin and will break the other environment.

| | Dev (`npx convex dev`) | Production (`npx convex deploy`) |
|--|------------------------|----------------------------------|
| Deployment | `combative-mongoose-559` | `ceaseless-weasel-494` |
| App origin / `SITE_URL` | `http://127.0.0.1:8080` | `https://www.prizelet.com` |
| Client `VITE_CONVEX_*` | `.env.local` → **dev** | Vercel Production/Preview → **prod** |

- Local OAuth and Vite always target the **dev** deployment.
- www.prizelet.com always targets the **prod** deployment.
- Never run `npx convex env set SITE_URL http://127.0.0.1:8080` against prod.
- After backend changes that must go live: `npx convex deploy` (prod only).

### Convex dashboard env

Configure under **Settings → Environment Variables** on the matching deployment:

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_…`) |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret (`whsec_…`) for `POST /stripe/webhook` |
| `SITE_URL` | Public app origin for that deployment (see table above) |
| `ALLOW_SANDBOX_CHECKOUT` | Non-production sandbox only |
| `ALLOW_DEV_ADMIN_GRANT` | Dev only — required for `grantTestAdmin` / platform-owner bootstrap. **Never set in production.** |

OAuth provider callback URLs (X / Discord) must include each deployment’s  
`https://<deployment>.convex.site/api/auth/callback/<provider>`.  
Stripe webhooks for live checkout must hit the **prod** site URL:  
`https://ceaseless-weasel-494.convex.site/stripe/webhook`.

See [`.env.example`](.env.example) for a full annotated template.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite development server |
| `npm run build` | Production client build |
| `npm run preview` | Preview the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright smoke (Chromium, WebKit, Firefox) |
| `npm run convex:dev` | Convex development sync |
| `npm run convex:deploy` | **Production** Convex deploy |

## Branching

| Branch | Purpose |
|--------|---------|
| `dev` | Day-to-day integration |
| `production` | Stable releases |
| Feature / fix branches | Cut from the agreed base (`dev` or the active cutover branch); one PR per task |

Merge to `production` only after review and testing on `dev` (or the stacked cutover path).

## Architecture notes

- **Auth & data** live in Convex — no Supabase path in this codebase.
- **Roles** (`member`, `creator`, `admin`) are enforced server-side; clients cannot self-assign admin.
- **Checkout** uses Stripe Checkout when publishable + secret keys are configured; webhooks update the payment ledger.
- Mobile-first shell and tracker notes live under [`docs/mobile-first/`](docs/mobile-first/) when that work is present on the branch.
- Supported browsers (Safari 16+ / modern Chrome, Firefox, Edge, Opera): [`docs/browser-support.md`](docs/browser-support.md).

## Security

- Do not commit secrets (`.env.local` is gitignored).
- Prefer Convex dashboard secrets for `STRIPE_*` and webhook material.
- Treat webhook signature verification as mandatory before trusting Stripe events in production.

## License

Private — all rights reserved unless otherwise stated by the repository owners.
