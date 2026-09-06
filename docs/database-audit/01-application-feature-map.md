# Application Feature Map

## User types

| Role | Capabilities |
|------|----------------|
| Anonymous | Marketing pages, public creator profiles, signup/login |
| Subscriber | Feed, saves, discover, pick tracker, billing UI, notifications, DMs to creators |
| Creator | Onboarding, posts, products, subscribers, promo, links, referrals, earnings, payouts, messages, cases, settings |
| Admin | Users/creators, finance, fees, payouts, messaging, campaigns, resolution, reports, platform settings |
| Demo visitor | Full UI walkthrough via `/demo/*` (sessionStorage only) |

## Feature inventory

| Feature | Routes | Persistence status |
|---------|--------|-------------------|
| Auth (email/password) | `/login`, `/signup` | Supabase Auth |
| Role selection | `/select-role` | `user_roles` / Convex `userRoles` |
| Creator onboarding | `/creator/onboarding` | `creators` + Storage |
| Public creator profile | `/:username` | `creators`, `posts`, `products`, `subscriptions` |
| Sandbox subscribe | profile / pricing cards | edge or Convex payments |
| Member feed | `/dashboard` | posts + bookmarks |
| Pick tracker | `/dashboard/results`, `/creator/performance-tracker` | `pick_tracker` |
| Saved / discover | `/dashboard/saved`, `/discover` | bookmarks tables |
| Notifications | `/dashboard/notifications` | `notifications` |
| Creator posts CRUD | `/creator/posts` | `posts` (content blob) |
| Products | `/creator/products` | `products` |
| Promo codes | `/creator/promo` | `promo_codes` |
| Tracking links | `/creator/links` | `creator_links` |
| Referrals | `/creator/referrals` | `referrals` + `referral_code` |
| Earnings / payouts | `/creator/earnings`, `/payouts` | mixed real + fake |
| DMs | `/creator/messages` | `direct_messages` |
| Resolution cases | `/creator/resolution-case`, `/admin/resolution-cases` | cases + messages |
| Support/growth chat | admin + creator payout request | `support_messages` |
| Admin finance | `/admin`, `/admin/finance` | mixed |
| Platform fees/settings | `/admin/fees`, `/admin/settings` | `platform_settings` |
| Email campaigns | `/admin/customer-email` | campaigns + broken notifications |
| Today’s events | `/todays-events` | **FRONTEND-ONLY** hardcoded |
| Landing creators | `/`, `/creators` | **MOCKED** |
| Demo mode | `/demo/*` | sessionStorage — VALID_DEMO |
