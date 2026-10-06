# Prizelet world-ready ledger

**Authority:** [`docs/ai/prizelet-world-ready-master-prompt.md`](./prizelet-world-ready-master-prompt.md)

**Status:** Wave 70 member/creator self-serve email OTP 2026-10-06. Product is **not** world-ready.

Do not claim world-ready until Section 8 gates in the master prompt pass.

## How to fill a row

| Field | Values |
|-------|--------|
| Result | `NOT_RUN` \| `PASS` \| `FAIL` \| `WAIVED` \| `BLOCKED` |
| Persistence | `public` \| `convex` \| `demo` \| `mixed` |
| Roles | anonymous / subscriber / creator / admin / demo |
| Evidence | branch, date, one-line actual vs expected |
| Waiver | owner + reason (required if WAIVED) |

Last updated: 2026-10-06. Last wave: **70** (`feat/world-ready-wave-70-email-otp`). Source pin: `bf85281` (inventory).

Wave 70: Member/creator self-serve email OTP — hashed 6-digit code, Resend when configured, dev echo only with `ALLOW_DEV_ADMIN_GRANT` on non-production SITE_URL. Soak `@prize2626` Settings → Change email → `prize2626+wave70otp@example.com` → `delivery=dev` code **266295**; wrong code `000000` stayed signed in (email unchanged). Admin fulfill remains backup. Units `emailOtp.security.test.ts` + `accountRequests.security.test.ts`.

Wave 69: Live Connect Transfer soak on combative-mongoose-559 — admin created pending **$50** for `@prize2626` Express `acct_1UNI6YRzsXVyRAzD` (`payouts_enabled`); `sendConnectPayout` → `funding=stripe_fx`, `tr_1UNKR8RpY5TupxHCGqx0oHZc`, transfer **479.68 NOK** for **$50** USD ledger; payout `completed` / `stripe_connect`. Platform available was NOK-only. Units unchanged (`stripeConnect.security.test.ts`).

Wave 68: Connect Transfer funding — matched USD available, else **Stripe-native FX** from NO settlement (NOK) using Stripe `exchange_rate` (never 1 øre = 1 cent). Express `acct_1UNI6YRzsXVyRAzD` KYC `payouts_enabled`. Decision log updated. Units `stripeConnect.security.test.ts`.

Wave 67: Product decision — commercial currency **USD**. Checkout/stripeDb/sandbox use `PRIZELET_LEDGER_CURRENCY`; Connect country **US**. Stripe entity still **NO**/settles **nok** with NOK-only available — admin note tells ops to fund USD. Decision log updated. Units `stripeConnect.security.test.ts`.

Wave 66: real Stripe soak — platform **NO**/available **NOK 255.32**, charges/ledger **USD**, Express `acct_1UN8ktRyfauxBCWX` US/USD `payouts_enabled=false`. Transfers refuse ledger≠destination or missing USD available (no NOK-as-USD-cents). Admin live balance action; UI no longer claims transfers “not built”. `STRIPE_CONNECT_COUNTRY=US` on combative-mongoose-559. Units `stripeConnect.security.test.ts`.

Wave 65: `payments/stripeDb`, `payments/sandbox`, `migrations/load` countTable — no `.collect` left in app Convex TS (comments excluded). Units `stripeDbSandboxMigrationCap.security.test.ts` 2/2.

Wave 64: notify role fanout + unread-by-link, entitlements, growthAttribution, auth role/content access, discord queries/mutations/grants, accountRequests — no `.collect`. Residual collects: `stripeDb` / sandbox / migrations counts only. Units `notifyDiscordAuthCap.security.test.ts` 2/2.

Wave 63: products list/sibling, growth links/promos/referrals, `listPublishedToday` indexed range take, bookmarks lists — no `.collect`. Soak products **7**, links **2**, promos **3**, referrals **3**, events **6**, savedPosts **1**, bookmarks **1**. Units `productsGrowthEventsCap.security.test.ts` 2/2.

Wave 62: support/resolution list+unread, notifications unread/markAllRead, messaging `listThread`, `mySubscriptions*` use capped takes (no `.collect`). Soak support **24**, memberSupport **1**, cases **1**/msgs **1**, notifications **66**, DMs **2**, subs **14**. Units `supportResolutionCap.security.test.ts` 2/2.

Wave 61: `listPublished` takes published creators + per-page post/product joins (no `.collect`); also caps payouts/picks/analytics/post preview/memberFeed. Soak published creators **9**. Units `listPublishedCap.security.test.ts` 2/2.

Wave 60: `myEarnings` / `countActiveByCreator` / `listForMyCreator` use capped indexed takes (no `.collect`). Earnings returns `truncated`. Soak max subs/creator **10**, events/creator **12**. Units `creatorEarningsCap.security.test.ts` 2/2.

