# Page map — Prizelet page-pack campaign

**Branch:** `improve/page-pack-identity`  
**Pack (read-only, not in repo):** `/Users/wahidrahmani/Downloads/prizelet-page-agent-pack/`  
**Reference SHA (map only):** `02558937cea8bd8fb3dc56d663a0ed6a43d1b796` — do not checkout.

## Route inventory vs pack

| Source | Count |
|--------|-------|
| Pack `route-manifest.json` / `pages/*.md` | 73 |
| Current `src/App.tsx` leaf routes | 75 |

### Added since pack (no dedicated brief yet)

| Route | Component | Notes |
|-------|-----------|--------|
| `/creator/notifications` | `CustomerNotifications` | Same page as M05 |
| `/admin/notifications` | `CustomerNotifications` | Same page as M05 |

### Removed / missing from App

None — every manifest path still exists.

### Brand

UI brand is **Prizelet** (`PrizeletLogo`). Legacy “Wizzlet” appears only in technical/docs identifiers — no mass rename in this campaign.

### Demo boundary

`/demo/*` is fixture-only; must not grant live entitlements, admin privilege, or write to production financial tables. Exit demos return to `/`.

## Identity dependency group (this checkpoint)

| ID | Route | Source | Child panels (discovered) |
|----|-------|--------|---------------------------|
| I01 | `/login` | `Login.tsx` | Email/password form; social OAuth; DEV admin bootstrap (dev-only) |
| I02 | `/signup` | `Signup.tsx` | Username/email/password; social; `?ref=` referral banner |
| I03 | `/auth/callback` | `AuthCallback.tsx` | Loading; error + retry / back to login |
| I04 | `/select-role` | `SelectRole.tsx` | Creator vs subscriber choice cards; Continue |
| C17 | `/creator/onboarding` | `CreatorOnboarding.tsx` | Steps: Profile, Images, Product (wizard, not route tabs) |

## Later groups (not in this checkpoint)

Public P01–P09 · Creator C01–C16 · Member M01–M09 · Admin A01–A15 · System S01–S04 · Demo D01–D15 · Billing tabs T01–T03.
