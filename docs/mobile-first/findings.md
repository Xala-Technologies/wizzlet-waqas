# Findings (Wave 1 + Wave 2)

| ID | Priority | Route / area | Viewport | Actual | Files | Fix | Status |
|----|----------|--------------|----------|--------|-------|-----|--------|
| MF-01 | P0 | Dashboard drawer | 360 | No `SheetTitle` | `MobileTopBar.tsx` | Visually hidden title | fixed |
| MF-02 | P1 | Dashboard drawer | 360 | Menu hit target small | `MobileTopBar.tsx` | ~44px control + safe-area + drawer close hit target | fixed |
| MF-03 | P1 | Landing nav | 360 | Missing `aria-current`; small toggle | `Navbar.tsx` | a11y + touch size | fixed |
| MF-04 | P0 | `/creator/performance-tracker` | 360 | Fixed quick-add fixed widths; tiny actions | `CreatorPerformanceTracker.tsx` | stack toolbar; larger actions; labeled scroll | fixed |
| MF-05 | P0 | `/dashboard/results` | 360 | Same as MF-04 | `CustomerResults.tsx` | same pattern | fixed |
| MF-06 | P1 | `/admin/transactions` | 360 | Toolbar does not wrap | `AdminTransactions.tsx` | flex-wrap; bounded table | fixed |
| MF-07 | P2 | Sidebars mobile | short height | Footer controls may compete with long nav | `*Sidebar.tsx` | flex column + scroll middle; hide logo when mobile | fixed |
| MF-08 | P2 | Nested table overflow | phone | Double `overflow-auto` | trackers | labeled `overflow-x-auto` region + sticky date col | fixed |
| MF-09 | P0 | Subscribers / Referrals | 360 | `min-w-[520px]` tables only | `CreatorSubscribers.tsx`, `CreatorReferrals.tsx` | stacked cards `<md` + desktop table | fixed |
| MF-10 | P0 | Creator messages | 360 | List + thread forced together | `CreatorMessages.tsx` | list→thread with back control | fixed |
| MF-11 | P0 | Discover | 360 | `min-w-[220px]` search trap | `CustomerDiscover.tsx` | full-width search + wrap chips | fixed |
| MF-12 | P1 | Admin Users/Creators/Customers/Payouts | 360 | Desktop tables only | admin list pages | cards `<md` + labeled desktop tables | fixed |
| MF-13 | P1 | Chart parents | phone | Possible width blowout | earnings/finance/fees/admin dashboard | `min-w-0` wrappers | fixed |

Physical device keyboard/safe-area soak: **NOT_RUN**.
