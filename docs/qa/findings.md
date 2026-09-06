# Findings (QA Wave 1 — 2026-09-06)

Campaign: full-application AUDIT_AND_TEST. Branch `fix/login-ensureuser-auth-race` (dirty) atop `bafb16a`. Environment: Vite `localhost:8080` → Convex `combative-mongoose-559` (dev), Stripe `pk_test`.

Prior IDs from [docs/convex-audit/findings.md](../convex-audit/findings.md) reused. Disposition hypotheses retested below.

---

## Retest of prior findings

| ID | Prior severity | Wave 1 result | Notes |
|----|----------------|---------------|-------|
| F-001 | P0 | **PASS (fixed)** | No client `allowSandbox`; `assertSandboxEnabled()` + unit gate |
| F-002 | P0 | **PASS (fixed)** | `createSubscriptionRecord` is `internalMutation` |
| F-003 | P0 | **PASS (fixed)** | Public `setStatus` requires admin; owner activate blocked in helper + unit tests |
| F-004 | P1 | **PASS (fixed)** | `listPreviewsByCreator` uses `getAuthUserId` |
| F-005 | P1 | **PASS (fixed)** | `importBatch` functions are `internalMutation` |
| F-006 | P1 | **PASS (fixed)** | Growth upserts check creator ownership |
| F-007 | P2 | **PASS (fixed)** | `getByUsername` public projection |
| F-008 | P2 | **PARTIAL** | Auth required; residual legacy unowned ACL — see **QA-W1-03** |
| F-009 | P2 | **PASS (W16)** | Balance helper + UI: Paid out ≠ reserved; request uses ConvexError |
| F-010 | P2 | **PASS (code) / E2E NOT_RUN** | Stripe + webhook path present; soak not run |
| F-011 | P2 | **PASS** | Public Convex APIs have `returns` validators (Waves 9–12; migrations/internal excluded) |
| F-012 | P2 | **PARTIAL** | Admin lists capped at 500 newest rows; cursor pagination + exact aggregates still open |
| F-013 | P1 data | **INSUFFICIENT** | Not re-validated via MCP data dump this wave |
| F-014 | P3 | **PASS (fixed W7)** | Client passes `fromMs`/`toMs`; query has no clock |
| F-015 | P3 | **OPEN** | Full `tsc` app project not re-run this wave; lint errors remain |

---

## QA-W1-01 — Bootstrap admin grant allowlists fixed emails

| | |
|--|--|
| Category | Security |
| Severity | **P1** |
| Confidence | High |
| Layer | Static |
| Role / API | Authenticated caller → `roles/mutations:grantTestAdmin` |
| Preconditions | Account email is `admin@wizzlet.dev` or `test@wizzlet.dev`, or `ALLOW_DEV_ADMIN_GRANT=true` |
| Expected | Admin minting only via existing admin (`grantRole`) or strictly deployment-scoped secret |
| Actual | Any session for allowlisted emails can mint `userRoles.role=admin` on that account |
| Evidence | `convex/roles/mutations.ts` `grantTestAdmin`; login bootstrap in dirty tree |
| Impact | If this code ships to a shared/prod deployment, registering those emails yields platform owner |
| Smallest fix | Gate on Convex env that is **never** set in prod (`ALLOW_DEV_ADMIN_GRANT` only); remove hard-coded emails from production builds; or `internalMutation` + one-time CLI |
| Regression test | Unauthenticated + non-allowlisted email must FORBIDDEN; prod env simulation must deny even allowlisted email |
| Related | Intentional local owner login; do not confuse with demo `/demo/admin` |

---

## QA-W1-02 — DEV UI role bypass skips DB authorization in the router

| | |
|--|--|
| Category | Security |
| Severity | **P2** (P1 if `import.meta.env.DEV` ever true in a deployed build) |
| Confidence | High |
| Layer | Static |
| Route | `ProtectedRoute` |
| Expected | Route access always requires DB-held role |
| Actual | When `import.meta.env.DEV && devMode`, role checks are skipped; UI can show admin shell |
| Evidence | `src/components/ProtectedRoute.tsx`; `AuthContext` `enableDevMode` / `setDevRole` |
| Impact | Combined with failed admin API, previously caused ErrorBoundary (FORBIDDEN). With QA-W1-01 fixed path, DB role is granted; bypass still masks missing roles |
| Smallest fix | Remove route bypass; keep demo routes for UI exploration; rely on real roles |
| Regression test | DEV build without DB admin must not render `/admin` children |

