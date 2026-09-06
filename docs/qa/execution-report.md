# Execution report — QA Wave 1

**Date:** 2026-09-06  
**Mode:** AUDIT_AND_TEST (no app remediations)  
**Agent plan:** Full Application QA Campaign  

## Candidate under test

| Field | Value |
|-------|-------|
| Branch | `fix/login-ensureuser-auth-race` |
| Tip ancestry | `bafb16a` (dev merge cutover stack) |
| Dirty tree | Yes — login auth race, admin bootstrap (`admin@wizzlet.dev`), ErrorBoundary/AdminQueryBoundary, README local-owner docs |
| Vite | `http://localhost:8080` → HTTP 200 |
| Convex | `combative-mongoose-559` (prizelet/dev) |
| Stripe publishable | `pk_test_*` |
| CI workflows | None present under `.github/workflows` |

## Safety gate

**PASS** — Write-capable tests limited to verified **dev** Convex + Stripe test publishable key. No `convex deploy`, no production writes, no DB reset, no GitHub issues.

## Commands run

| Command | Exit | Summary |
|---------|------|---------|
| `npm test` | 0 | 9 files, 43 tests passed |
| `npm run build` | 0 | Built; CSS `@import` order warning; large chunk warning |
| `npx eslint src convex` | 0 reported by shell despite **10 errors / 22 warnings** in output | Treat lint quality as **FAIL** for gate purposes |
| Browser smoke | n/a | Platform owner → `/admin` Platform Overview |

## Coverage summary

| Metric | Count |
|--------|-------|
| Features inventoried | 72 |
| Runtime-tested Wave 1 | 4 (login, owner bootstrap, admin overview, env safety) |
| Prior findings retested | 15 |
| Critical journeys run | 0 (J8 BLOCKED) |
| New findings | QA-W1-01 … QA-W1-05 |

## What works (evidence)

- Unit business-rule suite green.
- Production client build succeeds.
- Prior P0 subscription/sandbox invent-billing issues appear fixed in code + units.
- Local platform owner login (`admin@wizzlet.dev`) reaches live admin dashboard without FORBIDDEN ErrorBoundary.

## What fails / residual

- QA-W1-01 bootstrap admin email allowlist (P1 if promoted).
- QA-W1-02 DEV route role bypass.
- QA-W1-03 legacy file ACL residual.
- F-014 `Date.now()` in events query.
- ESLint error baseline; analytics unauth on sign-out (log).

## Boundaries not tested

- Full J1–J7 browser E2E; Stripe webhook soak; concurrent checkout; multi-account isolation; mobile a11y matrix; migration parity snapshot; payout settlement UI; messaging preference enforcement.

## Final gate (Wave 1 declared scope)

```text
INSUFFICIENT EVIDENCE
```

Mandatory critical journeys and authorization runtime matrix remain NOT_RUN. No unverified claim of full-application readiness.

---

# Wave 2 execution (2026-09-06)

## Commands

| Command | Exit | Summary |
|---------|------|---------|
| `npm test` | 0 | 10 files / **47** tests (added `authMatrix.security.test.ts`) |
| `npx playwright test -c playwright.qa.config.ts` | 0 | 2/2 J9 public-nav smoke PASS |
| `npx convex env list` (redacted) | 0 | `ALLOW_SANDBOX_CHECKOUT`, `STRIPE_SECRET_KEY=sk_test`, `STRIPE_WEBHOOK_SECRET=whsec` present |
| Browser J1 signup | n/a | Account created; role continue **FAIL** (QA-W2-01) |

## Artifacts added

- `e2e/public-nav.smoke.spec.ts`
- `playwright.qa.config.ts` (standalone; root config depends on missing lovable package)
- `.gitignore` entries for Playwright reports / `e2e/.auth`

## Fixtures

| Account | Purpose | Cleanup |
|---------|---------|---------|
| `qa.creator.w2.20260906@wizzlet.test` | J1 creator signup | Leave in dev DB; username `qacreator926` |
| `admin@wizzlet.dev` | Prior owner | Unchanged |

