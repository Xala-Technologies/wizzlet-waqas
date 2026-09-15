# Security Model

## Principles

- Never trust client-supplied role / userId / organizationId.
- Resolve identity from JWT (`ctx.auth.getUserIdentity().subject`).
- Map subject → `users.externalAuthId` → `users._id`.

## Role gates

| Operation | Rule |
|-----------|------|
| Assign creator/subscriber | Self only |
| Assign admin | Admin-only `grantRole` |
| Create subscription | Payment mutation only |
| Insert notifications to others | Admin or system |
| Premium post content | Owner, active subscriber, or admin |
| User PII list | Admin or creator’s own subscribers |
| Platform settings | Admin |
| Referral insert | Force commission=0, converted=false |

## Storage

Supabase Storage paths remain `{authUid}/...` if Auth continues; otherwise migrate to Convex file storage later.

## Tenant isolation tests

Creator A cannot read Creator B DMs, payouts, or unpublished drafts. Subscriber cannot read another user’s picks/notifications.
