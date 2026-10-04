# Prizelet — world-ready master prompt

**How to use:** Open a new Cursor agent chat. Attach this file (or paste it in full). Then type exactly:

> Start Wave 0 — inventory freeze

Later sessions: attach this file **and** [`docs/ai/world-ready-ledger.md`](./world-ready-ledger.md). Say which wave to run. Continue from the ledger — never from memory.

This document is the operating system for making Prizelet production-grade. It is **not** a license to rewrite the product or to claim “100% ready for the world” in a single session.

---

## 0. You are an agent on Prizelet

Prizelet is private betting infrastructure for sports creators: subscriptions, gated picks, performance tracking, and payouts.

| Layer | Stack |
|-------|--------|
| App | Vite, React 18, TypeScript, Tailwind, shadcn/ui |
| Backend | Convex (Auth, DB, file storage, HTTP actions) |
| Payments | Stripe Checkout + webhooks; sandbox only when **server** env allows |
| Local app | http://localhost:8080 |
| Convex dev | `combative-mongoose-559` (`npx convex dev`) |
| Convex prod | `ceaseless-weasel-494` — **do not deploy unless the user says make it live** |

**Actors**

| Actor | Persistence | Home |
|-------|-------------|------|
| Anonymous | Public queries only | `/` |
| Subscriber (member) | Convex `userRoles.role=subscriber` | `/dashboard` |
| Creator | `userRoles` + `creators` row | `/creator` (onboarding if no profile) |
| Admin | `userRoles.role=admin` (never self-assign) | `/admin` |
| Demo visitor | session/in-memory only | `/demo/*` |

UI brand is **Prizelet** (`PrizeletLogo`). Legacy “Wizzlet” is a repo/docs identifier only — do not mass-rename.

### 0.1 Mission per session

1. Inventory what exists in **live code** (not stale docs).
2. Audit auth, money, entitlements, and every route.
3. Exercise journeys like a real user (browser, not screenshot-only).
4. Fix **one clustered domain per PR**.
5. Update the ledger. Stop when the wave’s definition of done is met.

### 0.2 Hard rules (never violate)

- **Source of truth:** [`src/App.tsx`](../../src/App.tsx), [`convex/schema.ts`](../../convex/schema.ts), [`convex/_generated/api.d.ts`](../../convex/_generated/api.d.ts), unit tests under `src/lib/*.test.ts`, Playwright under `e2e/`.
- **Stale docs:** [`docs/database-audit/01-application-feature-map.md`](../database-audit/01-application-feature-map.md) still mentions Supabase Auth. Runtime has **no Supabase path**. Prefer code. Older convex-audit notes that Stripe was “absent” are **obsolete** — Stripe lives in [`convex/payments/stripeNode.ts`](../../convex/payments/stripeNode.ts) and [`src/lib/stripe.ts`](../../src/lib/stripe.ts).
- **Git:** new branch per wave (`fix/…`, `feat/…`, `chore/…`). Base on the newest shipped tip. Author **`wahidullahr <89798201+wahidullahr@users.noreply.github.com>`**. Do not change global git config. PR to **`production`**, reviewer **`xalatechnologies`**. Merge the PR; fast-forward `main`/`dev` if that is the repo convention. **Do not** run `npx vercel --prod` or `npx convex deploy` to production until the user says **make it live**.
- **Demo:** `/demo/*` and `src/lib/*Demo.ts` must not grant live entitlements, admin privilege, or write payment/payout/subscription rows. Empty signed-in dashboards may show sample preview + amber banner (`?demo=1` force, `?demo=0` empty real). Demo row actions toast and guide the user to create real data.
- **Visual language:** KPI strips use `DashboardKpiStrip` + `kpiIconTone`. Cards: `rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]`. Sport rows: `sportVisual()` + `resultPillTone`. Do not invent one-off KPI cards.
- **Money flags:** Never trust a client boolean for sandbox, fees, or activation. Server env only: `ALLOW_SANDBOX_CHECKOUT`, `ALLOW_DEV_ADMIN_GRANT` — **never set on production**.
- **Roles:** `assignSelfRole` may only mint `creator` or `subscriber`. Admin via existing admin `grantRole` or **dev-only** `grantTestAdmin` gated by `ALLOW_DEV_ADMIN_GRANT`. [`ProtectedRoute`](../../src/components/ProtectedRoute.tsx) must always enforce DB-held roles (no UI bypass).
- **Do not rewrite** working flows. Close gaps. Match existing patterns.
- **Do not skip** a route, Convex public function, or journey because it “looks done.” Record PASS/FAIL/WAIVED in the ledger.
- **Forbidden claim:** Do not say the product is 100% world-ready unless **Section 8 gates** all pass. Always keep a remaining-risk section.

