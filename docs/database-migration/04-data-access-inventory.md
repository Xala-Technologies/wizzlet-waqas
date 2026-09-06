# Data Access Inventory

## Client entrypoints

- `src/integrations/supabase/client.ts`
- `src/lib/supabase.ts` (re-export)
- Direct imports in `CustomerResults`, `CreatorPerformanceTracker`, `lib/stripe.ts`

## Auth / roles

`AuthContext`, `Login`, `Signup`, `SelectRole`, `ProtectedRoute`, `lib/roles.ts`

## High-traffic tables

| Table | Primary callers |
|-------|-----------------|
| users | hooks, admin, creator resolve |
| creators | profile, dashboards, admin |
| posts | creator posts, feeds, profile RPC |
| subscriptions | billing, earnings, admin finance |
| products | pricing cards, access control |
| pick_tracker | CustomerResults, CreatorPerformanceTracker |
| notifications | MemberSidebar, CustomerNotifications |
| saved_posts / bookmarks | Dashboard, Saved, Discover |

## RPC

- `get_creator_post_previews` — `CreatorProfile.tsx` only

## Edge

- `sandbox-checkout` — `lib/stripe.ts` subscribe/cancel

## Realtime

- `MemberSidebar` channel `member-notifications`

## Migration target pattern

Introduce `src/data/*` adapters + `VITE_DATA_BACKEND` so pages migrate in clusters without a big-bang rewrite.
