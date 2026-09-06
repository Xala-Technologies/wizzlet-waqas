# Schema Mapping — Postgres → Convex

## Conventions

| Postgres | Convex |
|----------|--------|
| `uuid` PK | `_id` + `legacyId: string` |
| `timestamptz` | `createdAt` / `updatedAt`: number (ms UTC) |
| `numeric` money | `amountCents: number` (integer minor units) |
| `snake_case` | `camelCase` |
| `auth.users.id` ref | `externalAuthId` on `users` |
| `users.id` FK | `v.id("users")` |
| jsonb prefs | typed object validators |

## Table map

| Supabase | Convex table |
|----------|--------------|
| users | users |
| user_roles | userRoles |
| creators | creators |
| posts | posts |
| products | products |
| subscriptions | subscriptions |
| analytics_events | analyticsEvents |
| pick_tracker | pickTracker |
| notifications | notifications |
| saved_posts | savedPosts |
| creator_bookmarks | creatorBookmarks |
| payouts | payouts |
| creator_links | creatorLinks |
| promo_codes | promoCodes |
| referrals | referrals |
| creator_payout_settings | creatorPayoutSettings |
| resolution_cases | resolutionCases |
| resolution_case_messages | resolutionCaseMessages |
| support_messages | supportMessages |
| platform_settings | platformSettings |
| direct_messages | directMessages |
| email_campaigns | emailCampaigns |

## ID strategy

- Every migrated document: `legacyId` (original UUID), indexed unique where applicable.
- Deterministic maps during ETL: `legacyUuid → Id<"table">`.
- Roles: after migration, `userRoles.userId` → `Id<"users">` (DEC-005); lookup via `users.externalAuthId`.

## Money

Convert `numeric` dollars → cents: `Math.round(Number(x) * 100)`. Reconcile SUM(amount), SUM(platform_fee), SUM(creator_earnings) in major units from source vs cents/100 in Convex.
