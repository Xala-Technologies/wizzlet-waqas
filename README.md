# Wizzlet

Sports creator subscription platform (Vite + React + Supabase).

## Prerequisites

- Node.js 20+
- npm (use npm for this repo — `package-lock.json` is the source of truth)

## Setup

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

App runs at http://localhost:8080/

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run Vitest unit tests |
| `npm run lint` | ESLint |

## Environment

See `.env.example`. Never commit `.env`.

Sandbox checkout (dev only):

1. Set Supabase Edge Function secret `ALLOW_SANDBOX_CHECKOUT=true`
2. Local Vite DEV already allows the client to call sandbox checkout
3. For non-dev builds, set `VITE_ALLOW_SANDBOX_CHECKOUT=true` only on staging

Admin roles cannot be self-assigned from the client. Grant `admin` via the Supabase service role / SQL editor.

## Security notes

- Apply migrations under `supabase/migrations/` (including `*_security_hardening_rls.sql`)
- Redeploy edge functions after pulling (`sandbox-checkout`, `stripe-webhook`)
- Stripe webhook fails closed until signature verification is implemented
