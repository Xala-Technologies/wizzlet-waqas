# Investigation Response (required first deliverable)

Supabase management access is **unavailable**. Authoritative DB target: **Convex** (`combative-mongoose-559`). Full detail: files `00`–`12` in this folder.

## 1. Application Architecture

Vite + React SPA. Roles: admin, creator, subscriber. Auth via Supabase Auth JWT → Convex. Storage (avatars) still Supabase-oriented. Data cutover: `VITE_DATA_BACKEND` defaults to **convex**.

## 2. Product Domain Map

Identity · Creators/products · Posts/picks · Subscriptions/payments · Payouts · Messaging/support · Admin/platform · Notifications · Sport events · Demo mode.

## 3. Feature Inventory

See `01-application-feature-map.md`.

## 4. End-to-End Workflows

Signup → role → creator onboard / subscribe → feed → picks → payouts → admin fees/campaigns.

## 5. Current Database Inventory

Convex schema covers core tables; legacy Postgres mirrored in `supabase/migrations` (read-only inventory). See `03`.

## 6. Feature→DB Matrix

See `04`. Highlights: many pages were PostgREST; several KPIs MOCKED; notifications INCORRECT IDs; events MISSING.

## 7–8. Gaps & Mocks

See `05`. CRITICAL: PostgREST dependency without access; dual ID; notification delivery. HIGH: fake dashboards, mock creators, payout toast-only, result vocab, no productId, hardcoded events.

## 9–10. Data model & security problems

Dual ID, missing FKs in app layer historically, money as dollars in Postgres vs cents in Convex, RLS on dead Postgres. Convex auth via JWT + role helpers.

## 11–12. Target architecture + ERD

See `06-target-data-model.md` (includes Mermaid ERD).

## 13–15. Migration, risk, order

See `09`, `12`. Implement against Convex only; no live Supabase DDL.
