# Persistence Gap Analysis

## CRITICAL

1. **App still defaults to Supabase PostgREST** while operators lack Supabase access → production features fail if project is offline.
2. **AdminCustomerEmail** writes `notifications.user_id = users.id` but readers/RLS expect `auth.uid`.
3. **Dual ID model** undocumented in many call sites; risk of silent empty feeds.

## HIGH

4. AdminDashboard: Paid Out `$7,280`, Open Cases `3`, fake monthly charts.
5. CreatorEarnings: fake Recent Payments + hardcoded monthly chart.
6. Landing `/creators` + `CreatorDiscovery` use mock creators, not DB.
7. Creator payout “request” toast without `payouts` insert.
8. Post result `won/lost` vs pick_tracker `win/loss` breaks cross-stats.
9. No `subscriptions.productId` — access control matches by price.
10. Today’s events entirely hardcoded.

## MEDIUM

11. CreatorPosts: product checkboxes + push/email toggles not persisted.
12. CreatorLinks clicks/conversions never updated.
13. Billing “charge history” invented client-side.
14. notification_prefs stored but delivery not implemented.
15. Signup doesn’t collect full_name.

## LOW

16. Orphan landing components (`FeaturesSection`, `PricingSection`).
17. Demo sessionStorage (acceptable).
18. Dev login UI bypass (DEV only).

## Dummy / mock production report

| Item | Class |
|------|-------|
| AdminDashboard charts + paid out + cases | PLACEHOLDER_KPI |
| CreatorEarnings payments list | SHOULD_BE_DB |
| mockCreators / demoCreators | SHOULD_BE_DB |
| getTodaysEvents | SHOULD_BE_DB or API |
| CustomerSubscriptionsBilling history | PLACEHOLDER |
| /demo/* seeds | VALID_DEMO |
| PlatformPreviewSection blurred KPIs | VALID_DEMO |
