# Account session management

Members can open **Settings → Active Sessions → View Sessions**. Creators use **Settings → Security → Active Sessions**. Both surfaces share the same component and owner-scoped backend endpoints.

The dialog shows actual sign-in and expiry times, marks the current session, and lets the account holder revoke another session or sign out everywhere after confirmation. Cancel, loading, retry, already-ended-session feedback, and keyboard focus are handled. Demo mode does not query or revoke real sessions.

## Security contract

- `accountSessions.listMine` returns only active sessions belonging to the authenticated user. A revoked, expired, anonymous, or MFA-pending session receives no data.
- `accountSessions.revoke` and `revokeAll` require an active session with completed MFA when enabled. They derive the owner from authentication; there is no client-supplied user ID or administrator bypass.
- Missing and foreign session IDs produce the same `SESSION_NOT_FOUND` response.
- Revocation deletes the session, all of its refresh-token records and its MFA grants in one transaction. Existing protected endpoints check the backing session, so an otherwise unexpired JWT cannot continue accessing account data.
- Sign out everywhere includes the current session, expired records and all other existing sessions. It also clears orphan MFA grants belonging to that user. Another user's sessions remain untouched.
- The list displays the latest 100 active sessions, plus the current one if older, and indicates when records are omitted. Bulk revocation is not limited by that display cap. An unusually large account that exceeds Convex transaction limits receives an error with rollback rather than a false partial-success response.
- Returned fields are restricted to session ID, creation time, expiration time and the current-session flag. Refresh tokens, JWTs and MFA secrets are never returned by these endpoints.

Session records do not contain reliable browser, device, location or last-activity metadata. The UI uses real sign-in times without inventing that information. “Trusted Devices” is a separate unfinished feature and remains marked unavailable. A new login created after revocation completes is allowed; this feature does not change the password or lock the account.

## Verification

Unit tests call the real Convex handlers with owned, foreign, revoked, expired and MFA-pending identities. They verify field minimization, refresh-token descendants, MFA grant cleanup, current-session invalidation, missing/foreign ID parity and revocation beyond the list cap. Component tests cover confirmation, cancellation and focus, double submission, failures, retries, expiry, truncation and demo isolation. Existing settings tests retain their prior coverage and mock the independently tested session component where unrelated to it.

The development browser suite uses separate disposable member and creator accounts in Chromium, WebKit and Firefox. It opens a second browser session, tests cross-account denial and anonymous access, cancels confirmations, revokes a refresh token and an active browser, signs out everywhere and signs back in. It verifies immediate protected-API denial and that a different account stays signed in. Member width is 1440 px; creator width is 390 px. Dialog-only screenshots omit credentials and background account fields; traces and automatic snapshots are disabled.

A development API probe additionally enrolls MFA on a disposable account, rejects management before verification, verifies another session, then checks the actual session, refresh-token and MFA-grant tables after individual and bulk revocation. It restores MFA to disabled and removes remaining test sessions.

Run local validation:

```sh
npm test -- --maxWorkers=1
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npx tsc --noEmit -p convex/tsconfig.json
npm run build
npm run audit:dependencies
```

With the application bound to the development Convex deployment and disposable `sec_` fixtures:

```sh
E2E_SECURITY_FIXTURES=/absolute/path/to/private-fixtures.json \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8174 \
npm run test:e2e -- e2e/session-management.spec.ts
```

Fixture format matches [account-security-browser.md](./account-security-browser.md). The suite refuses non-local frontend URLs, a production backend, or non-test account names. Cleanup signs out all of the fixture owner's sessions. Do not run it against real accounts.

## Rollout

Deploy the additive `accountSessions` backend functions before the frontend. No schema migration, new credential, provider setup or environment change is required. If the endpoint is missing during rollout, the dialog shows a retryable load error rather than breaking Settings. The existing `AuthContext` handles revoked sessions and clears local authentication.

Implementation and live revocation checks are limited to development until a production release is authorized. A frontend preview pointed at the old production backend cannot demonstrate the new endpoints.
