# M02 Member Bet Tracker — design pass summary

**Branch:** `fix/member-results-layout`  
**Files:** `src/pages/CustomerResults.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until `listMine` resolves (no KPI zero flash)
- `text-heading` / `text-support` / `text-ui`; Feed-vs-personal honesty kept in subtitle and empty copy
- Lean KPI strip (same metrics); streak muted (no urgency shout)
- Import / Export / Add Pick and dialog/quick-add controls `min-h-11`
- Solid empty → Add First Pick; filter-empty → Clear filters
- Delete confirm via `AlertDialog`; row actions `min-h-11`
- Quieter chart/tab section titles

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | KPI zeros / chrome while picks still loading | Full loading gate before chrome |
| Low | Tiny Import/Export/Add and row actions | `min-h-11` |
| Low | Immediate delete with no confirm | `AlertDialog` before `remove` |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`listMine` / `upsert` / `remove`, CSV import/export headers, odds conversion, `won`↔`win` mapping, net/ROI/streak formulas, filters, month/sport/insights tabs and charts.
