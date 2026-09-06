import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { TableNames } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

/**
 * Hard ceiling for admin full-table reads (F-012 interim).
 * Prefer cursor pagination + usePaginatedQuery for true scale; this prevents
 * unbounded `.collect()` memory/latency blowups while admin UIs still expect arrays.
 */
export const ADMIN_LIST_LIMIT = 500;

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
