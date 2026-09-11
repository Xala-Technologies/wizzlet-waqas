# C09 Access Control — design pass summary

**Branch:** `fix/creator-access-control-layout`  
**Files:** `src/pages/CreatorAccessControl.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until creator + products + subscriptions resolve
- `text-heading` / `text-support` / `text-ui`; honest impact copy (close = new sales only)
- No-creator → **Set up your profile**; empty → **Go to Products**
- Product cards: `min-h-11` Close/Reopen + max spots; labeled Switch; saving guard
- Soften scarcity copy to remaining spots (no “high demand” invent)

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Chrome while data loading | Full loading gate |
| Low | Empty only text, no path | CTA to Products / onboarding |
| Low | Overlapping saves on blur/toggle | `savingId` disables concurrent patches |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`upsert` for `isClosed` / `isLimited` / `maxSpots`, active-sub counts, fill progress, Unlimited/Closed/spots-left badges. No bulk revocation or new roles.
