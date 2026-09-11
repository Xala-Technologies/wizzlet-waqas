# C06 Creator Growth Manager — design pass summary

**Branch:** `fix/creator-growth-manager-layout`  
**Files:** `src/pages/CreatorPersonalGrowth.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until creator, metrics sources, support thread, and platform settings resolve
- `text-heading` / `text-support`: human coaching framing (not automated AI)
- Team avatar (`Users`) instead of Bot; empty / no-creator CTAs with onboarding link
- Compose: `min-h-11` input/send, larger suggestion chips, sticky mobile composer
- Side panel tokens; keep heuristic score disclaimer and formulas
- When `growthManagerEnabled` is false: honest “Chat unavailable” (no fake compose)

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Page implied AI via Bot + “manager” | Human growth-team copy + Users icon |
| Medium | Disabled growth chat still showed compose | Read platform feature flags; hide composer |
| Low | No-creator empty lacked next step | Link to `/creator/onboarding` |
| Low | Duplicate send while in flight | Guard `sending` in `send()` |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`sendSupport` / `markReadSupport`, growth channel, seen receipts, metric formulas, side-panel estimates (not a platform rating).