### 0.3 Local platform owner (dev only)

| | |
|--|--|
| Email | `admin@prizelet.dev` |
| Password | `AdminPrizelet1!` |

Login page: **Sign in as platform owner**. Requires Convex `ALLOW_DEV_ADMIN_GRANT` on the **dev** deployment only.

---

## 1. Frozen surface inventory

Wave 0 must **diff this list against live code**. If `App.tsx` / schema / `api.d.ts` gained or lost items, update this prompt’s lists **and** the ledger in the same PR. Until then, treat the lists below as the minimum that must not be skipped.

### 1.1 Routes — public / marketing / auth

| Route | Page | Must work |
|-------|------|-----------|
| `/` | `Index` | Landing, primary CTAs, no ErrorBoundary |
| `/network` | `Network` | Public network surface |
| `/creators` | `Creators` | Published catalogue (empty state OK) |
| `/todays-events` | `TodaysEvents` | Prefer `sportEvents` over hardcoded-only |
| `/discover` | `Discover` | Public discover |
| `/top-creators` | `TopCreators` | Ranking / empty |
| `/pricing` | `Pricing` | Plans / copy; checkout only when entitled |
| `/support` | `Support` | Public support |
| `/community` | `Community` | Public community |
| `/login` | `Login` | Email/password, social, safe return path |
| `/signup` | `Signup` | Username/email/password, social, `?ref=` |
| `/auth/callback` | `AuthCallback` | OAuth finish, errors, retry |
| `/select-role` | `SelectRole` | Creator vs subscriber; no admin card |
| `/subscription/success` | `SubscriptionSuccess` | Post-checkout; creator query param |
| `/subscription/cancel` | `SubscriptionCancel` | Abandoned checkout |
| `/go/:linkId` | `CreatorLinkRedirect` | Click count + redirect; no broken 404 for valid slug |
| `/c/:username` | `CreatorProfileRedirect` | Legacy bookmark → canonical profile |
| `/:username` | `CreatorProfile` | Public profile, products, gated posts, subscribe |
| `*` | `NotFound` | Unknown paths |

Catch-all `/:username` must not shadow real app prefixes (`/dashboard`, `/creator`, `/admin`, `/demo`, `/login`, …).

### 1.2 Routes — member (`ProtectedRoute` `subscriber`)

| Route | Page |
|-------|------|
| `/dashboard` | `Dashboard` |
| `/dashboard/results` | `CustomerResults` |
| `/dashboard/subscriptions-billing` | `CustomerSubscriptionsBilling` |
| `/dashboard/subscriptions-billing/manage/:username` | `CustomerManageSubscription` |
| `/dashboard/saved` | `CustomerSaved` |
| `/dashboard/notifications` | `CustomerNotifications` |
| `/dashboard/discover` | `CustomerDiscover` |
| `/dashboard/activity` | `CustomerActivity` |
| `/dashboard/settings` | `CustomerSettings` |
| `/dashboard/messages` | `CustomerMessages` |

Unauthenticated → login with return path. Wrong role → that role’s home. Loading spinner, not a blank flash.

### 1.3 Routes — creator (`ProtectedRoute` `creator`)

Missing `creators` row (except onboarding) → `/creator/onboarding`.

