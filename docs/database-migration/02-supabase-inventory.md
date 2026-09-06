# Supabase Inventory

## Services

| Service | Status | Action |
|---------|--------|--------|
| Database | 22 tables | → Convex |
| Auth | In use | KEEP |
| Storage | avatars, banners | KEEP |
| Realtime | notifications only | → Convex reactive query |
| Edge Functions | sandbox-checkout + Stripe stubs | → Convex payments action |
| RLS | ~90 policies | → Convex `require*` helpers |
| Triggers | handle_new_user, fee, updated_at | → Convex mutations |
| RPC | get_creator_post_previews | → Convex query |
| Cron / DB webhooks | None | N/A |

## Tables

`users`, `user_roles`, `creators`, `posts`, `subscriptions`, `analytics_events`, `products`, `pick_tracker`, `notifications`, `saved_posts`, `creator_bookmarks`, `payouts`, `creator_links`, `promo_codes`, `referrals`, `creator_payout_settings`, `resolution_cases`, `resolution_case_messages`, `support_messages`, `platform_settings`, `direct_messages`, `email_campaigns`

## SQL functions

- `has_role` — SECURITY DEFINER role check
- `handle_new_user` — auth signup → `users` row
- `calculate_platform_fee` — subscription fee split
- `get_creator_post_previews` — redacts premium content
- `update_updated_at_column`

## Edge functions

| Name | JWT | Behavior |
|------|-----|----------|
| sandbox-checkout | true | Mint/cancel subs if `ALLOW_SANDBOX_CHECKOUT` |
| stripe-webhook | false | Fail-closed 501 |
| create-checkout-session | true | 501 stub |
| create-connect-account | true | 501 stub |
| create-customer-portal | true | 501 stub |

## Hardening

Local migration `20260904143000_security_hardening_rls.sql` locks admin self-grant, client subscription INSERT, notification spam, referrals, users SELECT. Remote apply must be verified separately; Convex authz must match or exceed it.
