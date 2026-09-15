# C05 Creator Promo Codes — design pass summary

**Branch:** `fix/creator-promo-layout`  
**Files:** `src/pages/CreatorPromo.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until creator + promos resolve; `text-heading` / `text-support`
- No-creator CTA → `/creator/onboarding`
- New code form first on mobile (`order`), list first on `lg`; honest empty copy
- Form: `min-h-11` fields, review line, **Create code**, historical-purchase note
- List: larger Delete; `AlertDialog` confirm; Active toggle preserved

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Delete with no confirm | AlertDialog before remove |
| Low | Empty said “on the right” on phone | Responsive empty copy + form-first on narrow |
| Low | Chrome during load | Full-page loading gate |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

Once/forever discount semantics, validation, upsert/toggle, max uses; deactivation does not rewrite past purchases (copy only).