| Route | Page |
|-------|------|
| `/creator` | `CreatorDashboard` |
| `/creator/posts` | `CreatorPosts` |
| `/creator/products` | `CreatorProducts` |
| `/creator/subscribers` | `CreatorSubscribers` |
| `/creator/promo` | `CreatorPromo` |
| `/creator/promo/codes` | `CreatorPromoCodes` |
| `/creator/personal-growth-manager` | `CreatorPersonalGrowth` |
| `/creator/resolution-case` | `CreatorResolutionCase` |
| `/creator/smart-pricing` | `CreatorSmartPricing` |
| `/creator/access-control` | `CreatorAccessControl` |
| `/creator/performance-tracker` | `CreatorPerformanceTracker` |
| `/creator/messages` | `CreatorMessages` |
| `/creator/notifications` | `CustomerNotifications` (shared) |
| `/creator/links` | `CreatorLinks` |
| `/creator/referrals` | `CreatorReferrals` |
| `/creator/earnings` | `CreatorEarnings` |
| `/creator/payouts` | `CreatorPayouts` |
| `/creator/transactions` | `CreatorTransactions` |
| `/creator/settings` | `CreatorSettings` |
| `/creator/integrations` | `CreatorIntegrations` |
| `/creator/support` | `CreatorSupport` |
| `/creator/onboarding` | `CreatorOnboarding` |

### 1.4 Routes — admin (`ProtectedRoute` `admin`)

| Route | Page |
|-------|------|
| `/admin` | `AdminDashboard` |
| `/admin/creators` | `AdminCreators` |
| `/admin/users` | `AdminUsers` |
| `/admin/customers` | `AdminCustomers` |
| `/admin/finance` | `AdminFinance` |
| `/admin/transactions` | `AdminTransactions` |
| `/admin/fees` | `AdminFees` |
| `/admin/creator-messaging` | `AdminCreatorMessaging` |
| `/admin/customer-email` | `AdminCustomerEmail` |
| `/admin/growth-manager-inbox` | `AdminGrowthManagerInbox` |
| `/admin/resolution-cases` | `AdminResolutionCases` |
| `/admin/payouts` | `AdminPayouts` |
| `/admin/alerts` | `AdminAlerts` |
| `/admin/notifications` | `CustomerNotifications` (shared) |
| `/admin/reports` | `AdminReports` |
| `/admin/settings` | `AdminSettings` |

### 1.5 Routes — demo (fixture only)

| Route | Page |
|-------|------|
| `/demo/creator` | `DemoCreatorDashboard` |
| `/demo/admin` | `DemoAdminDashboard` |
| `/demo/admin/creators` | `DemoAdminCreators` |
| `/demo/admin/users` | `DemoAdminUsers` |
| `/demo/admin/transactions` | `DemoAdminTransactions` |
| `/demo/admin/fees` | `DemoAdminFees` |
| `/demo/admin/settings` | `DemoAdminSettings` |
| `/demo/member` | `DemoMemberDashboard` |
| `/demo/member/results` | `DemoMemberResults` |
| `/demo/member/subscriptions-billing` | `DemoMemberSubscriptions` |
| `/demo/member/saved` | `DemoMemberSaved` |
| `/demo/member/notifications` | `DemoMemberNotifications` |
| `/demo/member/discover` | `DemoMemberDiscover` |
| `/demo/member/activity` | `DemoMemberActivity` |
| `/demo/member/settings` | `DemoMemberSettings` |

Live `App.tsx` (Wave 0 freeze @ `bf85281`): `/demo/admin` and `/demo/member` are nested layout routes (`DemoAdminLayout`, `DemoMemberLayout`). `/demo/member/subscriptions-billing` mounts `DemoMemberSubscriptions` imported as `DemoMemberSubscriptionsBilling`. URLs above are unchanged.

Exit demo → `/`. No Convex financial writes.

### 1.6 HTTP + cron

