# Findings — Wave 73 MFA recovery 2026-10-07

Branch `feat/world-ready-wave-73-mfa-recovery`. Convex on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Backup codes | PASS | 8 hashed one-time codes on enroll / regenerate; plaintext shown once |
| Login | PASS | `/mfa` accepts TOTP or backup; backup consumes hash |
| Admin reset | PASS | `mfa.adminDisable` clears TOTP + backups + grants; refuses self |
| Hygiene | PASS | `totpBackupCodeHashes` stripped via `publicUserFields` |
| Soak | PASS | `@prize2626` enroll → backup panel (e.g. `79JW-PMTJ` …) + “8 backup codes left”; disable after soak so shared QA account stays open |
| Unit | PASS | `mfaBackup.security.test.ts` |

**Residual:** Resend on prod. Referral `tr_` soak. Section 8 gates. Do not claim world-ready.

---

# Findings — Wave 72 TOTP MFA 2026-10-06

Branch `feat/world-ready-wave-72-totp-mfa`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Schema | PASS | `users.totpSecret` / `totpEnabled`; `mfaSessionGrants` by session |
| Secret hygiene | PASS | `publicUserFields` strips secret from `me` / `getById` / admin `listUsers` |
| Gate | PASS | ProtectedRoute + Login + AuthCallback + SelectRole → `/mfa` when required |
| Settings | PASS | Creator + member `TotpManageCard` (no preview switch) |
| Soak | PASS | `@prize2626` Security: enroll → confirm TOTP **266588** → switch on; disable with **066885** → switch off. `/mfa` with TOTP off redirected to `/creator` |
| Unit | PASS | `totp.security.test.ts` + `mfaGate.test.ts` |

**Residual:** Superseded Wave 73 (backup codes + admin reset).

---



Branch `feat/world-ready-wave-71-referral-stripe-cash`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Action | PASS | `sendReferralCommissionConnect` reuses payout FX helper; unpaid until Transfer succeeds |
| Ledger backup | PASS | `markCommissionPaidAdmin` still admin-only; UI labeled Ledger only |
| Unit | PASS | `stripeConnect.security.test.ts` + `referralCommissionPaid.security.test.ts` |

**Residual:** Live `tr_` soak when an unpaid converted referral exists on a KYC Express creator. MFA; Resend on prod for OTP email.

---

# Findings — Wave 70 email OTP self-serve 2026-10-06

Branch `feat/world-ready-wave-70-email-otp`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Mint | PASS | Hashed SHA-256 OTP on `accountRequests`; `listMine` / admin list strip hash |
| Delivery | PASS | Resend when `RESEND_API_KEY`+`EMAIL_FROM`; else `ALLOW_DEV_ADMIN_GRANT` echo (blocked on production SITE_URL) |
| Verify | PASS | `verifyEmailChangeOtp` fulfills email + password provider id + session clear |
| Unit | PASS | `emailOtp.security.test.ts` + `accountRequests.security.test.ts` |
| UI | PASS | Member Settings + Creator Settings OTP dialog; soak `@prize2626` Change email → dev code **266295**, invalid `000000` did not rotate email |

**Residual:** Referral cash still outside Stripe; MFA coming soon; Resend must be set on prod for live email delivery.

---

# Findings — Production release 2026-10-05 (waves 62–68)

Tip `c5b9e9b`. Tag `release/2026-10-05-world-ready-62-68`.

| Layer | Result | Evidence |
|-------|--------|----------|
| Git | PASS | `production`/`main`/`dev` = `c5b9e9b`; PRs #186–#192 merged |
| Convex prod | PASS | Deployed to `ceaseless-weasel-494`; `SITE_URL=https://www.prizelet.com`; `STRIPE_CONNECT_COUNTRY=US`; sandbox/dev-grant unset |
| Vercel | PASS* | Free-tier build rate limit blocked new prod build; aliased tip preview to `www.prizelet.com` / `prizelet.com`; SPA bakes `ceaseless-weasel-494` |
| Smoke | PASS | `https://www.prizelet.com` HTTP 200 |

\* Prefer Pro plan or wait 24h for a native Production target build of the same SHA.

**Residual:** Express KYC + fund USD available; referral cash; email OTP. Product not world-ready.

---

# Findings — Wave 67 USD platform currency locked 2026-10-05

Branch `fix/world-ready-wave-67-usd-platform-currency`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Decision | PASS | Product currency **USD**; Connect country **US**; NOK pricing not chosen |
| Code | PASS | Checkout / stripeDb / sandbox write `PRIZELET_LEDGER_CURRENCY` |
| Stripe entity | PASS | Still **NO** / `default_currency=nok`; available NOK-only — admin surfaces fund-USD ops note |
| Unit | PASS | `stripeConnect.security.test.ts` |

**Residual:** Express KYC + fund USD available on Stripe; then real `tr_` soak. Referral cash / email OTP still open.

---

# Findings — Wave 66 Connect currency honesty (no fake NOK↔USD) 2026-10-05

Branch `fix/world-ready-wave-66-connect-currency-honesty`. Real Stripe soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Platform | PASS | Stripe account **NO** / `default_currency=nok`; available **nok 25532**, pending **nok 248405** |
| Ledger | PASS | Checkout + `paymentEvents.currency=usd`; pending payout **14240** USD cents |
| Express | PASS | `acct_1UN8ktRyfauxBCWX` country **US** / usd / `payouts_enabled=false` (KYC incomplete) |
| Transfer rule | PASS | `resolveConnectTransferCurrency` requires ledger===destination===available; refuses NOK-only balance for USD ledger |
| UI | PASS | Creator/Admin copy no longer claims transfers “not built”; admin loads live balance note |
| Env | PASS | `STRIPE_CONNECT_COUNTRY=US` (aligned with USD ledger, not platform legal NO) |

**Residual (superseded Wave 69):** Live FX transfer proven; optional USD available funding. Referral cash / email OTP still open.

---

# Findings — Wave 69 live Connect Transfer (Stripe FX) 2026-10-05

Branch `feat/world-ready-wave-69-connect-transfer-soak`. Soak on `combative-mongoose-559` + Stripe test.

| Step | Result | Evidence |
|------|--------|----------|
| Express KYC | PASS | `@prize2626` `acct_1UNI6YRzsXVyRAzD` US/USD `payouts_enabled=true` |
| Platform balance | PASS | Available **NOK only** (pre-transfer ~681.42) |
| Admin pending payout | PASS | Created **$50** pending for prize2626 |
| `sendConnectPayout` | PASS | `funding=stripe_fx`, `tr_1UNKR8RpY5TupxHCGqx0oHZc`, **47968** NOK for **5000** USD cents, rate **9.59358** |
| Ledger | PASS | Payout `completed` / method `stripe_connect` / reference `tr_1UNKR8…` |

**Residual:** Referral cash still outside Stripe; member self-serve verified email OTP; optional fund USD available (FX path works without it).

---

# Findings — Wave 65 stripeDb/sandbox/migration collect caps 2026-10-05

Branch `fix/world-ready-wave-65-stripeDb-sandbox-migration-caps`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| stripeDb | PASS | product active count + user/creator sub lookups use `.take` |
| Sandbox | PASS | subscribe/cancel existing-sub lookups capped |
| Migrations | PASS | `countTable` uses capped takes (not full table collect) |
| Repo scan | PASS | no remaining `.collect()` in `convex/**/*.ts` besides comments |
| Unit | PASS | `stripeDbSandboxMigrationCap.security.test.ts` 2/2 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer). F-012 unbounded collects closed.

---

# Findings — Wave 64 notify/discord/auth/accountRequests caps 2026-10-05

Branch `fix/world-ready-wave-64-notify-entitlements-discord-caps`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Notify / entitlements / growthAttribution | PASS | role fanout, unread-by-link, sub entitlement, referral convert — `.take` |
| Auth | PASS | `listRolesForUser` + `hasContentAccess` capped |
| Discord | PASS | queries/mutations/grants indexed takes (no `.collect`) |
| Account requests | PASS | listMine + open-request + fulfill session/role/sub clears capped |
| Unit | PASS | `notifyDiscordAuthCap.security.test.ts` 2/2 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer); residual `.collect` only in `stripeDb` / sandbox / migrations counts.

