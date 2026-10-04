# Prizelet world-ready ledger

**Authority:** [`docs/ai/prizelet-world-ready-master-prompt.md`](./prizelet-world-ready-master-prompt.md)

**Status:** Wave 15 J-DEMO 2026-10-05. J1–J8 + J-FILES + J-DEMO PASS. F-010 still PARTIAL. Product is **not** world-ready.

Do not claim world-ready until Section 8 gates in the master prompt pass.

## How to fill a row

| Field | Values |
|-------|--------|
| Result | `NOT_RUN` \| `PASS` \| `FAIL` \| `WAIVED` \| `BLOCKED` |
| Persistence | `public` \| `convex` \| `demo` \| `mixed` |
| Roles | anonymous / subscriber / creator / admin / demo |
| Evidence | branch, date, one-line actual vs expected |
| Waiver | owner + reason (required if WAIVED) |

Last updated: 2026-10-05. Last wave: **15** (`test/world-ready-wave-15-j-demo`). Source pin: `bf85281` (inventory).

Wave 15: `?demo=1` payouts amber banner; Withdraw → toast “Sample preview — payout not requested”; `listMine` still **2** rows (no new payout). `*Demo.ts` have no Convex money imports; money pages gate on `useDemo`. Unit `demo.security.test.ts` 2/2.

---

## A. Public / marketing / auth routes

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/` | Index | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/network` | Network | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creators` | Creators | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/todays-events` | TodaysEvents | anonymous | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/discover` | Discover | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/top-creators` | TopCreators | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/pricing` | Pricing | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/support` | Support | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/community` | Community | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/login` | Login | anonymous | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/signup` | Signup | anonymous | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/auth/callback` | AuthCallback | anonymous | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/select-role` | SelectRole | authenticated no role | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/subscription/success` | SubscriptionSuccess | subscriber+ | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/subscription/cancel` | SubscriptionCancel | subscriber+ | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/go/:linkId` | CreatorLinkRedirect | anonymous | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/c/:username` | CreatorProfileRedirect | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/:username` | CreatorProfile | anonymous+ | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `*` | NotFound | all | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |

## B. Member routes

PASS below is **anonymous → `/login`**, not an authenticated subscriber session.

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/dashboard` | Dashboard | subscriber | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/results` | CustomerResults | subscriber | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/subscriptions-billing` | CustomerSubscriptionsBilling | subscriber | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/subscriptions-billing/manage/:username` | CustomerManageSubscription | subscriber | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/saved` | CustomerSaved | subscriber | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/notifications` | CustomerNotifications | subscriber | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/discover` | CustomerDiscover | subscriber | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/activity` | CustomerActivity | subscriber | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/settings` | CustomerSettings | subscriber | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/dashboard/messages` | CustomerMessages | subscriber | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |

## C. Creator routes

PASS below is **anonymous → `/login`**, not an authenticated creator session.

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/creator` | CreatorDashboard | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/posts` | CreatorPosts | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/products` | CreatorProducts | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/subscribers` | CreatorSubscribers | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/promo` | CreatorPromo | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/promo/codes` | CreatorPromoCodes | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/personal-growth-manager` | CreatorPersonalGrowth | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/resolution-case` | CreatorResolutionCase | creator | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/smart-pricing` | CreatorSmartPricing | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/access-control` | CreatorAccessControl | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/performance-tracker` | CreatorPerformanceTracker | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/messages` | CreatorMessages | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/notifications` | CustomerNotifications | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/links` | CreatorLinks | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/referrals` | CreatorReferrals | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/earnings` | CreatorEarnings | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/payouts` | CreatorPayouts | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/transactions` | CreatorTransactions | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/settings` | CreatorSettings | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/integrations` | CreatorIntegrations | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/support` | CreatorSupport | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/onboarding` | CreatorOnboarding | creator | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |

## D. Admin routes

