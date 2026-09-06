# Testing Strategy

## Levels

1. **Unit:** money fee calc, entitlements, role helpers
2. **Authz:** negative tests for each require* helper
3. **Migration:** transform fixtures + idempotent load
4. **Integration:** Convex queries/mutations with test identity
5. **E2E (manual then automated):** signup, role select, profile, subscribe sandbox, feed, admin list

## Critical flows

- Sign up → users row exists (ensureUser)
- Select creator/subscriber roles (no admin self-grant)
- Public profile premium redaction
- Sandbox subscribe creates fee-split subscription
- Notifications unread reactive count
- Admin cannot be forged via client args

## Do not

Delete or weaken existing Vitest odds/csv tests to “make migration pass.”
