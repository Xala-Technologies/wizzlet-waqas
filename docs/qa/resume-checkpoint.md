# Resume checkpoint — after Wave 14 (J2)

## Open PR stack

- **#10–#16** auth → portal → F-011 → F-012 caps
- **#17** (this) `test/qa-j2-products-w14` — J2 product pricing sync + profile checkout productId

## Wave 14 / J2

- Featured product upsert syncs `creators.monthlyPriceCents`
- Profile subscribe / premium-lock CTAs use featured product price + `productId`
- Existing subscription amounts preserved on sub rows (not rewritten by product edits)
- Fixture note: `@qacreator1101` had no `products` rows; PricingCards path already passes product id in code

## Still open

- Journeys J4–J8
- F-012 residual: true cursor pagination for admin join pages
- Gate: **NOT READY** for full-app claim

## Prod reminder

Never set `ALLOW_DEV_ADMIN_GRANT` on production.
