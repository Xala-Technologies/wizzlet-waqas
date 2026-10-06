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

- Member/creator self-serve: authenticated `startEmailChange` action mints a hashed 6-digit OTP, emails it via Resend (`RESEND_API_KEY` + `EMAIL_FROM`), or echoes the code on **dev** when `ALLOW_DEV_ADMIN_GRANT=true` (never on production origins).
- `verifyEmailChangeOtp` rotates profile email + password `providerAccountId` (when present), sets `emailVerificationTime`, clears sessions. UI must not claim the email changed until verify succeeds.
- Admin `resolveAdmin` fulfill remains a backup (Users queue) and still rotates the same way.
- Hashed OTP fields never leave the server (`listMine` / `listOpenAdmin` strip them).

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

## Phase 2 — member billing clarity

- UI labels come from `describeSubscriptionAccess` (same rules as `subscriptionGrantsContentAccess`).
- Member cancel action uses Stripe `subscriptions.cancel` (immediate end) after `cancel_pending` marker; copy must say access ends after confirmed cancel, not “at period end”, unless Stripe returns `cancel_at_period_end` from another path.
- “Active” filter means **has content access**, not raw `status === "active"` (so past_due is excluded).
