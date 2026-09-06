# Convex post-migration audit

**Mode:** `AUDIT_ONLY` (no application remediations applied)  
**Audited commit (HEAD):** `7a22378e08d07117877ce81d21ec10708aaa075f` (`dev`)  
**Working tree:** dirty — large uncommitted Convex cutover vs HEAD  
**Date:** 2026-09-06  
**Auditor:** Principal Engineer review per `convex-post-migration-auditor.md`

## Overall gate

```text
INSUFFICIENT EVIDENCE: REQUIRED CHECKS BLOCKED OR NOT RUN
```

**Update (2026-09-06 remediation):** Phase A/B P0–P1 code defects (F-001–F-007) are fixed and pushed to the audited Convex deployment. Persistence E2E and historical migration reconciliation remain unmet — see [remediation-disposition.md](./remediation-disposition.md).

## Scope and access

| Item | Value |
|------|--------|
| App | Wizzlet — sports creator subscription SPA |
| Stack | Vite 5 + React 18 + Convex `^1.45.0` + `@convex-dev/auth` `^0.0.95` |
| Package manager | npm |
| Dev deployment | `https://combative-mongoose-559.convex.cloud` |
| Prod deployment | `https://ceaseless-weasel-494.convex.cloud` (MCP tables timed out; readOnly) |
| Auth | Convex Auth Password (Supabase fully removed from runtime) |
| Storage | Convex `_storage` |

## Deliverables

| File | Purpose |
|------|---------|
| [application-and-data-map.md](./application-and-data-map.md) | Surfaces, routes, Convex APIs |
| [coverage.json](./coverage.json) | Workflow field/write/read matrix |
| [schema-and-integrity.md](./schema-and-integrity.md) | Schema vs deployment |
| [security-review.md](./security-review.md) | AuthZ / public API |
| [migration-reconciliation.md](./migration-reconciliation.md) | Historical data parity |
| [test-results.md](./test-results.md) | Commands actually run |
| [findings.md](./findings.md) | Numbered findings P0–P3 |
| [remediation-plan.md](./remediation-plan.md) | Ordered fixes |
| [remediation-disposition.md](./remediation-disposition.md) | What was applied |

## Coverage snapshot

| Dimension | Result |
|-----------|--------|
| Schema tables declared | 33 app+auth tables in repo + deployed schema match (dev) |
| Document population (dev) | Appears **empty** (all `inferredSchema: Never`) |
| Workflows in matrix | 42 |
| Fully verified (static+deployed+E2E) | **0 / 42** |
| Static review PASS | 28 / 42 |
| Static FAIL / risk | 8 / 42 |
| BLOCKED / NOT_RUN | 6 / 42 |
| Authz critical defects | 3× P0, 3× P1 |
| Historical migration integrity | **BLOCKED** |

## Next actions (dependency order)

1. ~~Fix sandbox / subscription public mutations (F-001–F-003).~~ **Done**  
2. ~~Fix entitlements subject parsing (F-004).~~ **Done**  
3. ~~Lock down migration ETL (F-005); growth IDOR (F-006); public projection (F-007).~~ **Done**  
4. Run section 9 persistence proofs in an isolated deployment.  
5. Decide greenfield vs restore ETL for empty data (F-013).  
6. Phase C: payout balance, `getUrl` ACL, Stripe webhook, pagination.
