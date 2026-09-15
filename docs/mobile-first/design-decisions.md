# Design decisions (Wave 1)

## Breakpoints

- **Dashboard shells:** drawer below `md` (768px). Keep as-is.
- **Landing Navbar:** hamburger below `lg` (1024px). Keep intentional split unless content proves otherwise.
- Mobile-first Tailwind: unprefixed = smallest; add `sm:` / `md:` / `lg:` only when needed.

## Spacing and touch

- Page gutters: `p-4` (~16px) phones → `sm:p-6` / `md:p-8`.
- Primary touch targets: ~44–48 CSS px for standalone icon buttons (menu, row actions).
- Body/form text: ~14–16px; avoid shrinking below readable sizes.

## Tables

- **Comparison-heavy** (results / performance tracker): keep semantic `<table>` inside a **labeled** `overflow-x-auto` region; sticky first column when practical; no document-level sideways scroll.
- **Record lists** (subscribers, referrals, many admin lists): Wave 2+ stacked cards on `<md`.

## Toolbars

- Prefer `flex flex-wrap gap-2` + `w-full sm:w-auto`.
- Avoid fixed pixel widths (`w-[60px]`) for primary form fields on phones; use grid stacks.

## Navigation

- No bottom tab bar in Wave 1.
- Drawers must have accessible title (`SheetTitle`), Escape close, and close on route change.
- Preserve role switcher, theme, and sign-out reachability inside mobile drawers.