---

## QA-W1-03 — Residual F-008: legacy unowned storage IDs readable by any authenticated user

| | |
|--|--|
| Category | Security |
| Severity | **P2** |
| Confidence | High |
| Layer | Static |
| API | `files/storage:getUrl` |
| Expected | Only owner (or public intentional URLs) |
| Actual | If no `fileAssets` row, any authenticated user may resolve URL |
| Evidence | Comment + branch in `convex/files/storage.ts` |
| Smallest fix | Deny when asset missing; backfill `fileAssets`; or signed short-lived owner-only URLs |
| Related | F-008 |

---

## QA-W1-04 — Analytics track fires UNAUTHENTICATED during sign-out

| | |
|--|--|
| Category | Reliability |
| Severity | **P3** |
| Confidence | Medium |
| Layer | Runtime logs |
| Expected | Analytics no-ops when signed out |
| Actual | Convex log: `analytics/mutations:track` → `UNAUTHENTICATED` around signOut |
| Evidence | Convex terminal 2026-09-06 during prior sessions |
| Smallest fix | Skip mutation when `!isAuthenticated`; catch and ignore |
| Wave 1 | Not fully reproduced in controlled smoke; logged as residual |

---

## QA-W1-05 — ESLint baseline has errors

| | |
|--|--|
| Category | Maintainability |
| Severity | **P3** |
| Confidence | High |
| Layer | Lint |
| Actual | 10 errors (empty object types, unused expression in `AdminCreatorMessaging`, etc.) |
| Gate impact | Does not block local build; CI workflows absent in repo |

---

## Gate (Wave 1 scope)

```text
INSUFFICIENT EVIDENCE
```

No confirmed untouched P0 from prior list remains open in code review, but critical journeys J1–J7 / Stripe soak / authorization matrix runtime are **NOT_RUN**, and P1 bootstrap-admin allowlist (**QA-W1-01**) is a release concern if this branch is promoted without gating.

---

# Wave 2 additions (2026-09-06)

## QA-W2-01 — Select-role → protected route race leaves user stuck on `/select-role`

| | |
|--|--|
| Category | Reliability / Identity |
| Severity | **P1** |
| Confidence | High |
| Layer | Browser |
| Route | `/select-role` → `/creator/onboarding` |
| Preconditions | Fresh signup `qa.creator.w2.20260906@wizzlet.test` / `qacreator926` |
| Expected | After choosing Creator, land on onboarding and stay authenticated with `creator` role |
| Actual | Continue disables briefly then user remains on `/select-role` (or briefly hits admin via contaminated DEV bypass). Direct `/creator/onboarding` redirects back to select-role while roles query lags |
| Evidence | Browser session 2026-09-06; `SelectRole` calls `refreshRole()` which is a **noop** in `AuthContext` |
| Impact | New users cannot complete creator onboarding reliably; blocks J1 |
| Smallest fix | Await `me`/roles containing the assigned role before navigate; or return role from mutation and set local state; remove noop `refreshRole` |
| Related | QA-W1-02 DEV bypass contamination when prior admin session in same SPA tab |

## QA-W2-02 — UI checkout prefers Stripe when publishable key set (sandbox path unused)

| | |
|--|--|
| Category | Product / Commerce |
| Severity | **P2** (info for test planning) |
| Confidence | High |
| Layer | Static |
| Evidence | `src/lib/stripe.ts` `PAYMENTS_MODE` = stripe if `VITE_STRIPE_PUBLISHABLE_KEY` set |
| Notes | Dev Convex has `ALLOW_SANDBOX_CHECKOUT=true`, `STRIPE_SECRET_KEY=sk_test_*`, `STRIPE_WEBHOOK_SECRET=whsec_*`. Full card Checkout E2E still **NOT_RUN** (no completed payment this wave). |

## Auth matrix Wave 2

