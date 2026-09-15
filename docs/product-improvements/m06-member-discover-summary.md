# M06 Member Discover — design pass summary

**Branch:** `fix/member-discover-layout`  
**Files:** `src/pages/CustomerDiscover.tsx`  
**Ship:** push + production deploy

## Design changes

- `text-heading` / `text-support` / `text-ui`; honest list-price vs profile tiers copy
- Search always `min-h-11`; sort chips muted (not primary tint); `aria-pressed`
- Solid empty state; quieter avatar/rank; View profile + bookmark `min-h-11`
- Load more `min-h-11`; price labeled as list price sort

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Tiny bookmark / View profile / Load more | `min-h-11` controls |
| Low | Dashed empty | Solid caught-empty card |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`listPublished` search/pagination, client sort (active/newest/price), creator bookmarks, View profile → `/{username}`. No subscribed-state invent, no fake personalization.
