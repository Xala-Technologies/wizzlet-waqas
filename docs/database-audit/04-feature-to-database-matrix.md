# Feature → Database Matrix

| Feature | Persistence | Status |
|---------|-------------|--------|
| Login / signup | Auth + users trigger | COMPLETE (if Supabase Auth live) |
| Select role | user_roles / Convex | COMPLETE |
| Creator onboarding | creators + storage | COMPLETE |
| Public profile + premium redact | posts + RPC/entitlements | PARTIAL (RPC→Convex) |
| Sandbox subscribe | subscriptions + fees | PARTIAL (edge/Convex) |
| Member feed / saves | posts, saved_posts, bookmarks | COMPLETE (legacy PostgREST) |
| Pick tracker CRUD | pick_tracker | PARTIAL (vocab; dual-ID OK for auth uid) |
| Notifications inbox | notifications | INCORRECT (admin campaign IDs) |
| Billing history UI | synthesized | MOCKED |
| Creator posts | posts | PARTIAL (product targeting UI not saved) |
| Products / promos / links | tables | PARTIAL (link clicks) |
| Referrals | referrals | COMPLETE (list); signup attribution weak |
| Earnings charts / recent payments | hardcoded | MOCKED |
| Payout settings | creator_payout_settings | COMPLETE |
| Payout request | support_messages only | PARTIAL / fake success |
| DMs / support / cases | tables | COMPLETE |
| Admin dashboard KPIs | mixed | PARTIAL + MOCKED |
| Admin fees/settings | platform_settings | COMPLETE |
| Customer email campaign | email_campaigns + notifications | INCORRECT delivery |
| Landing creators / events | mock arrays | MOCKED / FRONTEND-ONLY |
| Demo mode | sessionStorage | VALID_DEMO |
| Discover/Network/Community stubs | static copy | FRONTEND-ONLY |
| Analytics track | analytics_events | COMPLETE |
| Today’s events | lib/events | MISSING |
| Verification badges | computed | FRONTEND-ONLY |
| Access control product match | price equality | INCORRECT |