---

# Findings — Wave 63 products/growth/events/bookmarks caps 2026-10-05

Branch `fix/world-ready-wave-63-products-growth-events-caps`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Products | PASS | `listPublicByCreator` / `listByCreator` / sibling upsert takes (no `.collect`) |
| Growth | PASS | links/promos/referrals list + referral dedupe takes |
| Events | PASS | `listPublishedToday` published+startsAt range `.take`; seedTodayDev existence take(1) |
| Bookmarks | PASS | saved posts + creator bookmarks lists capped |
| Data soak | PASS | products **7**, links **2**, promos **3**, referrals **3**, events **6**, savedPosts **1**, bookmarks **1** |
| Unit | PASS | `productsGrowthEventsCap.security.test.ts` 2/2 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer); residual `.collect` in discord/accountRequests/entitlements/notify/auth/stripeDb/migrations/sandbox/growthAttribution.

---

# Findings — Wave 62 support/resolution/inbox caps 2026-10-05

Branch `fix/world-ready-wave-62-support-resolution-caps`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Support | PASS | `listForMyCreator` / `listForMember` / growth unread use `.take` (no `.collect`) |
| Resolution | PASS | `listMine` / `listMessages` / `unreadCountCreator` capped takes |
| Inbox | PASS | notifications unread/markAllRead + messaging `listThread` + `mySubscriptions*` capped |
| Data soak | PASS | support **24**, memberSupport **1**, cases **1**, case msgs **1**, notifications **66**, DMs **2**, subs **14** |
| Unit | PASS | `supportResolutionCap.security.test.ts` 2/2 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer); residual `.collect` in growth/products/discord/events/accountRequests/entitlements/notify/auth/stripeDb/migrations.

---

# Findings — Wave 61 listPublished + listMine caps 2026-10-05

Branch `fix/world-ready-wave-61-list-published-cap`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Discovery | PASS | `listPublished` `.take(ADMIN_SCAN_MAX_DOCS)` + post/product `.take(ADMIN_JOIN_LIMIT)` |
| Lists | PASS | payouts/picks/analytics/post preview/memberFeed no longer `.collect` |
| Data soak | PASS | published creators **9** |
| Unit | PASS | `listPublishedCap.security.test.ts` 2/2 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer).

---

# Findings — Wave 60 creator earnings capped reads 2026-10-05

Branch `fix/world-ready-wave-60-creator-earnings-cap`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `myEarnings` / `countActiveByCreator` / `listForMyCreator` `.take(ADMIN_SCAN_MAX_DOCS)`; no `.collect` |
| UI | PASS | Creator Earnings amber note when `truncated` |
| Data soak | PASS | max subs/creator **10**, events/creator **12** |
| Unit | PASS | `creatorEarningsCap.security.test.ts` 2/2 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer).

---

# Findings — Wave 59 creator balance capped reads 2026-10-05

Branch `fix/world-ready-wave-59-creator-balance-cap`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `getCreatorAvailableBalanceCents` `.take(ADMIN_SCAN_MAX_DOCS)` on events + payouts; no `.collect` |
| Mutation | PASS | `requestPayout` throws `BALANCE_TRUNCATED` when capped |
| UI | PASS | Creator Payouts shows `scanTruncationNote` when truncated |
| Data soak | PASS | max events/creator **12**, payouts/creator **2** — under 5k |
| Unit | PASS | `creatorBalanceCap.security.test.ts` 2/2; `payoutBalance.test.ts` 6/6 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer).

---

# Findings — Wave 58 admin join spend honesty 2026-10-05

Branch `fix/world-ready-wave-58-admin-join-spend-indexes`. Convex soak on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Cap | PASS | `ADMIN_JOIN_LIMIT` = `ADMIN_LIST_LIMIT` (**500**) |
| Query | PASS | `metricsTruncated` on listUsersPage / listCustomersPage / listCreatorsPage |
| UI | PASS | amber join note via `joinMetricsTruncationNote` on Users/Customers/Creators |
| Data soak | PASS | max subs/user and /creator well under 500; no truncated rows expected |
| Unit | PASS | `adminJoinMetrics.security.test.ts` 3/3 |

**Residual:** Connect KYC/currency; referral cash outside Stripe; email OTP (no mailer).

---

# Findings — Wave 57 eslint clean 2026-10-05

Branch `fix/world-ready-wave-57-eslint-cleanup`. Frontend lint hygiene.

| Step | Result | Evidence |
|------|--------|----------|
| Lint | PASS | `npm run lint` → 0 errors / 0 warnings (was 28 warnings) |
| Hooks | PASS | CreatorLinks `links` dep; CreatorProducts `isOnProfile` useCallback; DemoAdminUsers `spendOf` useCallback |
| Config | PASS | ignore `convex/_generated/**`; co-export override for ui/contexts/demo |
| Unit | PASS | `eslintConfig.security.test.ts` 1/1 |

**Residual:** Connect KYC/currency; admin join spend metrics still cap at 200.

---

# Findings — Wave 56 AuthContext hasRole is DB-held only 2026-10-05

Branch `fix/world-ready-wave-56-authcontext-dev-hasrole`. Frontend-only; no Convex schema change.

| Step | Result | Evidence |
|------|--------|----------|
| Client | PASS | `hasRole` = `roles.includes`; `switchRole` refuses unheld; `devMode` always false |
| Unit | PASS | `authContextDevBypass.security.test.ts` 2/2 |
| UI | PASS | `DevModeBanner` removed from `App.tsx`; ProtectedRoute already DB-held |

**Residual:** Connect KYC/currency; eslint warnings.

---

# Findings — Wave 55 dashboardStats accounts via userRoles 2026-10-05

Branch `fix/world-ready-wave-55-dashboard-user-role-indexes`. Soak via Convex CLI on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `takeUserRolesByRole` for admin/moderator/user/creator/subscriber; unique `userId`; `db.get` |
| Unit | PASS | `dashboardStats.security.test.ts` 1/1 |
| Data soak | PASS | Unique role accounts **26** (33 rows); 8 users with no role excluded (deleted + stray); Creators **9**, Active **5** |

**Residual:** Connect KYC/currency; AuthContext DEV leftover; eslint.

---

# Findings — Wave 54 dashboardStats indexed creators/events 2026-10-05

Branch `fix/world-ready-wave-54-dashboard-stats-indexes`. Admin soak via Convex CLI on `combative-mongoose-559` (browser soak skipped — prior hangs).

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | no `adminScanAll`; `takeCreatorsByPublished` + `takePaymentEventsByStatus(settled/paid)`; users `.take` |
| Unit | PASS | `dashboardStats.security.test.ts` 1/1 |
| Data soak | PASS | Accounts **34**, Creators **9**, Active **5**, volume **$69.95**, fees **$3.50**, paid out **$47.47**, open cases **1** |

**Residual:** Connect KYC/currency; users table still newest-first cap.

---

# Findings — Wave 53 reportSourceData indexed 2026-10-05

Branch `fix/world-ready-wave-53-report-source-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | no `adminScanAll`; `takeCreatorsByPublished` + sub/payout status takes; users `.take(ADMIN_SCAN_MAX_DOCS)` |
| Unit | PASS | `reportSourceData.security.test.ts` 2/2 |
| UI soak | PASS | `/admin/reports` CSVs generated; Convex tables users **34**, creators **9**, subscriptions **14**, payouts **4** |

**Residual:** Connect KYC/currency; dashboardStats still caps users/creators/events at 5k.

---

# Findings — Wave 52 announcement audience indexed 2026-10-05

Branch `fix/world-ready-wave-52-announcement-audience-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `resolveAnnouncementRecipients` no `adminScanAll`; active/canceled status takes; specific `by_creatorId` |
| Unit | PASS | `announcementAudience.security.test.ts` 1/1 |
| UI soak | PASS | `/admin/customer-email` All **34**, Active **5**, Canceled **8** |

