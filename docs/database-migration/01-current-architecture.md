# Current Architecture

## Runtime

- **Frontend:** Vite + React Router SPA
- **Auth:** Supabase Auth (email/password)
- **Data:** Supabase PostgREST from browser (`@/lib/supabase`)
- **Payments (today):** `sandbox-checkout` edge function + `subscriptions` rows
- **Storage:** buckets `avatars`, `banners`
- **Realtime:** one `postgres_changes` channel on `notifications`
- **Project:** `nwthxghkmbukrlifkdoy`

## Identity model (critical)

```text
Supabase Auth user.id  (auth uid)
        ↓ users.auth_id
public.users.id        (app user id — used by most FKs)

user_roles.user_id   = auth uid (exception)
pick_tracker / some bookmarks historically filtered by auth uid (inconsistent)
```

## Role model

Roles: `admin` | `creator` | `subscriber` (+ legacy enum values `moderator`, `user`).  
UI precedence: admin > creator > subscriber. Guards in `ProtectedRoute` + `AuthContext`.

## Money path

1. Client invokes `sandbox-checkout` (gated).
2. Service role inserts/updates `subscriptions`.
3. Trigger `calculate_platform_fee` sets `fee_percentage`, `platform_fee`, `creator_earnings` from `platform_settings`.

Live Stripe edge functions exist as fail-closed stubs (501).

## Git

- Day-to-day: `dev`
- Stable: `production` (GitHub default)
