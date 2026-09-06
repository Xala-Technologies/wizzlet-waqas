# Test cases (Wave 1)

| ID | Feature | Layer | Expected | Result | Evidence |
|----|---------|-------|----------|--------|----------|
| TC-BASE-01 | Tooling | Unit | `npm test` all pass | PASS | 9 files / 43 tests, exit 0 |
| TC-BASE-02 | Tooling | Build | `npm run build` succeeds | PASS | Vite build ~8s, exit 0; CSS `@import` order warning |
| TC-BASE-03 | Tooling | Lint | `npx eslint src convex` clean | FAIL | 10 errors / 22 warnings (incl. `AdminCreatorMessaging` unused expression, empty interfaces) |
| TC-ENV-01 | Safety | Static | Frontend → Convex **dev** | PASS | `combative-mongoose-559`; Stripe `pk_test_` |
| TC-ID-01 | ID-01/04 | Browser | Platform owner button signs in and opens `/admin` without ErrorBoundary | PASS | Browser CDP 2026-09-06: `hasOverview=true`, `hasForbidden=false` |
| TC-ID-02 | ID-04 | Browser | `dashboardStats` loads for bootstrap admin | PASS | KPIs render ($0 aggregates) |
| TC-SEC-F001 | COM-01 | Unit+Static | Sandbox gated by env, not client boolean | PASS | `assertSandboxEnabled`; `subscriptions.security.test.ts` |
| TC-SEC-F002 | SEC-02 | Static | `createSubscriptionRecord` not public | PASS | `internalMutation` |
| TC-SEC-F003 | SEC-02 | Unit+Static | Owner cannot activate via transition helper; `setStatus` admin-only | PASS | Unit + `requireAdmin` on mutation |
| TC-SEC-F004 | J3 | Static | Entitlements use `getAuthUserId` | PASS | `posts/queries.ts` + `entitlements.ts` |
| TC-SEC-F005 | SEC-04 | Static | Migration imports are `internalMutation` | PASS | `importBatch.ts` |
| TC-SEC-F006 | CR-05/12 | Static | Promo/link patch ownership | PASS | `requireCreatorOwner` / `creatorId` match |
| TC-SEC-F007 | PUB-09 | Static | Public creator projection | PASS | `getByUsername` omits stripe/discord |
| TC-SEC-F008 | SEC-03 | Static | `getUrl` requires auth + owner when asset registered | PARTIAL | Auth required; **legacy unowned** files still readable by any auth user |
| TC-SEC-F009 | CR-15 | Unit | Payout balance math | PASS | `payoutBalance.test.ts` |
| TC-SEC-F010 | COM-02/05 | Static | Stripe webhook path exists | PASS (code) | Runtime soak NOT_RUN |
| TC-SEC-F014 | PLAT-01 | Static | No `Date.now()` in queries | FAIL | `events/queries.ts:44` still uses `Date.now()` |
| TC-SEC-W1-01 | SEC-06 | Static | Admin bootstrap not grantable by arbitrary accounts in prod | FAIL | Email allowlist without deployment-kind gate |
| TC-SEC-W1-02 | SEC-05 | Static | UI cannot bypass DB roles outside intentional local tooling | FAIL | `ProtectedRoute` + `AuthContext` DEV bypass |
| TC-J1–J9 | Journeys | E2E | See agent prompt | NOT_RUN / J8 BLOCKED | No Playwright specs yet |

## Journey status

| Journey | Result |
|---------|--------|
| J1 Commercial lifecycle | **PASS** (W4 pay+cancel) |
| J2 Product edits | NOT_RUN |
| J3 Content access | **PASS** (W5) |
| J4 Messages/support | NOT_RUN |
| J5 Payout reconciliation | NOT_RUN |
| J6 Promo/referral | NOT_RUN |
| J7 Identity continuity | NOT_RUN |
| J8 Migration continuity | BLOCKED |
| J9 Public nav/controls | PASS (W2) |

---

# Wave 2 test cases

