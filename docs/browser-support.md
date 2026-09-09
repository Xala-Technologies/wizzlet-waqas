# Browser support

Prizelet / Wizzlet targets **modern evergreen browsers**. Autoprefixer and related tooling use the `browserslist` entry in `package.json`.

## Supported

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | Latest 2 major versions | Latest (Android) |
| Firefox | Latest 2 major versions | Latest (Android) |
| Edge | Latest 2 major versions | — |
| Opera | Latest 2 major versions | — |
| Safari | **16+** | **iOS Safari 16+** |

Build target remains **ES2020** (Vite / `tsconfig.app.json`). No `@vitejs/plugin-legacy` polyfill stack.

## Explicitly out of scope

- **Internet Explorer 11** — incompatible with the Vite + React 18 + Convex ESM stack without a full legacy rewrite.

## QA

- Automated smoke: `npm run test:e2e` (Playwright Chromium, WebKit, Firefox via `playwright.qa.config.ts`).
- Manual once per release: iPhone Safari, desktop Safari, Chrome, Firefox, Edge, Opera — login, copy link, Stripe Checkout redirect, sticky tracker tables.

## OAuth notes (Safari / ITP)

- Convex `SITE_URL` must match the public app origin (production: `https://www.prizelet.com`).
- Client `VITE_CONVEX_SITE_URL` must match the Convex `.site` host used for OAuth callbacks.
- `/auth/callback` shows a clear failure state with **Try again** / **Back to login** if the session never arrives (instead of hanging forever).

Verified in this workstream: Convex `SITE_URL=https://www.prizelet.com` and local `VITE_CONVEX_SITE_URL` are set. Manual iOS Safari OAuth (email / X / Discord) should still be spot-checked on device after deploy.
