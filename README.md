# Wizzlet

Sports creator subscription platform (Vite + React + Convex Auth, database, and file storage).

## Prerequisites

- Node.js 20+
- npm (use npm for this repo — `package-lock.json` is the source of truth)

## Branches

| Branch | Purpose |
|--------|---------|
| `dev` | Day-to-day work and testing |
| `production` | Stable releases |

Feature branches should be cut from `dev`. Merge `dev` → `production` after testing.

## Setup

```bash
cp .env.example .env
# Set VITE_CONVEX_URL to your Convex deployment URL
npm install
npx convex dev   # sync backend (keep running while developing)
npm run dev      # Vite app at http://localhost:8080/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest unit tests |
| `npm run convex:dev` | Convex backend sync |

## Security notes

- Admin roles cannot be self-assigned from the client
- Stripe Checkout is enabled when `VITE_STRIPE_PUBLISHABLE_KEY` + Convex `STRIPE_SECRET_KEY` are set
- Configure webhook `POST /stripe/webhook` and set `STRIPE_WEBHOOK_SECRET` for signature verification
- Never commit secret keys; use Convex env + gitignored `.env.local`
