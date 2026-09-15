# M01 Member Feed — design pass summary

**Branch:** `fix/member-feed-layout`  
**Files:** `src/pages/Dashboard.tsx`  
**Ship:** push + production deploy

## Design changes

- `text-heading` / `text-support` / `text-ui`; Billing + Browse creators `min-h-11`
- Next up as readable task list (same recovery links)
- Lean KPI cards with muted icons (active subs / picks / wins / win rate —)
- Feed cards: quieter badges; muted streak text (no flame shout); Save/Track/Copy `min-h-11`
- Empty CTAs `min-h-11`; track dialog larger inputs + actions
- Subscribed-no-posts discover link points to `/dashboard/discover`

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Tiny feed / header / dialog controls | `min-h-11` hit targets |
| Low | Amber flame streak urgency | Muted `{n}W streak` label |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`memberFeed`, entitlement-based activeSubs, past-due / cancel-pending / unread Next up links, save/track/copy, show more, win-rate honesty vs My Bet Tracker. No feed invent.
