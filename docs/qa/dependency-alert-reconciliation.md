# Dependency alert reconciliation — 2026-10-15

## Result

The six open Dependabot alerts do not match the npm dependencies at production commit `a74a759def7eefbad30dd9ccb1226cc1fac51254`. A clean `npm ci` and fresh `npm run audit:dependencies` both report **0 vulnerabilities**. No new dependency upgrade is required for these advisories.

All installed copies in `package-lock.json` were compared with the affected ranges from the GitHub alerts, including nested package paths. The direct Vitest declaration, `^4.1.11`, also excludes the affected range. Browserslist is absent from the dependency graph; the `browserslist` configuration in `package.json` is not an installed package.

| GitHub alert | Severity | Package | Affected versions in the alert | Current lockfile | Result |
| --- | --- | --- | --- | --- | --- |
| [#7](https://github.com/Xala-Technologies/wizzlet-waqas/security/dependabot/7) | High | js-yaml | `>=4.0.0 <4.3.2` | `4.3.2` | Patched |
| [#6](https://github.com/Xala-Technologies/wizzlet-waqas/security/dependabot/6), [#5](https://github.com/Xala-Technologies/wizzlet-waqas/security/dependabot/5) | Medium | vitest | `>=2.1.0 <4.1.11` | `4.1.11` | Patched in both manifests |
| [#4](https://github.com/Xala-Technologies/wizzlet-waqas/security/dependabot/4) | Medium | @vitest/mocker | `>=2.1.0 <4.1.11` | `4.1.11` | Patched |
| [#3](https://github.com/Xala-Technologies/wizzlet-waqas/security/dependabot/3) | High | browserslist | `<=4.28.6` | Absent | Removed with the old build dependency chain |
| [#1](https://github.com/Xala-Technologies/wizzlet-waqas/security/dependabot/1) | High | nanoid | `<3.3.12` | `3.3.20` | Patched |

The severity labels describe the upstream advisories, not newly reproduced application vulnerabilities. Five alert records are development dependencies; the nanoid alert is classified as runtime by GitHub and resolves locally through Vite → PostCSS. The previous build hardening commit is [`c896a18`](https://github.com/Xala-Technologies/wizzlet-waqas/commit/c896a18).

## GitHub discrepancy

GitHub's REST API still returned six **open** alerts with September update timestamps when this check began. This is an observed discrepancy between alert state and the current manifests. It is not evidence that the patched packages remain vulnerable, and the exact reason GitHub did not update its graph has not been established.

The dependency-graph SBOM endpoint returned HTTP 404 with the available API access. The in-app browser was signed out of GitHub, so the documented graph refresh could not initially be used. No alerts were dismissed or ignored.

To refresh after signing in with permission to manage alerts: open **Security → Dependabot → Alert settings → Refresh Dependabot alerts**. GitHub documents this as a background rescan of the manifests and permits it once per hour. Verify the resulting alert state separately; a successful npm audit alone does not prove GitHub's alerts have closed. See [GitHub's dependency graph troubleshooting](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependency-graph-errors).

## Released MFA changes

The live `https://www.sweeph.com` asset `/assets/index-BKs0-U9K.js` embeds release `a74a759def7eefbad30dd9ccb1226cc1fac51254` and the production Convex binding. Its SHA-256 is `1291ecf2217c6825281dcde29e2a4bd16ab5eeb22c757037c793376e4355b3ac`.

Inspection of that served asset confirms the MFA account-switch handler awaits `signOut` before navigation, four authenticator inputs carry an accessible name, and the backup-code input is labeled. This confirms the deployed code from [PR #236](https://github.com/Xala-Technologies/wizzlet-waqas/pull/236). It does not substitute for a live MFA challenge using an enrolled production account.

Production smoke uses existing disposable member and unpublished creator accounts. It checks sign-in, role boundaries, the non-MFA account's return destination, backend MFA status, password-dialog cancellation and focus, and sign-out. It does not enroll MFA, rotate passwords, publish profiles, send messages, or transact. Full MFA enrollment, recovery, replay rejection, and expiry were exercised against development in [the account-security browser pass](./account-security-browser.md).

## Validation results

- Clean install and fresh npm audit: 0 vulnerabilities.
- Lint and application TypeScript: passed.
- Unit tests: 633 passed across 108 files after the clean install.
- Production build: passed; the existing bundle-size advisory remains.
- Production browser smoke: six journeys passed — Chromium, WebKit and Firefox, each with member at 1440 px and creator at 390 px. No uncaught page errors or horizontal overflow in the completed diagnostic run.
- Fixture MFA and creator publication state remained unchanged, and all test browser/API sessions were signed out.

An initial WebKit creator run completed its functional assertions but reported one `TypeError: Load failed` page error. The full rerun with request-failure diagnostics passed all six journeys. Navigation cancellations were recorded, with no uncaught page errors. The initial error has not been reproduced or assigned an application root cause; it remains an unconfirmed observation, not a confirmed bug fix.

The local evidence report stores the alert responses, semver comparisons, lockfile hash, historical versions, production asset identity, browser results, masked screenshots and command logs. Credentials and browser authentication state are excluded from the PR.

## Reproduce the local dependency checks

```sh
npm ci
npm ls js-yaml browserslist nanoid vitest @vitest/mocker --all
npm run audit:dependencies
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm test -- --maxWorkers=1
npm run build
```

Use the repository's npm lockfile. Do not add overrides, regenerate a second lockfile, or suppress alerts solely to make the GitHub count disappear. The existing CI already runs the dependency audit after `npm ci`.

Upstream advisory references: [js-yaml](https://github.com/advisories/GHSA-2883-xcg3-v3hh), [Vitest](https://github.com/advisories/GHSA-82fw-gwwq-j7x9), [Browserslist](https://github.com/advisories/GHSA-73wf-gq98-2v4g), [nanoid](https://github.com/advisories/GHSA-xwg4-73v4-xw9w).
