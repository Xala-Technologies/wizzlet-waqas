# Typography and landing spacing

## Status

Complete on branch `fix/typography-landing-spacing`.

This pass establishes semantic type roles and tighter landing section seams. It does **not** claim full WCAG conformance.

## Baseline (before)

| Area | Observation | Evidence |
|------|-------------|----------|
| Type system | No semantic roles; Tailwind defaults + many arbitrary `text-[9px]`–`text-[13px]` | Inspection `src/index.css`, `tailwind.config.ts` |
| Fonts | DM Sans + JetBrains Mono via Google Fonts `@import` after `@tailwind` (Vite warning) | `src/index.css` |
| Landing seams | Adjacent sections each `py-24`/`md:py-32`/`py-28 md:py-36` → ~12–17rem combined gaps | `src/components/landing/*` |
| Hero | `min-h-[92vh]` + `pt-16` | `HeroSection.tsx` |
| Dashboards | Own `p-4 sm:p-6 md:p-8` in `DashboardLayout` — **unchanged by spacing work** | `DashboardLayout.tsx` |

Before screenshots: `docs/ui/screenshots/before-landing-light.png`, `before-landing-dark.png`.

## Final text roles

| Role | Tailwind class | Size | Line height | Use |
|------|----------------|------|-------------|-----|
| Body | `text-body` | 1.125rem (18px) | 1.65 | Paragraphs, primary explanatory copy |
| UI | `text-ui` | 1rem (16px) | 1.5 | Nav, inputs, buttons, labels, table cells |
| Support | `text-support` | 0.9375rem (15px) | 1.5 | Descriptions, metadata |
| Caption | `text-caption` | 0.875rem (14px) | 1.4 | Nonessential captions/badges only |
| Title | `text-title` | 1.25rem | 1.3 | Card / subsection titles |
| Title LG | `text-title-lg` | 1.5rem | 1.25 | Larger subsection titles |
| Heading | `text-heading` | 1.75rem | 1.2 | Page headings (mobile) |
| Heading LG | `text-heading-lg` | 2rem | 1.15 | Page headings (desktop) |
| Display | `text-display` | clamp(2rem … 3.5rem) | 1.05 | Landing hero |

Authoritative definitions: `tailwind.config.ts` + CSS vars in `src/index.css`.

**Migration map used:**

- `text-[8–11px]` / `text-xs` → `text-caption`
- `text-[12–13px]` → `text-support`
- `text-[14–16px]` / control `text-sm` in primitives → `text-ui`
- Chart/SVG `fontSize` 8–12 → `14` (caption rem-equivalent)

Default Tailwind `text-sm` / `text-xs` tokens were **not** redefined globally.

## Landing spacing rules

- Shared owner: `LandingSection` (`variant`: `default` | `band` | `hero`)
- CSS helpers: `.landing-section` = `py-5 sm:py-6 md:py-8 lg:py-10`; `.landing-section-band` slightly taller
- Total seam targets: ~40–48px phone / 48–64px tablet / 64–80px desktop (sum of adjacent paddings)
- Heading → supporting text: `mb-2`/`mb-3` (8–12px)
- Section intro → content: `mb-6`/`mb-8` (24–32px)
- Related cards: `gap-4`/`gap-5` (16–24px)
- Hero: nav `pt-16`; `min-h-[70vh] md:min-h-[min(92vh,52rem)]`; body uses `text-body`
- **Do not** change `DashboardLayout` padding (confirmed unchanged)

## Justified exceptions

- Hero viewport height and display type for first-viewport composition
- CTA / Command Center use `band` (slightly taller) but not stacked `py-28`+`py-36`
- Chart/SVG text uses rem-equivalent numeric sizes where CSS classes do not apply
- Third-party Stripe checkout: NOT_APPLICABLE
- Raising dense badges/labels may wrap or grow UI — accepted; critical text not shrunk back

## Affected files (primary)

| Area | Paths |
|------|--------|
| Tokens | `src/index.css`, `tailwind.config.ts` |
| Docs | `docs/ui/typography-and-spacing.md`, `docs/ui/screenshots/*` |
| Landing | `src/components/landing/LandingSection.tsx`, `HeroSection.tsx`, `TodaysEventsSection.tsx`, `WhySwitchSection.tsx`, `ToolsSection.tsx`, `PlatformPreviewSection.tsx`, `CommandCenterSection.tsx`, `CreatorDiscovery.tsx`, `TestimonialsSection.tsx`, `CTASection.tsx`, `FeaturesSection.tsx`, `PricingSection.tsx`, `Footer.tsx` |
| Primitives | `src/components/ui/*` (button, input, label, table, badge, dialog, sidebar, card, …) |
| Chrome | `AdminSidebar.tsx`, `CreatorSidebar.tsx`, `MemberSidebar.tsx`, `PrizeletLogo.tsx`, `RoleSwitcher.tsx`, … |
| Consumers | Landing/auth/dashboard pages + charts (bulk map of sub-14px arbitrary sizes / `text-xs`) |

## Verification

| Check | How | Result | Notes |
|---|---|---|---|
| Visual | Screenshots before/after light+dark landing; login; admin overview | PASS | `docs/ui/screenshots/after-landing-light-1440.png`, `after-landing-dark-1440.png`, `after-login-dark.png`, `after-admin-overview.png` |
| Visual 390px | Mobile viewport capture | NOT_RUN | Desktop browser tooling used; reflow spot-check below |
| Resize text 200% | Browser zoom | NOT_RUN | Not executed in this pass |
| Reflow ~320px | Landing + login + admin | NOT_RUN | Not executed in this pass |
| Contrast | Spot-check body/muted light+dark | PASS | Landing hero + login + admin readable in both themes (manual visual) |
| Text spacing resilience | SC 1.4.12 injection | NOT_RUN | |
| Lint | `npm run lint` | PASS | Exit 0 errors (pre-existing warnings only) |
| Typecheck | `npx tsc --noEmit` | PASS | Exit 0 |
| Tests | `npm test -- --run` | PASS | 82 tests passed |
| Build | `npm run build` | PASS | Exit 0 |
| Workflows | Login form + platform-owner sign-in; admin overview loads; sidebar nav visible | PASS | Live at `localhost:8080` |
| Dialog open | Modal smoke | NOT_RUN | |
| Messaging send | Smoke | NOT_RUN | Out of scope for this CSS pass |

**Regression commands (recorded):**

```
npm run lint          → 0 errors, 22 warnings (pre-existing)
npx tsc --noEmit      → exit 0
npm test -- --run     → 82 passed
npm run build         → exit 0
```
