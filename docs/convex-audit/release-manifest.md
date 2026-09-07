# Release manifest — Wizzlet Convex stabilization

| Field | Value |
|-------|--------|
| Branch | `feat/convex-cutover-stripe` |
| Baseline commit | `4ad800119b7caf6decc14d0e10b50c8a711b820f` |
| Gate | **NOT READY** until WZ-01–03 tests PASS and live Stripe webhook verified in staging |
| Identity ADR | Greenfield (see `ADR-greenfield-identity.md`) |
| Product periods | Monthly recurring only |
| Cancellation | Immediate after Stripe success |
| Payouts | Manual |
| Promo/referral commercial | Promo discount at Checkout **available**; referral cash commission still pending |
| Campaigns | In-app announcements only |

## Required before production promote

1. SEC-01, PAY-01/02, PAY-05 backend/static PASS
2. Stripe webhook events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. CI green on PR SHA
4. No `ALLOW_SANDBOX_CHECKOUT` on production
