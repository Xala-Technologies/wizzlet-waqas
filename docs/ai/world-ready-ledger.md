# Prizelet world-ready ledger

**Authority:** [`docs/ai/prizelet-world-ready-master-prompt.md`](./prizelet-world-ready-master-prompt.md)

**Status:** Wave 0 inventory frozen against live `src/App.tsx`, `convex/schema.ts`, and `convex/_generated/api.d.ts` @ `bf85281`. Journey / tooling / residual-risk rows stay `NOT_RUN` until Wave 1+. Audit not started.

Do not claim world-ready until Section 8 gates in the master prompt pass.

## How to fill a row

| Field | Values |
|-------|--------|
| Result | `NOT_RUN` \| `PASS` \| `FAIL` \| `WAIVED` \| `BLOCKED` |
| Persistence | `public` \| `convex` \| `demo` \| `mixed` |
| Roles | anonymous / subscriber / creator / admin / demo |
| Evidence | branch, date, one-line actual vs expected |
| Waiver | owner + reason (required if WAIVED) |

Last updated: 2026-10-04. Last wave: **0** (`chore/world-ready-wave-0-inventory`). Source pin: `bf85281`.

Wave 0 does **not** exercise wrong-role redirects (Wave 2). Each route has one intended-role row.

---

## A. Public / marketing / auth routes

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/` | Index | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/network` | Network | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creators` | Creators | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/todays-events` | TodaysEvents | anonymous | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/discover` | Discover | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/top-creators` | TopCreators | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/pricing` | Pricing | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/support` | Support | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/community` | Community | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/login` | Login | anonymous | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/signup` | Signup | anonymous | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/auth/callback` | AuthCallback | anonymous | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/select-role` | SelectRole | authenticated no role | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/subscription/success` | SubscriptionSuccess | subscriber+ | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/subscription/cancel` | SubscriptionCancel | subscriber+ | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/go/:linkId` | CreatorLinkRedirect | anonymous | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/c/:username` | CreatorProfileRedirect | anonymous | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/:username` | CreatorProfile | anonymous+ | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `*` | NotFound | all | public | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

## B. Member routes

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/dashboard` | Dashboard | subscriber | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/results` | CustomerResults | subscriber | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/subscriptions-billing` | CustomerSubscriptionsBilling | subscriber | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/subscriptions-billing/manage/:username` | CustomerManageSubscription | subscriber | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/saved` | CustomerSaved | subscriber | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/notifications` | CustomerNotifications | subscriber | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/discover` | CustomerDiscover | subscriber | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/activity` | CustomerActivity | subscriber | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/settings` | CustomerSettings | subscriber | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/dashboard/messages` | CustomerMessages | subscriber | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

## C. Creator routes

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/creator` | CreatorDashboard | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/posts` | CreatorPosts | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/products` | CreatorProducts | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/subscribers` | CreatorSubscribers | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/promo` | CreatorPromo | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/promo/codes` | CreatorPromoCodes | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/personal-growth-manager` | CreatorPersonalGrowth | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/resolution-case` | CreatorResolutionCase | creator | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/smart-pricing` | CreatorSmartPricing | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/access-control` | CreatorAccessControl | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/performance-tracker` | CreatorPerformanceTracker | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/messages` | CreatorMessages | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/notifications` | CustomerNotifications | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/links` | CreatorLinks | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/referrals` | CreatorReferrals | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/earnings` | CreatorEarnings | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/payouts` | CreatorPayouts | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/transactions` | CreatorTransactions | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/settings` | CreatorSettings | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/integrations` | CreatorIntegrations | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/support` | CreatorSupport | creator | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/creator/onboarding` | CreatorOnboarding | creator | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

