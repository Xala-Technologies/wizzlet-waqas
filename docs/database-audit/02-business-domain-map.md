# Business Domain Map

```text
Identity
  users (profile) ←→ auth subject
  userRoles (admin|creator|subscriber)

Creator commerce
  creators → products → subscriptions → fee split
  promoCodes, creatorLinks, referrals

Content
  posts (free/premium picks) → entitlements via subscription
  savedPosts, creatorBookmarks

Performance
  pickTracker (personal log; vocab ≠ posts.result)

Comms
  notifications, directMessages, supportMessages
  resolutionCases + resolutionCaseMessages
  emailCampaigns

Money ops
  payouts, creatorPayoutSettings, platformSettings

Analytics
  analyticsEvents

Platform
  admin aggregates, branding flags
```

## Lifecycles

**Subscription:** `active` → `cancelled` | `past_due` (UI)  
**Post result:** `pending` → `won` | `lost` | `push`  
**Pick tracker result:** `pending` → `win` | `loss` | `push` (**vocab mismatch**)  
**Payout:** `pending` → `completed` | `failed` (admin)  
**Resolution case:** `open` → … status strings (admin updates)