Wave 59: `getCreatorAvailableBalanceCents` takes events/payouts (no `.collect`); returns `truncated`; requestPayout refuses `BALANCE_TRUNCATED`. Soak max events/creator **12**, payouts/creator **2**. Units `creatorBalanceCap.security.test.ts` 2/2 + `payoutBalance.test.ts` 6/6.

Wave 58: `ADMIN_JOIN_LIMIT` raised **200 → 500** (list ceiling). Users/customers/creators pages return `metricsTruncated` + amber join note. Soak max subs/user **2**, /creator **10**, join cap not hit. Units `adminJoinMetrics.security.test.ts` 3/3.

Wave 57: `npm run lint` **0** problems. Fixed hooks deps on CreatorLinks/CreatorProducts/DemoAdminUsers; ignore `_generated` + intentional co-export surfaces. Units `eslintConfig.security.test.ts` 1/1.

Wave 56: `hasRole` / `switchRole` use held roles only. Vite DEV no longer pretends the session holds every role. DevModeBanner unmounted. Units `authContextDevBypass.security.test.ts` 2/2.

Wave 55: `dashboardStats` account count from `userRoles.by_role` unique userIds (not a users table scan). Soak unique role accounts **26** (33 role rows; 8 users have no role, mostly deleted). Other KPIs unchanged. Units `dashboardStats.security.test.ts` 1/1.

Wave 54: `dashboardStats` creators via published index; paymentEvents via settled/paid status takes; users newest-first cap (no status index). Convex soak: Accounts **34**, Creators **9**, Active **5**, MRR **$70**, Fees **$3.50**, Paid out **$47.47**, Open cases **1**. Units `dashboardStats.security.test.ts` 1/1.

Wave 53: `reportSourceData` uses published creators + sub/payout status takes (users newest-first cap). Soak `/admin/reports` CSVs; Convex users **34**, creators **9**, subs **14**, payouts **4**. Units `reportSourceData.security.test.ts` 2/2.

Wave 52: `resolveAnnouncementRecipients` uses sub status indexes (active/canceled/cancelled/…) and creator `by_creatorId` take; All Customers is a capped users read. Soak All **34** / Active **5** / Canceled **8**. Units `announcementAudience.security.test.ts` 1/1.

Wave 51: `payoutsOverview` status-indexed paymentEvents (settled/paid) + payouts; names via `db.get`. Soak `/admin/payouts` Owed **$104.49**, queued **$142.40**, paid **$47.47**. Units `payoutsOverview.security.test.ts` 3/3.

Wave 50: `feesOverview` `takeSubsByStatus(active)` + `db.get` names; no `adminScanAll`. Soak `/admin/fees` Volume **$69.95**, Fees **$3.50**, 5 intro / 0 standard; j2creator 4 subs **$3.00**. Units `feesOverview.security.test.ts` 1/1.

Wave 49: Admin `Send via Stripe` → `sendConnectPayout` (admin-only). Ledger stays unpaid unless Stripe accepts a Transfer. Soak `j2creator` pending **$142.40** still pending (`CONNECT_PAYOUTS_NOT_ENABLED`; Express KYC unfinished). Platform balance is NOK vs USD destination (would `STRIPE_CURRENCY_MISMATCH` next). Units `stripeConnect.security.test.ts` 12/12.

Wave 48: Prizlett sandbox Connect = marketplace; Accounts v1 policy enabled. Express create requests `card_payments`+`transfers`. Soak `j2creator` → Account Link `acct_1UN8ktRyfauxBCWX`; return shows Continue onboarding. Transfers still unimplemented. Units `stripeConnect.security.test.ts` 8/8.

Wave 47: `dashboardStats` uses status indexes for active subs, paid/completed payouts, open cases; users/creators/events still capped scans for counts. Units `dashboardStats.security.test.ts` 1/1.

Wave 46: `financeOverview` status-indexed subs/payouts; creator names via `db.get`; recent 8 newest. Units `financeOverview.security.test.ts` 1/1.

Wave 45: `alertsOverview` uses status/published indexes (failed/open/pending/unpublished) instead of five `adminScanAll`s. Inactive = published >30d with no active-status sub in the capped bucket.

Wave 44: `customersOverview` uses `by_status` takes (active/canceled/cancelled/past_due/failed) so Churned matches list `cancelled`. Units `customersOverview.security.test.ts` 1/1.

Wave 43: `listCustomersPage` cursor-paginates subscriptions (no `adminScanAll` / integer cursor). Soak `/admin/customers` as platform owner. Units `adminCustomersPage.security.test.ts` 2/2.

Wave 42: Creator Payouts `Connect Stripe` → `createConnectOnboardingSession` (Express + Account Link). Soak `j2creator`: action ran; Stripe returned Connect-not-enabled → `STRIPE_CONNECT_NOT_ENABLED` (no fake account, no transfers). Units `stripeConnect.security.test.ts` 6/6.

