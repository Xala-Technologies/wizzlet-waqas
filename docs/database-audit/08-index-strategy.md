# Index Strategy

Indexes already on Convex for primary access paths. Ensure:

| Query | Index |
|-------|-------|
| user by auth | `users.by_externalAuthId` |
| creator by username | `creators.by_username` |
| posts by creator+time | `posts.by_creatorId_createdAt` |
| subs by user+creator | `subscriptions.by_userId_creatorId` |
| notifications unread | `notifications.by_userId_read` |
| picks by user+date | `pickTracker.by_userId_date` |
| sport events by date | `sportEvents.by_startsAt` (new) |
| payment events by creator | `paymentEvents.by_creatorId` (new) |

Avoid unbounded `.collect()` on admin lists long-term — add pagination cursors.
