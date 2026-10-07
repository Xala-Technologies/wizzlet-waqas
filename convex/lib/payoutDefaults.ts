/**
 * Platform payout defaults (hold, Monday cadence, reserve, feature flags).
 */

export const DEFAULT_EARNINGS_HOLD_DAYS = 7;
export const DEFAULT_PAYOUT_WEEKDAY = 1; // Monday (Date.getUTCDay)
export const DEFAULT_PAYOUT_CADENCE = "weekly" as const;
export const DEFAULT_PAYOUT_RESERVE_PERCENT = 0;
export const DEFAULT_MIN_PAYOUT_CENTS = 5000;

export type PayoutDefaults = {
  earningsHoldDays: number;
  payoutWeekday: number;
  payoutCadence: string;
  payoutReservePercent: number;
  minPayoutCents: number;
};

export function parsePayoutDefaults(
  payoutDefaults: Record<string, unknown> | null | undefined,
): PayoutDefaults {
  const row = payoutDefaults ?? {};
  const holdRaw = Number(row.earningsHoldDays ?? row.earnings_hold_days);
  const weekdayRaw = Number(row.payoutWeekday ?? row.payout_weekday);
  const reserveRaw = Number(row.payoutReservePercent ?? row.payout_reserve_percent);
  const minDollars = Number(row.minPayoutAmount ?? row.min_payout_amount);
  const cadenceRaw = row.payoutCadence ?? row.payout_cadence ?? row.schedule;

  return {
    earningsHoldDays:
      Number.isFinite(holdRaw) && holdRaw >= 0
        ? Math.floor(holdRaw)
        : DEFAULT_EARNINGS_HOLD_DAYS,
    payoutWeekday:
      Number.isFinite(weekdayRaw) && weekdayRaw >= 0 && weekdayRaw <= 6
        ? Math.floor(weekdayRaw)
        : DEFAULT_PAYOUT_WEEKDAY,
    payoutCadence:
      typeof cadenceRaw === "string" && cadenceRaw.length > 0
        ? cadenceRaw
        : DEFAULT_PAYOUT_CADENCE,
    payoutReservePercent:
      Number.isFinite(reserveRaw) && reserveRaw >= 0
        ? Math.min(100, reserveRaw)
        : DEFAULT_PAYOUT_RESERVE_PERCENT,
    minPayoutCents:
      Number.isFinite(minDollars) && minDollars > 0
        ? Math.round(minDollars * 100)
        : DEFAULT_MIN_PAYOUT_CENTS,
  };
}

export function isAutoPayoutsEnabled(
  featureFlags: Record<string, unknown> | null | undefined,
): boolean {
  const flags = featureFlags ?? {};
  return flags.autoPayoutsEnabled === true || flags.auto_payouts_enabled === true;
}

export function computeAvailableAtMs(
  createdAtMs: number,
  earningsHoldDays: number,
): number {
  return createdAtMs + Math.max(0, earningsHoldDays) * 86_400_000;
}
