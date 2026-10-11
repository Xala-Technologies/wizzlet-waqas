# Release manifest — Prizelet Convex stabilization

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
2. Stripe webhook events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.refunded`, `refund.updated`, `charge.dispute.created`, `charge.dispute.closed`, `account.updated`. Route test-mode events to the development Convex `/stripe/webhook` endpoint and configure its matching signing secret there. Live-mode events belong to the production endpoint with its own secret. Verify a provider-generated event reaches the intended deployment before payment testing. Refunds already acknowledged by older code without a ledger debit require reconciliation; merely replaying a processed receipt will not repair them.
3. CI green on PR SHA
4. No `ALLOW_SANDBOX_CHECKOUT` on production
