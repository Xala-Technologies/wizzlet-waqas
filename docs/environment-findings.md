# Environment findings

Evidence captured for release-engineering work on branch `chore/env-consistency-release`.  
Status vocabulary: **PASS** | **FAIL** | **BLOCKED** | **UNVERIFIED** | **NOT_RUN** | **NOT_APPLICABLE**.

## Git snapshot (rechecked at branch creation)

| Ref | SHA | Notes |
|-----|-----|-------|
| `origin/dev` | `02558937cea8bd8fb3dc56d663a0ed6a43d1b796` | Integration tip; base for this chore |
| `origin/main` | `7a22378e08d07117877ce81d21ec10708aaa075f` | Identical to `production` |
| `origin/production` | `7a22378e08d07117877ce81d21ec10708aaa075f` | GitHub default branch |
| Gap | `dev` is **53 commits ahead** of `production`/`main` | `production` has **0** commits not in `dev` |

Local `origin/HEAD` may still symbolically point at `main` while GitHub’s default is `production` — **UNVERIFIED** remote HEAD fix; requires separate approval.

Release tags: **none**.

## Drift classification

| Class | Finding |
|-------|---------|
| Planned unreleased development | Primary gap: 53 commits on `dev` not on `production` |
| Production hotfix missing from development | **None** (`origin/dev..origin/production` empty) |
| Approved change not yet promoted | Merged PRs on `dev` awaiting a formal `production` release |
| Unmerged / stacked work | Open UI PRs #34–#37; older QA stack PRs #14–#24 |
| Configuration-only difference | Expected (URLs, Stripe mode, Convex deployment) |
| Abandoned / duplicate work | Many stacked QA PRs likely superseded by merges into `dev` — preserve until reviewed; **do not delete** without approval |
| Unexplained code/deployment drift | Live `www.prizelet.com` has been updated via **Vercel CLI promote from feature-branch previews**, so git `production` tip is **not** authoritative for what customers run |

```text
feature branch → Vercel preview → CLI promote → www.prizelet.com
feature branch → PR → dev  (53 commits not merged to production git tip)
```

## Hosting / backend (local evidence)

| Component | Evidence | Status |
|-----------|----------|--------|
| Frontend host | `vercel.json` SPA; local `.vercel` project name `wizzlet-waqas` | Present |
| Deploy automation in repo | No `.github/workflows` before this chore | Was absent |
| Convex | `convex/`, `npm run convex:dev` / `convex:deploy` | Present |
| Convex deployment ids | Historical audit names (`combative-mongoose-559`, `ceaseless-weasel-494`) | **UNVERIFIED** live |
| Supabase runtime | No client/deps in `src/` / `package.json` | **NOT_APPLICABLE** (docs only leftover) |
| Dual lockfiles | `package-lock.json` (canonical) + `bun.lockb` | Non-canonical bun lock; delete only with approval |

## Branch disposition (no mass merge/delete)

| Branch / PR | Disposition |
|-------------|-------------|
| `dev` | Integration; PR target |
| `production` | Intended release tip; keep |
| `main` | Legacy alias of production tip; keep until approved retire |
| PR #37 `fix/consolidate-prizelet-ui` | Unreleased UI; separate from this chore; merge intentionally later |
| PRs #34–#36 | Overlap with #37; resolve after consolidate lands |
| PRs #14–#24 stacked QA | Likely largely in `dev` already; leave open; close/delete only after evidence + approval |
| `feat/convex-cutover-stripe` | Historical cutover; do not treat as current release base |

## Remote activation (blocked)

| Item | Status |
|------|--------|
| Push / open PR for this chore | **BLOCKED** until separate authorization |
| GitHub environment protections | **UNVERIFIED** / likely absent |
| Vercel Production bound only to `production` branch | **UNVERIFIED** |
| Convex prod env (no sandbox, no dev-admin, correct `SITE_URL`) | **UNVERIFIED** |
| Tag + release manifest for live traffic | **NOT_RUN** |
| Recovery drill | **NOT_RUN** |

See [release-process.md](./release-process.md) for the authorized activation sequence.

## Local verification (this chore)

| Check | Result |
|-------|--------|
| `npm run env:validate` (local profile) | **PASS** |
| `npm run lint` | **PASS** (warnings only; 0 errors) |
| `npx tsc --noEmit -p tsconfig.app.json` | **PASS** |
| `npm test -- --run` | **PASS** (100 tests) |
| `npm run build` (fixture `VITE_APP_ENV=development`) | **PASS** |
| `npm run release:verify-build` | **PASS** (Convex host baked into dist) |
| `npm run release:manifest` | **PASS** (printed; nonsecret) |
| Branch protection / hosted secret isolation | **BLOCKED** / **UNVERIFIED** |
| Live Vercel ↔ git `production` parity | **UNVERIFIED** (known process bypass) |
| Convex dashboard prod flags | **UNVERIFIED** |
| Production recovery rehearsal | **NOT_RUN** |

**Implemented locally:** docs, `src/config/*`, Convex `envGuards`, npm scripts, CI checks workflow, disabled release workflow, safeguard tests.  
**Not executed:** push, PR, merge, tag, deploy, secret changes, branch protection edits.
