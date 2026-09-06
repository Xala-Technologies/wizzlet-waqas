# Verification (Wave 1 + Wave 2)

Branch: `fix/mobile-responsive-wave2` (from `fix/mobile-first-shells`)

## Commands

| Command | Status | Notes |
|---------|--------|-------|
| `npm test` | PASS | 9 files / 43 tests |
| `npx tsc --noEmit` | PASS | exit 0 |
| `npm run build` | PASS | vite build ok (pre-existing CSS `@import` warning) |

## Browser (emulation)

Overflow = `documentElement.scrollWidth - clientWidth`. Screenshots from Wave 1 remain under `docs/mobile-first/screenshots/`.

| Route | 360×800 | 1440×900 | Themes | Notes |
|-------|---------|----------|--------|-------|
| `/` | PASS | PASS | light+dark | Wave 1 shells |
| `/login` | PASS | PASS | light | |
| `/dashboard` | PASS | PASS | light+dark | drawer |
| `/dashboard/results` | PASS | NOT_RUN | light | |
| `/dashboard/discover` | PASS (code) | NOT_RUN | — | search wraps; runtime smoke if logged in |
| `/creator/subscribers` | PASS (code) | NOT_RUN | — | cards `<md` |
| `/creator/referrals` | PASS (code) | NOT_RUN | — | cards `<md` |
| `/creator/messages` | PASS (code) | NOT_RUN | — | list→thread |
| `/admin/users` etc. | PASS (code) | NOT_RUN | — | cards + desktop tables |
| Charts (earnings/finance) | PASS (code) | NOT_RUN | — | `min-w-0` wrappers |

Role-gated creator/admin routes may redirect in the shared test account; treat as PASS (code) until exercised with the right role.

## Physical devices

| Check | Status |
|-------|--------|
| iOS Safari keyboard / safe-area | NOT_RUN |
| Android Chrome keyboard / safe-area | NOT_RUN |

## Playwright overflow smoke

BLOCKED — no auth fixtures in CI for dashboard routes.
