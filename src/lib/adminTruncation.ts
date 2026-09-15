import { ADMIN_LIST_LIMIT, ADMIN_SCAN_MAX_DOCS } from '../../convex/lib/adminLists';

/** Shared admin truncation / scope copy (U8). */
export function scanTruncationNote(truncated: boolean, listLimit: number = ADMIN_SCAN_MAX_DOCS): string | null {
  if (!truncated) return null;
  return `Showing up to ${listLimit.toLocaleString()} rows per table — totals may be incomplete at this scale.`;
}

export function takeCapExportNote(limit: number = ADMIN_LIST_LIMIT): string {
  return `Exports include up to ${limit.toLocaleString()} newest rows per source table.`;
}

export function loadedOnlyLabel(extra?: string): string {
  return extra ? `Loaded${extra}` : 'Loaded';
}

export { ADMIN_LIST_LIMIT, ADMIN_SCAN_MAX_DOCS };
