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

## Stabilization wave (WZ-*) — 2026-09-06

| ID | Status | Change |
|----|--------|--------|
| WZ-01 | **Fixed** | Credential binding: Auth-owned email; password change via owned `authAccounts` + current password |
| WZ-02 | **Fixed** | Ledger dedupe on `checkoutSessionId` / `commercialRef`; `webhookReceipts` for event delivery |
| WZ-03 | **Fixed** | Cancel: pending → Stripe → local; fail if Stripe fails (except already canceled) |
| WZ-04 | **Partial** | Invoice paid/failed + subscription.updated handlers; billingStatus vs access |
| WZ-05 | **Fixed** | Monthly-only products/checkout; capacity / isActive / isClosed gates |
| WZ-06 | **Fixed** | Import quarantine for missing status / bad timestamps; no default `active` |
| WZ-07 | **ADR** | Greenfield identity — no unverified merge |
| WZ-08/09/16 | **Partial** | Year-month finance keys; exclude sandbox/test from payouts; paginated discover |
| WZ-10–15 | **Partial** | Clear-field null semantics; messagingEnabled; campaign = in-app; promo blocked; fileAssets ownership |
| WZ-11 | **Fixed** | Username uniqueness; public vs owner product lists; featured atomicity; archive-on-delete |
| WZ-18 | **Partial** | GitHub CI workflow + release manifest |

## Stripe (2026-09-06)

- Secret key stored as Convex env `STRIPE_SECRET_KEY` (dev deployment only in this session)
- Publishable key in local `.env` / `.env.local` as `VITE_STRIPE_PUBLISHABLE_KEY` (gitignored)
- HTTP webhook: `https://combative-mongoose-559.convex.site/stripe/webhook`
- Webhook should include invoice + subscription lifecycle events
- Until webhook secret exists, fulfillment still works via `confirmCheckoutSession` on success redirect

## Regression tests

`src/lib/subscriptions.security.test.ts` — status transitions + sandbox env gate  
`src/lib/payoutBalance.test.ts` — available balance math  
`src/lib/credentialOwnership.test.ts` — SEC-01  
`src/lib/commerceIdentity.test.ts` — PAY-01/02/05/06 helpers

## Deploy notes

- Dev: `ALLOW_SANDBOX_CHECKOUT=true` set on `combative-mongoose-559`
- **Do not** set this on production unless intentionally sandboxing

## Updated gate

```text
NOT READY FOR PRODUCTION — browser E2E and live Stripe staging still NOT_RUN
```

P0/P1 code defects from stabilization plan are fixed with unit/static evidence. Remaining: browser E2E, live webhook soak, production promote.