**Residual:** Connect KYC/currency; reportSourceData scans.

---

# Findings — Wave 51 payoutsOverview indexed events/payouts 2026-10-05

Branch `fix/world-ready-wave-51-payouts-overview-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`. Added `paymentEvents.by_status`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `takePaymentEventsByStatus(settled/paid)` + payout status takes; `db.get` names; no `adminScanAll` |
| Unit | PASS | `payoutsOverview.security.test.ts` 3/3 |
| UI soak | PASS | `/admin/payouts` Owed **$104.49**, queued **$142.40**, paid **$47.47**; OPEN 1 / COMPLETED 2 / FAILED 1; j2 in-flight **$142.40** |

**Residual:** Connect KYC/currency; announcement audience + reportSourceData scans.

---

# Findings — Wave 50 feesOverview indexed active fees 2026-10-05

Branch `fix/world-ready-wave-50-fees-overview-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `feesOverview` `takeSubsByStatus(active)` + `db.get` names; no `adminScanAll` |
| Unit | PASS | `feesOverview.security.test.ts` 1/1 |
| UI soak | PASS | `/admin/fees` Volume **$69.95**, Fees **$3.50**, Creator **$66.45**, Active **5** (intro 5 / standard 0); j2creator 4 subs **$3.00**, QA Creator W3 **$0.50** |

**Residual:** Connect KYC/currency; announcement audience + payoutsOverview scans.

---

# Findings — Wave 49 Connect Transfer action 2026-10-05

Branch `feat/world-ready-wave-49-connect-transfers`. Admin soak `admin@prizelet.dev`; creator `j2creator` Express `acct_1UN8ktRyfauxBCWX` (`payouts_enabled: false`). Platform Stripe available **NOK 255.32**.

| Step | Result | Evidence |
|------|--------|----------|
| Action | PASS | `sendConnectPayout` admin-only; `recordConnectTransfer` only after Stripe `transfers.create` |
| Preflight | PASS | `CONNECT_PAYOUTS_NOT_ENABLED` / `STRIPE_CURRENCY_MISMATCH` / `STRIPE_INSUFFICIENT_BALANCE` helpers |
| UI soak | PASS | `/admin/payouts` Record payout j2 **$142.40** pending; Send via Stripe left status **pending** (not completed, no `tr_`) |
| Unit | PASS | `stripeConnect.security.test.ts` 12/12 |

**Residual:** finish Express KYC; align settlement currency (NOK platform vs USD Express); then a real `tr_` soak.

---

# Findings — Wave 48 Connect Express live on Prizlett sandbox 2026-10-05

Branch `feat/world-ready-wave-48-connect-express-capabilities`. Fixture `j2creator` / `j2creator+wave7@example.com` on `combative-mongoose-559`. Platform Stripe `acct_1UCIO0RpY5TupxHC` (Prizlett sandbox).

| Step | Result | Evidence |
|------|--------|----------|
| Dashboard Connect | PASS | Marketplace model “You collect payments and pay recipients”; Accounts v1 support **Enabled** |
| Express create | PASS | US Express needs `card_payments`+`transfers`; Account Links return `connect.stripe.com/setup/e/…` |
| Creator soak | PASS | Connect Stripe → `acct_1UN8ktRyfauxBCWX`; `?connect=return` UI **Continue Stripe onboarding** |
| Unit | PASS | `stripeConnect.security.test.ts` 8/8 |

**Residual:** Express KYC not finished; **transfers not implemented**; two probe accounts from API (`acct_1UN8i3RrQKtZfV1Y` US, `acct_1UN8i7RpIyPG9dcW` NO).

---

# Findings — Wave 47 dashboardStats indexed money/cases 2026-10-05

Branch `fix/world-ready-wave-47-dashboard-stats-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `dashboardStats` `takeSubsByStatus(active)` / payouts paid+completed / cases open+pending+in_progress; no `adminScanAll` for those tables |
| Unit | PASS | `dashboardStats.security.test.ts` 1/1 |
| UI soak | PASS | `/admin` Active subs **5**, MRR **$70**, paid out **$47**, open cases **1**; recent j4member / j6comm |

**Residual:** users/creators/paymentEvents still capped scans; Connect transfers; email OTP.

---

# Findings — Wave 46 financeOverview status indexes 2026-10-05

Branch `fix/world-ready-wave-46-finance-overview-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `financeOverview` status buckets for subs/payouts; `db.get` creator names; recent `.take(8)`; no `adminScanAll` |
| Unit | PASS | `financeOverview.security.test.ts` 1/1 |
| UI soak | PASS | `/admin/finance` Gross **$299.87**, MRR **$69.95 · 5 active**, fees **$15.00**, top **j2creator** 4 active; recent rows include j4member / j6comm |

**Residual:** dashboardStats still `adminScanAll`; Connect transfers; email OTP.

---

# Findings — Wave 45 alertsOverview indexed buckets 2026-10-05

Branch `fix/world-ready-wave-45-alerts-overview-indexes`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `alertsOverview` status/published indexes; no `adminScanAll`; support unread newest-capped |
| Unit | PASS | `alertsOverview.security.test.ts` 1/1 |
| UI soak | PASS | `/admin/alerts` Critical **1** (open cases) + Warning **6** unread; View Cases → **WAVE9 J4 payout hold**; Growth Inbox threads present |

**Residual:** finance/dashboard `adminScanAll`; Connect transfers; email OTP.

---

# Findings — Wave 44 customersOverview status indexes 2026-10-05

Branch `fix/world-ready-wave-44-customers-overview-status`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query | PASS | `customersOverview` `by_status` takes; includes `cancelled`; no `adminScanAll` |
| Unit | PASS | `customersOverview.security.test.ts` 1/1 |
| KPI soak | PASS | `/admin/customers` Customers **13**, Active Subs **5**, Revenue **$300**, At Risk **0**, Churned **8** (was 0 before counting `cancelled`) |

**Residual:** finance/dashboard snapshots still `adminScanAll` 5k; Connect transfers; email OTP.

---

# Findings — Wave 43 admin customers F-012 pagination 2026-10-05

Branch `fix/world-ready-wave-43-admin-customers-pagination`. Admin soak `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Query rewrite | PASS | `listCustomersPage` uses `.paginate()` on `subscriptions`; per-user `by_userId` `.take(joinCap)`; no `adminScanAll` |
| Unit | PASS | `adminCustomersPage.security.test.ts` 2/2 |
| Admin UI | PASS | `/admin/customers` **13** loaded; `j4member` Active 2 subs **$44.98**; deleted users **Canceled**; `j6commwave34` Active |
| Snapshots | Residual | `customersOverview` still `adminScanAll` 5k |

**Residual:** Connect transfers (Stripe dashboard); member email OTP; snapshot scans.

---

# Findings — Wave 42 Stripe Connect Express onboarding 2026-10-05

