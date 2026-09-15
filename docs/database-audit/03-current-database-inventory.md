# Current Database Inventory

Source: `supabase/migrations/*` + `src/integrations/supabase/types.ts` + deployed `convex/schema.ts`.  
Live Supabase not queried (no access).

## Tables (22 product)

All 22 tables are referenced from `src/`. None are unused.

See types.ts for columns. Notable:

| Table | Used? | Correct? | Problems |
|-------|-------|----------|----------|
| users | Yes | Partial | dual-ID confusion with auth |
| user_roles | Yes | Partial | user_id = auth.uid historically |
| creators | Yes | Yes | username nullable in PG |
| posts | Yes | Partial | free-text content; result vocab |
| products | Yes | Partial | no link from subscriptions |
| subscriptions | Yes | Partial | no product_id; client insert hardened |
| pick_tracker | Yes | Partial | win/loss vs won/lost; no post_id FK |
| notifications | Yes | Incorrect | dual-ID write bug from admin email |
| payouts | Yes | Partial | creator request doesn’t create row |
| platform_settings | Yes | Yes | singleton |
| creator_links | Yes | Partial | clicks never incremented in UI |
| Others | Yes | Mostly OK | — |

## Missing entities (app needs, no table)

- Sport events / slate (`lib/events.ts`)
- Payment/transaction ledger (admin transactions ≈ subscriptions)
- Creator verification record
- Post↔product association
- Webhook/event idempotency store (for future Stripe)

## Convex coverage

Convex mirrors all 22 domains + `migrationCheckpoints` + `mutationLog`. Money in **cents**. Authz helpers exist; SPA not fully wired.
