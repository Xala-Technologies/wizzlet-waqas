# Remediation disposition (2026-09-06)

Authorized remediations applied after AUDIT_ONLY baseline. Original findings remain in `findings.md`; status below.

| ID | Status | Change |
|----|--------|--------|
| F-001 | **Fixed** | Sandbox gated by `ALLOW_SANDBOX_CHECKOUT` env; client boolean removed |
| F-002 | **Fixed** | `createSubscriptionRecord` → `internalMutation` |
| F-003 | **Fixed** | Status enum + owner/creator may only `cancelled`; admin any |
| F-004 | **Fixed** | `getAuthUserId` in `listPreviewsByCreator` / entitlements |
| F-005 | **Fixed** | `migrations/importBatch` → `internalMutation` (secret still required) |
| F-006 | **Fixed** | Promo/link patch requires `creatorId` match |
| F-007 | **Fixed** | `getByUsername` public projection |
| F-008 | **Fixed** | `files.getUrl` requires auth |
| F-009 | **Fixed** | `requestPayout` checks available balance vs paymentEvents − reserved payouts |
| F-010 | **Fixed (test)** | Stripe Checkout + signed webhook path + success-page confirm; sandbox fallback remains |
| F-011–F-015 | Open / partial | returns validators, pagination, E2E, migration data |

## Stripe (2026-09-06)

- Secret key stored as Convex env `STRIPE_SECRET_KEY` (dev deployment only in this session)
- Publishable key in local `.env` / `.env.local` as `VITE_STRIPE_PUBLISHABLE_KEY` (gitignored)
- HTTP webhook: `https://combative-mongoose-559.convex.site/stripe/webhook`
- **Required next step:** create Stripe webhook endpoint → set `STRIPE_WEBHOOK_SECRET` on Convex
- Until webhook secret exists, fulfillment still works via `confirmCheckoutSession` on success redirect

## Regression tests

`src/lib/subscriptions.security.test.ts` — status transitions + sandbox env gate  
`src/lib/payoutBalance.test.ts` — available balance math

## Deploy notes

- Dev: `ALLOW_SANDBOX_CHECKOUT=true` set on `combative-mongoose-559`
- **Do not** set this on production unless intentionally sandboxing

## Updated gate

```text
INSUFFICIENT EVIDENCE: REQUIRED CHECKS BLOCKED OR NOT RUN
```

P0/P1 code defects in Phase A/B are fixed. Remaining: persistence E2E (NOT_RUN), historical migration (BLOCKED), P2 items (payout balance, getUrl ACL, Stripe live, pagination).
