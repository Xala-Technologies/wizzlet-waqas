# M07 Member Activity — design pass summary

**Branch:** `fix/member-activity-layout`  
**Files:** `src/pages/CustomerActivity.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until analytics + saved counts resolve (no KPI zero flash)
- `text-heading` / `text-support` / `text-ui`; lean KPI cards with muted icons
- Saved Posts KPI links to `/dashboard/saved`
- Solid empty → Go to Feed `min-h-11`; honesty that history is recorded, not invented
- Recently viewed rows `min-h-11`; quieter section title

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | KPI/chrome flash while loading | Full loading gate |
| Low | Tiny empty / list hit targets | `min-h-11` + Feed CTA |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`analytics.mutations.listMine` (bounded recent events), `listSavedDetailed` count, same four KPIs and formulas, creator-profile row links, no invented activity.
