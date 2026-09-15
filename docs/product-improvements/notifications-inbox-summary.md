# Notifications inbox — design pass summary

**Branch:** `fix/notifications-inbox-layout`  
**Files:** `src/pages/CustomerNotifications.tsx`  
**Routes:** `/creator/notifications`, `/dashboard/notifications`, `/admin/notifications`  
**Ship:** push + production deploy

## Design changes

- `text-heading` / `text-support` / `text-ui`; Mark all read + Load more `min-h-11`
- Solid empty state (caught up honesty); quieter muted type icons
- Larger row hit targets; focus ring; unread dot preserved
- Mark-all in-flight guard; list skeletons until first page

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Tiny Mark all / Load more | `min-h-11` controls |
| Low | Double mark-all clicks | `markingAll` guard |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`listMinePage` pagination, `markRead` / `markAllRead`, deep-link navigate, loaded-page unread badge, shared member/creator/admin layout. No filters, prefs, or schema invent.
