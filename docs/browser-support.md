# Browser support

Sweeph targets **modern evergreen browsers**. Tailwind 4 compiles CSS through its Vite plugin; `package.json` declares the supported browser policy. A Browserslist entry alone does not polyfill Tailwind's required CSS features.

## Supported

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | Latest 2 major versions | Latest (Android) |
| Firefox | Latest 2 major versions | Latest (Android) |
| Edge | Latest 2 major versions | — |
| Opera | Latest 2 major versions | — |
| Safari | **16.4+** | **iOS Safari 16.4+** |

Tailwind 4 requires Safari 16.4+, Chrome/Edge 111+, or Firefox 128+; the latest-two policy above is stricter for evergreen desktop browsers. Safari/iOS 16.0–16.3 are no longer supported by this build. See the [Tailwind upgrade guide](https://tailwindcss.com/docs/upgrade-guide#browser-requirements). No `@vitejs/plugin-legacy` polyfill stack is installed.

## Explicitly out of scope

- **Internet Explorer 11** — incompatible with the Vite + React 18 + Convex ESM stack without a full legacy rewrite.

## QA

- Automated smoke: `npm run test:e2e` (Playwright Chromium, WebKit, Firefox via `playwright.qa.config.ts`).
- Visual migration checks: [`qa/style-regression.md`](./qa/style-regression.md), covering light/dark themes and desktop/mobile viewports. Playwright WebKit is not proof of behavior on a physical iPhone or the minimum supported Safari version.
- Manual once per release: iPhone Safari, desktop Safari, Chrome, Firefox, Edge, Opera — login, copy link, Stripe Checkout redirect, sticky tracker tables.

## OAuth notes (Safari / ITP)

- Convex `SITE_URL` must match the public app origin on that deployment (production: `https://www.sweeph.com` on prod; local: `http://127.0.0.1:8080` on dev). Do not share one deployment for both.
- Client `VITE_CONVEX_SITE_URL` must match the Convex `.site` host used for OAuth callbacks (www → `ceaseless-weasel-494`; local → `combative-mongoose-559`).
- `/auth/callback` shows a clear failure state with **Try again** / **Back to login** if the session never arrives (instead of hanging forever).

Verified in this workstream: Convex `SITE_URL=https://www.sweeph.com` and local `VITE_CONVEX_SITE_URL` are set. Manual iOS Safari OAuth (email / X / Discord) should still be spot-checked on device after deploy.
