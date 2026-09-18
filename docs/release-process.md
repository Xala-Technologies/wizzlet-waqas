# Release process

Single path for Prizelet. Aligns with README and Cursor per-task branch rules.  
Do not use ad-hoc `vercel promote` of feature-branch previews as the normal production path.

Evidence and blockers: [environment-findings.md](./environment-findings.md).  
Environment map: [environments.md](./environments.md).

## Happy path

```text
feat|fix|chore branch (from dev)
  → PR to dev (checks + reviewer)
  → identified release candidate SHA on dev
  → isolated verification (preview + production-style build + env:validate)
  → merge RC into production (keep main tip-equal when syncing)
  → production frontend deploy from that SHA + Convex prod deploy in the same release window
  → release manifest recorded
```

1. Cut a focused branch from `dev` (or an intentional stack base).  
2. Open a PR to `dev`; request review from `xalatechnologies`.  
3. CI must PASS (`lint`, `tsc`, unit tests, `env:validate`, production build).  
4. Identify the **release candidate** as the exact merge/result SHA on `dev`. New commits after approval invalidate the candidate until checks re-run.  
5. Verify a production-style `npm run build` against isolated services; confirm baked `VITE_CONVEX_URL` / release stamp with `npm run release:verify-build`.  
6. Merge the candidate into `production`. Keep `main` tip-equal to `production` when synchronizing; **do not delete `main` without approval**.  
7. Deploy frontend from the approved `production` SHA only. Deploy Convex with a production-scoped deploy key for the same window. Fill `npm run release:manifest`.  

`main` is a legacy alias of the production tip until an approved rename/retire.

## Hotfix

1. Branch from the **actual released** SHA on `production`.  
2. Fix, test, and release through the protected process.  
3. Forward-port the equivalent change into `dev` (verify across squash/cherry-pick).  

## Frontend / backend compatibility

Frontend publish and Convex deploy are **not** atomic.

- Prefer compatible expansion: add fields/indexes, deploy backend, then frontend, then remove old contracts after a support window.  
- Partial failure: report which of frontend, Convex, Stripe webhooks, or auth callbacks updated; do not mark the release successful if unknown.  
- Old browser sessions may keep a previous SPA until refresh — keep required older endpoints until evidence allows removal.

## Recovery limits

| Action | Expectation |
|--------|-------------|
| Revert frontend alias to previous Vercel deployment | Restores UI only; does not undo Convex writes or Stripe charges |
| Redeploy previous Convex revision | May fail if schema moved forward; plan forward-repair |
| Restore a database backup | **Isolated rehearsal only**; never assume it reverses external money movement |
| Point SPA at an old backend | Only if schema and auth remain compatible |

Do not promise that reverting a git commit or restoring an old database preserves newer valid writes or reverses payouts/refunds/emails.

## Single deploy coordinator

Only **one** system should publish production for each layer:

- Frontend: Vercel Production bound to `production` (preferred) **or** a single approved workflow — not both competing.  
- Backend: Convex production deploy key used by an authorized operator/CI job only.  

The checked-in `.github/workflows/release.yml` is **disabled** until secrets, environment protections, and coordinator choice are authorized.

## Activation checklist (separate authorization)

Production remains **BLOCKED** until each item is evidenced:

1. Push release-engineering / feature PRs and merge to `dev` after review.  
2. Apply GitHub Environment protections for `production`.  
3. Bind Vercel Production to the `production` branch; stop feature-branch promote as the default.  
4. Confirm Convex prod deploy key scope; dashboard: no `ALLOW_SANDBOX_CHECKOUT`, no `ALLOW_DEV_ADMIN_GRANT`, `SITE_URL=https://www.prizelet.com`.  
5. First tagged release on `production` with matching Convex revision and filled manifest.  
6. Read-only production smoke (nav, login surfaces, role boundaries).  

Writing workflow files alone does **not** claim protections or live parity.
