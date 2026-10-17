# Prizelet QA artifacts

Audit mode: **AUDIT_AND_TEST** (Wave 1). Application remediations are **not** applied here unless separately authorized.

| File | Purpose |
|------|---------|
| [feature-coverage.json](./feature-coverage.json) | Stable feature IDs, routes, roles, Wave 1 status |
| [dependency-matrix.md](./dependency-matrix.md) | Upstream → downstream consistency requirements |
| [dependency-alert-reconciliation.md](./dependency-alert-reconciliation.md) | Current npm versions, stale GitHub alerts, and released MFA verification |
| [session-management.md](./session-management.md) | Owner-scoped active sessions, revocation, browser coverage and rollout order |
| [test-cases.md](./test-cases.md) | Case IDs linked to features / findings |
| [findings.md](./findings.md) | Confirmed defects, regressions, residual risks |
| [improvements.md](./improvements.md) | Prioritized proposals (not applied) |
| [execution-report.md](./execution-report.md) | Commands, environments, results |
| [resume-checkpoint.md](./resume-checkpoint.md) | Exact next steps for later waves |

Private traces/screenshots/auth state stay out of Git. Reference sanitized evidence only.
