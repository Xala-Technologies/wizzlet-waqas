# C12 Creator Links — design pass summary

**Branch:** `fix/creator-links-layout`  
**Files:** `src/pages/CreatorLinks.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until creator + links resolve; no KPI zeros flash
- `text-heading` / `text-support` / `text-ui`; lean click/conversion KPI cards
- No-creator → **Set up your profile**; empty list points to create form + `/go/…`
- Create form: `min-h-11` inputs/button; compact name · host review; disabled until name + URL
- List: destination + `/go/{id}` hint; Copy / Delete labeled `min-h-11`; delete `AlertDialog`

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| High | Copy shared destination URL, not tracking `/go/…` | Copy via `trackingUrl(id)` / `copyTracking` |
| Low | Delete with no confirm | `AlertDialog` before `removeLink` |
| Low | Chrome while links loading | Full loading gate |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`upsertLink` / `removeLink`, stored click + conversion totals, `/go/:id` tracking behavior (no redirect/schema changes).
