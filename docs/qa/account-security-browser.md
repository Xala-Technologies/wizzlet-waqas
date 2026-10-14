# Account security browser regression

`e2e/account-security-recovery.spec.ts` uses dedicated, disposable development identities. It covers password rotation and concurrent-session revocation; role restrictions in the browser and API; MFA setup/cancellation; authenticator challenges; account switching; one-time backup recovery and regeneration; MFA disabling; and expiry followed by fresh sign-in.

The suite runs a member at 1440 px and a creator at 390 px in each configured browser (Chromium, WebKit and Firefox). It does not contact external mail or OAuth providers, change production data, or perform payments. MFA recovery here means recovery using saved backup codes; administrative identity verification is outside this suite.

## Private fixtures

Set `E2E_SECURITY_FIXTURES` to a private JSON file with:

- `devUrl`: `https://combative-mongoose-559.convex.cloud`.
- `actors`: `chromium_member`, `chromium_creator`, `webkit_member`, `webkit_creator`, `firefox_member`, and `firefox_creator`.
- Each actor has `email`, `username`, `id`, `password`, and a different random `nextPassword`. Creators need a completed, unpublished creator profile. Members hold only `subscriber`; creators hold only `creator`.

Accounts must use unique `sec_` usernames and `@example.invalid` emails. Provision them through the normal password sign-up, `ensureUser`, role assignment, and creator onboarding APIs. Do not reuse personal or shared QA accounts: this suite rotates credentials and revokes their sessions. Keep the fixture file outside the repository with mode `0600`; the test updates it after password changes and keeps temporary enrollment material there for cleanup.

Run the local app against that development backend. Supply the existing development operator credential as `E2E_SECURITY_ADMIN_KEY` in the process environment (never commit or print it), then run:

```sh
PLAYWRIGHT_NO_COPY_PROMPT=1 \
E2E_SECURITY_FIXTURES=/secure/path/security-fixtures.private.json \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8173 \
npm run test:e2e -- e2e/account-security-recovery.spec.ts
```

Private runs use one worker. Traces and automatic screenshots are disabled; the copy-prompt environment variable prevents Playwright from recording a page snapshot containing credentials or backup codes. Optional `E2E_SECURITY_EVIDENCE` captures selected screenshots with credential fields and enrollment material masked. Treat failure logs as private until checked for sensitive values.

## Session expiry and cleanup

Expiry uses the operator's existing Convex CLI access to confirm session ownership and the dashboard's built-in `patchDocumentsFields` mutation through the authenticated SDK. It is pinned to the named development deployment, checks the browser token's user against the disposable fixture, reads the session to confirm ownership, and changes only that exact session's `expirationTime`. It deploys no test endpoint or application code.

Cleanup disables/cancels the disposable account's MFA setup, signs out known API sessions, and rotates its random password again to invalidate leftover browser sessions. Creator visibility must remain unpublished. If a run is interrupted, use the fixture's current credentials and saved enrollment material to complete cleanup before reusing it.
