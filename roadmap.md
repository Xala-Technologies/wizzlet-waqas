# Wizzlet Roadmap

## Open Tasks
- [ ] Non-functional controls left: Admin Users/Customers row actions, Creator Settings Discord/X connect, CSV import buttons (creator tracker + My Results), 2FA setup.
- [ ] Customer emails are delivered as in-app announcements; hook up a real email provider for inbox delivery.
- [ ] No pagination on admin tables (Supabase caps unranged selects at 1000 rows → silently wrong totals at scale).
- [ ] Dev Quick Test login grants admin+creator+subscriber and is visible in production builds — gate it before launch.
- [ ] Enable workspace Git access so GitHub project sync can be connected (requires workspace owner/admin action in Lovable settings).
- [ ] Creator Earnings monthly chart / recent payments still partly illustrative.
- [ ] Admin overview charts (Monthly Revenue, Platform Fees, Creator/Customer Growth) are hardcoded arrays — derive from transactions.
- [ ] Customer signup list shows "Unknown" — backfill display names on the users record.

## Completed
- [x] Creator Messages is a real subscriber DM inbox (`direct_messages`) with a persisted per-creator messaging on/off switch; subscribers can message creators from Subscriptions & Billing.
- [x] Personal Growth Manager runs on live 30-day metrics (earnings, churn, conversion, win rate, performance score) with a real two-way thread into the Admin Growth Manager Inbox.
- [x] Admin Platform Settings persist to `platform_settings` (fees, payout rules, branding, feature switches) and admin password change works.
- [x] Admin Fees "Save" now writes the live fee rules, and the subscription fee trigger reads those rules instead of hardcoded rates.
- [x] Admin Customer Email computes real audience sizes, logs campaigns to `email_campaigns`, and delivers announcements as in-app notifications.
- [x] Creator power pages wired to live data: Links (`creator_links`), Promo Codes (`promo_codes`), Referrals (`referrals` + per-creator referral code), Access Control (product spot limits/close), Payouts (`payouts` + `creator_payout_settings`, payout requests), Smart Pricing (suggestion derived from win rate, view→sub conversion and market average).
- [x] Resolution Center is a real two-sided case system (`resolution_cases` + threaded messages) for creators and admins.
- [x] Admin Creator Messaging and Growth Manager Inbox run on `support_messages` with unread tracking and replies.
- [x] Admin Alerts derives every item from live data (failed payments, open cases, unread messages, pending payouts, unpublished/inactive creators).
- [x] QA pass (deep test): creator-role accounts without a creator profile are now redirected to `/creator/onboarding` instead of hitting 406s and empty pages; onboarding invalidates the guard cache and lands on `/creator`.
- [x] Replaced `.single()` with `.maybeSingle()` across all lookup queries (removes 406 responses).
- [x] Fixed 403 on dev role assignment (upsert now uses ignoreDuplicates; user_roles has no UPDATE policy).
- [x] Admin Fees "Fee Earnings by Creator" now shows the effective rate from real billed amounts instead of re-guessing from account age.
- [x] Fixed dead demo links (`/demo/member/subscriptions`, `/demo/member/content`).
- [x] Member surface is fully backend-backed: Subscriptions & Billing, Saved, Notifications, Discover, Activity, Settings now query live data with loading/empty states and optimistic updates.
- [x] Feed "Save" persists to `saved_posts`; creator bookmarks persist to `creator_bookmarks`.
- [x] Member notification preferences stored on `users.notification_prefs`; password change via Auth.
- [x] `/dashboard/activity` routed and linked; notifications sidebar badge shows the real unread count (realtime).
- [x] Leaked-password protection enabled on Auth.
- [x] Deterministic role resolution for multi-role accounts (admin > creator > subscriber) with persisted active role.
- [x] Role switcher in all three sidebars for accounts holding multiple roles.
- [x] ProtectedRoute now authorises on all held roles instead of a single arbitrary one.
- [x] `/admin/users` surfaced in the admin sidebar as "All Accounts".
- [x] Removed orphaned creator routes/pages (Content, Promotions, Bundles, Content Insights, Leaderboard) and the dashboard links pointing at them.
- [x] DashboardLayout reuses MemberSidebar instead of a duplicate nav; theme toggle now present in all three sidebars.
- [x] Role selection uses upsert so re-selecting a role can't fail on the unique constraint.
- [x] Analytics no longer fires rejected (401) inserts for signed-out visitors.