PASS below is **anonymous → `/login`**, not an authenticated admin session.

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/admin` | AdminDashboard | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/creators` | AdminCreators | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/users` | AdminUsers | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/customers` | AdminCustomers | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/finance` | AdminFinance | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/transactions` | AdminTransactions | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/fees` | AdminFees | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/creator-messaging` | AdminCreatorMessaging | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/customer-email` | AdminCustomerEmail | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/growth-manager-inbox` | AdminGrowthManagerInbox | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/resolution-cases` | AdminResolutionCases | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/payouts` | AdminPayouts | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/alerts` | AdminAlerts | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/notifications` | CustomerNotifications | admin | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/reports` | AdminReports | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/settings` | AdminSettings | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |

## E. Demo routes (must not write Convex money tables)

Nested layouts in `App.tsx`: `/demo/admin` → `DemoAdminLayout`; `/demo/member` → `DemoMemberLayout`.

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/demo/creator` | DemoCreatorDashboard | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/admin` | DemoAdminDashboard (nested DemoAdminLayout) | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/admin/creators` | DemoAdminCreators | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/admin/users` | DemoAdminUsers | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/admin/transactions` | DemoAdminTransactions | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/admin/fees` | DemoAdminFees | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/admin/settings` | DemoAdminSettings | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member` | DemoMemberDashboard (nested DemoMemberLayout) | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/results` | DemoMemberResults | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/subscriptions-billing` | DemoMemberSubscriptions (imported as DemoMemberSubscriptionsBilling) | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/saved` | DemoMemberSaved | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/notifications` | DemoMemberNotifications | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/discover` | DemoMemberDiscover | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/activity` | DemoMemberActivity | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/demo/member/settings` | DemoMemberSettings | demo | demo | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |

## F. HTTP + cron

| Surface | Module | Result | Evidence |
|---------|--------|--------|----------|
| Convex Auth HTTP routes | `convex/http.ts` + `auth.addHttpRoutes` | NOT_RUN | frozen vs convex/http.ts + crons.ts @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `POST /stripe/webhook` | `payments.stripeNode.fulfillWebhook` | PARTIAL | Wave 6: live HTTP 400 missing signature; 400 forged signature (secret present). Signed event → `webhookReceipts` still not observed. Wave 5 fulfill used confirmCheckoutSession |
| `GET /discord/bot-install/callback` | `discord.roles.completeBotInstall` | NOT_RUN | frozen vs convex/http.ts + crons.ts @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| Cron 5m pending Discord grants | `discord.roles.retryPendingGrants` | NOT_RUN | frozen vs convex/http.ts + crons.ts @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

## G. Journeys

| ID | Name | Result | Evidence |
|----|------|--------|----------|
| J1 | Commercial lifecycle (publish → Stripe → webhook → cancel → access) | PASS | Wave 5 2026-10-05: publish `@prize2626` + product Monthly pro $100; member signup `j1member`; Checkout `cs_test_a171BP4bJzrvM8pRX5c7xvgaScFUnfjkraXVlSBBbIFzb8Zxz6spGJWgXJ`; sub `mn7bg36b7xe76gkxyaeq0caaph8fnhyh` ACTIVE then cancelled; `paymentEvents` `checkout:cs_test_…` + `cancel_local:…`; My Creators `?demo=0` empty after cancel. Residual: no new `webhookReceipts` for this session (confirmCheckoutSession fulfilled); Connect not in scope |
| J2 | Product CRUD + profile slots | PASS | Wave 7 2026-10-05: `j2creator` published; create **J2 Monthly Alpha** $19.99 monthly + limited 100 spots; pin `showOnProfile`; edit → $24.99; public profile Subscribe $24.99; hard delete (no subs) → 0 products. `setShowOnProfile` throws `PROFILE_SLOTS_FULL` at 4; unit `productProfileSlots.test.ts`. Residual: soft-archive when subscription exists not browser-soaked; featured exclusivity not UI-toggled |
| J3 | Content access / pick lock / win rate | PASS | Wave 8 2026-10-05: anonymous `/j2creator?demo=0` no secret bodies; owner posts list shows WAVE8_*; `setResult` won then UI **Result locked** + `RESULT_LOCKED` on upsert/setResult; public Win Rate 100% with won+push (push excluded). `memberFeed` uses `subscriptionGrantsContentAccess`; saved posts use `canViewPostContent`. Residual: paid unlock/cancel not browser-soaked on this fixture (0 subs); pickTracker lock not subscriber-session soaked |
| J4 | Messages / support / resolution | PASS | Wave 9 2026-10-05: `j4creator`/`j4member` Stripe sub; DM + creator unread/reply; support/resolution/growth admin replies; messaging off deny; cancel → `FORBIDDEN` on send. Unit `messaging.security.test.ts` 6/6. Fix: messaging toggle on populated CreatorMessages inbox. Residual: UI composer still shown when gated (server enforces) |
| J5 | Payout request / approve / balance | PASS | Wave 10 2026-10-05: `j4creator` $28.49 available → request → reserved $0 avail; admin failed frees balance; re-request → completed; Paid ≠ reserved; Connect stub copy honest. `payoutBalance.test.ts` 5/5. Residual: admin Lifetime from active subs only |
| J6 | Promo / tracking links / referrals | PASS | Wave 11 2026-10-05: promo CRUD WAVE11OFF10; `/go/{id}` click+redirect; signup `?ref=` banner; commission UI honest (—). Fixes shortPath + duration control + referral demo rates. Residual: paid conversion attribution not browser-soaked |
| J7 | Identity (password, OAuth, roles, email request) | PASS | Wave 12 2026-10-05: password login; evil `returnTo` blocked → `/dashboard`; logout → `/` no select-role; email request open (email unchanged); roles unit + `switchRole` held-only. Residual: OAuth callback + multi-role switcher UI not browser-soaked |
| J8 | Migration ETL internal-only | PASS | Wave 13 2026-10-05: all migration exports `internalMutation`; client has zero import refs; `MIGRATION_SECRET` unset on combative-mongoose-559; `migrations.security.test.ts` 3/3. Residual: historical data parity not claimed |
| J9 | Public nav + chrome | PASS | Wave 2: public-nav + browser-matrix on chromium/webkit/firefox; platform-owner bootstrap visible in DEV |
| J-ADMIN | Admin lists, fees, reports, campaigns | NOT_RUN | |
| J-DISCORD | Bot install + grants + revoke | NOT_RUN | |
| J-FILES | Storage ownership `getUrl` | PASS | Wave 14 2026-10-05: unowned→FORBIDDEN; owner URL OK; foreign j4member→FORBIDDEN; `files.security.test.ts` 4/4 |
| J-DEMO | Demo writes zero money rows | PASS | Wave 15 2026-10-05: demo Withdraw toast-only; listMine unchanged (2); Demo.ts no money API imports; `demo.security.test.ts` 2/2 |

## H. Tooling gates

| Command | Result | Evidence |
|---------|--------|----------|
| `npm test` | PASS | Wave 8: contentAccess.test.ts 11 tests (access matrix + win rate + lock helpers); Wave 7 productProfileSlots |
| `npm run lint` | PASS | Wave 3: 0 errors, 28 warnings |
| `npm run build` | PASS | Wave 3: `vite build` succeeded |
| `npm run env:validate` | PASS | Wave 1: `env:validate PASS (local)`; sandbox false; devAdmin false |
| `npm run test:e2e` | PASS | Wave 2: 18 passed, 6 skipped (full surface spec chromium-only). Timeout 120s, 4 workers |
| `npx tsc -b` (F-015) | PASS | Wave 3: `npx tsc -b` exit 0 after payouts/products/settings/SEO/replaceAll fixes |

## I. Residual-risk retest

| ID | Result | Evidence |
|----|--------|----------|
| QA-W1-01 grantTestAdmin / ALLOW_DEV_ADMIN_GRANT | PASS | Wave 1 2026-10-04: env+allowlist+assertProductionSafeEnv; authMatrix.security.test.ts |
| QA-W1-02 ProtectedRoute DEV bypass | PASS | Wave 1: ProtectedRoute uses DB roles only. Residual: AuthContext hasRole DEV-only (prod build strips) |
| QA-W1-03 unowned file getUrl | PASS | Wave 1: getUrl FORBIDDEN if missing asset or non-owner. E2E J-FILES still NOT_RUN |
| F-001 sandbox client flag | PASS | Wave 1: server env only; envGuards + subscriptions.security tests |
| F-002 public createSubscriptionRecord | PASS | Wave 1: internalMutation only |
| F-003 owner setStatus active | PASS | Wave 1: public setStatus is admin-only; owner activate throws in unit tests |
| F-004 JWT subject as user id | PASS | Wave 1: listPreviewsByCreator uses getAuthUserId |
| F-005 public migration mutations | PASS | Wave 1: importBatch/load are internalMutation |
| F-009 / J5 payout reserved vs paid | PASS | Wave 1: payoutBalance.test.ts 5/5. Live UI Wave 2 |
| F-010 webhook soak / Connect | PARTIAL | Wave 6: endpoint live + secret verified via reject; `isDuplicateWebhookReceipt` unit tests. Signed soak + Connect still NOT_RUN |
| F-012 admin full-table scans | PASS | Wave 4: listUsersPage/listCreatorsPage indexed joins use `.take(ADMIN_JOIN_LIMIT=200)`. Customers still `adminScanAll` cap 5k |
| F-015 lint / tsc | PASS | Wave 3: `npx tsc -b` exit 0; lint still 0 errors / 28 warnings |

## J. Public Convex API coverage (Wave 0 freeze)

**162** app `query` / `mutation` / `action` exports in `convex/` (excluding `internal*`). **Missing `returns` validators: none.**

Convex Auth library public API (from `convex/auth.ts` `convexAuth()`; validators owned by `@convex-dev/auth`):

| API | Auth | returns validator | Result | Evidence |
|-----|------|-------------------|--------|----------|
| `auth.signIn` | auth | library | PASS | Wave 12: password sign-in `j4member+wave9` → `/dashboard` |
| `auth.signOut` | auth | library | PASS | Wave 12: logout → `/` without `/select-role` flash |
| `auth.store` | TBD | library | NOT_RUN | frozen vs convex/auth.ts @ bf85281 |
| `auth.isAuthenticated` | TBD | library | NOT_RUN | frozen vs convex/auth.ts @ bf85281 |

App public functions (`Auth` = TBD until Wave 1):

| API | Auth | returns validator | Result | Evidence |
|-----|------|-------------------|--------|----------|
| `accountRequests.listMine` | auth | yes | PASS | Wave 12: open email-change shown on settings |
| `accountRequests.listOpenAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `accountRequests.requestAccountDeletion` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `accountRequests.requestEmailChange` | auth | yes | PASS | Wave 12: request `j4member+wave12@example.com`; sign-in email unchanged |
| `admin.exportReports.exportReportBundle` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listCampaignsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listCasesPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listCreatorsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listCustomersPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listPayoutsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listSubscriptionsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listSupportMessagesPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listTransactionsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listUsersPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.createEmailCampaign` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.dashboardStats` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.listCampaigns` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.listUsers` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.previewAnnouncementAudience` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.sendAnnouncement` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.alertsOverview` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.customersOverview` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.feesOverview` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.financeOverview` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.payoutsOverview` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.reportSourceData` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `analytics.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `analytics.mutations.listForMyCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `analytics.mutations.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `analytics.mutations.track` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `authProviders.socialProviders` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `bookmarks.mutations.listCreatorBookmarks` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `bookmarks.mutations.listCreatorBookmarksDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `bookmarks.mutations.listSavedPosts` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `bookmarks.mutations.toggleCreatorBookmark` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `bookmarks.mutations.toggleSavedPost` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.earnings.myEarnings` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.getLinkPublic` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.listMyLinks` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.listMyPromos` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.listMyReferrals` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.recordLinkClick` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.recordReferral` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.recordReferralByCode` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.removeLink` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.removePromo` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.upsertLink` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.upsertPromo` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.getByUsername` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.listPublished` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.myCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.setPublished` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.setVerificationStatus` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.updateSettings` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.upsertOnboarding` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.disconnect` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.retryMyAccess` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.setProductRole` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.startBotInstall` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.queries.botStatus` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.queries.connection` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.queries.memberAccess` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.roles.createMemberInvite` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.roles.listAssignableRoles` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `events.queries.listPublishedToday` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `events.queries.removeAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `events.queries.seedTodayDev` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `events.queries.upsertAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `files.storage.generateUploadUrl` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `files.storage.getUrl` | requireAppUser + owner | yes | PASS | Wave 14 runtime: unowned/foreign FORBIDDEN; owner URL returned |
| `files.storage.registerOwnedFile` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.listThread` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.markReadCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.markReadSubscriber` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.myCreatorInbox` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.myCreatorInboxPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.mySubscriberInbox` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.mySubscriberInboxPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.overviewInboxThreads` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.send` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.setMessagingEnabled` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.unreadCountCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.unreadCountSubscriber` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `notifications.mutations.adminInsert` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `notifications.mutations.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `notifications.mutations.listMinePage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `notifications.mutations.markAllRead` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `notifications.mutations.markRead` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `notifications.mutations.unreadCount` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.sandbox.sandboxCancel` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.sandbox.sandboxSubscribe` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.cancelCreatorSubscription` | auth | yes | PASS | Wave 5: cancelled sub `mn7bg36…` / Stripe `sub_1UMxh9…`; billingStatus canceled |
| `payments.stripeNode.confirmCheckoutSession` | auth | yes | PASS | Wave 5: session `cs_test_a171…` → settled `paymentEvents` commercialRef |
| `payments.stripeNode.createBillingPortalSession` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.createCheckoutSession` | auth | yes | PASS | Wave 5: redirected to checkout.stripe.com Prizlett sandbox Monthly pro $100 |
| `payouts.mutations.availableBalance` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.createAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.getMySettings` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.requestPayout` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.setStatusAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payouts.mutations.upsertSettings` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `picks.mutations.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `picks.mutations.remove` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `picks.mutations.upsert` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `platform.mutations.get` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `platform.mutations.upsert` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.listMine` | creator | yes | PASS | Wave 8: owner `/creator/posts?demo=0` showed WAVE8_SECRET_BODY |
| `posts.queries.listMinePage` | creator | yes | PASS | Wave 8: paginated posts list 2 published premium posts |
| `posts.queries.listPreviewsByCreator` | public | yes | PASS | Wave 8: anonymous profile no secret body; win rate from results only |
| `posts.queries.listSavedDetailed` | subscriber | yes | PASS | Wave 8: redaction now `canViewPostContent` (product-aware); no saved-library soak |
| `posts.queries.listSavedDetailedPage` | subscriber | yes | PASS | Wave 8: same entitlement as listSavedDetailed |
| `posts.queries.memberFeed` | subscriber | yes | PASS | Wave 8: filters via `subscriptionGrantsContentAccess`; 0 active subs on j2creator so feed empty |
| `posts.queries.remove` | creator | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.setResult` | creator | yes | PASS | Wave 8: Mark as won / Mark as push then Result locked |
| `posts.queries.upsert` | creator | yes | PASS | Wave 8: publish J3 SECRET + J3 PUSH; settled result cannot be overwritten |
| `products.mutations.listByCreator` | owner | yes | PASS | Wave 7: creator products table listed live rows |
| `products.mutations.listPublicByCreator` | public | yes | PASS | Wave 7: `/j2creator?demo=0` showed J2 Monthly Alpha |
| `products.mutations.remove` | owner | yes | PASS | Wave 7: hard delete with no subscriptions → empty catalog |
| `products.mutations.setShowOnProfile` | owner | yes | PASS | Wave 7: pin + MAX_PROFILE_PRODUCTS=4 server guard |
| `products.mutations.upsert` | owner | yes | PASS | Wave 7: create $1999→edit $2499 monthly limited product |
| `resolution.mutations.addMessage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.create` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.listMessages` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.markReadAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.markReadCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.setStatus` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.unreadCountAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.unreadCountCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `roles.mutations.assignSelfRole` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `roles.mutations.grantRole` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `roles.mutations.grantTestAdmin` | requireAppUser + ALLOW_DEV_ADMIN_GRANT + allowlist | yes | NOT_RUN | Wave 1 static+unit PASS (QA-W1-01) |
| `roles.mutations.myRoles` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.countActiveByCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listForMyCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listSubscribersDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listSubscribersDetailedPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.myPaymentEvents` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.mySubscriptions` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.mySubscriptionsDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.setStatus` | requireAdmin | yes | NOT_RUN | Wave 1 static: owner cannot activate (F-003) |
| `support.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.listForMember` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.listForMyCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.markReadAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.markReadCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.markReadMember` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.send` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.sendMember` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.unreadCountAdminGrowth` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.unreadCountCreatorGrowth` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `users.queries.changePassword` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `users.queries.ensureUser` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `users.queries.getById` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `users.queries.hasPasswordAccount` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `users.queries.me` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `users.queries.updateProfile` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |

### J.missing-returns (Wave 0 required artifact)

None. All 162 app public functions had a `returns:` validator immediately before `handler`.

`migrations/*`, `payments/stripeDb`, `discord/grants`, and other `internal*` functions are **not** in this public list.

## K. Schema tables (Wave 0 tick)

Confirm each table still exists; note writers. Result `NOT_RUN` = existence freeze, not writer audit.

| Table | Primary writers | Result | Evidence |
|-------|-----------------|--------|----------|
| users (app overlay) | Convex Auth, users.queries | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| authSessions | Convex Auth (authTables) | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| authAccounts | Convex Auth (authTables) | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| authRefreshTokens | Convex Auth (authTables) | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| authVerificationCodes | Convex Auth (authTables) | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| authVerifiers | Convex Auth (authTables) | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| authRateLimits | Convex Auth (authTables) | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| userRoles | roles.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| creators | creators/* | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| products | products.mutations | PASS | Wave 7: create/edit/pin/delete soak on j2creator |
| posts | posts/* | PASS | Wave 8: upsert + setResult won/push; RESULT_LOCKED |
| subscriptions | payments/*, subscriptions.mutations | PASS | Wave 5: active→cancelled soak on prize2626 / j1member; Stripe sub_1UMxh9… |
| analyticsEvents | analytics.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| pickTracker | picks.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| paymentEvents | payments/* | PASS | Wave 5: subscription_charge $10000 test + subscription_cancel for cs_test_a171… |
| webhookReceipts | stripeNode.fulfillWebhook | PARTIAL | Wave 6: HTTP reject + helper tests. No new signed receipt this wave |
| sportEvents | events / platform | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| notifications | notifications / notify | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| savedPosts / creatorBookmarks | bookmarks.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| payouts / creatorPayoutSettings | payouts.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| creatorLinks / promoCodes / referrals | creators.growth | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| resolutionCases / resolutionCaseMessages | resolution.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| supportMessages / memberSupportMessages | support.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| platformSettings | platform.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| directMessages | messaging.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| emailCampaigns | admin | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| fileAssets | files/storage | PASS | Wave 14: registerOwnedFile + owner getUrl; foreign denied |
| migrationCheckpoints / mutationLog | migrations/* internal | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| accountRequests | accountRequests | PASS | Wave 12: email_change open for j4member; sign-in email not mutated in-app |
| discordBotInstalls / discordAccessGrants | discord/* | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |

Schema `appRole` also allows `moderator` and `user` (not product actors; no routes).

## L. Waivers

| ID | Owner | Reason | Date |
|----|-------|--------|------|
| | | | |

## M. Remaining risk (update every fix PR)

- P2: F-010 residual — signed Stripe → `webhookReceipts` insert + Connect payouts; Discord grant soak; J7 OAuth callback + multi-role switcher UI residual; historical migration data parity BLOCKED (greenfield); J2 soft-archive-with-sub not soaked; J3 paid unlock/cancel + pickTracker session not soaked on j2creator; admin payout Lifetime ignores cancelled-sub paymentEvents; referral commission cash TBD
- P3: admin user/creator spend metrics cap at 200 indexed rows; customer pages scan ≤5k subscriptions; eslint warnings; AuthContext DEV `hasRole` leftover
- Not in this PR: production deploy, live Stripe keys, MFA
- Waivers: see section L
