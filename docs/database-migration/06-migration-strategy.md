# Migration Strategy

## Principles

Safe + measurable + reversible. Domain-based PRs on `dev`. No production DROP/TRUNCATE.

## Phases

0. Documentation (this folder)
1. Convex schema + auth bridge (no SPA cutover)
2. Identity (users, roles, ensureUser)
3. Creators / products / posts + entitlements
4. Subscriptions + fee logic + sandbox payment action
5. Member + messaging + admin domains
6. ETL + validation + shadow reads + flagged cutover

## Feature flag

`VITE_DATA_BACKEND=supabase|convex` (default `supabase` until cutover).

## Payments

No dual-write for subscribe/cancel. Historical migrate → validate → atomic write-path switch.

## Adapters

`src/data/*` wraps Supabase or Convex so page rewrites stay incremental.