Wave 41: Admin deletion fulfill returns `sub_*` ids; `cancelStripeSubscriptionsAdmin` cancels Stripe (proven `canceled:1`); scheduler backup + soft-delete soaks on j41c/d/e. Units `accountRequests.security.test.ts` 4/4.

Wave 40: CRM cancelled label. Wave 39: gated composer. Wave 38: X OAuth.

---

## A. Public / marketing / auth routes

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/` | Index | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/network` | Network | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creators` | Creators | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/todays-events` | TodaysEvents | anonymous | convex | PASS | Wave 19: empty + seeded slate from `listPublishedToday`; Wave 2 smoke |
| `/discover` | Discover | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/top-creators` | TopCreators | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/pricing` | Pricing | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/support` | Support | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/community` | Community | anonymous | public | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/login` | Login | anonymous | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/signup` | Signup | anonymous | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/auth/callback` | AuthCallback | anonymous | convex | PASS | Wave 30: applies stashed `prizelet.referralCode` → referral row; Wave 27 Discord OAuth finish |
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
| `/creator/smart-pricing` | CreatorSmartPricing | creator | mixed | PASS | Wave 21: heuristic directional-only + Apply list price → updateSettings $11.99; sellable prices deferred to Products |
| `/creator/access-control` | CreatorAccessControl | creator | mixed | PASS | Wave 21: Limit subscriber count → max spots 100 via products.upsert; Wave 2 smoke |
| `/creator/performance-tracker` | CreatorPerformanceTracker | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/messages` | CreatorMessages | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/notifications` | CustomerNotifications | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/links` | CreatorLinks | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/referrals` | CreatorReferrals | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/earnings` | CreatorEarnings | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/payouts` | CreatorPayouts | creator | mixed | PASS | Wave 48: Express Account Link `acct_1UN8ktRyfauxBCWX` (j2creator); Continue onboarding after return; transfers not live. Wave 42 action; Wave 22 banner |
| `/creator/transactions` | CreatorTransactions | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/settings` | CreatorSettings | creator | mixed | PASS | Wave 42: billing bullet Connect-on-Payouts / transfers not live; Wave 21: 2FA/team stubs |
| `/creator/integrations` | CreatorIntegrations | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/support` | CreatorSupport | creator | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/creator/onboarding` | CreatorOnboarding | creator | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |

## D. Admin routes

PASS below is **anonymous → `/login`**, not an authenticated admin session.