| ID | Feature | Layer | Result | Evidence |
|----|---------|-------|--------|----------|
| TC-W2-AUTH-01 | SEC-01 self-assign union | Unit | PASS | `authMatrix.security.test.ts` |
| TC-W2-AUTH-02 | Subscription actor policy | Unit | PASS | same |
| TC-W2-AUTH-03 | Sandbox env gate | Unit | PASS | same |
| TC-W2-J9-01 | Public nav routes | Playwright | PASS | `e2e/public-nav.smoke.spec.ts` |
| TC-W2-J9-02 | Login owner bootstrap visible | Playwright | PASS | same |
| TC-W2-STRIPE-01 | Dev Stripe secrets present | Env | PASS | `sk_test` + `whsec` on Convex |
| TC-W2-STRIPE-02 | Completed Checkout + webhook soak | E2E | NOT_RUN | Secrets present; no card purchase this wave |
| TC-W2-J1-01 | Signup new creator | Browser | PASS | reached `/select-role` |
| TC-W2-J1-02 | Assign creator + open onboarding | Browser | FAIL → **PASS (W3)** | QA-W2-01 fixed; retest on `qa.creator.fix.1101` |
| TC-W2-J1-03 | Publish + member subscribe + cancel | Browser | PARTIAL (W3) | Subscribe+ACTIVE PASS; cancel NOT_RUN |
| TC-W2-PUB-01 | `/creators` empty catalogue | Browser | PASS | No published creators before fixture |

---

# Wave 3 test cases

| ID | Feature | Layer | Result | Evidence |
|----|---------|-------|--------|----------|
| TC-W3-J1-01 | Creator fixture onboard+publish | Browser | PASS | `/qacreator1101` Subscribe $9.99 |
| TC-W3-J1-02 | Member signup → Subscriber dashboard | Browser | PASS | `/dashboard` empty feed |
| TC-W3-J1-03 | Stripe Checkout redirect | Browser | PASS | `checkout.stripe.com` Prizlett sandbox |
| TC-W3-J1-04 | Test card + success page | Browser | PASS | Subscription Confirmed @qacreator1101 |
| TC-W3-J1-05 | Billing ACTIVE after webhook | Browser | PASS | ACTIVE SUBS=1; billing row ACTIVE |
| TC-W3-J1-06 | Profile CTA post-subscribe | Browser | FAIL → **PASS (W4)** | QA-W3-01 fixed |
| TC-W3-J1-07 | Cancel + access lock | Browser | NOT_RUN → **PASS (W4)** portal cancel; pick lock NOT_RUN |
| TC-W3-STRIPE-02 | Checkout + webhook soak | E2E | PASS (happy path) | Replaces W2 NOT_RUN for pay path |

## Journey status (updated)

| Journey | Result |
|---------|--------|
| J1 Commercial lifecycle | **PASS** (pay + cancel; gated-pick half deferred to J3) |
| J9 Public nav/controls | PASS (W2) |

---

# Wave 4 test cases

| ID | Feature | Layer | Result | Evidence |
|----|---------|-------|--------|----------|
| TC-W4-CTA-01 | Subscribed CTA + count | Browser | PASS | Subscribed; 1 subscriber |
| TC-W4-CANCEL-01 | Billing Cancel | Browser | PASS | Status CANCELLED |
| TC-W4-CANCEL-02 | Access metrics after cancel | Browser | PASS | ACTIVE SUBS=0; Subscribe CTA; 0 subscribers |
| TC-W4-J3-01 | Premium pick lock after cancel | Browser | NOT_RUN → **PASS (W5)** | Full lock/unlock/lock cycle |

## Journey status (updated)

| Journey | Result |
|---------|--------|
| J1 Commercial lifecycle | **PASS** (W4) |
| J3 Content access | **PASS** (W5) |
| J9 Public nav/controls | PASS (W2) |

---

# Wave 5 test cases

| ID | Feature | Layer | Result | Evidence |
|----|---------|-------|--------|----------|
| TC-W5-J3-01 | Publish premium pick | Browser | PASS | Creator posts UI; premium on |
| TC-W5-J3-02 | Lock while cancelled | Browser | PASS | Secret hidden; unlock CTA |
| TC-W5-J3-03 | Unlock while ACTIVE | Browser | PASS | Secret + Copy Pick visible |
| TC-W5-J3-04 | Lock after cancel | Browser | PASS | Secret hidden again |

---

# Wave 6 test cases

| ID | Feature | Layer | Result | Evidence |
|----|---------|-------|--------|----------|
| TC-W6-SEC-01 | grantTestAdmin env gate | Unit | PASS | `isDevAdminGrantAllowed` |
| TC-W6-SEC-02 | Member setStatus | Convex run + identity | PASS | FORBIDDEN |
| TC-W6-SEC-03 | getUrl unowned/foreign | Convex run + identity | PASS | FORBIDDEN |
| TC-W6-SEC-04 | Member /admin route | Browser | PASS | Redirect `/dashboard` |
| TC-W6-SEC-05 | Owner bootstrap /admin | Browser | PASS | Platform Overview |
