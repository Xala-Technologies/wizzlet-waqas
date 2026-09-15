# Security review

## Trust model

| Layer | Implementation |
|-------|----------------|
| Authentication | `@convex-dev/auth` Password + HTTP routes (`convex/http.ts`) |
| JWT config | `convex/auth.config.ts` — `CONVEX_SITE_URL`, `applicationID: "convex"` |
| App user | `getAuthUserId` → `users` doc (`convex/lib/auth.ts`) |
| Roles | `userRoles` table; `requireAdmin` / `requireRole` |
| Dev bypass | `AuthContext` DEV mode can set UI role without DB admin — **dev builds only** |

## Positive controls

- `assignSelfRole` cannot grant `admin` (union: creator|subscriber).
- Most creator mutations use `requireCreatorOwner`.
- Admin list/dashboard queries call `requireAdmin`.
- `generateUploadUrl` requires authenticated user.
- Migration imports require `MIGRATION_SECRET` when set.

## Critical defects (confirmed by static review)

See `findings.md` F-001…F-006.

### Payment / subscription bypass surface

| Function | Auth | Problem |
|----------|------|---------|
| `payments.sandbox.sandboxSubscribe` | `requireAppUser` | `allowSandbox: v.boolean()` client-controlled |
| `subscriptions.createSubscriptionRecord` | self or admin | Client can insert `status: "active"` |
| `subscriptions.setStatus` | owner/admin/creator | Owner can set arbitrary status including `"active"` |

Frontend does **not** call `createSubscriptionRecord` today (only sandbox), but the public API remains callable.

### Entitlement fail-closed / fail-wrong

`listPreviewsByCreator` passes `identity.subject` (`userId|sessionId`) into `canViewPostContent`, which treats it as `Id<"users">`. Premium unlock on public profiles fails for legitimate subscribers (fail closed). Comment in entitlements is incorrect.

### Public / unauthenticated APIs

| Function | Intent | Risk |
|----------|--------|------|
| `creators.getByUsername` | Public profile | Returns full doc incl. `stripeAccountId`, Discord IDs |
| `files.getUrl` | Resolve URL | No ownership ACL |
| `recordLinkClick` | Analytics | Unauth write / inflation |
| `assertNotSelfAdmin` | Dead | No auth, no effect |
| `migrations.import*` | ETL | Secret-gated public mutations; can mint admin roles |

## Former RLS reconciliation

Supabase migrations deleted from tree. Historical hardening doc (`20260904143000_security_hardening_rls.sql`) no longer in repo — **BLOCKED** for line-by-line RLS mapping. Partial mapping from `docs/database-migration/05-security-mapping.md` (historical) vs Convex helpers:

| Former intent | Convex stand-in | Status |
|---------------|-----------------|--------|
| Users read own row | `users.queries.me` | PASS (static) |
| No self-admin | `assignSelfRole` validator | PASS |
| Creator owns posts | `requireCreatorOwner` | PASS (static) |
| Subscriptions insert via payment only | public mutations | **FAIL** |
| Premium content RLS | entitlements | **FAIL** (subject bug) |

## Scheduled / HTTP side effects

- No custom webhooks in `convex/http.ts` (Auth only).
- No `crons.ts` found.
- Stripe webhook: **not implemented** (fail-closed by absence).
