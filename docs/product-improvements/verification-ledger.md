# Verification ledger — identity checkpoint

**Candidate branch:** `improve/page-pack-identity`  
**Evidence layers:** unit (Vitest), static review. No production writes. Authenticated browser E2E: NOT_RUN (no isolated test credentials in session).

| ID | Target | Status | Evidence | Notes |
|----|--------|--------|----------|-------|
| — | Shared baseline (`safeReturnPath`, `AuthShell`, ProtectedRoute `returnTo`) | PASS | Vitest `safeReturnPath.test.ts` (15); static review | Admin elevation blocked without role; OAuth stash via sessionStorage |
| I01 | Login | PASS | Unit + static | Safe return; duplicate-submit guard; password visibility; DEV admin bootstrap still `import.meta.env.DEV` only |
| I02 | Signup | PASS | Unit + static | Preserves `returnTo` / `ref`; handoff to select-role; password rules unchanged |
| I03 | Auth callback | PASS | Unit + static | Waits for auth; reads returnTo from query or storage; role-aware destination |
| I04 | Role selection | PASS | Unit + static | Creator → onboarding; subscriber honors safe return; no admin self-serve; radiogroup a11y |
| C17 | Creator onboarding | PASS | Vitest `onboardingStep.test.ts`; static | Steps Profile/Images/Product; upload failure aborts save; publish only when explicit; logo no longer → landing |
| J01 | Identity journey (safe local subset) | PARTIAL | Unit path matrix | Password/OAuth happy paths with returnTo covered by units. Live multi-account browser: **NOT_RUN**. Stripe/provider: **NOT_APPLICABLE** for this checkpoint |

## Commands actually run

```text
npx vitest run src/lib/safeReturnPath.test.ts src/lib/onboardingStep.test.ts \
  src/lib/authSession.test.ts src/lib/authMatrix.security.test.ts src/lib/roles.test.ts
→ 5 files, 32 tests PASS

npx tsc --noEmit
→ PASS (exit 0)
```

## Coverage denominators (this checkpoint)

| Scope | Done | Total |
|-------|------|-------|
| Identity dependency pages (I01–I04 + C17) | 5 | 5 |
| Discovered C17 wizard steps | 3 | 3 (Profile, Images, Product) |
| Pack pages overall | 5 improved | 73 (+2 notification routes deferred) |

## Remaining risks

- Authenticated Playwright smoke still NOT_RUN.
- OAuth returnTo depends on sessionStorage surviving the provider round-trip (same browser tab).
- Creator deep-link returnTo after first role pick is deferred until onboarding completes (by design).