| Check | Result |
|-------|--------|
| Self-assign cannot include admin (validator contract + unit) | PASS (`authMatrix.security.test.ts`) |
| Owner cannot activate subscription status (unit) | PASS |
| Sandbox env gate unit | PASS |
| Runtime member `setStatus` / foreign `getUrl` | NOT_RUN (blocked by QA-W2-01 fixture completion) |
| Anon call to authed mutations | NOT_RUN via MCP (status timeout); expect UNAUTHENTICATED |

## Gate (after Wave 2)

```text
NOT READY
```

Confirmed P1 **QA-W2-01** blocks creator onboarding / J1 completion. Prior **QA-W1-01** remains a promote risk. J9 PASS; Stripe secrets present but payment soak NOT_RUN.

---

## Remediation note (2026-09-06) — QA-W2-01

**Status:** Fixed on branch `fix/select-role-nav-race` (authorized remediation).

- `acceptAssignedRole` + non-noop `refreshRole(expectRole)` in `AuthContext`
- `SelectRole` clears DEV bypass, assigns role, waits, then navigates
- Signup clears stored active role + DEV bypass
- Browser verify: `qa.creator.fix.1101@wizzlet.test` → `/creator/onboarding` PASS

---

# Wave 3 additions (2026-09-06)

## J1 commercial lifecycle (browser) — PARTIAL PASS

| Step | Result | Evidence |
|------|--------|----------|
| Creator signup + select Creator | PASS | `qa.creator.fix.1101@wizzlet.test` / `@qacreator1101` |
| Onboarding + publish | PASS | Public `/qacreator1101` with Subscribe CTA |
| Member signup + select Subscriber | PASS | `qa.member.w3.1101@wizzlet.test` → `/dashboard` |
| Stripe Checkout redirect | PASS | `checkout.stripe.com` session `cs_test_a1aEIEGYNK6Xu8B30IUZeYTVJFANfnBziyN2TnEihyv9w7WolOfvWOvBwP` |
| Test card pay + success page | PASS | `/subscription/success` “Subscription Confirmed!” |
| Access / billing ACTIVE | PASS | Dashboard **1 ACTIVE SUBS**; `/dashboard/subscriptions-billing` shows QA Creator W3 **ACTIVE** $9.99 |
| Cancel + post-cancel lock | NOT_RUN | Portal cancel not executed this wave |
| Premium pick entitlement | NOT_RUN | Creator has 0 published picks |

## QA-W3-01 — Public creator profile CTA / subscriber count lag after paid subscribe

| | |
|--|--|
| Category | Product / UX |
| Severity | **P2** |
| Confidence | Medium |
| Layer | Browser |
| Route | `/:username` after successful Checkout |
| Expected | Active subscriber sees subscribed/manage state; public or owner-facing count reflects new sub when designed to |
| Actual | After confirmed ACTIVE billing, `/qacreator1101` still showed **Subscribe — $9.99/mo** and **0 subscribers** in the same member session |
| Evidence | Wave 3 browser 2026-09-06; contrast with dashboard ACTIVE SUBS=1 and billing ACTIVE |
| Impact | Misleading CTA; risk of double-checkout attempt; public social proof stale |
| Smallest fix | Drive CTA from `hasActiveSubscription` query; refresh subscriber count from same subscription rows used by billing |
| Related | J1 PARTIAL; QA-W2-02 Stripe path confirmed working |

## QA-W2-01 disposition

**PASS (fixed)** — re-verified Wave 3 on fresh creator + member fixtures.

## QA-W2-02 note update

Stripe Checkout + webhook fulfillment **PASS** on Wave 3 fixtures (sandbox unused because `VITE_STRIPE_PUBLISHABLE_KEY` set). Residual: cancel / portal path and gated-pick access still NOT_RUN.

## Gate (after Wave 3)

```text
NOT READY
```

J1 subscribe path works end-to-end on Stripe test mode, but cancel/entitlement soak incomplete; **QA-W1-01** promote risk remains; **QA-W3-01** profile CTA residual open.

---

# Wave 4 additions (2026-09-06)

## QA-W3-01 disposition — **PASS (fixed)**

