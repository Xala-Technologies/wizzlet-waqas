# Resume checkpoint — after Wave 10

## Open PR stack

- **#10** `fix/qa-w1-auth-harden-w6` — auth harden + commerce reliability
- **#11** `fix/eslint-and-billing-portal` — ESLint errors + Stripe Customer Portal
- **#12** `fix/convex-returns-validators-w9` — F-011 priority auth/subs/messaging
- **#13** (this) `fix/convex-returns-validators-w10` — F-011 creators/posts/products/notifications/support

## Wave 10

- Extended `convex/lib/validators.ts` (creator/post/product/notification/support docs + projections)
- `returns` on creators, posts, products, notifications, support public APIs (~26 exports)

## Still open

- Remaining without `returns`: payouts, resolution, events, admin, analytics lists, growth, bookmarks, picks, platform (~40+)
- F-012 admin pagination
- Journeys J2/J4–J8
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
