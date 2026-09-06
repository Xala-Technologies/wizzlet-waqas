# Schema and integrity

## Repo vs deployment

| Check | Dev (`combative-mongoose-559`) | Prod (`ceaseless-weasel-494`) |
|-------|--------------------------------|-------------------------------|
| Schema tables present | Yes — matches `convex/schema.ts` + auth tables | MCP `tables` **timed out** — BLOCKED |
| Undeclared tables | None observed in MCP table list | BLOCKED |
| Document inference | All listed tables `inferredSchema: Never` ⇒ **no documents** (or inaccessible) | BLOCKED |

Dev schema validators align with repo for core tables (`users`, `creators`, `posts`, `subscriptions`, `paymentEvents`, auth tables, etc.).

## Integrity notes

1. **Empty deployment vs “migration complete” narrative**  
   Prior docs claim cutover; live document inference shows empty tables. Treat population as unverified (see `migration-reconciliation.md`).

2. **Money**  
   Amounts stored as integer cents (`amountCents`, fee fields). `calculatePlatformFee` used on sandbox/create paths. Good representation; payment *authorization* is the problem, not precision.

3. **Status fields**  
   `subscriptions.status` is `v.string()` — no enum. Callers can write arbitrary statuses (F-003).

4. **Uniqueness**  
   Indexes on `username`, `by_userId_creatorId`, promo `code` exist, but Convex indexes are not unique constraints. Writers must enforce uniqueness transactionally. Username uniqueness on creator upsert: **static review only**.

5. **IDs**  
   - Convex `Id<"…">` for relationships  
   - Optional `legacyId` / `externalAuthId` for migration  
   - Unsafe cast risk: `viewerSubject as Id<"users">` in entitlements (F-004)

6. **Arrays / growth**  
   No unbounded embedded history arrays observed in schema; relationship tables used appropriately.

7. **`.collect()` usage**  
   Multiple admin/list queries use unbounded `.collect()` (`subscriptions.listAllAdmin`, `admin.dashboardStats` aggregations, etc.). Acceptable only while tables stay small; **P2 scale risk** as data grows (F-012).

8. **Time in queries**  
   `events/queries.ts` uses `Date.now()` / `new Date()` inside a query (breaks Convex query caching determinism) — P3 (F-014).

9. **Return validators**  
   No public function defines `returns:` validators — validation gap vs Convex best practice (F-011).
