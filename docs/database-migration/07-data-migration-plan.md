# Data Migration Plan

## Pipeline

```text
Extract → Normalize → Transform → Map IDs → Load (idempotent) → Validate → Reconcile
```

## Tooling

`scripts/convex-migration/` — Node scripts with checkpoints:

| File | Role |
|------|------|
| config.ts | env targets; production requires explicit flag |
| extract.ts | pull rows via Supabase service role |
| transform.ts | field mapping + cents conversion |
| load.ts | Convex internal mutations upsert by legacyId |
| validate.ts | counts + sums + orphans |
| reconcile.ts | report |
| checkpoint.ts | resume state |

## Load order

users → userRoles → creators → products → posts → subscriptions → analyticsEvents → pickTracker → notifications → savedPosts → creatorBookmarks → payouts → creatorLinks → promoCodes → referrals → creatorPayoutSettings → resolutionCases → resolutionCaseMessages → supportMessages → platformSettings → emailCampaigns → directMessages

## Idempotency

Upsert on `legacyId`. Retries must not create duplicates.

## Side effects

ETL must **not** send emails, notifications, or payment webhooks.