Branch `feat/world-ready-wave-42-stripe-connect-onboarding`. Fixture `j2creator` / `j2creator+wave7@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Payouts Connect UI | PASS | `/creator/payouts?demo=0` Stripe Connect card + **Connect Stripe**; copy says it does not send payouts yet |
| Authenticated action | PASS | Convex `payments/stripeNode:createConnectOnboardingSession` + `getConnectOnboardingContext` |
| Express account create | BLOCKED | Stripe: Connect not enabled on platform → `STRIPE_CONNECT_NOT_ENABLED` (~1.95s). No `acct_` persisted |
| Transfers | Residual | Not implemented — onboarding only |
| Unit | PASS | `stripeConnect.security.test.ts` 6/6 |

**Residual:** Enable Stripe Connect on the platform account, then complete Express KYC + transfers. Member email OTP still out of scope.

---

# Findings — Wave 41 deletion Stripe cancel 2026-10-05

Branch `fix/world-ready-wave-41-deletion-stripe-cancel`. Fixtures `j41c`/`j41d`/`j41e` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Soft-delete fulfill | PASS | j41c/d/e → `deleted+…@prizelet.invalid`; local sub `cancelled`/`canceled` |
| Return `sub_*` ids | PASS | `resolveAdmin` returns `stripeSubscriptionIds`; units assert |
| Admin Stripe cancel action | PASS | `cancelStripeSubscriptionsAdmin` → `{canceled:1}` on live `sub_*` after deploy (`convex dev --once`) |
| Scheduler backup | PASS (code) | `fulfillAccountDeletion` schedules `cancelStripeSubscriptionsBestEffort` |
| Admin UI wiring | PASS | `AdminUsers` mutation + `useAction(cancelStripeSubscriptionsAdmin)` |
| Unit | PASS | `accountRequests.security.test.ts` 4/4 |

**Residual:** Connect live transfers; member self-serve verified email OTP.

---

# Findings — Wave 36 referral commission paid ledger 2026-10-05

Branch `test/world-ready-wave-36-referral-commission-paid`. Fixture `j2creator` / `j6comm+wave34` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Unpaid admin queue | PASS | `/admin/payouts` Referral commissions — j2creator / j6comm **$1.49** |
| Mark paid | PASS | `commissionPaidCents` **149** + `commissionPaidAt` set |
| Creator honesty | PASS | `/creator/referrals?demo=0` accrued **$1.49**; Rewards paid **$1**; row status **Paid** |
| Unit | PASS | `referralCommissionPaid.security.test.ts` 3/3 |

**Commission cash residual:** Ledger Mark paid PASS. Next: Connect live transfers; X OAuth consent.

---

# Findings — Wave 35 account-request fulfillment 2026-10-05

Branch `test/world-ready-wave-35-account-request-fulfillment`. Fixtures `j4member` / throwaway `j35del` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Admin fulfill email | PASS | `/admin/users` Fulfill → `j4member+wave12@example.com`; password `providerAccountId` rotated |
| Login after rotate | PASS | Sign-in with new email + `Wave9Pass1!` → `/dashboard` “Good morning, j4member” |
| Admin reject deletion | PASS | Rejected open `j6oauth` deletion (fixture preserved) |
| Throwaway deletion request | PASS | `j35del+wave35` Settings → Request deletion → open |
| Admin fulfill deletion | PASS | Auth/roles stripped; email `deleted+…@prizelet.invalid`; name **Deleted user**; request **fulfilled** |
| Unit | PASS | `accountRequests.security.test.ts` 3/3 |

**Account-request fulfillment residual:** PASS for admin fulfill/reject. Next: Connect transfers; X OAuth consent; self-serve verified email OTP (not claimed).

---

# Findings — Wave 34 referral commission accrual 2026-10-05

Branch `test/world-ready-wave-34-referral-commission`. Fixtures `j2creator` + `j6commwave34` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Signup `?ref=` | PASS | Banner “Referred with code j2creator-jn73sz” |
| Paid convert | PASS | Checkout `cs_test_a1hmxS…` WAVE24 |
| Commission accrue | PASS | Referrals row `j6comm+wave34` **$1.49**; Rewards paid **$1**; rate **10%** |
| Honesty | PASS | Accrues on pay; cash payout still manual/Connect |
| Admin rate | PASS | Platform Settings “Referral commission (%)” |
| Unit | PASS | `referralCommission.test.ts` 3/3 + growthAttribution commission guard |

**Commission accrual residual:** PASS. Next: Connect transfers; X OAuth consent.

---

# Findings — Wave 33 creatorLinks paid conversions 2026-10-05

Branch `test/world-ready-wave-33-link-conversions`. Fixtures `j2creator` + `j4member+wave9` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Create link | PASS | Wave33 Bio → `/go/jd72413kctd49fqj00arzq048h8fq08t` |
| `/go/` handoff | PASS | `sessionStorage.prizelet.creatorLinkId` set before redirect |
| Paid convert | PASS | Checkout `cs_test_a1LSVo…` WAVE24 → row clicks/sign-ups/conversions **1** |
| Links honesty | PASS | Copy: conversions increment after `/go/` + Checkout |
| Unit | PASS | `creatorLinkHandoff.test.ts` + `growthAttribution.security.test.ts` 3/3 |

**Link conversion residual:** PASS. Next: Connect transfers; commission cash; X consent.

---

# Findings — Wave 32 saved posts + admin account requests 2026-10-05

Branch `test/world-ready-wave-32-saved-posts-admin-requests`. Fixture `j6oauthwave30` + platform owner on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Subscribe for feed | PASS | Checkout `cs_test_a1lGXn…` WAVE24 → success |
| Feed Save | PASS | `/dashboard?demo=0` Save → Unsave on `J3 PUSH PICK` |
| Saved Posts | PASS | `/dashboard/saved?demo=0` Saved Posts **(1)** |
| Admin open queue | PASS | `/admin/users` Open account requests **2 open** (email-change + deletion) |
| Unit | PASS | `accountRequests.security.test.ts` 2/2 |

**Saved-post / admin requests residual:** PASS. Next: Connect transfers; commission cash; X consent; link `conversions` product.

---

# Findings — Wave 31 bookmarks + analytics + account deletion 2026-10-05

Branch `test/world-ready-wave-31-bookmarks-analytics`. Fixture `j6oauthwave30` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Bug | PASS (fix) | Profile Favorite was local toast only — now `toggleCreatorBookmark` |
| Discover bookmark | PASS | `/dashboard/discover?demo=0&q=j2creator` → Remove bookmark |
| Saved creators | PASS | `/dashboard/saved` Bookmarked Creators (1) j2creator |
| Analytics track | PASS | `page_view:creator:j2creator` + `post_view` for member |
| Account deletion | PASS | Settings Request deletion → `accountRequests` **open** |
| Unit | PASS | `bookmarks.security.test.ts` 2/2 |

**Member engagement residual:** PASS for bookmarks/track/deletion. Next: Connect; commission cash; X consent; saved-post feed soak.

---

# Findings — Wave 30 OAuth referral handoff + links honesty 2026-10-05

Branch `test/world-ready-wave-30-oauth-ref-x`. Fixture `j6oauthwave30` / `j6oauth+wave30@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Handoff store | PASS | `/signup?ref=j2creator-jn73sz` → Continue with Discord writes `sessionStorage.prizelet.referralCode` |
| AuthCallback apply | PASS | Stashed code → `recordReferralByCode` → referral `m571wjav…` pending for j6oauth |
| Unit | PASS | `referralHandoff.test.ts` 4/4 |
| Links honesty | PASS | Creator Links live copy: paid conversions not attributed yet |
| X OAuth full consent | Residual | `socialProviders.twitter: true`; agent lacked X login credentials |

**OAuth `?ref=` drop residual:** PASS (fixed). Next: Connect transfers; commission cash; X consent soak; link conversion product.

---

# Findings — Wave 29 J6 paid referral attribution 2026-10-05

Branch `test/world-ready-wave-29-j6-referral-attribution`. Fixtures `j2creator` + `j6refwave29` / `j6ref+wave29@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Referral code | PASS | `/creator/referrals?demo=0` ensured `j2creator-jn73sz` |
| Signup `?ref=` | PASS | Banner “Referred with code j2creator-jn73sz”; row `converted: false` |
| Paid convert | PASS | Checkout `cs_test_a1a8xUI…` WAVE24 → `converted: true`, `commissionEarnedCents: 0` |
| Creator UI | PASS | Total referrals **1** / New subscribers **1**; row **Approved**; revenue/commission **—**; “Commission cash payouts are not configured yet.” |

**J6 paid conversion attribution residual:** PASS. Commission cash remains P2 TBD. Next: Connect live transfers; X OAuth; link `conversions` wiring.

---

# Findings — Wave 28 J7 multi-role switcher + OAuth residual 2026-10-05

Branch `test/world-ready-wave-28-j7-multi-role`. Fixture `j2creator` / `j2creator+wave7@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Admin grant | PASS | `/admin/users` Grant **Subscriber** → `userRoles` `[creator, subscriber]` (`n179g48…`) |
| Switcher visible | PASS | `/creator` shows **Switch to Member** |
| Member switch | PASS | Click → `/dashboard` + **Switch to Creator** |
| Creator switch | PASS | Click → `/creator` + **Switch to Member** again |
| Discord OAuth residual | PASS | Closed via Wave 27 Continue with Discord → AuthCallback (`prize262626`) |
| Unit | PASS | `authMatrix.security.test.ts` 7/7 |