| Surface | File | Must |
|---------|------|------|
| Convex Auth HTTP | `convex/http.ts` + `auth.addHttpRoutes` | OAuth callbacks |
| `POST /stripe/webhook` | `http.ts` → `internal.payments.stripeNode.fulfillWebhook` | Verify signature; idempotent via `webhookReceipts` |
| `GET /discord/bot-install/callback` | `http.ts` → `internal.discord.roles.completeBotInstall` | Redirect integrations success/error |
| Cron every 5 min | `convex/crons.ts` → `internal.discord.roles.retryPendingGrants` | Pending grants + expired access |

Prod webhook URL: `https://ceaseless-weasel-494.convex.site/stripe/webhook` (document only; do not deploy).

### 1.7 Convex modules (every import in `api.d.ts`)

Treat **every public query/mutation/action** as in-scope. For each: caller identity, auth helper (`getAuthUserId` / `requireAdmin` / creator owner), args + **returns** validators, no JWT `userId|sessionId` used as `Id<"users">`.

| Module | Domain |
|--------|--------|
| `accountRequests` | Email-change cases (no fake email mutation) |
| `admin/exportReports`, `admin/paginatedLists`, `admin/queries`, `admin/snapshots` | Admin reads/exports |
| `analytics/mutations` | Analytics events |
| `auth`, `authProviders` | Convex Auth + social |
| `bookmarks/mutations` | Saved posts / creator bookmarks |
| `creators/earnings`, `creators/growth`, `creators/queries` | Profile, links, promo, referrals, earnings |
| `discord/grants`, `discord/mutations`, `discord/queries`, `discord/roles` | Bot install, role grants |
| `events/queries` | Sport slate |
| `files/storage` | Upload + `getUrl` ownership |
| `messaging/mutations` | DMs; entitlement-gated |
| `migrations/importBatch`, `migrations/load` | **internal** ETL only |
| `notifications/mutations` | Inbox |
| `payments/sandbox`, `payments/stripeDb`, `payments/stripeNode` | Checkout, webhook, portal |
| `payouts/mutations` | Request / admin process; balance helper |
| `picks/mutations` | Member/creator tracker; settled lock |
| `platform/mutations` | Fees / settings singleton |
| `posts/queries` (+ post mutations in this tree) | Feed, previews, results |
| `products/mutations` | Products CRUD / profile slots |
| `resolution/mutations` | Cases + messages |
| `roles/mutations` | `myRoles`, `assignSelfRole`, `grantRole`, `grantTestAdmin` |
| `subscriptions/mutations` | Status transitions; owner cannot activate |
| `support/mutations` | Creator/member support channels |
| `users/queries` | Profile reads (`ensureUser`, `updateProfile`, `changePassword` live here too) |
| `lib/*` | Shared helpers — **not** public client endpoints; test these |
| `crons`, `http` | Generated module imports only; surfaces in §1.6 |

`auth` also exports Convex Auth public `signIn` / `signOut` / `store` / `isAuthenticated` (library-owned, not listed as app `query({` exports). Wave 0 counted **162** app public functions; all had `returns` validators. Do not treat `lib/*` as skippable product APIs.

**Lib files that must stay consistent with UI:** [`convex/lib/contentAccess.ts`](../../convex/lib/contentAccess.ts), [`convex/lib/entitlements.ts`](../../convex/lib/entitlements.ts), [`src/lib/billingAccess.ts`](../../src/lib/billingAccess.ts), [`convex/lib/payoutBalance.ts`](../../convex/lib/payoutBalance.ts), [`convex/lib/envGuards.ts`](../../convex/lib/envGuards.ts), [`convex/lib/commerceIdentity.ts`](../../convex/lib/commerceIdentity.ts).

### 1.8 Schema tables (product data)

Product tables: `users` (Convex Auth overlay + app fields), `userRoles`, `creators`, `products`, `posts`, `subscriptions`, `analyticsEvents`, `pickTracker`, `paymentEvents`, `webhookReceipts`, `sportEvents`, `notifications`, `savedPosts`, `creatorBookmarks`, `payouts`, `creatorLinks`, `promoCodes`, `referrals`, `creatorPayoutSettings`, `resolutionCases`, `resolutionCaseMessages`, `supportMessages`, `memberSupportMessages`, `platformSettings`, `directMessages`, `emailCampaigns`, `fileAssets`, `migrationCheckpoints`, `mutationLog`, `accountRequests`, `discordBotInstalls`, `discordAccessGrants`.

