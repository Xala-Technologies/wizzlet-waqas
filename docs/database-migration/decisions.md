# Decision Log

## DEC-001 — Keep Supabase Auth

**Context:** Full auth rewrite multiplies risk.  
**Options:** Keep Auth / migrate to Convex Auth / Clerk.  
**Chosen:** Keep Supabase Auth; map `subject` → `users.externalAuthId`.  
**Risks:** Dual systems until later auth project.  
**Rollback:** Unaffected.

## DEC-002 — Keep Supabase Storage

**Context:** Only avatars/banners.  
**Chosen:** Keep buckets; store public URLs on Convex `creators`.  
**Rollback:** Unaffected.

## DEC-003 — legacyId on every migrated row

**Context:** Need reconciliation and support.  
**Chosen:** `legacyId` + indexes; retain through stabilization.  
**Rollback:** Enables reverse correlation.

## DEC-004 — No dual-write for payments

**Context:** Subscribe/cancel are side-effectful.  
**Chosen:** Migrate history → validate → atomic write switch.  
**Risks:** Brief write freeze at cutover.  
**Rollback:** Re-point payment client to sandbox edge.

## DEC-005 — Normalize roles to Convex user ids

**Context:** Today `user_roles.user_id` = auth uid.  
**Chosen:** Convex `userRoles.userId` → `Id<"users">`; resolve auth via `externalAuthId`.  
**Risks:** ETL must join auth uid → users correctly.  
**Rollback:** Document mapping tables.

## DEC-006 — Money as integer cents

**Context:** Floating point unsafe.  
**Chosen:** `amountCents`, `platformFeeCents`, `creatorEarningsCents`.  
**Rollback:** Convert back with `/100` for Supabase numeric if needed.

## DEC-007 — Default backend remains Supabase until flag flip

**Chosen:** `VITE_DATA_BACKEND` defaults to `supabase`. Convex ships dark until intentional cutover.