**J7 multi-role / Discord OAuth residual:** PASS. Remaining J7: X/Twitter OAuth not soaked. Next: referral cash; Connect live transfers.

---

# Findings — Wave 27 J-DISCORD end-to-end 2026-10-05

Branch `test/world-ready-wave-27-j-discord`. Fixtures `j2creator` + Discord OAuth member `prize262626` on `combative-mongoose-559`. Portal app `1546839405245759508`.

| Step | Result | Evidence |
|------|--------|----------|
| Portal redirects | PASS | Auth + `…/discord/bot-install/callback` on combative-mongoose-559 ([Discord OAuth2](https://discord.com/developers/applications/1546839405245759508/oauth2)) |
| Bot install | PASS | `/creator/integrations` Add to Discord → authorize **Prizelet VIP** → `?discord=connected` |
| Role map | PASS | WAVE24 → **Monthly Pro** (“Role mapped”) |
| Member Discord login | PASS | Continue with Discord → subscriber `prize262626` / discordId set |
| Subscribe grant | PASS | Checkout `cs_test_a1at5i…` WAVE24 → `discordAccessGrants.status` **granted** |
| Cancel revoke | PASS | Manage cancel → grant **revoked** |
| Unit | PASS | `discord.security.test.ts` 3/3 |

**J-DISCORD:** PASS. Next: referral cash; Connect live transfers; J7 OAuth/multi-role residual.

---

# Findings — Wave 26 J2 featured exclusivity UI 2026-10-05

Branch `test/world-ready-wave-26-j2-featured`. Fixture `j2creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Bug | PASS (fix) | Create/edit form hard-coded `isFeatured: false` (wiped featured on every save) |
| Featured switch | PASS | Create Product Visibility → **Featured list price** switch |
| Create featured | PASS | **WAVE26 Featured Tier** $19.99 published with Featured badge |
| Exclusivity | PASS | Edit **WAVE24** → Featured on → only WAVE24 shows Featured; WAVE26 cleared |
| Public CTA | PASS | `/j2creator?demo=0` Subscribe **$14.99 / month** (featured price) |
| Unit | PASS | `productFeatured.test.ts` 3/3 |

**J2 featured exclusivity residual:** PASS. Next: J-DISCORD human OAuth; referral cash; Connect live transfers; J7 OAuth/multi-role residual.

---

# Findings — Wave 25 admin Lifetime from paymentEvents 2026-10-05

Branch `test/world-ready-wave-25-admin-lifetime`. Fixtures platform owner + `j4creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Unit | PASS | `payoutBalance.test.ts` 6/6 (cancelled-sub settled events still sum) |
| Convex push | PASS | `npx convex dev --once` → combative-mongoose-559 |
| Admin Lifetime | PASS | `/admin/payouts` **j4creator** Lifetime **$28.49** / Paid $28.49 / Available $0 (cancelled j4member sub) |
| Other rows | PASS | Prize $95 / j2creator $14.24 / QA Creator W3 $28.47 also from events |

**Admin Lifetime residual:** PASS (was active-subs-only). Next: J-DISCORD human OAuth; referral cash; J2 featured exclusivity; Connect live transfers.

---

# Findings — Wave 24 J3 paid unlock / cancel / pickTracker 2026-10-05

Branch `test/world-ready-wave-24-j3-paid-unlock`. Fixtures `j2creator` + `j3member+wave24@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Product recreate | PASS | **WAVE24 Monthly Access** $14.99 monthly on `j2creator` |
| Member signup | PASS | `j3member` / `j3member+wave24@example.com` → subscriber |
| Checkout | PASS | `cs_test_a13a8w85pXNh5Rc0WSUT8kBcms5hcO1f0RESywUzhKWO7RQaKnOnvD8moI`; card 4242; sub `sub_1UMytH…` ACTIVE |
| Paid unlock | PASS | `/dashboard?demo=0` shows **WAVE8_SECRET_BODY** + Lakers pick |
| Cancel | PASS | `cancelCreatorSubscription` → status **cancelled** / billingStatus canceled |
| Access lock | PASS | Feed empty: “Nothing in your feed yet”; no WAVE8 secret |
| pickTracker lock | PASS | Settled Win → Edit dialog Result combobox **disabled** |
| Cancel copy honesty | PASS (fix) | Manage UI said period-end; now says access ends **immediately** |

**J3 paid unlock residual:** PASS. Next: admin Lifetime metric; J-DISCORD human OAuth.

---

# Findings — Wave 23 J2 soft-archive with subscription 2026-10-05

Branch `test/world-ready-wave-23-j2-soft-archive`. Fixture `j4creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Delete with sub history | PASS | Delete **J4 Monthly Access** (cancelled sub row linked) → **Archived (1)** / All Products (0) |
| Public storefront | PASS | `/j4creator?demo=0` **No products yet** (list price CTA $11.99 remains) |
| Toast honesty | PASS (code) | UI uses `archived` return → “Product archived — subscribers keep access” |
| Unit | PASS | `productRemove.test.ts` 2/2 |

**J2 soft-archive residual:** PASS. Next: J3 paid unlock/cancel + pickTracker; admin Lifetime metric; J-DISCORD human OAuth.

---

# Findings — Wave 22 J-CONNECT residual honesty 2026-10-05

Branch `test/world-ready-wave-22-connect-residual`. Fixtures `j4creator` + platform owner on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Creator billing copy | PASS (fix) | Was “Payouts go to your connected Stripe account”; now **paid manually until Stripe Connect is enabled** |
| Creator payouts banner | PASS | `/creator/payouts?demo=0` ledger/manual until Connect; onboarding not available |
| Admin payouts | PASS | `/admin/payouts` “ledger only… until Stripe Connect is enabled” |
| Onboarding stub | PASS | `createConnectOnboardingLink` toast: Connect not enabled yet / manual payouts |
| Live Connect transfers | Residual | Not implemented — honesty PASS, capability still open P2 |

**J-CONNECT:** PASS (honesty). Next: J-DISCORD needs human Discord OAuth; other P2 residuals (soft-archive, paid unlock, Lifetime payout metric).

---

# Findings — Wave 21 J-SETTINGS / J-SMART-PRICING 2026-10-05

Branch `test/world-ready-wave-21-j-settings-smart-pricing`. Fixture `j4creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Smart pricing honesty | PASS | Copy: heuristic…**impact is directional only**; sellable prices → Products |
| Apply list price | PASS | `updateSettings` **$9.99 → $11.99**; Current list price shows $11.99 after reload |
| Settings 2FA stub | PASS | Enable 2FA → “Two-factor authentication setup is coming soon.” |
| Team invite stub | PASS | Send Invite → “Invite sent (preview)” / “Team invites are not wired to the backend yet.” |
| Access control | PASS | Limit subscriber count → **Max spots 100** on J4 Monthly Access |

**J-SETTINGS / J-SMART-PRICING:** PASS. Next: Connect residual honesty; J-DISCORD still needs human Discord OAuth.

---

# Findings — Wave 20 J-NOTIFICATIONS 2026-10-05

Branch `test/world-ready-wave-20-j-notifications`. Fixtures platform owner + `j4member` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Admin insert | PASS | `adminInsert` → `k97f919…` title **WAVE20_NOTIFY_TITLE** |
| Member inbox | PASS | `/dashboard/notifications` shows WAVE20 + message + “Payment of $29.99” |
| markRead | PASS | unreadCount **2 → 1** |
| Mark all read | PASS | unreadCount **0**; button disabled |
| Admin shared page | PASS | `/admin/notifications` Mark all read + payout alerts |

**J-NOTIFICATIONS:** PASS. Next: settings/smart-pricing honesty or Connect residual; J-DISCORD still needs human Discord OAuth.

---

# Findings — Wave 19 J-EVENTS today’s slate 2026-10-05

Branch `test/world-ready-wave-19-j-events`. Deployment `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Route restore | PASS (fix) | `/todays-events` was `<Navigate to="/" />`; now renders `TodaysEventsSection` |
| Empty state | PASS | “No events published for today yet” (stale seeded rows outside today) |
| Seed today | PASS | `seedTodayDev` → inserted **3** |
| Populated UI | PASS | Broncos/Chiefs Featured; Celtics/Knicks Starting Soon; Dodgers/Padres Upcoming |
| Unit | PASS | `events.test.ts` 2/2 (`todayBoundsMs`, no fake client games) |

**J-EVENTS:** PASS. Next: J-NOTIFICATIONS / settings honesty / smart pricing.

---

# Findings — Wave 18 F-010 signed webhook 2026-10-05

Branch `test/world-ready-wave-18-f010-webhook`. Target `https://combative-mongoose-559.convex.site/stripe/webhook`.

| Step | Result | Evidence |
|------|--------|----------|
| Signed delivery | PASS | `evt_wave18_292f5ef2530b1dc5` type `ping` → HTTP **200** |
| webhookReceipts insert | PASS | Row `p974wd00…` provider stripe / processed |
| Replay dedupe | PASS | Same event → HTTP 200; still **one** receipt for that eventId |
| Connect payouts | Residual | Admin copy: ledger only until Stripe Connect enabled |

**F-010:** PASS (webhook soak). Connect remains residual. World-ready still blocked by J-DISCORD + other P2s.

---

# Findings — Wave 17 J-DISCORD 2026-10-05

Branch `test/world-ready-wave-17-j-discord`. Fixture `j4creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Bot configured | PASS | `discord.queries.botStatus.configured === true` |
| Integrations UI | PASS | `/creator/integrations?demo=0` Connect Discord + unmapped J4 Monthly Access |
| startBotInstall | PASS | OAuth URL `client_id=1546839405245759508` → convex.site callback |
| HTTP callback | PARTIAL | No code → 302 `?discord=error`; guild token exchange not soaked |
| Cron | PASS | `retryPendingGrants` every 5m; unit 3/3 |
| Guild install + grant/revoke | BLOCKED | Requires interactive Discord OAuth in a real guild; not available in agent browser |

**J-DISCORD:** BLOCKED (honest). Next: F-010 webhook/Connect residual.

---

# Findings — Wave 16 J-ADMIN ops 2026-10-05

Branch `test/world-ready-wave-16-j-admin`. Platform owner `admin@prizelet.dev` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Overview | PASS | Executive dashboard — live Convex aggregates |
| Users list | PASS | `/admin/users` **22 loaded**; j4member / j4creator rows |
| Creators list | PASS | `/admin/creators` **9 loaded**; Top/Growing/At Risk strips |
| Platform fees | PASS | Volume $9.99; intro 5% / standard 10% breakdown |
| Reports export | PASS | Creators CSV → `creators_2026-10-04.csv` 1 KB in Recent Exports |
| Announcements | PASS | Copy: “Email outbox is not enabled yet”; in-app delivery |
| Alerts | PASS | Critical 1 / Warning 6; open cases + unread creator msgs |

**J-ADMIN:** PASS. Next: J-DISCORD / F-010.

---

# Findings — Wave 15 J-DEMO zero money writes 2026-10-05

Branch `test/world-ready-wave-15-j-demo`. Fixture `j4creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Demo banner | PASS | `/creator/payouts?demo=1` amber sample-preview copy |
| Demo Withdraw | PASS | Toast “Sample preview — payout not requested” |
| No money write | PASS | `payouts.listMine` count **2** before and after click |
| Demo modules | PASS | 23 `*Demo.ts` — no Convex money imports |
| Unit | PASS | `demo.security.test.ts` 2/2 |

**J-DEMO:** PASS. Next: J-ADMIN / J-DISCORD / F-010.

---

# Findings — Wave 14 J-FILES storage ACL 2026-10-05

Branch `test/world-ready-wave-14-j-files`. Fixtures `j4creator` / `j4member` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Unowned getUrl | PASS | Upload `kg2bkvwtb4mg8sese237tjrvbn8fm9gn` before register → `FORBIDDEN` @ storage.ts:56 |
| Owner register + getUrl | PASS | `registerOwnedFile` → `p57aez…`; URL `…/api/storage/0e74cb2e-…` |
| Foreign getUrl | PASS | `j4member` getUrl same id → `FORBIDDEN` @ storage.ts:59 |
| Unit | PASS | `files.security.test.ts` 4/4 |

**J-FILES:** PASS. Next: J-DEMO / J-ADMIN / J-DISCORD / F-010.

---

# Findings — Wave 13 J8 migration ETL 2026-10-05

Branch `test/world-ready-wave-13-j8-migration`. Deployment `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| importBatch internal-only | PASS | All exports `internalMutation`; secret-gated `FORBIDDEN_MIGRATION` |
| load helpers internal-only | PASS | `upsert*` / `countTable` are `internalMutation` |
| Client API exposure | PASS | No `api.migrations` / path refs under `src/` |
| MIGRATION_SECRET after cutover | PASS (fix) | Was set on Convex env; **unset** on combative-mongoose-559 |
| Unit | PASS | `migrations.security.test.ts` 3/3 |
| Historical data parity | Residual | ETL scripts deleted; greenfield — do not claim Supabase parity |

**J8:** PASS. Next: remaining residual journeys (J-ADMIN / J-DISCORD / J-FILES / J-DEMO) or F-010.

---

# Findings — Wave 12 J7 identity 2026-10-05

Branch `test/world-ready-wave-12-j7-identity`. Fixture `j4member+wave9@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Password login | PASS | Sign-in → `/dashboard` (“Good morning, j4member”) |
| Open redirect | PASS | `/login?returnTo=https://evil.example/phish` → post-login `http://127.0.0.1:8080/dashboard` (not evil) |
| Sign-out path | PASS | Log out → `/` immediately; no `/select-role` flash (creator + member) |
| Email change request | PASS | Request `j4member+wave12@example.com`; UI “Open email-change request”; Email Address still `j4member+wave9@…` |
| Roles / switchRole | PASS | Unit `roles.test.ts` + `safeReturnPath.test.ts` 19/19; `switchRole` no-ops unless role held |
| OAuth X/Discord | Residual | Buttons present on login; full OAuth callback not browser-soaked |
| Multi-role switcher UI | Residual | Fixtures single-role; RoleSwitcher not exercised in browser |

**J7:** PASS. Next: J8 migration ETL internal-only.

---

# Findings — Wave 11 J6 promo / links / referrals 2026-10-05

Branch `test/world-ready-wave-11-j6-promo`. Fixture `j4creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Promo create | PASS | `WAVE11OFF10` 10% / max 100 / expires 2027-12-31; Active codes **1** |
| Discount duration UI | PASS (fix) | Added once\|forever select; default expiry no longer stale 2025-03-31 |
| Tracking link create | PASS | `WAVE11 IG Bio` → `/go/jd75mwt8rh94cjfm1vbg0t0cas8fn21j` |
| `/go/` click + redirect | PASS | Redirect to `/j4creator`; row clicks **1** |
| Live `/go/` shortSlug bug | PASS (fix) | UI showed `/go/wave11-ig-bi` (invalid id); `shortPath` now uses document id for live |
| Signup `?ref=` | PASS | `Referred with code j4creator-jn79vx` |
| Commission honesty | PASS (fix) | Live referrals no longer show demo 20% / $10 as live settings |
| Unit | PASS | `promoCodes.test.ts` 4/4 |
| Subscribe conversion attribution | NOT_RUN | Click path verified; paid conversion not re-soaked |

**J6:** PASS. Next: J7 identity continuity.

---

# Findings — Wave 10 J5 payouts 2026-10-05

Branch `test/world-ready-wave-10-j5-payouts`. Fixture `j4creator+wave9@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Available balance (test Stripe) | PASS | `/creator/payouts?demo=0` Available **$28.49**; sandbox mode excluded by design; test mode counts |
| Below platform min blocks withdraw | PASS | Default min $50 → Withdraw disabled until settings min **$5** |
| Request reserves balance | PASS | Withdraw → Available **$0**; History `Requested` $28.49 (`h2n8fnb41`) |
| Admin reject (failed) | PASS | Mark failed → status `failed`; Available restored **$28.49** |
| Re-request + admin complete | PASS | Second request `n858fngdy` → Mark paid → `completed`; creator Paid **$28.49** |
| Paid ≠ reserved | PASS | While requested: Paid $0 / available $0; after complete: Paid $28.49 / in-progress $0 |
| Connect honesty | PASS | Admin copy: ledger only until Stripe Connect enabled |
| Unit matrix | PASS | `payoutBalance.test.ts` 5/5 |
| Admin Lifetime vs paymentEvents | Residual | Overview Lifetime from **active** subscriptions; cancelled j4member sub → Lifetime $0 while Paid $28.49 |

**J5:** PASS. Next: J6 promo / links / referrals.

---

# Findings — Wave 9 J4 messages / support / resolution 2026-10-05

Branch `test/world-ready-wave-9-j4-messages`. Fixtures `j4creator+wave9@example.com` / `j4member+wave9@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Creator support → admin reply | PASS | `WAVE9_*` support/growth threads; admin replies unread on creator |
| Resolution case | PASS | Creator case `md7934…` + admin `WAVE9_CASE_REPLY` |
| Stripe subscribe + product | PASS | Product `kx7c96…` **J4 Monthly Access** $29.99; member `n1788zg…` active then cancelled |
| Member → creator DM | PASS | `WAVE9_DM_BODY`; creator nav **Messages 1**; reply `WAVE9_CREATOR_REPLY` |
| Messaging off deny | PASS | Creator toggle off; member send kept draft, no new message |
| Cancel → DM deny | PASS | My Creators empty; send → `ConvexError: FORBIDDEN` toast |
| Unit matrix | PASS | `messaging.security.test.ts` 6/6 |
| Inbox messaging toggle (populated) | PASS (fix) | Toggle was empty-state only; added to main CreatorMessages header |

**J4:** PASS. Next: J5 payouts.

---

# Findings — Wave 8 J3 content access / pick lock / win rate 2026-10-05

Branch `test/world-ready-wave-8-j3-access`. Fixture creator `j2creator` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Publish premium pick | PASS | `J3 SECRET PICK Lakers ML` + `WAVE8_SECRET_BODY`; `isPremium: true` |
| Anonymous profile redaction | PASS | `/j2creator?demo=0` does not include WAVE8 bodies |
| Owner sees body | PASS | `/creator/posts?demo=0` shows WAVE8_SECRET_BODY |
| Settle + lock | PASS | Mark as won → Result **Won**; menu **Result locked**; `posts.result === "won"` |
| Win rate excludes push | PASS | Second post `J3 PUSH PICK` marked push; public Win Rate stays **100%** |
| Entitlement matrix | PASS (unit) | `contentAccess.test.ts` cancelled / past_due / cancel_pending / period end |
| Member-feed unlock / cancel | NOT_RUN | 0 subscriptions and 0 products on this fixture after J2 delete |
| pickTracker lock (session) | NOT_RUN | Code `RESULT_LOCKED` + CustomerResults disables result when settled; no subscriber session |

**J3:** PASS. Next: J4 messages / support / resolution.

---

# Findings — Wave 7 J2 product CRUD 2026-10-05


Branch `test/world-ready-wave-7-j2-products`. Fixture creator `j2creator` / `j2creator+wave7@example.com` on `combative-mongoose-559`.

| Step | Result | Evidence |
|------|--------|----------|
| Create product | PASS | **J2 Monthly Alpha** monthly $19.99, limited spots 100, public |
| Pin to profile | PASS | `showOnProfile: true`; Displayed Products strip |
| Edit | PASS | Price → $24.99 (`priceCents: 2499`) |
| Public profile | PASS | `/j2creator?demo=0` Subscribe $24.99 / month + Creator Products card |
| Delete (no subs) | PASS | Hard delete; catalog count 0 |
| Max 4 profile slots | PASS (unit + code) | `MAX_PROFILE_PRODUCTS` / `wouldExceedProfileSlots`; `setShowOnProfile` throws `PROFILE_SLOTS_FULL`; UI toast |
| Soft-archive with subscribers | NOT_RUN | Code path in `remove` when subscription linked; no paid sub on this fixture |

**J2:** PASS. Next: J3 content access / pick lock / win rate.

---

# Findings — Wave 6 F-010 webhook HTTP 2026-10-05

Branch `test/world-ready-wave-6-f010-webhook`. Target `https://combative-mongoose-559.convex.site/stripe/webhook`.

| Check | Result | Evidence |
|-------|--------|----------|
| Missing `stripe-signature` | PASS | HTTP 400 `Missing stripe-signature` |
| Forged signature | PASS | HTTP 400 Stripe constructEvent reject — `STRIPE_WEBHOOK_SECRET` is configured |
| Receipt dedupe helper | PASS | `isDuplicateWebhookReceipt` / `webhookReceiptKey`; `commerceIdentity.test.ts` 11/11 |
| Signed Stripe delivery → `webhookReceipts` | NOT_RUN | Stripe CLI unauthenticated; no local `sk_test`; cannot construct a valid `whsec` payload without echoing Convex secrets |
| Connect payouts | NOT_RUN | Separate residual |

F-010 remains **PARTIAL**. Next: Stripe Dashboard destination or `stripe listen --forward-to …convex.site/stripe/webhook`, then J2 product CRUD.

---

# Findings — Wave 5 J1 / F-010 Stripe soak 2026-10-05

Branch `test/world-ready-wave-5-j1-stripe`. Dev Convex `combative-mongoose-559`, Stripe test Checkout (Prizlett sandbox).

| Step | Result | Evidence |
|------|--------|----------|
| Creator publish | PASS | `@prize2626` published; product **Monthly pro** $100 |
| Member signup | PASS | `j1member` / `j1member+wave5@example.com` → subscriber role |
| Checkout | PASS | `createCheckoutSession` → `cs_test_a171BP4bJzrvM8pRX5c7xvgaScFUnfjkraXVlSBBbIFzb8Zxz6spGJWgXJ`; card 4242 |
| Fulfill / ACTIVE | PASS | Success page; sub `mn7bg36b7xe76gkxyaeq0caaph8fnhyh` ACTIVE; My Creators `?demo=0` shows Prize |
| Ledger charge | PASS | `paymentEvents` `subscription_charge` $10000 `paymentMode:test` `commercialRef:checkout:cs_test_a171…` |
| Cancel + access lock | PASS | `cancelCreatorSubscription` → status `cancelled` / billingStatus `canceled`; My Creators empty; `subscription_cancel` event |
| Async webhook receipt | FAIL (this soak) | No new `webhookReceipts` row for this session; fulfillment via `confirmCheckoutSession` |
| Connect payouts | NOT_RUN | Out of this wave |

**J1:** PASS (client confirm path). **F-010:** PARTIAL (webhook async + Connect residual). Section 8 world-ready gate still blocked until webhook delivery proven and remaining journeys pass. No prod deploy.

Next: finish F-010 webhook delivery / Connect, or J2–J8 authenticated journeys.

---

# Findings — Wave 4 F-012 admin joins 2026-10-05

Branch `fix/world-ready-wave-4-f012`. Closed unbounded `.collect()` on `listUsersPage` / `listCreatorsPage`. Indexed enrichments use `.take(ADMIN_JOIN_LIMIT)` (200, clamped to 500).

Residual P3: spend/sub counts undercount if a user/creator has >200 related rows. `listCustomersPage` still uses `adminScanAll` (5k).

`adminLists.test.ts` covers join cap math. Next: F-010 / J1 Stripe soak or authenticated journeys.

---

# Findings — Wave 3 F-015 tsc 2026-10-05

Branch `fix/world-ready-wave-3-tsc`. Closed F-015: `npx tsc -b` now exits 0.

Fixes: `replaceAll` → ES2020-safe replace; payouts `SelectTrigger`/`Input` invalid `size`; products `never` false-branch; unreachable Settings integrations panel (redirect to `/creator/integrations` remains); Seo `description` on manage-subscription.

`npm test` includes `paymentFeeDetail.test.ts`. Next cluster: F-012.

---

# Findings — Wave 2 e2e 2026-10-04

Branch `test/world-ready-wave-2-e2e`. `npm run test:e2e`: **18 passed**, 6 skipped (world-ready surface spec Chromium-only; WebKit/Firefox still run J9 + browser-matrix).

- Public + demo routes: HTTP <500, no ErrorBoundary text.
- Protected routes (anonymous): navigate to `/login`.
- J9 PASS. J1–J8 / Stripe soak **NOT_RUN**.

---

# Findings — Wave 1 retest 2026-10-04

Campaign: world-ready Wave 1 (static + unit). Branch `chore/world-ready-wave-1-audit` atop `ab53b2d`. No product code changes this wave.

| ID | Result | Evidence |
|----|--------|----------|
| QA-W1-01 | **PASS (unit)** | `isDevAdminGrantAllowed` requires `ALLOW_DEV_ADMIN_GRANT===true` **and** allowlisted email. `grantTestAdmin` also calls `assertProductionSafeEnv()`. Tests in `src/lib/authMatrix.security.test.ts`, `src/lib/envGuards.test.ts`. Residual: emails still in source; must stay unset on prod. |
| QA-W1-02 | **PASS (router)** | `ProtectedRoute` always uses DB `roles` (`src/components/ProtectedRoute.tsx`). Residual P3: `AuthContext` `setDevRole` / `hasRole` still honor `import.meta.env.DEV` (stripped in production `vite build`). |
| QA-W1-03 / F-008 | **PASS (static)** | `files/storage.getUrl` throws `FORBIDDEN` when no `fileAssets` row or owner mismatch. Runtime soak still Wave 2 (`J-FILES`). |
| F-001 | **PASS** | Server `isSandboxEnabled` / `assertProductionSafeEnv`; client `VITE_ALLOW_SANDBOX_CHECKOUT` refused in production `publicEnv`. Vitest PASS. |
| F-002 | **PASS** | `createSubscriptionRecord` is `internalMutation`. |
| F-003 | **PASS** | Public `subscriptions.setStatus` is `requireAdmin` + `assertSubscriptionStatusTransition`. Owner activate blocked in unit tests. |
| F-004 | **PASS** | `listPreviewsByCreator` uses `getAuthUserId(ctx)`, not JWT subject. |
| F-005 | **PASS** | `migrations/importBatch` + `migrations/load` are `internalMutation` + `MIGRATION_SECRET`. |
| F-009 | **PASS (unit)** | `payoutBalance` reserved vs paid-out; Vitest 5/5. Live UI reconcile is Wave 2 J5. |
| F-010 | **NOT_RUN (soak)** | Webhook HTTP + `fulfillWebhook` exist. Stripe test-card soak / Connect payouts not executed this wave. |
| F-012 | **PARTIAL** | List UIs use cursor pagination; aggregates `adminScanAll` cap 5k. Residual: per-user `.collect()` joins inside `admin/paginatedLists.listUsersPage`. |
| F-015 | **FAIL (`tsc`)** | `npm run lint`: 0 errors, 28 warnings. `npm run build` (Vite) PASS. `npx tsc -b`: errors in `paymentFeeDetail.ts`, `CreatorPayouts.tsx`, `CreatorProducts.tsx`, `CreatorSettings.tsx`, `CustomerManageSubscription.tsx`. Not fixed in Wave 1 (not a P0 one-liner). |
| Discord cron | **PASS (static)** | `convex/crons.ts` every 5m → `retryPendingGrants`. Runtime soak Wave 2. |
| Stale docs | **PASS (this campaign)** | Master prompt + ledger prefer live Convex/Stripe; Wave 0 froze surfaces. |

Tooling 2026-10-04: `npm test` 23 files / 134 tests PASS. `npm run env:validate` PASS (local). `npm run test:e2e` deferred to Wave 2 (merge-before-next).

---

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
| F-012 | P2 | **PARTIAL (W21)** | List UIs paginated; dashboard/finance/fees/alerts use exact scans (50k safety); Reports + some payout joins residual |
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
| Preconditions | Account email is `admin@prizelet.dev` or `test@prizelet.dev`, or `ALLOW_DEV_ADMIN_GRANT=true` |
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
| Preconditions | Fresh signup `qa.creator.w2.20260906@prizelet.test` / `qacreator926` |
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
- Browser verify: `qa.creator.fix.1101@prizelet.test` → `/creator/onboarding` PASS

---

# Wave 3 additions (2026-09-06)

## J1 commercial lifecycle (browser) — PARTIAL PASS

| Step | Result | Evidence |
|------|--------|----------|
| Creator signup + select Creator | PASS | `qa.creator.fix.1101@prizelet.test` / `@qacreator1101` |
| Onboarding + publish | PASS | Public `/qacreator1101` with Subscribe CTA |
| Member signup + select Subscriber | PASS | `qa.member.w3.1101@prizelet.test` → `/dashboard` |
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

## Gate (after Wave 21)

```text
NOT READY
```

Remaining: J8 BLOCKED; Admin Reports + residual payout joins; referral cash commission; Aggregate component at very large scale.

## QA-W21-F012 — Exact admin aggregates

| | |
|--|--|
| Category | Scale / admin |
| Severity | **P2** |
| Layer | Convex + UI |
| Finding | Dashboard / Finance / Fees / Alerts used 500-row takes; email/messaging loaded full joins |
| Fix | `adminScanAll` (5k/table take) + `financeOverview` / `feesOverview` / `alertsOverview`; raised `dashboardStats`; server-side announcement audience; paginated campaigns/creators/messaging |
| Residual | Admin Reports CSV path; Admin Payouts balance panel still uses capped lists |

## QA-W20-F012 — Admin pagination residual

| | |
|--|--|
| Category | Scale / admin |
| Severity | **P2** |
| Layer | Convex + UI |
| Finding | Customers, Cases, Growth inbox, Transactions still used `listAllAdmin` / full joins |
| Fix | `listCustomersPage` / `listCasesPage` / `listSupportMessagesPage` / `listTransactionsPage` + Load more |
| Residual | Finance / Fees / Alerts / Reports / Customer Email / Creator Messaging + `dashboardStats` |

## QA-W19-F012 — Admin cursor pagination

| | |
|--|--|
| Category | Scale / admin |
| Severity | **P2** |
| Layer | Convex + UI |
| Finding | Wave 13 capped takes at 500; list UIs still loaded full arrays client-side |
| Fix | `listUsersPage` / `listCreatorsPage` / `listPayoutsPage` + `usePaginatedQuery` on Admin Users, Creators, Payouts history |
| Residual | Other admin pages + `dashboardStats` still use `adminTakeNewest` |

## QA-W18-J7 — Identity cross-device continuity

| | |
|--|--|
| Category | Identity |
| Severity | **P2** |
| Layer | Unit + browser |
| Finding | Login destination depended on localStorage preferred; empty storage → `/select-role` even with DB roles |
| Fix | `refreshRole` returns active role; login uses `homePathForRole(active)`; SelectRole redirects when roles exist |
| Unit | `roles.test.ts` — 4 PASS |
| Browser | Cleared `prizelet.activeRole` → creator login lands `/creator`; `/select-role` redirects to creator home |

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
