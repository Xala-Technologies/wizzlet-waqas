# M05 Member Notifications — design pass summary

**Branch:** `fix/member-notifications-layout`  
**Files:** `src/pages/CustomerNotifications.tsx`  
**Routes:** `/dashboard/notifications`, `/creator/notifications`, `/admin/notifications`  
**Ship:** push + production deploy

## Design changes

- Full loading gate until first page + `unreadCount` resolve
- Header “N new” uses server `unreadCount` (matches sidebar), not loaded-page only
- Empty recovery CTAs by role (Feed/Messages, creator dashboard/messages, admin home)
- Row open in-flight guard; Mark all / Load more stay `min-h-11`

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Badge/count only reflected loaded page unread | Use `notifications.unreadCount` |
| Low | Chrome + Mark all while list still loading | Full loading gate |
| Low | Empty had no recovery path | Role-aware CTAs |
| Low | Double-click row could race mark/navigate | `openingId` guard |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`listMinePage` pagination, `markRead` / `markAllRead`, deep-link navigate on open, shared member/creator/admin layout. No filters, prefs, or schema invent.