## Gate after Wave 2

```text
NOT READY
```

P1 onboarding race confirmed; J1 incomplete; Stripe Checkout card flow not executed.

---

# Wave 3 execution (2026-09-06)

## Scope

Authorized **QA-W2-01** remediation already on branch `fix/select-role-nav-race`. Re-ran J1 commercial lifecycle with fresh fixtures through Stripe test Checkout.

## Browser J1 results

| Step | Result |
|------|--------|
| Creator signup / role / onboarding / publish | PASS (`@qacreator1101`) |
| Member signup / Subscriber / dashboard | PASS |
| Subscribe → Stripe Checkout → card `4242…` | PASS |
| `/subscription/success` confirmed | PASS |
| Dashboard ACTIVE SUBS=1 + billing ACTIVE $9.99 | PASS |
| Profile CTA reflects subscribed | FAIL (**QA-W3-01**) |
| Cancel / gated pick entitlement | NOT_RUN |

## Fixtures

| Account | Purpose |
|---------|---------|
| `qa.creator.fix.1101@wizzlet.test` | J1 creator |
| `qa.member.w3.1101@wizzlet.test` | J1 member + paid sub |
| Session | `cs_test_a1aEIEGYNK6Xu8B30IUZeYTVJFANfnBziyN2TnEihyv9w7WolOfvWOvBwP` |

## Gate after Wave 3

```text
NOT READY
```

Commerce happy-path works on Stripe test mode; cancel/entitlement and remaining journeys still open; **QA-W1-01** / **QA-W3-01** residual.

---

# Wave 4 execution (2026-09-06)

## Scope

Authorized remediations on `fix/profile-sub-cta-cancel-w4`: QA-W3-01 profile CTA/count + billing Cancel wiring; then cancel soak.

## Results

| Check | Result |
|-------|--------|
| Profile Subscribed + 1 subscriber (pre-cancel) | PASS |
| Cancel → CANCELLED | PASS |
| ACTIVE SUBS=0 + Subscribe CTA restored | PASS |
| Gated pick entitlement | NOT_RUN |

## Code touched

- `convex/subscriptions/mutations.ts` — `countActiveByCreator`
- `src/pages/CreatorProfile.tsx` — subscribed CTA + count
- `src/pages/CustomerSubscriptionsBilling.tsx` — Cancel → `cancelSubscription`

## Gate after Wave 4

```text
NOT READY
```

J1 pay+cancel PASS; J3 picks and promote-hardening still open.

---

# Wave 5 execution (2026-09-06)

## Scope

J3 content ownership/access: premium pick lock ↔ unlock across cancel / resubscribe.

## Results

| Check | Result |
|-------|--------|
| Publish premium pick as `@qacreator1101` | PASS |
| Locked for cancelled member | PASS |
| Unlocked after Stripe resubscribe | PASS |
| Locked again after cancel | PASS |

## Gate after Wave 5

```text
NOT READY
```

J1 + J3 PASS on fixtures. Promote risks QA-W1-01/02 and remaining journeys open.

---

# Wave 6 execution (2026-09-06)

## Scope

Authorized remediations for QA-W1-01/02/03 + runtime auth matrix on `fix/qa-w1-auth-harden-w6`.

## Results

| Check | Result |
|-------|--------|
| grantTestAdmin env+email gate | PASS (units + owner login) |
| ProtectedRoute no DEV bypass | PASS (member `/admin` → dashboard) |
| files.getUrl ACL | PASS (unowned/foreign FORBIDDEN) |
| Member setStatus | FORBIDDEN |

## Code touched

- `convex/lib/devAdminGrant.ts` (new)
- `convex/roles/mutations.ts`, `convex/files/storage.ts`
- `src/components/ProtectedRoute.tsx`, `src/pages/Login.tsx`
- `src/lib/authMatrix.security.test.ts`

## Gate after Wave 6

```text
NOT READY
```

W1 security findings closed on this branch; remaining product journeys incomplete.
