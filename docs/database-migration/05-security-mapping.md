# Security Mapping — RLS → Convex

## Principle

Every protected Postgres policy maps to a server-side Convex helper. UI guards are UX only.

## Core helpers

| Helper | Replaces |
|--------|----------|
| `requireIdentity` | authenticated session |
| `requireAppUser` | users row for auth subject |
| `requireRole(role)` | has_role / user_roles |
| `requireAdmin` | admin policies |
| `requireCreatorOwner` | creators update/own posts |
| `requireActiveSubscription` | premium post SELECT |
| `requirePostContentAccess` | get_creator_post_previews entitlement |
| `assertNoClientSubscriptionInsert` | dropped client INSERT (server payment only) |

## Hardening parity checklist

- [ ] Client cannot assign `admin` role
- [ ] Client cannot insert `subscriptions`
- [ ] Notifications insert: admin or system only
- [ ] Referrals: no forged commission/converted
- [ ] Users PII: own / admin / creator’s subscribers only
- [ ] Premium post content redacted without entitlement

## Negative tests required

Unauthenticated access, cross-creator access, forged IDs, subscriber reading other users’ picks, non-admin admin queries.
