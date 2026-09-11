# C10 Creator Performance Tracker — design pass summary

**Branch:** `fix/creator-performance-tracker-layout`  
**Files:** `src/pages/CreatorPerformanceTracker.tsx`  
**Ship:** local only (no push/deploy)

## Design changes

- Hierarchy: loading gate until picks + creator resolve; then `text-heading` header + primary **Add Pick**
- Secondary Import / Export / Smart Add at `min-h-11`; wrap on phone
- Eligibility strip + 8 KPI cards use `text-support` / `text-ui` (all metrics kept)
- Quick-add: bordered card, `min-h-11` fields, **Add** / **Save changes**, Cancel (not ✕)
- Filters `min-h-11`; empty state tokens + **Add First Pick**
- Edit dialog labels/inputs aligned; primary **Save changes**
- Chart section titles use `text-support` (no chart rewrite)

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Delete with no confirm | AlertDialog before remove |
| Medium | KPI zeros flash while loading | Gate chrome until data ready |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint `CreatorPerformanceTracker.tsx` | PASS |
| Browser screenshots | NOT_RUN (no auth session) |

## Preserved

Odds sync, win/ROI/streak formulas, CSV import/export, smart add / duplicate, filters, Content/Sport/Monthly/Insights tabs, Verified = platform-granted (not auto from eligibility).