| Fix | Detail |
|-----|--------|
| Branch | `fix/profile-sub-cta-cancel-w4` |
| Root cause | `CreatorProfile` hardcoded `subCount = 0` and never checked active membership |
| Code | `countActiveByCreator` public query; profile uses `mySubscriptions` for Subscribed CTA + Manage billing |
| Verify | Pre-cancel: **Subscribed** + **1 subscriber**; post-cancel: **Subscribe — $9.99/mo** + **0 subscribers** |

## Cancel soak — **PASS**

| Step | Result |
|------|--------|
| Billing Cancel button (wired to `cancelCreatorSubscription`) | PASS |
| Status → CANCELLED | PASS |
| Dashboard ACTIVE SUBS → 0 | PASS |
| Profile CTA restores Subscribe | PASS |
| Gated-pick lock after cancel | NOT_RUN (still 0 picks on fixture) |

## QA-W4-01 — Billing “Open Billing Portal” was a no-op stub

| | |
|--|--|
| Category | Product |
| Severity | **P2** |
| Confidence | High |
| Layer | Static + runtime |
| Actual | `manageBilling` only toasted sandbox message; copy claimed Stripe portal |
| Fix applied (W4) | Cancel button uses real Stripe cancel action; portal button copy/toast clarified |
| Fix applied (W8) | `createBillingPortalSession` + client `openCustomerPortal` / billing page button |
| Residual | Needs Stripe Customer Portal configuration in Dashboard; customer must exist (from checkout) |

## Gate (after Wave 4)

```text
NOT READY
```

J1 pay+cancel happy path PASS on fixtures. Remaining: gated-pick entitlement (J3), **QA-W1-01/02**, other journeys.

---

# Wave 5 additions (2026-09-06)

## J3 gated entitlement — **PASS**

| Step | Result | Evidence |
|------|--------|----------|
| Creator publishes premium pick | PASS | `QA W5 Premium Lock Test` + secret notes; Premium toggle on |
| Cancelled member sees lock | PASS | Premium Content / Subscribe to unlock; secret hidden |
| Resubscribe via Stripe test card | PASS | success `cs_test_a1XqctA6aXiXJvihogUMVC6YOjGsJRTCtgWxS5kDxKmhrHPkSJzT8qrH6n` |
| Active member sees unlock | PASS | Secret notes visible; Copy Pick; Subscribed; 1 subscriber |
| Cancel again → lock restored | PASS | Secret hidden; Subscribe CTA; 0 subscribers |

## Gate (after Wave 5)

```text
NOT READY
```

Critical commerce + entitlement path verified. Remaining blockers for promote: **QA-W1-01**, **QA-W1-02**, incomplete journeys J2/J4–J8.

---

# Wave 6 additions (2026-09-06)

## QA-W1-01 disposition — **PASS (fixed)**

| | |
|--|--|
| Branch | `fix/qa-w1-auth-harden-w6` |
| Fix | `isDevAdminGrantAllowed` requires `ALLOW_DEV_ADMIN_GRANT=true` **and** allowlisted email |
| Dev env | `ALLOW_DEV_ADMIN_GRANT=true` set on `combative-mongoose-559` only |
| Verify | Unit tests + platform owner login → `/admin` Platform Overview |

## QA-W1-02 disposition — **PASS (fixed)**

| | |
|--|--|
| Fix | `ProtectedRoute` always enforces DB roles (removed DEV bypass branch) |
| Login | Owner session no longer enables DEV role bypass |
| Verify | Member `/admin` redirects to `/dashboard`; owner `/admin` works via real admin role |

## QA-W1-03 disposition — **PASS (fixed)**

| | |
|--|--|
| Fix | `files.getUrl` FORBIDDEN when asset missing or not owned |
| Verify | Unowned storageId → FORBIDDEN; foreign owner → FORBIDDEN; owner → URL |

## Auth matrix runtime (Wave 6)

| Check | Result |
|-------|--------|
| Member `subscriptions/mutations:setStatus` | **FORBIDDEN** (`--identity` member) |
| Member `files/storage:getUrl` unowned | **FORBIDDEN** |
| Member `files/storage:getUrl` foreign owned | **FORBIDDEN** |
| Owner `getUrl` own file | PASS (URL returned) |
| Member browser `/admin` | Redirect `/dashboard` |
| Owner bootstrap `/admin` | PASS (no FORBIDDEN UI) |

