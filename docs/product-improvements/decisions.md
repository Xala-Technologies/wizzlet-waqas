# Product improvements — decisions (Phase 1)

## Entitlement / content access matrix

Authoritative helper: `subscriptionGrantsContentAccess` / `hasContentAccess`.

| Facts on `subscriptions` row | Content access |
|------------------------------|----------------|
| `status` in `cancelled` / `canceled` | Deny |
| `status` or `billingStatus` in `past_due` / `unpaid` / `incomplete` | Deny |
| `status === "active"` and not past_due billing | Allow |
| `status === "active"` with `billingStatus === "cancel_pending"` or `cancelAtPeriodEnd` | Allow until `currentPeriodEnd` (ms); if period end missing, allow while status remains active |
| Period ended (`now > currentPeriodEnd`) under cancel-at-period-end / cancel_pending | Deny |

Notes:

- `billingStatus` and access `status` stay distinct fields; Stripe sync may copy access into `status` via `accessStatus`.
- `hasActiveSubscription` now delegates to `hasContentAccess` so existing call sites stay consistent.
- Queries use `Date.now()` for period-end checks (documented tradeoff: entitlement correctness over query cache purity).

## Email change

- Full Convex Auth email rotation: **BLOCKED** until a verified provider change-email flow exists.
- Disposition: authenticated `accountRequests` row (`category: email_change`) + `mutationLog`; admin reviews manually.
- UI must not claim the email was changed.

## Settled record lock

- Owner cannot change `posts.result` or `pickTracker.result` once it leaves `pending`.
- No admin override path in this phase (none existed); documented as future work.
- Win rate for published/practice settled picks: **wins / (wins + losses)** — exclude `push` and `pending`.

## Onboarding

- Draft persists via `upsertOnboarding` with `isPublished: false`.
- `onboardingStep` optional on `creators` for resume.
- `setPublished(true)` only on explicit Publish; never unpublish on resume.

## Prod env footguns (never set on production)

- `ALLOW_SANDBOX_CHECKOUT`
- `ALLOW_DEV_ADMIN_GRANT`
