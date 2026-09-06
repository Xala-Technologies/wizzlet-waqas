# Dependency matrix (Wave 1 cut)

| Upstream change | Downstream feature | Expected effect | Consistency | Verification | Wave 1 |
|-----------------|--------------------|-----------------|-------------|--------------|--------|
| Sandbox/Stripe subscribe success | Member feed premium posts | `content` unlocked for subscriber | Immediate DB | J1, J3 | **PASS (W5 profile)** |
| Sandbox/Stripe subscribe success | Member billing ACTIVE | Subscription row ACTIVE $9.99 | Immediate (webhook) | J1 | **PASS (W3)** |
| Sandbox/Stripe subscribe success | Creator public subscriber count / CTA | Count + CTA update | Immediate | J1 | **PASS (W4)** |
| Sandbox/Stripe subscribe success | Admin finance / transactions | Fee + revenue aggregates | Immediate or after ledger write | J1, J5 | NOT_RUN |
| Webhook / confirmCheckoutSession | Access without success-page return | Active sub even if user abandons return URL | Async ≤ bounded | COM-05 | PASS (inferred via ACTIVE after Checkout) |
| Cancel subscription | Premium access | Locked after cancel rule | Immediate | J1 | **PASS (W5)** |
| Cancel subscription | Messaging eligibility | Prefer server `messagingEnabled` + active sub | Immediate | J4 | **PASS (W15)** |
| Product price / period edit | New checkout | New buyers see new terms | Immediate | J2 | **PASS (W14)** |
| Product price edit | Existing subs | Preserve purchased terms unless migration | Immediate | J2 | **PASS (W14)** |
| Product capacity / isClosed | Checkout | Reject when unavailable | Immediate | COM-01/02 | STATIC_PARTIAL |
| `ALLOW_SANDBOX_CHECKOUT` unset | `sandboxSubscribe` | FORBIDDEN | Env | SEC sandbox | STATIC_PASS |
| Payout request | Available balance | Reject if over available | Immediate | J5 | STATIC_PARTIAL (unit) |
| Admin grant / role | `/admin/*` queries | `requireAdmin` passes | Immediate | ID-04, ADM-* | PASS (bootstrap) |
| Promo create | Checkout attribution | Discount + attribution rows | At purchase | J6 | NOT_RUN |
| Creator unpublish | Public profile | Hidden from discovery / getByUsername | Immediate | PUB-09 | NOT_RUN |
| File registerOwnedFile | `files.getUrl` | Non-owners FORBIDDEN | Immediate | SEC-03 | STATIC_PARTIAL |
| Sign-out | Analytics track | Must not throw / must skip when unauth | Immediate | PLAT-02 | FAIL (log) |

## Notes

- Distinguish **immediate Convex consistency** from **Stripe webhook async** fulfillment.
- Sandbox payment events must stay excluded from payout available-balance math (WZ-08/09 disposition).