`...authTables` overlay (library): `users`, `authSessions`, `authAccounts`, `authRefreshTokens`, `authVerificationCodes`, `authVerifiers`, `authRateLimits`.

Schema `appRole` also allows `moderator` and `user`. Those are **not** product actors and have **no** routes.

Pick/result vocabulary: `pending | won | lost | push` (normalize legacy win/loss).

---

## 2. Real-world journeys (must work 100% of the happy path + named edges)

Map to historic QA IDs in [`docs/qa/test-cases.md`](../qa/test-cases.md) (`J1`–`J9`). Re-run; do not copy old PASS blindly.

### J1 — Commercial lifecycle

Signup (member + creator) → `select-role` → creator onboarding draft/resume/`onboardingStep` → explicit **Publish** (`isPublished: true`, never unpublish on resume) → member discovers `/:username` → `createCheckoutSession` in [`src/lib/stripe.ts`](../../src/lib/stripe.ts):

- If `publicEnv.stripeMode === 'stripe'`: Convex action `payments.stripeNode.createCheckoutSession` → Stripe Checkout → webhook `fulfillWebhook` → `subscriptions` + `paymentEvents` + `webhookReceipts` + notification.
- Else sandbox **only** if server `ALLOW_SANDBOX_CHECKOUT`.
- Already subscribed → success page, no double charge (`commercialRef` / `isSameCheckoutFulfillment`).

Then: `/subscription/success`, member billing ACTIVE, profile CTA not “Subscribe” for that product, creator earnings/subscribers increment. Cancel via Stripe portal / `openCustomerPortal` / `subscriptions.cancel` per [`docs/product-improvements/decisions.md`](../product-improvements/decisions.md). Access follows **entitlement matrix** (below). Promo codes apply on checkout when valid.

**Edges:** publishable key missing → no fake paid access; webhook retry idempotent; test vs live `paymentMode` excluded from live payout math.

### J2 — Products

Creator CRUD products: price cents, billing period, featured, `showOnProfile` (max 4), limited spots, active/closed. Public profile shows only intended products. Edit does not orphan subscriptions. Image via Convex storage + `fileAssets` owner.

### J3 — Content access / picks

Premium posts: `isPremium` + optional `visibleProductIds`. Preview redaction uses `getAuthUserId`, not JWT subject. Member feed and `/:username` must agree.

**Entitlement matrix** (`subscriptionGrantsContentAccess`):

| Subscription facts | Access |
|--------------------|--------|
| `status` cancelled/canceled | Deny |
| `status` or `billingStatus` past_due / unpaid / incomplete | Deny |
| `status === active` | Allow |
| active + cancel_pending / `cancelAtPeriodEnd` | Allow until `currentPeriodEnd`; deny after |

Settled lock: owner cannot change `posts.result` or `pickTracker.result` once not `pending`. Win rate = wins / (wins + losses); exclude `push` and `pending`.

### J4 — Messages / support / resolution

Member DMs only if messaging enabled + content access ([`convex/lib/messagingAccess.ts`](../../convex/lib/messagingAccess.ts)). Creator inbox, unread badges. Support: creator `supportMessages`, member widget `memberSupportMessages`. Resolution cases: creator open + admin reply; read receipts. Admin growth-manager inbox and creator-messaging are real Convex, not placeholders.

### J5 — Payouts

Balance from `paymentEvents` minus paid/reserved payouts ([`convex/lib/payoutBalance.ts`](../../convex/lib/payoutBalance.ts)). Creator request uses ConvexError on insufficient funds. Admin approve/reject. Paid out ≠ reserved. Sandbox/test mode excluded from live payouts. Stripe Connect stubs must not pretend money moved.

### J6 — Promo / links / referrals

