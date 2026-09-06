# Resume checkpoint — after Wave 17 (J6)

## Open PR stack

- **#10–#19** through J5 payouts
- **#20** (this) `test/qa-j6-promo-referral-w17` — J6 promo + referral attribution

## Wave 17 / J6

- `upsertPromo` persists codes (ownership, format, uniqueness); UI CRUD on `/creator/promo`
- Checkout accepts optional `promoCode` → Stripe one-time coupon; fulfill bumps `usedCount` + marks referrals converted
- Signup `?ref=` → `recordReferralByCode`; honest referral copy (no false 10% cash claim)
- Unit: `promoCodes.test.ts` — 3 PASS
- Browser: created `QAJ6OFF20` (20% off); signup shows “Referred via code …”

## Still open

- Journeys J7–J8
- Cash referral commission productization
- F-012 residual cursor pagination
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
