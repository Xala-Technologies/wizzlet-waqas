# Resume checkpoint — after Wave 7 ship prep

## Shipped on branch `fix/qa-w1-auth-harden-w6`

- Commerce + entitlement (J1/J3), select-role fix, profile CTA, cancel
- Security: QA-W1-01/02/03 + runtime auth matrix
- Reliability: F-014 events day bounds from client; analytics track soft-no-op when signed out

## Still open (not in this PR scope)

- Journeys J2/J4–J8, ESLint baseline cleanup, Stripe Customer Portal, admin pagination / returns validators
- Gate: **NOT READY** for full-app claim; core money + auth path is substantially stronger

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