Promo CRUD, ownership, max uses, expiry, `discountDuration` once|forever. `/go/:linkId` increments clicks; conversion on subscribe. Signup `?ref=` + `creators.referralCode`. Commission cash may be TBD — if unimplemented, UI must not show fake paid commissions as live money.

### J7 — Identity continuity

Password + X/Discord OAuth. [`AuthCallback`](../../src/pages/AuthCallback.tsx) `waitForAuthenticated` / `ensureCanonicalAuthOrigin`. Safe return paths ([`src/lib/safeReturnPath.ts`](../../src/lib/safeReturnPath.ts)) — no open redirects. Multi-role: `ROLE_PRIORITY` admin > creator > subscriber; `switchRole` only among held roles. Sign-out does not flash `/select-role`. Email change: `accountRequests` + audit; **do not claim email already changed**.

### J8 — Migration continuity

ETL `internalMutation` only. `MIGRATION_SECRET` unset after cutover. Do not expose import to the client API. If J8 cannot run, ledger **BLOCKED** with reason — do not fake PASS.

### J9 — Public nav / chrome

Landing and primary nav do not throw. Playwright: [`e2e/public-nav.smoke.spec.ts`](../../e2e/public-nav.smoke.spec.ts), [`e2e/browser-matrix.smoke.spec.ts`](../../e2e/browser-matrix.smoke.spec.ts). Dev login shows platform-owner bootstrap; production **build** must not expose grant UI that works without `ALLOW_DEV_ADMIN_GRANT`.

### Additional journeys (not optional)

- **Admin ops:** users/creators lists paginated; fees `platformSettings`; reports export; alerts; customer email campaigns (status honest if send is not wired to a provider).
- **Discord:** bot install OAuth; grant/revoke with subscription; cron retries; failed grants visible.
- **Files:** `getUrl` denied for unowned IDs; no “legacy unowned readable by any auth user.”
- **Events:** today’s events from `sportEvents` when published; empty state if none.
- **Notifications:** create on pay/message/support; mark read; shared page on member/creator/admin prefixes.
- **Settings:** profile, notification prefs, integrations catalog — live vs toast-stub labeled honestly.
- **Smart pricing / access control:** if algorithm is incomplete, say so in UI; do not persist fake live prices as Stripe amounts without server support.

---

## 3. Per-screen and per-API quality bar

### 3.1 Every screen

Verify: loading, empty real (`?demo=0`), sample preview (empty account or `?demo=1`), error, forbidden/redirect, mobile and desktop, light and dark. Shared state: if you change how subscriptions or roles are written, re-check every reader (profile CTA, feed, billing, messaging, admin finance).

### 3.2 Every public Convex function

Auth, ownership, validators including `returns`, no client-trusted money/role flags, pagination or documented 50k safety cap, no unbounded `collect()` on hot admin paths without a note in remaining risk.

### 3.3 Commands that must stay green (Wave 3+)

```bash
npm test
npm run lint
npm run build
npm run env:validate
npm run test:e2e
```

Add a unit test for every security/money bug class you fix (see `src/lib/*.security.test.ts`, `contentAccess.test.ts`, `payoutBalance.test.ts`, `envGuards.test.ts`).

---

## 4. Operating protocol (waves)

One wave = one branch = one PR = one domain. Do not mix Stripe payouts with landing copy.

### Wave 0 — Inventory freeze

1. Diff Section 1 against `App.tsx`, `schema.ts`, `api.d.ts`.
2. Fill [`docs/ai/world-ready-ledger.md`](./world-ready-ledger.md): every route × intended roles × persistence (`convex` / `demo` / `public` / `mixed`) × result `NOT_RUN`.
3. List public Convex functions without `returns` validators.
4. **No feature work.** Commit the ledger.

### Wave 1 — Audit

Static + unit. Retest residual risks (Section 5). Write/update [`docs/qa/findings.md`](../qa/findings.md) with IDs. Do not “fix everything” in this wave unless a P0 is a one-line gate already covered by tests.

### Wave 2 — E2E

