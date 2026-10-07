/**
 * Weekly Monday payout schedule helpers (UTC).
 */

/** ISO week start (Monday 00:00 UTC) for a timestamp. */
export function utcWeekStartMs(nowMs: number): number {
  const d = new Date(nowMs);
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - daysFromMonday,
    0,
    0,
    0,
    0,
  );
}

export function weekBatchKey(creatorId: string, weekStartMs: number): string {
  const d = new Date(weekStartMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${creatorId}:${y}-${m}-${day}`;
}

/** Next Monday 09:00 UTC strictly after now (or this Monday 09:00 if still in the future). */
export function nextMondayPayoutAtMs(nowMs: number, payoutHourUtc = 9): number {
  const weekStart = utcWeekStartMs(nowMs);
  const thisMondayRun = weekStart + payoutHourUtc * 3_600_000;
  if (nowMs < thisMondayRun) return thisMondayRun;
  return thisMondayRun + 7 * 86_400_000;
}

export function formatPayoutDateLabel(ms: number): string {
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Whether this Monday batch should include a creator for their schedule preference.
 * - weekly / missing → every Monday
 * - biweekly → even ISO weeks from epoch week
 * - monthly → first Monday of the UTC month only
 * - manual → never auto
 */
export function isScheduleDueThisWeek(
  schedule: string | undefined,
  weekStartMs: number,
): boolean {
  const s = (schedule ?? "weekly").toLowerCase();
  if (s === "manual") return false;
  if (s === "biweekly" || s === "bi-weekly") {
    const weeks = Math.floor(weekStartMs / (7 * 86_400_000));
    return weeks % 2 === 0;
  }
  if (s === "monthly") {
    const d = new Date(weekStartMs);
    return d.getUTCDate() <= 7;
  }
  return true; // weekly / default
}
