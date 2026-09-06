# Resume checkpoint — after Wave 8

## Open PR #10 (`fix/qa-w1-auth-harden-w6`)

- Commerce + entitlement (J1/J3), select-role fix, profile CTA, cancel
- Security: QA-W1-01/02/03 + runtime auth matrix
- Reliability: F-014 events day bounds from client; analytics track soft-no-op when signed out

## Wave 8 branch `fix/eslint-and-billing-portal`

- ESLint error baseline cleared (migrations `any`, empty UI interfaces, unused expression, tailwind `require`)
- Real Stripe Customer Portal: `createBillingPortalSession` + `openCustomerPortal` / billing page button

## Still open

- Journeys J2/J4–J8, admin pagination / returns validators, ESLint warnings
- Gate: **NOT READY** for full-app claim; core money + auth + portal path is stronger

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
Ensure Stripe Customer Portal is enabled in the Stripe Dashboard for the mode in use.