Browser tools + Playwright. Walk J1–J9 and **every leftover ledger row**. Evidence: what you clicked, expected vs actual. Money paths: Stripe **test** card on **dev** Convex only.

### Wave 3+ — Fix

One finding cluster per PR (example clusters: auth grant, file URLs, webhook idempotency, payout math, list pagination, Discord grants, demo leak, lint/tsc). Re-verify the journey **and** sibling screens. Repeat until P0/P1 are gone or explicitly waived in the ledger with owner + reason.

---

## 5. Residual risks — retest first (do not assume still open)

Historic IDs from [`docs/qa/findings.md`](../qa/findings.md) / convex-audit. Code may already have fixed some (e.g. `ProtectedRoute` comments say no DEV bypass; Stripe exists). **Retest and set ledger PASS/FAIL.**

| ID | Risk |
|----|------|
| QA-W1-01 / F-grant | `grantTestAdmin` email allowlist vs `ALLOW_DEV_ADMIN_GRANT`; must fail on prod-like env |
| QA-W1-02 | DEV `ProtectedRoute` / `setDevRole` UI bypass |
| QA-W1-03 / F-008 | `files/storage.getUrl` unowned legacy storage IDs |
| F-001–F-003 | Sandbox client flag; public `createSubscriptionRecord`; owner `setStatus` → active |
| F-004 | Entitlement using JWT subject |
| F-005 | Public migration mutations |
| F-009 / J5 | Payout reserved vs paid |
| F-010 | Webhook soak; Connect payouts |
| F-012 | Admin full-table scans |
| F-015 | Lint / full `tsc` |
| Discord cron | Pending grants / revoke on cancel |
| Stale docs | Agents following Supabase or “sandbox-only payments” |

---

## 6. Definition of done — one wave

- Ledger rows for the wave updated (`PASS` / `FAIL` / `WAIVED` / `BLOCKED`) with date and branch.
- Tests added for the bug class.
- Browser verification of touched flows (not a single screenshot).
- Commit as wahidullahr; PR + reviewer `xalatechnologies`; merge per workspace rules.
- **No production deploy.**

---

## 7. Session start checklist (paste this into every follow-up)

```
Repo: Prizelet (wizzlet-waqas). Read docs/ai/prizelet-world-ready-master-prompt.md and docs/ai/world-ready-ledger.md.
1. git fetch; branch from newest shipped tip; new branch for this wave.
2. Confirm VITE_CONVEX_URL is combative-mongoose-559 (dev), not production.
3. Continue the lowest NOT_RUN / FAIL ledger row unless the user named a wave.
4. Prefer live code over docs/database-audit and old Stripe-absent notes.
5. Fix one cluster. Verify in the browser. Update the ledger. Stop.
```

---

## 8. Gates before anyone may say “ready for the world”

All must be true:

1. Every `App.tsx` route has a ledger row that is PASS or WAIVED (waiver has owner + reason).
2. Every **public** Convex function has documented auth + `returns` validator.
3. J1 money path proven on **dev** with Stripe test card: checkout → webhook → billing ACTIVE → cancel → access lock.
4. J3 feed and public profile agree on entitlement matrix.
5. J5 payout numbers reconcile with `payoutBalance` tests + UI.
6. `/demo/*` writes zero subscription/payment/payout rows.
7. `npm test`, `npm run lint`, `npm run build`, `npm run env:validate`, `npm run test:e2e` pass.
8. No open P0/P1 in `docs/qa/findings.md` unless waived.
9. Remaining-risk section lists residual P2/P3 (pagination, Connect, Discord soak, email provider, MFA, etc.).
10. User has **not** been told the site is live; production still requires an explicit **make it live**.

Until then, the only honest status is: **in progress, ledger attached.**

---

## 9. Remaining-risk template (required in every Wave 3+ PR)

```md
## Remaining risk
- P2: …
- Not in this PR: production Stripe live keys, Vercel promote, MFA, …
- Waivers: ID — reason — owner
```

Literal zero bugs forever is not a deliverable. Honesty is.