| Route | Page | Roles | Persistence | Result | Evidence |
|-------|------|-------|-------------|--------|----------|
| `/admin` | AdminDashboard | admin | convex | PASS | Wave 55: Accounts **26** role-backed; Creators **9** / Active **5** / Fees **$3.50** / Paid **$47.47** |
| `/admin/creators` | AdminCreators | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/users` | AdminUsers | admin | convex | PASS | Wave 37: multi-role pills — `j2creator+wave7` **CREATOR**+**SUBSCRIBER**; Wave 16 load; Wave 2 smoke |
| `/admin/customers` | AdminCustomers | admin | convex | PASS | Wave 43: `listCustomersPage` native paginate + indexed `by_userId` joins; Wave 2 smoke |
| `/admin/finance` | AdminFinance | admin | convex | PASS | Wave 46: indexed financeOverview; Wave 2 smoke |
| `/admin/transactions` | AdminTransactions | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/fees` | AdminFees | admin | convex | PASS | Wave 50: indexed active-sub fees; Volume **$69.95** / Fees **$3.50** / 5 intro; Wave 2 smoke |
| `/admin/creator-messaging` | AdminCreatorMessaging | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/customer-email` | AdminCustomerEmail | admin | convex | PASS | Wave 52: audience preview All **34** / Active **5** / Canceled **8**; Wave 16 in-app only |
| `/admin/growth-manager-inbox` | AdminGrowthManagerInbox | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/resolution-cases` | AdminResolutionCases | admin | convex | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/payouts` | AdminPayouts | admin | convex | PASS | Wave 51: indexed lifetime/in-flight KPIs (Owed **$104.49** / queued **$142.40** / paid **$47.47**); Wave 49 Send via Stripe honesty; Wave 25 Lifetime |
| `/admin/alerts` | AdminAlerts | admin | convex | PASS | Wave 45: indexed alertsOverview; Wave 2 smoke |
| `/admin/notifications` | CustomerNotifications | admin | mixed | PASS | Wave 2 chromium surface smoke 2026-10-04; inventory pin bf85281 |
| `/admin/reports` | AdminReports | admin | convex | PASS | Wave 53: CSV exports from indexed takes; Creators/Customers/Transactions/Payouts/Fees files written |
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
| `POST /stripe/webhook` | `payments.stripeNode.fulfillWebhook` | PASS | Wave 18: signed `evt_wave18_292f5ef…` ping → 200 + receipt; replay deduped. Wave 6: missing/forged sig → 400 |
| `GET /discord/bot-install/callback` | `discord.roles.completeBotInstall` | PASS | Wave 27: live OAuth code → `?discord=connected` + guild **Prizelet VIP**; Wave 17 missing-code error path |
| Cron 5m pending Discord grants | `discord.roles.retryPendingGrants` | PASS | Wave 17: registered in `crons.ts` (5m); `discord.security.test.ts` |

## G. Journeys

| ID | Name | Result | Evidence |
|----|------|--------|----------|
| J1 | Commercial lifecycle (publish → Stripe → webhook → cancel → access) | PASS | Wave 5 2026-10-05: publish `@prize2626` + product Monthly pro $100; member signup `j1member`; Checkout `cs_test_a171BP4bJzrvM8pRX5c7xvgaScFUnfjkraXVlSBBbIFzb8Zxz6spGJWgXJ`; sub `mn7bg36b7xe76gkxyaeq0caaph8fnhyh` ACTIVE then cancelled; `paymentEvents` `checkout:cs_test_…` + `cancel_local:…`; My Creators `?demo=0` empty after cancel. Residual: no new `webhookReceipts` for this session (confirmCheckoutSession fulfilled); Connect not in scope |
| J2 | Product CRUD + profile slots | PASS | Wave 7 CRUD + slots; Wave 23 soft-archive; Wave 26 2026-10-05: Featured list-price switch; upsert exclusivity clears siblings; soak j2creator WAVE26 featured then WAVE24 featured → only WAVE24 badge; `/j2creator` Subscribe **$14.99**. `productFeatured.test.ts` 3/3 |
| J3 | Content access / pick lock / win rate | PASS | Wave 8 owner lock/win-rate; Wave 24 2026-10-05: `j3member` Checkout `cs_test_a13a8w…` ACTIVE → dashboard shows WAVE8_SECRET_BODY; cancel `sub_1UMytH…` → status cancelled, feed empty (no secret); pickTracker settled Win → Result combobox **disabled**. Residual: cancel UI previously lied about period-end (fixed this wave) |
| J4 | Messages / support / resolution | PASS | Wave 9/39/40: composer gated; CRM **Canceled · was Premium** for cancelled j4member. Units messaging 7/7 + creatorMessageSubscriber 4/4 |
| J5 | Payout request / approve / balance | PASS | Wave 10 request/approve; Wave 25 Lifetime math; Wave 69 live Connect FX transfer `tr_1UNKR8…` for `@prize2626` **$50**. `payoutBalance.test.ts` 6/6 |
| J6 | Promo / tracking links / referrals | PASS | Wave 11/29/30/33/34; Wave 36 2026-10-05: admin Mark paid ledger for accrued commission (**$1.49** → Paid). Residual: Stripe Connect cash movement still out of scope |
| J7 | Identity (password, OAuth, roles, email request) | PASS | Wave 70: self-serve OTP (`startEmailChange` / `verifyEmailChangeOtp` / `resendEmailChangeOtp`); admin fulfill still backup. Wave 12/27/28/30/38; Wave 35 admin email fulfill + soft-delete; Wave 38 X OAuth; Wave 41 deletion fulfill → Stripe `cancelStripeSubscriptionsAdmin` cancels remote `sub_*`. |
| J8 | Migration ETL internal-only | PASS | Wave 13 2026-10-05: all migration exports `internalMutation`; client has zero import refs; `MIGRATION_SECRET` unset on combative-mongoose-559; `migrations.security.test.ts` 3/3. Residual: historical data parity not claimed |
| J9 | Public nav + chrome | PASS | Wave 2: public-nav + browser-matrix on chromium/webkit/firefox; platform-owner bootstrap visible in DEV |
| J-ADMIN | Admin lists, fees, reports, campaigns | PASS | Wave 16 2026-10-05: users/creators paginated; fees analytics; CSV export; campaigns in-app-only honesty; alerts strip |
| J-DISCORD | Bot install + grants + revoke | PASS | Wave 27 2026-10-05: portal redirects include bot-install callback; `j2creator` Add to Discord → Prizelet VIP connected; WAVE24 mapped Monthly Pro; Discord login `prize262626` Checkout `cs_test_a1at5i…` → grant **granted**; cancel → **revoked**. `discord.security.test.ts` 3/3 |
| J-FILES | Storage ownership `getUrl` | PASS | Wave 14 2026-10-05: unowned→FORBIDDEN; owner URL OK; foreign j4member→FORBIDDEN; `files.security.test.ts` 4/4 |
| J-DEMO | Demo writes zero money rows | PASS | Wave 15 2026-10-05: demo Withdraw toast-only; listMine unchanged (2); Demo.ts no money API imports; `demo.security.test.ts` 2/2 |
| J-EVENTS | Today’s sportEvents slate | PASS | Wave 19 2026-10-05: restored page; empty “No events published for today yet”; seed → 3 cards (NFL/NBA/MLB); bounds unit 2/2 |
| J-NOTIFICATIONS | Inbox create + mark read | PASS | Wave 20 2026-10-05: adminInsert + member markRead/markAllRead; pay/message rows; admin shared page |
| J-SETTINGS | Settings live vs toast-stub honesty | PASS | Wave 21 2026-10-05: 2FA “coming soon”; team invite preview “not wired to the backend yet”; account profile editable |
| J-SMART-PRICING | Smart pricing + access control honesty | PASS | Wave 21 2026-10-05: heuristic “directional only”; list price via updateSettings (not fake Stripe product prices); access-control limit spots persists |
| J-CONNECT | Stripe Connect residual honesty | PASS | Wave 69: live `tr_1UNKR8…` stripe_fx (**479.68 NOK** for **$50** USD) to `@prize2626` `acct_1UNI6YRzsXVyRAzD` payouts_enabled. Wave 68 FX plan; Wave 66 matched-USD refuse when NOK-only; Wave 49 Transfer action. Residual: optional USD available funding; j2 Express still KYC-incomplete. |

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
| QA-W1-02 ProtectedRoute DEV bypass | PASS | Wave 56: AuthContext `hasRole`/`switchRole` held-roles only; banner unmounted. Wave 1 ProtectedRoute DB roles |
| QA-W1-03 unowned file getUrl | PASS | Wave 1: getUrl FORBIDDEN if missing asset or non-owner. E2E J-FILES still NOT_RUN |
| F-001 sandbox client flag | PASS | Wave 1: server env only; envGuards + subscriptions.security tests |
| F-002 public createSubscriptionRecord | PASS | Wave 1: internalMutation only |
| F-003 owner setStatus active | PASS | Wave 1: public setStatus is admin-only; owner activate throws in unit tests |
| F-004 JWT subject as user id | PASS | Wave 1: listPreviewsByCreator uses getAuthUserId |
| F-005 public migration mutations | PASS | Wave 1: importBatch/load are internalMutation |
| F-009 / J5 payout reserved vs paid | PASS | Wave 1: payoutBalance.test.ts 5/5. Live UI Wave 2 |
| F-010 webhook soak / Connect | PASS | Wave 18 webhook soak. Wave 69: live `tr_1UNKR8…` stripe_fx. Wave 49 refuse without payouts_enabled; Wave 48 Express Account Link. |
| F-012 admin full-table scans | PASS | Waves 43–65: admin KPIs + creator/public/discord/payment/migration collects → indexed takes; no remaining app `.collect()` |
| F-015 lint / tsc | PASS | Wave 3: `npx tsc -b` exit 0; lint still 0 errors / 28 warnings |

## J. Public Convex API coverage (Wave 0 freeze)

**165** app `query` / `mutation` / `action` exports in `convex/` (excluding `internal*`). **Missing `returns` validators: none.**

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
| `accountRequests.listOpenAdmin` | admin | yes | PASS | Wave 32: `/admin/users` Open account requests — 2 open (j4member email-change + j6oauth deletion) |
| `accountRequests.requestAccountDeletion` | subscriber | yes | PASS | Wave 31: Settings → Request deletion → status **open** |
| `accountRequests.requestEmailChange` | auth | yes | PASS | Wave 70: mints hashed OTP (no plaintext); Wave 12: request created, sign-in email unchanged until verify |
| `accountRequests.startEmailChange` | auth | yes | PASS | Wave 70: action mints + Resend/dev delivery; never echoes code on production SITE_URL |
| `accountRequests.resendEmailChangeOtp` | auth | yes | PASS | Wave 70: cooldown 60s; remints hashed OTP |
| `accountRequests.verifyEmailChangeOtp` | auth | yes | PASS | Wave 70: 5 attempts / 10m TTL; fulfill + clear sessions |
| `accountRequests.resolveAdmin` | admin | yes | PASS | Wave 35: fulfill email + fulfill deletion + reject; cannot resolve own |
| `admin.exportReports.exportReportBundle` | admin | yes | PASS | Wave 16: creators CSV `creators_2026-10-04.csv` |
| `admin.paginatedLists.listCampaignsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listCasesPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listCreatorsPage` | admin | yes | PASS | Wave 16: Creators **9 loaded** |
| `admin.paginatedLists.listCustomersPage` | admin | yes | PASS | Wave 43: paginate subscriptions + `by_userId` take(joinCap); no adminScanAll |
| `admin.paginatedLists.listPayoutsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listSubscriptionsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listSupportMessagesPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listTransactionsPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.paginatedLists.listUsersPage` | admin | yes | PASS | Wave 37: `roles[]` sorted display; soak `j2creator` dual pills; Wave 16 load |
| `admin.queries.createEmailCampaign` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.dashboardStats` | admin | yes | PASS | Wave 55: unique `userRoles.by_role` accounts; no users 5k scan |
| `admin.queries.listCampaigns` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.listUsers` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.queries.previewAnnouncementAudience` | admin | yes | PASS | Wave 52: status-indexed recipients; soak All **34** / Active **5** / Canceled **8** |
| `admin.queries.sendAnnouncement` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `admin.snapshots.alertsOverview` | admin | yes | PASS | Wave 45: status/published indexes; support unread newest-capped |
| `admin.snapshots.customersOverview` | admin | yes | PASS | Wave 44: indexed status takes + cancelled churn |
| `admin.snapshots.feesOverview` | admin | yes | PASS | Wave 50: active `by_status` take; soak Volume **$69.95** Fees **$3.50** |
| `admin.snapshots.financeOverview` | admin | yes | PASS | Wave 46: status-indexed subs/payouts; no creators table scan |
| `admin.snapshots.payoutsOverview` | admin | yes | PASS | Wave 51: status indexes for events+payouts; soak Owed **$104.49** queued **$142.40** paid **$47.47** |
| `admin.snapshots.reportSourceData` | admin | yes | PASS | Wave 53: no `adminScanAll`; published + status takes; users newest-first cap |
| `analytics.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `analytics.mutations.listForMyCreator` | creator | yes | PASS | Wave 31: CreatorDashboard query path; Wave 10+ overview soak |
| `analytics.mutations.listMine` | subscriber | yes | PASS | Wave 31: CustomerActivity / member events after profile visit |
| `analytics.mutations.track` | authenticated | yes | PASS | Wave 31: `/j2creator` → `page_view:creator:j2creator` + `post_view` rows |
| `authProviders.socialProviders` | public | yes | PASS | Wave 38: Continue with X visible + authorize; Wave 27/30/31 `{ twitter: true, discord: true }` |
| `bookmarks.mutations.listCreatorBookmarks` | subscriber | yes | PASS | Wave 63: capped take; Wave 31 Discover bookmark |
| `bookmarks.mutations.listCreatorBookmarksDetailed` | subscriber | yes | PASS | Wave 63: capped take; Wave 31 `/dashboard/saved` |
| `bookmarks.mutations.listSavedPosts` | subscriber | yes | PASS | Wave 63: capped take; Wave 31 Saved Posts |
| `bookmarks.mutations.toggleCreatorBookmark` | subscriber | yes | PASS | Wave 31: profile Bookmark → creatorBookmarks row; Discover control |
| `bookmarks.mutations.toggleSavedPost` | subscriber | yes | PASS | Wave 32: feed Save → Unsave + `/dashboard/saved` Saved Posts (1) J3 PUSH PICK |
| `creators.earnings.myEarnings` | creator | yes | PASS | Wave 60: capped by_creatorId takes + truncated; UI amber on Earnings |
| `creators.growth.getLinkPublic` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.listMyLinks` | creator | yes | PASS | Wave 63: capped take; Wave 33 Links table |
| `creators.growth.listMyPromos` | creator | yes | PASS | Wave 63: `.take(ADMIN_SCAN_MAX_DOCS)` |
| `creators.growth.listMyReferrals` | creator | yes | PASS | Wave 63: capped take; Wave 29 referrals UI |
| `creators.growth.listUnpaidCommissionsAdmin` | admin | yes | PASS | Wave 36: `/admin/payouts` unpaid queue showed j6comm **$1.49** |
| `creators.growth.markCommissionPaidAdmin` | admin | yes | PASS | Wave 36: Mark paid → `commissionPaidCents` 149; creator status Paid |
| `creators.growth.recordLinkClick` | public | yes | PASS | Wave 33: `/go/jd72413…` → clicks **1** |
| `creators.growth.recordReferral` | authenticated | yes | PASS | Wave 11/29 path via code helper |
| `creators.growth.recordReferralByCode` | authenticated | yes | PASS | Wave 29: signup `?ref=j2creator-jn73sz` → referral row pending then converted |
| `creators.growth.removeLink` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.removePromo` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.growth.upsertLink` | creator | yes | PASS | Wave 33: created Wave33 Bio → `/j2creator` |
| `creators.growth.upsertPromo` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.getByUsername` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.listPublished` | public | no | PASS | Wave 61: capped published take + join takes; truncated flag |
| `creators.queries.myCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.setPublished` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.setVerificationStatus` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `creators.queries.updateSettings` | owner | yes | PASS | Wave 21: monthlyPriceCents $9.99→$11.99 from Smart Pricing |
| `creators.queries.upsertOnboarding` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.disconnect` | creator | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.retryMyAccess` | subscriber | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `discord.mutations.setProductRole` | creator | yes | PASS | Wave 27: WAVE24 → Monthly Pro |
| `discord.mutations.startBotInstall` | creator | yes | PASS | Wave 27: OAuth URL → guild authorize Prizelet VIP |
| `discord.queries.botStatus` | creator | yes | PASS | Wave 17/27: configured true |
| `discord.queries.connection` | creator | yes | PASS | Wave 27: Prizelet VIP / 2 members |
| `discord.queries.memberAccess` | subscriber | yes | PASS | Wave 27: success page Join Discord CTA after Checkout |
| `discord.roles.createMemberInvite` | subscriber | yes | PASS | Wave 27: Join Discord from subscription success |
| `discord.roles.listAssignableRoles` | creator | yes | PASS | Wave 27: Monthly Pro listed |
| `events.queries.listPublishedToday` | public | yes | PASS | Wave 63: published+startsAt range take; Wave 19 slate |
| `events.queries.removeAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `events.queries.seedTodayDev` | auth + ALLOW_DEV_ADMIN_GRANT | yes | PASS | Wave 19: inserted 3 for local day |
| `events.queries.upsertAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `files.storage.generateUploadUrl` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `files.storage.getUrl` | requireAppUser + owner | yes | PASS | Wave 14 runtime: unowned/foreign FORBIDDEN; owner URL returned |
| `files.storage.registerOwnedFile` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `messaging.mutations.listThread` | auth | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)`; soak DMs **2** |
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
| `notifications.mutations.adminInsert` | admin | yes | PASS | Wave 20: WAVE20_NOTIFY_TITLE → j4member |
| `notifications.mutations.listMine` | auth | yes | PASS | Wave 20: member list includes WAVE20 + pay/message |
| `notifications.mutations.listMinePage` | auth | yes | PASS | Wave 20: `/dashboard/notifications` UI |
| `notifications.mutations.markAllRead` | auth | yes | PASS | Wave 62: unread take cap; Wave 20 mark soak |
| `notifications.mutations.markRead` | auth | yes | PASS | Wave 20: unread 2→1 |
| `notifications.mutations.unreadCount` | auth | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)`; soak notifications **66** |
| `payments.sandbox.sandboxCancel` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.sandbox.sandboxSubscribe` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.cancelCreatorSubscription` | auth | yes | PASS | Wave 5: cancelled sub `mn7bg36…` / Stripe `sub_1UMxh9…`; billingStatus canceled |
| `payments.stripeNode.confirmCheckoutSession` | auth | yes | PASS | Wave 5: session `cs_test_a171…` → settled `paymentEvents` commercialRef |
| `payments.stripeNode.createBillingPortalSession` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `payments.stripeNode.createCheckoutSession` | auth | yes | PASS | Wave 5: redirected to checkout.stripe.com Prizlett sandbox Monthly pro $100 |
| `payouts.mutations.availableBalance` | creator | yes | PASS | Wave 59: capped by_creatorId takes + truncated; refuse request when truncated |
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
| `products.mutations.listByCreator` | owner | yes | PASS | Wave 63: capped take; Wave 7 products table |
| `products.mutations.listPublicByCreator` | public | yes | PASS | Wave 63: capped take; Wave 7 `/j2creator` |
| `products.mutations.remove` | owner | yes | PASS | Wave 7 hard delete; Wave 23 soft-archive when subscription linked → Archived tab |
| `products.mutations.setShowOnProfile` | owner | yes | PASS | Wave 7: pin + MAX_PROFILE_PRODUCTS=4 server guard |
| `products.mutations.upsert` | owner | yes | PASS | Wave 7: create $1999→edit $2499 monthly limited product |
| `resolution.mutations.addMessage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.create` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.listMessages` | auth | yes | PASS | Wave 62: case messages `.take(ADMIN_SCAN_MAX_DOCS)` |
| `resolution.mutations.listMine` | creator | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)`; soak cases **1** |
| `resolution.mutations.markReadAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.markReadCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.setStatus` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.unreadCountAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `resolution.mutations.unreadCountCreator` | creator | yes | PASS | Wave 62: cases take + per-case `ADMIN_JOIN_LIMIT` |
| `roles.mutations.assignSelfRole` | authenticated | yes | PASS | Wave 12 select-role + authMatrix allowlist; Wave 28 multi-role fixture already held creator |
| `roles.mutations.grantRole` | admin | yes | PASS | Wave 28: admin granted `subscriber` to `j2creator` (`n179g48…`); roles `[creator, subscriber]` |
| `roles.mutations.grantTestAdmin` | requireAppUser + ALLOW_DEV_ADMIN_GRANT + allowlist | yes | PASS | Wave 16/28: Sign in as platform owner → `/admin` |
| `roles.mutations.myRoles` | authenticated | yes | PASS | Wave 28: RoleSwitcher rendered only after dual roles present |
| `subscriptions.mutations.countActiveByCreator` | public | no | PASS | Wave 60: capped `by_creatorId` take then filter active |
| `subscriptions.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listForMyCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listSubscribersDetailed` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.listSubscribersDetailedPage` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.myPaymentEvents` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `subscriptions.mutations.mySubscriptions` | auth | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)`; soak subs **14** |
| `subscriptions.mutations.mySubscriptionsDetailed` | auth | yes | PASS | Wave 62: capped by_userId take + db.get creators |
| `subscriptions.mutations.setStatus` | requireAdmin | yes | NOT_RUN | Wave 1 static: owner cannot activate (F-003) |
| `support.mutations.listAllAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.listForMember` | auth | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)`; soak memberSupport **1** |
| `support.mutations.listForMyCreator` | creator | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)`; soak support **24** |
| `support.mutations.markReadAdmin` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.markReadCreator` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.markReadMember` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.send` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.sendMember` | TBD | yes | NOT_RUN | frozen vs convex/*.ts @ bf85281 |
| `support.mutations.unreadCountAdminGrowth` | admin | yes | PASS | Wave 62: growth channel `.take(ADMIN_LIST_LIMIT)` |
| `support.mutations.unreadCountCreatorGrowth` | creator | yes | PASS | Wave 62: `.take(ADMIN_SCAN_MAX_DOCS)` filter unread |
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
| userRoles | roles.mutations | PASS | Wave 28: `j2creator` holds creator+subscriber after admin grant; switcher uses held roles only |
| creators | creators/* | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| products | products.mutations | PASS | Wave 7: create/edit/pin/delete soak on j2creator |
| posts | posts/* | PASS | Wave 8: upsert + setResult won/push; RESULT_LOCKED |
| subscriptions | payments/*, subscriptions.mutations | PASS | Wave 5: active→cancelled soak on prize2626 / j1member; Stripe sub_1UMxh9… |
| analyticsEvents | analytics.mutations | PASS | Wave 31: track wrote page_view/post_view for j6oauth on `/j2creator` |
| pickTracker | picks.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| paymentEvents | payments/* | PASS | Wave 5: subscription_charge $10000 test + subscription_cancel for cs_test_a171… |
| webhookReceipts | stripeNode.fulfillWebhook | PARTIAL | Wave 6: HTTP reject + helper tests. No new signed receipt this wave |
| sportEvents | events / platform | PASS | Wave 19: published today slate via seedTodayDev + public list |
| notifications | notifications / notify | PASS | Wave 20: adminInsert + markRead/markAllRead on j4member |
| savedPosts / creatorBookmarks | bookmarks.mutations | PASS | Wave 32: savedPosts (1) J3 PUSH; Wave 31 creatorBookmarks j2creator |
| payouts / creatorPayoutSettings | payouts.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| creatorLinks / promoCodes / referrals | creators.growth | PASS | Wave 36: commissionPaidCents on referral; Wave 33 link conversions; Wave 29 convert |
| resolutionCases / resolutionCaseMessages | resolution.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| supportMessages / memberSupportMessages | support.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| platformSettings | platform.mutations | PASS | Wave 16: Platform Fees shows intro/standard rates from settings |
| directMessages | messaging.mutations | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| emailCampaigns | admin | PASS | Wave 16: Announcements UI honest — in-app only, email outbox not enabled |
| fileAssets | files/storage | PASS | Wave 14: registerOwnedFile + owner getUrl; foreign denied |
| migrationCheckpoints / mutationLog | migrations/* internal | NOT_RUN | present in convex/schema.ts @ bf85281; existence freeze only |
| accountRequests | accountRequests | PASS | Wave 35: fulfill/reject; Wave 41: deletion returns `stripeSubscriptionIds` + Stripe cancel admin action / scheduler |
| discordBotInstalls / discordAccessGrants | discord/* | PASS | Wave 27: install nonce + grant row granted then revoked for prize262626 |

Schema `appRole` also allows `moderator` and `user` (not product actors; no routes).

## L. Waivers

| ID | Owner | Reason | Date |
|----|-------|--------|------|
| | | | |

## M. Remaining risk (update every fix PR)

- P2: USD currency locked (Wave 67). Connect Transfer proven Wave 69 via Stripe-native FX (`tr_1UNKR8…`); referral cash still outside Stripe; historical migration data parity BLOCKED (greenfield). Email OTP shipped Wave 70 (Resend env required on prod; dev echo only with ALLOW_DEV_ADMIN_GRANT)
- P3: admin join spend still capped at 500; F-012 Convex `.collect` closed Waves 59–65; optional USD available funding (FX path works); customers/alerts/finance/dashboard/fees/payouts/announcement/reports KPIs PASS (Wave 43–47, 50–55); eslint PASS Wave 57; join honesty PASS Wave 58
- Not in this PR: www.prizelet.com Vercel promote, live Stripe keys, MFA
- Waivers: see section L