## Security
- [x] Revoked anonymous access to private tables (activity, bookmarks, notifications, pick tracker, saved posts, subscriptions, roles, users) and all anon writes
- [x] Revoked direct execute on internal trigger functions
- [ ] Remaining linter warnings are intentional: public browsing of creators/posts/products, authenticated table visibility (RLS-protected), has_role + get_creator_post_previews must stay callable

## Demo dashboards (Owner / Creator / Customer) — done
- Owner: overview, creators, users, transactions, fees, settings all wired to a session-persisted demo store (approvals, feature/disable, deactivate, refunds, fee recalculation, editable platform settings, reset).
- Creator: 9 query-param tabs wired to demo store (publish, settle, products, subscribers, promos, messages, earnings, settings).
- Customer: feed, results, saved, notifications, discover, activity, settings, subscriptions wired to shared member store.
- Form labels now linked to inputs (htmlFor/id) on demo settings + fee forms.

### Still open (production surfaces)
- 39 security-linter warnings
- Access-control subscriber counts approximate (price matching)
- Creator Earnings chart / recent payments still illustrative
- Customer email sends in-app notifications only (no external provider)
- [x] Member demo tabs share one live store (DemoMemberProvider): sidebar unread badge, subscriptions, spend and gating update instantly; cancelling a subscription is confirmed everywhere; removed orphaned demo billing/content pages.

## QA sweep — full application audit (Sep 2026)
- 76 route × viewport checks (desktop 1280 + mobile 390): 0 crashes, 0 horizontal overflow, 0 real console errors, no blank pages.
- Flow tests: subscribe/cancel (with confirm dialog), notifications mark-all-read, admin refund confirm, fee validation (>50%, intro>standard), creator profile validation (short/invalid username), 404, demo-mode entry — all pass.
- Fixed: every public page now has a unique title, meta description, canonical, OG/Twitter tags (`src/components/Seo.tsx`); auth/404/unknown-creator pages set noindex; creator profiles get dynamic metadata.
- Fixed: accessible names on the mobile nav toggle, notifications link and tracker remove buttons (0 unnamed buttons app-wide).
- Fixed: 404 page redesigned on-brand with Browse creators / Back home.
- Refactor: odds parsing/conversion de-duplicated into `src/lib/odds.ts` (was copied in 4 files) with 13 unit tests. Suite: 18 tests green. Typecheck clean.

## Accessibility review (WCAG 2.1 AA sweep)
- Audited 31 routes for unlabeled controls, unlabeled inputs, missing alt, landmarks, heading order, tap targets.
- Critical fixed: 16 unlabeled Radix `Switch` toggles across admin/creator/member settings, products, promo codes and access control now carry `aria-label`; 10 icon-only bookmark buttons on Discover, 7 remove-pick buttons and the saved-page remove button now named.
- Warning fixed: every public/auth/404/creator-profile page now has exactly one `<main id="main-content">` landmark; heading-level skips (h1→h3) removed on /network, member results and saved; tap targets under 24px enlarged with padding on feed actions, icon buttons, sortable table headers and footer links.
- Added: keyboard skip-to-main-content link in the navbar (verified: first Tab focuses it, Enter jumps to `#main-content`).
- Clean: 0 images without alt, 0 unlabeled inputs, 0 click handlers on non-interactive elements, 0 positive tabIndex, no autoFocus, `lang` set on `<html>`.
- 76-route crawl still 0 issues; 18 unit tests green; typecheck clean.
