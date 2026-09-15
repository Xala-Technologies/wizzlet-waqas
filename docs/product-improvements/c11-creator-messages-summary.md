# C11 Creator Messages — design pass summary

**Branch:** `fix/creator-messages-layout`  
**Files:** `src/pages/CreatorMessages.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until creator, first inbox page, and subscribers resolve
- `text-heading` / `text-support` / `text-ui`; messaging toggle in `min-h-11` row
- Empty states: onboarding CTA, messaging-off copy, no-threads → View subscribers
- List–detail preserved; Load more `min-h-11`; sticky mobile composer + safe-area
- Clear reply draft when `activeId` changes; double-send guard

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Reply draft could leak across threads | Clear `reply` on `activeId` change |
| Low | Chrome/toggle during first load | Full loading gate |
| Low | Duplicate send while in flight | Guard `sending` in `send()` |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

Inbox pagination, messaging on/off, `?subscriberId=` deep link, mark-read on open thread only, seen receipts, list-first on phone.
