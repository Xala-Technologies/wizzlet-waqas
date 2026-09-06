# Remediation plan

**Status:** Not authorized — AUDIT_ONLY. Do not apply until explicit approval.

## Dependency order

### Phase A — Stop free access (P0)

1. **F-001** Server-gate sandbox (`process.env.ALLOW_SANDBOX_CHECKOUT` in action, or remove public sandbox).  
2. **F-002** Make `createSubscriptionRecord` `internalMutation`.  
3. **F-003** Constrain `setStatus` transitions + status enum.  
4. Add convex-test / integration tests for unauthorized activate.

### Phase B — Correct entitlements & API lockdown (P1)

5. **F-004** Use `getAuthUserId` in `canViewPostContent` / callers.  
6. **F-005** Internalize migration imports; rotate `MIGRATION_SECRET`.  
7. **F-006** Ownership checks on growth upserts.  
8. **F-013** Establish data plan: empty OK for greenfield vs restore ETL on non-prod.

### Phase C — Hardening (P2)

9. Redact `getByUsername`; ACL `getUrl`; payout balance; pagination; `returns` validators.  
10. Implement real Stripe path only with webhook signature verification + idempotent `paymentEvents`.

### Phase D — Hygiene (P3)

11. Fix events query time arg; fix TS errors; remove dead `assertNotSelfAdmin`.

## Data repair / rollback

- Convex may already contain post-cutover sandbox writes once users test — do not wipe without export.  
- Switching back to Supabase is **not** viable (runtime removed; Auth replaced). Rollback = redeploy prior git revision + prior deployment only if retained.  
- Prefer forward fixes on Convex Auth identity model.

## Verification after each fix

1. Failing regression test first.  
2. Smallest patch.  
3. `npx convex dev --once` (authorized env).  
4. Update `coverage.json` / findings disposition.  
5. Re-run section 9 persistence proofs in isolated deployment.