## D. Admin routes

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/admin` | AdminDashboard | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/creators` | AdminCreators | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/users` | AdminUsers | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/customers` | AdminCustomers | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/finance` | AdminFinance | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/transactions` | AdminTransactions | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/fees` | AdminFees | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/creator-messaging` | AdminCreatorMessaging | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/customer-email` | AdminCustomerEmail | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/growth-manager-inbox` | AdminGrowthManagerInbox | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/resolution-cases` | AdminResolutionCases | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/payouts` | AdminPayouts | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/alerts` | AdminAlerts | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/notifications` | CustomerNotifications | admin | mixed | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/reports` | AdminReports | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/admin/settings` | AdminSettings | admin | convex | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

## E. Demo routes (must not write Convex money tables)

Nested layouts in `App.tsx`: `/demo/admin` → `DemoAdminLayout`; `/demo/member` → `DemoMemberLayout`.

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/demo/creator` | DemoCreatorDashboard | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/admin` | DemoAdminDashboard (nested DemoAdminLayout) | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/admin/creators` | DemoAdminCreators | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/admin/users` | DemoAdminUsers | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/admin/transactions` | DemoAdminTransactions | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/admin/fees` | DemoAdminFees | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/admin/settings` | DemoAdminSettings | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member` | DemoMemberDashboard (nested DemoMemberLayout) | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/results` | DemoMemberResults | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/subscriptions-billing` | DemoMemberSubscriptions (imported as DemoMemberSubscriptionsBilling) | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/saved` | DemoMemberSaved | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/notifications` | DemoMemberNotifications | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/discover` | DemoMemberDiscover | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/activity` | DemoMemberActivity | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |
| `/demo/member/settings` | DemoMemberSettings | demo | demo | NOT_RUN | frozen vs App.tsx @ bf85281; chore/world-ready-wave-0-inventory; 2026-10-04 |

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
| J9 | Public nav + chrome | NOT_RUN | |
| J-ADMIN | Admin lists, fees, reports, campaigns | NOT_RUN | |
| J-DISCORD | Bot install + grants + revoke | NOT_RUN | |
| J-FILES | Storage ownership `getUrl` | NOT_RUN | |
| J-DEMO | Demo writes zero money rows | NOT_RUN | |

## H. Tooling gates

| Command | Result | Evidence |
|---------|--------|----------|
| `npm test` | NOT_RUN | Wave 0 did not run gates |
| `npm run lint` | NOT_RUN | Wave 0 did not run gates |
| `npm run build` | NOT_RUN | Wave 0 did not run gates |
| `npm run env:validate` | NOT_RUN | Wave 0 did not run gates |
| `npm run test:e2e` | NOT_RUN | Wave 0 did not run gates |

## I. Residual-risk retest

| ID | Result | Evidence |
|----|--------|----------|
| QA-W1-01 grantTestAdmin / ALLOW_DEV_ADMIN_GRANT | NOT_RUN | |
| QA-W1-02 ProtectedRoute DEV bypass | NOT_RUN | |
| QA-W1-03 unowned file getUrl | NOT_RUN | |
| F-001 sandbox client flag | NOT_RUN | |
| F-002 public createSubscriptionRecord | NOT_RUN | |
| F-003 owner setStatus active | NOT_RUN | |
| F-004 JWT subject as user id | NOT_RUN | |
| F-005 public migration mutations | NOT_RUN | |
| F-009 / J5 payout reserved vs paid | NOT_RUN | |
| F-010 webhook soak / Connect | NOT_RUN | |
| F-012 admin full-table scans | NOT_RUN | |
| F-015 lint / tsc | NOT_RUN | |

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
| `files.storage.getUrl` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
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
| `roles.mutations.grantTestAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `roles.mutations.myRoles` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.countActiveByCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listForMyCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listSubscribersDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listSubscribersDetailedPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.myPaymentEvents` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.mySubscriptions` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.mySubscriptionsDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.setStatus` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
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

- P2: Wave 1+ not started (auth audit, entitlement matrix, payout math, pagination, Discord soak)
- Not in this PR: production deploy, live Stripe keys, MFA, journey execution, tooling gates
- Waivers: see section L
