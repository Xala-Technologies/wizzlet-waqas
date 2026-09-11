# M08 Member Settings — design pass summary

**Branch:** `fix/member-settings-layout`  
**Files:** `src/pages/CustomerSettings.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until `me` + account requests resolve
- `text-heading` / `text-support` / `text-ui`; muted section icons
- Inputs and actions `min-h-11`; Open notifications CTA
- Hydrate once per user id (no reactive wipe of dirty edits)
- Double-submit guards on profile / email request / password

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Medium | Form could reset on reactive `me` refresh after first init pattern drift | Hydrate once per `me._id` |
| Low | Tiny controls / Discord brand shout | `min-h-11` + muted icons |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`updateProfile`, email-change request / open-request honesty, Discord → `/login`, password change action and validation. No notification preference invent.
