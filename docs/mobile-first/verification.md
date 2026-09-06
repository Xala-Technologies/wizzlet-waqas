# Verification (Wave 1)

Branch: `fix/mobile-first-shells`

## Commands

| Command | Status | Notes |
|---------|--------|-------|
| `npm test` | PASS | 9 files / 43 tests |
| `npx tsc --noEmit` | PASS | exit 0 |
| `npm run build` | PASS | vite build ok (pre-existing CSS `@import` warning) |

## Browser (emulation)

Evidence: `docs/mobile-first/screenshots/`. Overflow = `documentElement.scrollWidth - clientWidth`.

| Route | 360×800 | 1440×900 | Themes | Notes |
|-------|---------|----------|--------|-------|
| `/` | PASS | PASS | light+dark | overflow 0; mobile menu + `aria-current` on desktop |
| `/login` | PASS | PASS | light | overflow 0 |
| `/dashboard` | PASS | PASS | light+dark | drawer open/close; SheetTitle + Close reachable; overflow 0 |
| `/dashboard/results` | PASS | NOT_RUN | light | overflow 0; filters wrap; empty-state padding tightened |
| `/creator/performance-tracker` | BLOCKED | BLOCKED | — | test user redirected to `/creator/onboarding` (no completed creator profile) |
| `/admin/transactions` | BLOCKED | BLOCKED | — | same session lacks admin workspace without role switch UI exercise |

## Physical devices

| Check | Status |
|-------|--------|
| iOS Safari keyboard / safe-area | NOT_RUN |
| Android Chrome keyboard / safe-area | NOT_RUN |

## Playwright overflow smoke

BLOCKED — no auth fixtures in CI for dashboard routes. Manual overflow checks used instead for public + member routes.
