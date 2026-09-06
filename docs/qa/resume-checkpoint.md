# Resume checkpoint — after Wave 9

## Open PRs

- **#10** `fix/qa-w1-auth-harden-w6` — auth harden + commerce reliability
- **#11** `fix/eslint-and-billing-portal` — ESLint errors + Stripe Customer Portal
- **#12** (this) `fix/convex-returns-validators-w9` — F-011 returns validators (stacked on #11)

## Wave 9

- Shared `convex/lib/validators.ts` document validators
- `returns` on users, files upload/register, roles, sandbox pay, subscriptions (member + admin list), messaging

## Still open

- Remaining public APIs without `returns` (creators/posts/admin/etc.)
- F-012 admin pagination (needs UI redesign for join-heavy lists)
- Journeys J2/J4–J8
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
Ensure Stripe Customer Portal is enabled in the Stripe Dashboard for the mode in use.
