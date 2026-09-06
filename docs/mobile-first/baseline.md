# Mobile-first baseline

| Field | Value |
|-------|--------|
| Branch | `fix/mobile-first-shells` |
| Base tip | `85000f6` (creators footer / onboarding exit) |
| Wave | 1 — shells + trackers + admin transactions |
| Brief | `wizzlet-mobile-first-responsive-agent.md` |

## Viewport matrix (CSS px)

| Test | Viewport |
|------|----------|
| Reflow | 320 × 568 |
| Small phone | 360 × 800 |
| Standard phone | 390 × 844 |
| Wide phone | 430 × 932 |
| Phone landscape | 844 × 390 |
| Tablet portrait | 768 × 1024 |
| Laptop | 1280 × 800 |
| Desktop | 1440 × 900 |

Wave 1 minimum: **360×800** and **1440×900** on changed routes.

Screenshots: [`docs/mobile-first/screenshots/`](./screenshots/).

## Known shells (pre-fix)

- Dashboard: `MobileTopBar` + Sheet drawer below `md`; sidebars from `md`.
- Landing Navbar: hamburger below `lg` (intentional divergence from dashboard `md`).
- `MobileTopBar` lacked `SheetTitle` (a11y); menu hit target small.
- Trackers/admin tables rely on horizontal overflow rather than mobile layouts.

## Constraints

- No Convex / auth / payment contract changes.
- No Tailwind upgrade or new UI frameworks.
- Physical iOS/Android: `NOT_RUN` unless devices available.
