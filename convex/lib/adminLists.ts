import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc, TableNames } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Hard ceiling for admin full-table reads (F-012 interim join/aggregate paths).
 * Prefer cursor pagination (`admin/paginatedLists` + `usePaginatedQuery`) for list UIs.
 * Prefer `adminScanAll` for exact-ish admin aggregates (dashboard / finance / alerts).
 */
export const ADMIN_LIST_LIMIT = 500;

/**
 * Per-table take for multi-table admin aggregates.
 * Kept well under Convex’s ~32k docs/query limit when several tables are scanned together.
 * Note: cannot use `.paginate()` loops here — Convex allows only one paginated query per function.
 */
export const ADMIN_SCAN_MAX_DOCS = 5_000;

/** Newest-first capped read — same array shape as `.collect()`, truncated at limit. */
export async function adminTakeNewest<TableName extends TableNames>(
  ctx: Ctx,
  table: TableName,
  limit: number = ADMIN_LIST_LIMIT,
) {
  const capped = Math.min(Math.max(limit, 1), ADMIN_LIST_LIMIT);
  return ctx.db.query(table).order("desc").take(capped);
}

export function adminListTruncated(rowCount: number, limit: number = ADMIN_LIST_LIMIT): boolean {
  return rowCount >= limit;
}

/**
 * Newest-first scan for admin aggregates (10× the interim 500-row list cap).
 * Sets `truncated` when the per-table ceiling is hit.
 */
export async function adminScanAll<TableName extends TableNames>(
  ctx: Ctx,
  table: TableName,
  maxDocs: number = ADMIN_SCAN_MAX_DOCS,
): Promise<{ docs: Doc<TableName>[]; truncated: boolean }> {
  const capped = Math.min(Math.max(maxDocs, 1), ADMIN_SCAN_MAX_DOCS);
  const docs = await ctx.db.query(table).order("desc").take(capped);
  return { docs, truncated: docs.length >= capped };
}

/** Default page size for admin Load More UIs. */
export const ADMIN_PAGE_SIZE = 25;
