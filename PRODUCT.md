# Prizelet / Sweeph

## Product

Creator monetization platform: creators publish picks/posts and products; members discover creators, subscribe, and message. Dashboards for creator ops (overview, posts, products, earnings, marketing) and member home/discover/messages/settings.

## Platform

Web app (React + Vite + Convex). Desktop-first dashboards with mobile-responsive shells. Light and dark themes; Sweeph navy chrome for dark sidebars.

## Users

- **Creators** — publish content, manage subscribers, track performance and payouts.
- **Members** — discover creators, subscribe, consume feed/picks, message creators.
- **Admins** — trust/ops tooling (secondary surface).

## Principles

- Product Owner mocks and existing dashboard visual language win over generic “AI redesign.”
- Prefer shared primitives (`DashboardKpiStrip`, card tokens, sport/result pills) over one-off chrome.
- Empty states ship honest sample preview + amber banner (`?demo=0` / `?demo=1`), not fake live metrics.
- One clear primary action per dense screen; don’t invent purple-on-white marketing chrome for product UI.
- Accessibility and touch targets matter on member and creator mobile shells.

## Design authority

- Screen-by-screen PO fidelity: `.cursor/skills/design-fidelity-qa`
- Brand DESIGN.md experiments: `vendor/awesome-design-md` + `.cursor/skills/awesome-design-md`
- Craft / anti-slop passes: `/impeccable` (this skill) — refine within the incumbent system unless the user asks for a redesign
