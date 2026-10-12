# Authenticated browser regression

`e2e/authenticated-journeys.spec.ts` is opt-in. It covers desktop (1440×1000) and mobile (390×844) viewports in Chromium, Firefox, and WebKit. WebKit desktop emulation does not certify physical Safari or iOS devices.

Start the local application against a development Convex deployment. Prepare disposable member and creator accounts for each browser/viewport pair, with their corresponding roles; creators need an onboarding profile. Creator profiles can remain unpublished. Use an existing authorized development administrator. Do not use production accounts or data for these tests.

Keep the fixture JSON outside the repository, with restrictive file permissions:

```json
{
  "devUrl": "https://YOUR-DEVELOPMENT-DEPLOYMENT.convex.cloud",
  "admin": { "email": "YOUR-DEV-ADMIN", "password": "YOUR-DEV-PASSWORD" },
  "actors": {
    "chromium-desktop-member": { "email": "DISPOSABLE-MEMBER", "password": "DISPOSABLE-PASSWORD", "handle": "qa_member" },
    "chromium-desktop-creator": { "email": "DISPOSABLE-CREATOR", "password": "DISPOSABLE-PASSWORD", "handle": "qa_creator", "creatorId": "CREATOR-DOCUMENT-ID" }
  }
}
```

Populate all twelve actor keys: `{chromium,firefox,webkit}-{desktop,mobile}-{member,creator}`. The local frontend must use the same development deployment as `devUrl`. The suite rejects non-local frontend URLs. Authentication traces are disabled because they would capture credentials and tokens.

```sh
E2E_AUTH_FIXTURES=/absolute/private/path/fixtures.json \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:8080 \
npm run test:e2e -- --workers=3
```

The suite removes the picks, posts, products, saved posts, and bookmarks it creates in `finally` blocks. After testing, use the account-deletion workflow to retire the disposable users and remove their fixture file. Interrupted runs may need fixture cleanup before rerunning. Admin tests only read and export development data. Treat downloaded reports and failure artifacts as private; do not commit them.

Coverage includes odds keyboard entry, validation, pick CRUD, CSV formula neutralization and import retry, saved-library removal, creator post/product CRUD, admin exports and search, member-to-admin denial, calendar dates west of UTC, and authenticated route rendering. Route rendering does not validate every action on those screens. External delivery, live payment modes, payout execution, and real-device/browser-version certification require separate runs.
