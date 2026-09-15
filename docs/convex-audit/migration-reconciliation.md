# Migration reconciliation

## Boundary

| Artifact | Status |
|----------|--------|
| Supabase source snapshot | **Unavailable** in repo (`supabase/` deleted) |
| ETL scripts `scripts/convex-migration/` | **Deleted** |
| Import APIs | `convex/migrations/importBatch.ts` (public + secret) |
| Internal load helpers | `convex/migrations/load.ts` — **no callers** in repo |
| Cutover timestamp / manifest | Not found |
| Checkpoints table | Declared; inferred empty on dev |

## Questions separated

| Question | Answer |
|----------|--------|
| Does the repo contain Convex schema/code for domains? | **Yes** (static) |
| Does the intended deployment run that schema? | **Yes** on dev (MCP tables match schema) |
| Does that deployment contain correct migrated data? | **No evidence** — tables appear empty (`inferredSchema: Never`) |

## Reconciliation result

```text
Historical migration integrity: BLOCKED
```

Reasons:

1. No approved source extract or checksum artifacts in tree.  
2. ETL tooling removed; cannot re-validate counts against Supabase.  
3. Dev deployment document inference indicates **zero rows** across app tables — incompatible with a completed populated cutover unless data lives only on another deployment/account not inspected.  
4. Prod MCP table listing timed out — cannot confirm prod population.

## Auth cutover impact

Convex Auth Password replaces Supabase Auth. Even a perfect Postgres row copy would **not** restore login without password re-provisioning or credential migration (not present). New users must sign up again — document as intentional product break if so.

## Classification of remaining “supabase” mentions

| Location | Class |
|----------|-------|
| `docs/database-*` | Historical artifact |
| `convex/schema.ts` comment on `externalAuthId` | Migration compatibility field |
| `.gitignore` `supabase/.temp/` | Obsolete path |
| Runtime `src/` | **None** |
