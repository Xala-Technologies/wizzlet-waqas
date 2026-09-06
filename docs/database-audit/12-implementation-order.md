# Implementation Order

1. Convex schema extensions + push  
2. Auth config (Supabase JWT) + ConvexProviderWithAuth  
3. Default backend → convex (env)  
4. Public creators + sportEvents queries  
5. Admin dashboard real aggregates  
6. Creator earnings + paymentEvents  
7. Notifications + payout request fixes  
8. Normalize pick/post results  
9. subscriptions.productId in sandbox subscribe  
10. Remove remaining CRITICAL/HIGH gaps  

## Risk summary

| Severity | Count (themes) |
|----------|----------------|
| CRITICAL | Backend unreachable without Convex cutover; notification ID bug; dual-ID |
| HIGH | Fake admin/earnings KPIs; mock landing; payout request; result vocab; no product link |
| MEDIUM | Unsaved post targeting; link clicks; prefs unused |
| LOW | Demo/orphans |
