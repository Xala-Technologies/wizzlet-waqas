# Resume checkpoint — after Wave 18 (J7)

## Open PR stack

- **#10–#20** through J6 promo/referral
- **#21** (this) `test/qa-j7-identity-w18` — J7 identity cross-device continuity

## Wave 18 / J7

- Login navigates from `refreshRole()` server-held roles (empty localStorage / new device OK)
- `SelectRole` redirects when DB roles already exist (spinner while loading)
- Unit: `roles.test.ts` — preferred / stale / empty storage cases
- Browser: cleared `wizzlet.activeRole` → login creator → `/creator`; `/select-role` → redirect home

## Still open

- Journey J8 (migration — BLOCKED)
- Referral cash commission productization
- F-012 residual cursor pagination
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