## Gate (after Wave 6)

```text
NOT READY
```

Security promote blockers from W1 remediated. Remaining: journeys J2/J4–J8, ESLint baseline, prod env checklist.

---

# Wave 14 additions (2026-09-07)

## J2 Product edits — **PASS (fixed)**

| | |
|--|--|
| Category | Commerce |
| Severity | **P2** (pricing drift) |
| Layer | Static + browser + data |
| Finding | Featured/fallback subscribe CTAs used `creator.monthlyPriceCents` / omitted `productId`; product edits could diverge from profile/checkout fallback |
| Fix | Featured product upsert syncs `creators.monthlyPriceCents`; profile lock/fallback CTAs use featured (or first) product price + `productId` |
| Existing subs | Confirmed `subscriptions.amountCents` stored at purchase (fixture cancelled sub still `999`); checkout uses live product price only for new sessions |
| Browser | `@qacreator1101` profile loads Subscribe CTA at $9.99; fixture had **0** product rows (PricingCards path code-verified via `PricingCards` → `createCheckoutSession(..., product.id)`) |
| Residual | Optional: create/edit product E2E under creator session once products exist on fixture |

## Gate (after Wave 14)

```text
NOT READY
```

J2 closed for launch-monthly product pricing. Remaining journeys: J4–J8.

---

# Wave 15 additions (2026-09-07)

## J4 Messages preferences / support — **PASS (hardened)**

| | |
|--|--|
| Category | Entitlement |
| Severity | **P2** |
| Layer | Unit + static + browser |
| Finding | Subscriber sends required active sub + messagingEnabled; creator could still DM cancelled subscribers |
| Fix | Shared `canSendDirectMessage` — both roles need `messagingEnabled` + active subscription; empty body rejected |
| Unit | `messaging.security.test.ts` — 6 cases PASS |
| Browser | Cancelled member `qa.member.w3.1101` on `/dashboard/subscriptions-billing`: CANCELLED row, **no Message button** |
| Support channel | Admin/creator `supportMessages` remains separate (not subscription-gated by design) |

## Gate (after Wave 18)

```text
NOT READY
```

Remaining journey: J8 (BLOCKED — no approved migration snapshot). Referral cash commission not productized.

## QA-W18-J7 — Identity cross-device continuity

| | |
|--|--|
| Category | Identity |
| Severity | **P2** |
| Layer | Unit + browser |
| Finding | Login destination depended on localStorage preferred; empty storage → `/select-role` even with DB roles |
| Fix | `refreshRole` returns active role; login uses `homePathForRole(active)`; SelectRole redirects when roles exist |
| Unit | `roles.test.ts` — 4 PASS |
| Browser | Cleared `wizzlet.activeRole` → creator login lands `/creator`; `/select-role` redirects to creator home |

## QA-W17-J6 — Promo / referral attribution

| | |
|--|--|
| Category | Growth / commerce |
| Severity | **P2** (was blocked by `PROMO_UNAVAILABLE`) |
| Layer | Unit + static + browser |
| Finding | `upsertPromo` hard-threw; signup ignored `?ref=`; false 10% commission copy |
| Fix | Real promo CRUD; Stripe one-time coupon on checkout; `recordReferralByCode`; fulfill attribution |
| Unit | `promoCodes.test.ts` — 3 PASS |
| Browser | Creator created `QAJ6OFF20`; `/signup?ref=…` shows referred banner |

## QA-W16-J5 — Payout reconciliation

| | |
|--|--|
| Category | Commerce / finance |
| Severity | **P2** (UI bug fixed) |
| Layer | Unit + browser |
| Finding | “Paid out” card used `reservedCents` (includes requested/pending) |
| Fix | Paid out = sum of `completed`/`paid` payout rows; shared `payoutBalance` helpers; `ConvexError` on request |
| Unit | `payoutBalance.test.ts` — 5 cases PASS |
| Browser | Creator `/creator/payouts`: Lifetime **$18.98**; after request Available **$0** / Pending **$18.98** / Paid **$0**; History shows `requested` |
