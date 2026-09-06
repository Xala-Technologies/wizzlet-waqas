# Application and data map

## Product

Wizzlet is a **creator / subscriber / admin** SaaS for sports picks and subscriptions. Not multi-tenant org SaaS. Actors: anonymous visitor, authenticated subscriber, creator, admin.

## Entry points

```text
index.html → src/main.tsx → src/App.tsx
  ErrorBoundary → ConvexAppProvider (ConvexAuthProvider)
    → QueryClientProvider → AuthProvider → BrowserRouter
```

## Surfaces

| Surface | Path pattern | Auth |
|---------|--------------|------|
| Marketing / public | `/`, `/creators`, `/pricing`, `/:username`, … | Public |
| Auth | `/login`, `/signup`, `/select-role` | Public forms → Convex Auth |
| Subscriber app | `/dashboard/*` | `ProtectedRoute` role `subscriber` |
| Creator app | `/creator/*` | role `creator` |
| Admin app | `/admin/*` | role `admin` |
| Demo (local seed) | `/demo/*` | No Convex persistence (in-memory/session stores) |

## Identity model (current)

```text
Convex Auth Password
  → users._id (= getAuthUserId)
  → userRoles.userId
  → creators.userId, subscriptions.userId, …
```

Legacy `users.externalAuthId` remains optional for ETL compatibility. JWT `identity.subject` is `userId|sessionId` (Convex Auth), **not** raw `users._id`.

## Persistence domains

| Domain | Tables | Primary writers |
|--------|--------|-----------------|
| Auth / profile | `users`, auth* tables, `userRoles` | Auth + `users.queries.*`, `roles.mutations.*` |
| Creators | `creators`, `products` | `creators/queries`, `products/mutations` |
| Content | `posts`, `pickTracker` | `posts/queries`, `picks/mutations` |
| Commerce | `subscriptions`, `paymentEvents`, `payouts`, `creatorPayoutSettings` | `payments/sandbox`, `subscriptions/*`, `payouts/*` |
| Growth | `creatorLinks`, `promoCodes`, `referrals` | `creators/growth` |
| Comms | `notifications`, `directMessages`, `supportMessages`, `resolutionCases*` | messaging / notifications / resolution / support |
| Ops | `platformSettings`, `emailCampaigns`, `sportEvents`, `analyticsEvents` | admin / platform / events / analytics |
| Migration | `migrationCheckpoints`, `mutationLog` | `migrations/*` |

## External integrations

| Integration | Status |
|-------------|--------|
| Stripe live checkout / webhook | **Absent** in Convex; sandbox only (`src/lib/stripe.ts` `PAYMENTS_MODE = 'sandbox'`) |
| Connect onboarding / portal | Toast stubs |
| Supabase Auth/DB/Storage | **Removed** from runtime |
| File bytes | Convex storage → URL stored on `creators.avatarUrl` / `bannerUrl` |

## Critical workflow diagrams

### Subscribe (sandbox)

```text
UI createCheckoutSession
  → assertSandboxAllowed (client DEV / VITE flag)
  → payments.sandbox.sandboxSubscribe({ allowSandbox: clientBool })
  → insert subscriptions + paymentEvents + notification
  → redirect /subscription/success
```

**Defect:** `allowSandbox` is client-controlled (see findings F-001).

### Premium post view (public profile)

```text
/:username → getByUsername + listPreviewsByCreator
  → canViewPostContent(identity.subject)
  → redact content if not entitled
```

**Defect:** `listPreviewsByCreator` passes full JWT subject (F-004). `memberFeed` correctly passes `user._id`.

### Role assignment

```text
SelectRole / Login → assignSelfRole(creator|subscriber only)
Admin → grantRole (requireAdmin)
```

Self-admin assignment is blocked at validator level.
