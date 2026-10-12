# Style regression checks

The opt-in `e2e/style-regression.spec.ts` compares the home page, authentication forms, member/creator/admin demos, settings, tables, and a pick dialog. Each runs in light/dark themes at desktop/mobile sizes in Chromium, Firefox, and WebKit: 132 cases.

Build and serve the previous commit and candidate with the same public development backend. Set `VITE_SITE_URL` separately at build time to each preview origin (for example, `http://127.0.0.1:8170` for the baseline and `http://127.0.0.1:8171` for the candidate). Otherwise the canonical-origin guard redirects both builds to the existing local application and invalidates the comparison. The suite asserts the final origin before capturing. These isolated previews are for anonymous/demo CSS checks only; do not use them for OAuth or change the shared backend's SITE_URL.

Store screenshots outside the repository; use the same absolute baseline directory for both commands:

```sh
E2E_VISUAL_BASELINES=/absolute/path/to/baselines PLAYWRIGHT_BASE_URL=http://127.0.0.1:8170 npm run test:e2e -- e2e/style-regression.spec.ts --update-snapshots
E2E_VISUAL_BASELINES=/absolute/path/to/baselines PLAYWRIGHT_BASE_URL=http://127.0.0.1:8171 npm run test:e2e -- e2e/style-regression.spec.ts
```

Only generate/update snapshots against the known baseline. Do not accept candidate snapshots to hide migration regressions. Keep browser versions and host environment identical. Date, timezone, locale, theme and viewport are fixed. CSS animations are disabled; remote DiceBear avatar contents are masked because their delivery is unrelated to the CSS compiler. Geometry and surrounding styles remain in the comparison. The permitted pixel difference is 0.1% at Playwright's default perceived-color threshold.

The development fixture must have X and Discord sign-in enabled. The authentication screenshots wait for both buttons, so an unresolved provider query cannot produce a smaller, incomplete baseline. These checks only render the buttons; they do not initiate OAuth.

When running the existing public navigation smoke tests against a production preview, set `E2E_BUILD_MODE=production`. This asserts that development owner-bootstrap controls are absent. The default mode expects those controls in the Vite development server.

Without `E2E_VISUAL_BASELINES`, these tests are explicitly skipped. This suite uses public/demo pages and does not create accounts or mutate shared application data. It does not replace authenticated journey tests or physical Safari/iOS validation.

## Tailwind 4 migration

`src/styles/tailwind.css` contains the migrated theme, animation plugin and container settings. `tailwind-v3-compat.css` preserves the previous palette, size/shadow scales and sibling spacing. In particular, v4's trailing margin is ineffective on inline labels; the compatibility utilities retain the original leading margins and hidden-child behavior. Inline theme values prevent clashes with similarly named application CSS variables. The hero's responsive line height and notification icon size are explicit to preserve their prior appearance. Existing invisible focus outlines use Tailwind 4's `outline-hidden` utility. The unused typography plugin, Lovable editor tagger (which depended on Tailwind 3), standalone PostCSS/Autoprefixer setup, and obsolete Bun lockfile have been removed. npm remains the package manager used by CI.

The browser floor is Safari/iOS 16.4+, per the upstream compiler requirements. The legacy Tailwind 3 dependency chain must not be restored to provide editor tagging.
