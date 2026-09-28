---
name: awesome-design-md
description: >-
  Apply brand DESIGN.md systems from the vendored VoltAgent/awesome-design-md
  catalog (Stripe, Linear, Vercel, Notion, etc.). Use when the user asks for a
  page or UI "like [brand]", wants a DESIGN.md reference, Stitch-style design
  system docs, or to generate UI matching a known product's visual language.
---

# Awesome DESIGN.md

Curated brand design systems from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md). Each brand is a plain-text `DESIGN.md` (Google Stitch format) that agents read to keep UI visually consistent.

## Catalog location (this repo)

- Index: `vendor/awesome-design-md/CATALOG.md`
- Brands: `vendor/awesome-design-md/design-md/<slug>/DESIGN.md`
- Previews (optional): `preview.html`, `preview-dark.html` beside each `DESIGN.md`

## When to use

- User names a brand ("make this like Linear / Stripe / Vercel")
- User asks for a marketing/landing/dashboard look from a known product
- User wants to activate a `DESIGN.md` for Stitch or agent-driven UI work

## Workflow

1. **Resolve the slug** — match the brand name to a folder under `design-md/` (see `CATALOG.md`). Examples: `linear.app`, `stripe`, `vercel`, `notion`, `supabase`.
2. **Read the source of truth** — open `vendor/awesome-design-md/design-md/<slug>/DESIGN.md` fully before designing or coding.
3. **Activate for the task** (pick one, do not invent a third path):
   - **Scoped task:** keep working from the vendored path; cite tokens from that file.
   - **Session active system:** copy that file to project-root `DESIGN.md` (overwrite only if the user asked to switch the active system).
4. **Implement** using the DESIGN.md sections: theme, color roles, typography, components, layout, elevation, do/don't, responsive rules, agent prompt guide.
5. **Respect product chrome** — when the user is polishing Prizelet/Sweeph product UI (dashboards, PO mocks), prefer existing app tokens and `design-fidelity-qa` over replacing the whole product with a third-party brand. Brand DESIGN.md is for new surfaces, marketing experiments, or when the user explicitly asks for that look.

## Never do

- Never invent tokens that contradict the chosen `DESIGN.md`.
- Never silently replace the product's design system without the user asking to activate a brand.
- Never commit huge `preview.html` changes into app routes; previews stay in the vendor catalog.

## Refresh the catalog

```bash
npm run design-md:sync
```

## Related

- Project skill: `design-fidelity-qa` (PO mock pixel fidelity — different job)
- Stitch MCP: `upload_design_md` / `create_design_system_from_design_md` when pushing a DESIGN.md into Stitch
