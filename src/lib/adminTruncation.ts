import {
  ADMIN_JOIN_LIMIT,
  ADMIN_LIST_LIMIT,
  ADMIN_SCAN_MAX_DOCS,
} from '../../convex/lib/adminLists';

/** Shared admin truncation / scope copy (U8). */
export function scanTruncationNote(truncated: boolean, listLimit: number = ADMIN_SCAN_MAX_DOCS): string | null {
  if (!truncated) return null;
  return `Showing up to ${listLimit.toLocaleString()} rows per table — totals may be incomplete at this scale.`;
}

/** Per-row join cap note for spend / earnings / sub counts on admin people tables. */
export function joinMetricsTruncationNote(
  truncated: boolean,
  joinLimit: number = ADMIN_JOIN_LIMIT,
): string | null {
  if (!truncated) return null;
  return `Some loaded rows hit the ${joinLimit.toLocaleString()}-row join cap — spend or subscriber totals may be incomplete.`;
}

export function takeCapExportNote(limit: number = ADMIN_LIST_LIMIT): string {
  return `Exports include up to ${limit.toLocaleString()} newest rows per source table.`;
}

export function loadedOnlyLabel(extra?: string): string {
  return extra ? `Loaded${extra}` : 'Loaded';
}

export { ADMIN_JOIN_LIMIT, ADMIN_LIST_LIMIT, ADMIN_SCAN_MAX_DOCS };
