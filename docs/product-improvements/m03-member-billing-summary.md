# M03 Member Subscriptions & Billing — design pass summary

**Branch:** `fix/member-billing-layout`  
**Files:** `src/pages/CustomerSubscriptionsBilling.tsx`  
**Ship:** push + production deploy

## Design changes

- Loading gate until user + subscriptions + payment events resolve
- `text-heading` / `text-support` / `text-ui`; quieter tabs
- Solid empties (Discover / Billing Portal); filter-empty honesty for Active vs Cancelled
- Past-due banner, row actions, portal buttons, filters `min-h-11`
- Cancel dialog in-flight guard; portal double-open guard

## Bugs fixed

| Severity | Issue | Fix |
|----------|--------|-----|
| Low | Tiny Cancel / Message / Portal / filter controls | `min-h-11` |
| Low | Filter empty was a bare line | Solid empty + Show all + access-filter honesty |
| Low | Unused `useMutation` import | Removed |

## Checks

| Check | Result |
|-------|--------|
| `tsc --noEmit` | PASS |
| ESLint touched file | PASS |
| Browser screenshots | NOT_RUN |

## Preserved

`mySubscriptionsDetailed` / `myPaymentEvents`, `subscriptionGrantsContentAccess` + `describeSubscriptionAccess`, cancel → Stripe, billing portal handoff, access vs billing status separation, three tabs (Subscriptions / Charges / Payment Method).

## Follow-up: empty craft (flat)

**Branch:** `fix/member-billing-empty-craft`

- Shared flat empty panel (no gradients): subscriptions / charges with guidance rows
- Payment Method rebuilt as clear Stripe handoff with three facts
- Header Billing portal always available; tab counts; muted charge status badges
