# Prizelet world-ready ledger

**Authority:** [`docs/ai/prizelet-world-ready-master-prompt.md`](./prizelet-world-ready-master-prompt.md)

**Status:** Wave 3 F-015 `tsc` cluster fixed 2026-10-05. J1–J8 still `NOT_RUN`. Product is **not** world-ready.

Do not claim world-ready until Section 8 gates in the master prompt pass.

## How to fill a row

| Field | Values |
|-------|--------|
| Result | `NOT_RUN` \| `PASS` \| `FAIL` \| `WAIVED` \| `BLOCKED` |
| Persistence | `public` \| `convex` \| `demo` \| `mixed` |
| Roles | anonymous / subscriber / creator / admin / demo |
| Evidence | branch, date, one-line actual vs expected |
| Waiver | owner + reason (required if WAIVED) |

Last updated: 2026-10-05. Last wave: **3** (`fix/world-ready-wave-3-tsc`). Source pin: `bf85281` (inventory).

Wave 2 smoke: Chromium walked every `App.tsx` public/demo path (no ErrorBoundary) and every protected path (anonymous → `/login`). WebKit/Firefox still run J9 public-nav + browser-matrix. Authenticated happy paths (J1–J8) are **not** claimed PASS.

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
| `POST /stripe/webhook` | `payments.stripeNode.fulfillWebhook` | NOT_RUN | frozen vs convex/http.ts + crons.ts @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `GET /discord/bot-install/callback` | `discord.roles.completeBotInstall` | NOT_RUN | frozen vs convex/http.ts + crons.ts @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| Cron 5m pending Discord grants | `discord.roles.retryPendingGrants` | NOT_RUN | frozen vs convex/http.ts + crons.ts @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

## G. Journeys

| ID | Name | Result | Evidence |
|----|------|--------|----------|
| J1 | Commercial lifecycle (publish → Stripe → webhook → cancel → access) | NOT_RUN | |
| J2 | Product CRUD + profile slots | NOT_RUN | |
| J3 | Content access / pick lock / win rate | NOT_RUN | |
| J4 | Messages / support / resolution | NOT_RUN | |
| J5 | Payout request / approve / balance | NOT_RUN | |
| J6 | Promo / tracking links / referrals | NOT_RUN | |
| J7 | Identity (password, OAuth, roles, email request) | NOT_RUN | |
| J8 | Migration ETL internal-only | NOT_RUN | |
| J9 | Public nav + chrome | PASS | Wave 2: public-nav + browser-matrix on chromium/webkit/firefox; platform-owner bootstrap visible in DEV |
| J-ADMIN | Admin lists, fees, reports, campaigns | NOT_RUN | |
| J-DISCORD | Bot install + grants + revoke | NOT_RUN | |
| J-FILES | Storage ownership `getUrl` | NOT_RUN | |
| J-DEMO | Demo writes zero money rows | NOT_RUN | |

## H. Tooling gates

| Command | Result | Evidence |
|---------|--------|----------|
| `npm test` | PASS | Wave 3 2026-10-05: 24 files / 136 tests after paymentFeeDetail.test.ts |
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
| F-010 webhook soak / Connect | NOT_RUN | Wave 1: handler present; soak/Connect not executed |
| F-012 admin full-table scans | FAIL | Wave 1: pagination exists; residual unbounded `.collect()` joins on listUsersPage |
| F-015 lint / tsc | PASS | Wave 3: `npx tsc -b` exit 0; lint still 0 errors / 28 warnings |

## J. Public Convex API coverage (Wave 0 freeze)

**162** app `query` / `mutation` / `action` exports in `convex/` (excluding `internal*`). **Missing `returns` validators: none.**

Convex Auth library public API (from `convex/auth.ts` `convexAuth()`; validators owned by `@convex-dev/auth`):

| API | Auth | returns validator | Result | Evidence |
|-----|------|-------------------|--------|----------|
| `auth.signIn` | TBD | library | NOT_RUN | frozen vs convex/auth.ts @ bf85281 |
| `auth.signOut` | TBD | library | NOT_RUN | frozen vs convex/auth.ts @ bf85281 |
| `auth.store` | TBD | library | NOT_RUN | frozen vs convex/auth.ts @ bf85281 |
| `auth.isAuthenticated` | TBD | library | NOT_RUN | frozen vs convex/auth.ts @ bf85281 |

App public functions (`Auth` = TBD until Wave 1):

| API | Auth | returns validator | Result | Evidence |
|-----|------|-------------------|--------|----------|
| `accountRequests.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `accountRequests.listOpenAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `accountRequests.requestAccountDeletion` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `accountRequests.requestEmailChange` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
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
| `files.storage.getUrl` | requireAppUser + owner | yes | NOT_RUN | Wave 1 static: FORBIDDEN if no fileAssets / wrong owner @ files/storage.ts |
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
| `payments.stripeNode.cancelCreatorSubscription` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.confirmCheckoutSession` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.createBillingPortalSession` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.createCheckoutSession` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
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
| `posts.queries.listMine` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.listMinePage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.listPreviewsByCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.listSavedDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.listSavedDetailedPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.memberFeed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.remove` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.setResult` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `posts.queries.upsert` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `products.mutations.listByCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `products.mutations.listPublicByCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `products.mutations.remove` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `products.mutations.setShowOnProfile` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `products.mutations.upsert` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
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
| products | products.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| posts | posts/* | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| subscriptions | payments/*, subscriptions.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| analyticsEvents | analytics.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| pickTracker | picks.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| paymentEvents | payments/* | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| webhookReceipts | stripeNode.fulfillWebhook | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
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
| fileAssets | files/storage | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| migrationCheckpoints / mutationLog | migrations/* internal | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| accountRequests | accountRequests | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| discordBotInstalls / discordAccessGrants | discord/* | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |

Schema `appRole` also allows `moderator` and `user` (not product actors; no routes).

## L. Waivers

| ID | Owner | Reason | Date |
|----|-------|--------|------|
| | | | |

## M. Remaining risk (update every fix PR)

- P2: F-012 residual `.collect()` joins; F-010 Stripe soak / Connect; Discord grant soak; J1–J8 authenticated journeys not run
- P3: eslint warnings; AuthContext DEV `hasRole` leftover
- Not in this PR: production deploy, live Stripe keys, MFA, F-012 pagination cluster
- Waivers: see section L
