# M09 Member Messages — design pass summary

**Branch:** `fix/member-messages-layout`  
**Files:** `src/pages/CustomerMessages.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until user + first inbox page + subscriptions resolve
- `text-heading` / `text-support` / `text-ui`; empty → **Browse creators**
- Quieter selected thread; Load more `min-h-11`
- Sticky mobile composer + safe-area; desktop composer in pane footer
- Clear reply draft when `activeId` changes; double-send guard

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Reply draft could leak across threads | Clear `reply` on `activeId` change |
| Low | Duplicate send while in flight | Guard `sending` in `send()` |
| Low | Tiny Load more | `min-h-11` |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

Inbox pagination, `?creatorId=` deep link, mark-read on open thread, seen receipts, phone list-first, desktop auto-select first thread.
