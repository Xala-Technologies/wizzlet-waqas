# Improvements (proposals only — not applied)

## Release blockers (before production promote)

1. ~~**Fix select-role navigation race** (QA-W2-01)~~ — done; Wave 3 retest PASS.
2. ~~**Gate `grantTestAdmin`** (QA-W1-01)~~ — Wave 6: requires `ALLOW_DEV_ADMIN_GRANT` + email allowlist.
3. ~~**Remove DEV `ProtectedRoute` role bypass** (QA-W1-02)~~ — Wave 6 PASS.
4. ~~**J1 Stripe commercial lifecycle**~~ — Waves 3–4 PASS.
5. ~~**Profile CTA / subscriber count** (QA-W3-01)~~ — Wave 4 PASS.
6. ~~**files.getUrl legacy unowned** (QA-W1-03)~~ — Wave 6 PASS.
7. ~~Optional: real Stripe Customer Portal (QA-W4-01 residual)~~ — Wave 8 wired.
8. **Never set `ALLOW_DEV_ADMIN_GRANT` on production.**

## Next-release corrections

| Proposal | Benefit | Acceptance | Effort | Risk |
|----------|---------|------------|--------|------|
| Deny `files.getUrl` when no `fileAssets` (QA-W1-03) | Stops cross-user legacy file reads | Unowned id → FORBIDDEN | S | May break old avatars until backfill |
| Pass `now` into events query (F-014) | Restores Convex query caching | Client passes clock; query deterministic | S | Clients must refresh periodically |
| Soft-fail analytics on logout (QA-W1-04) | Cleaner logs / no toast noise | Sign-out never calls authed track | S | Low |
| Fix ESLint errors (QA-W1-05) | CI-ready | `eslint` exit 0 | S | Low |
| Add `returns` validators (F-011) | Contract safety | Public functions validated | M | **Done** Waves 9–12 |
| Paginate admin `.collect()` (F-012) | Scale safety | Admin lists use cursors | M | Wave 13: hard cap 500 (PARTIAL); cursor UI deferred |

## Later product improvements

- Playwright suite for J1–J7 with isolated contexts and gitignored auth state.
- Physical-device / WebKit pass for mobile-first shells (docs/mobile-first).
- Webhook soak: duplicate delivery + fulfillment without success URL.
- Replace demo-mode reliance with seeded synthetic accounts for stakeholder demos.

## Explicitly out of Wave 1

No application code remediations were applied during this audit wave.
