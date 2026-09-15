# Test results

## Commands executed (AUDIT_ONLY)

| Command | Environment | Exit | Notes |
|---------|-------------|------|-------|
| `npm test` (`vitest run`) | local | **0** | 24 tests / 5 files — unit only (money, odds, csv, results) |
| `npx tsc --noEmit -p tsconfig.app.json` | local | **1** | Errors in AdminFees, AdminFinance, AdminGrowthManagerInbox, CreatorProfile, CustomerSaved |
| `npm run build` | not re-run this audit pass | — | Previously passed (2026-09-05); dirty tree since |
| `npx convex dev --once` | **NOT RUN** | — | Pushes functions/schema — forbidden in AUDIT_ONLY |
| Browser E2E / Playwright | **NOT_RUN** | — | No authorized isolated persistence campaign |
| `convex-test` suite | **NOT_RUN** | — | Not installed / no suite present |
| MCP `tables` (dev) | Convex MCP | OK | Schema present; inferred empty |
| MCP `tables` (prod) | Convex MCP | **timeout** | BLOCKED |
| MCP `data` / `runOneoffQuery` | — | **NOT_RUN** | Avoid PII; emptiness already inferred |

## Evidence layers

| Layer | Status |
|-------|--------|
| Static review | Done — findings F-001…F-015 |
| Isolated backend tests | NOT_RUN (no convex-test) |
| Deployed integration | NOT_RUN |
| Browser E2E persistence | NOT_RUN |

## Unit test coverage vs audit needs

Existing tests cover money math and odds helpers only. **Zero** authz / subscription / entitlement regression tests.
