# C04 Creator Subscribers — design pass summary

**Branch:** `fix/creator-subscribers-layout`  
**Files:** `src/pages/CreatorSubscribers.tsx`  
**Ship:** local only (no push/deploy)

## Design changes

- Hierarchy: gate full chrome until first page + creator resolve; then `text-heading` + honest subtitle
- Semantic tokens (`text-heading`, `text-support`, `text-ui`) on header, empty, cards, table
- Honest counts: incomplete list → “N active on this page · M loaded”; exhausted → “N active · M total”
- Empty state CTA: **View your profile** when `isPublished`; otherwise **Set up your profile** → `/creator/settings` (or onboarding if no creator row)
- Larger Load more (`min-h-11`); slightly larger status badge icons
- Kept mobile cards + desktop table dual layout

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | “Active” looked like a full total while only a page was loaded | Page-scoped vs complete-list wording |
| Low | Header/counts flashed before first page | Loading gate before chrome |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint `CreatorSubscribers.tsx` | PASS |
| Browser screenshots | NOT_RUN (no auth session) |

## Preserved

`listSubscribersDetailedPage` pagination/fields; no search/filters/export; no cancel/message row actions; no extra PII queries.
