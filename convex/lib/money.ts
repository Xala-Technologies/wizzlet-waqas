/**
 * Port of Postgres trigger calculate_platform_fee.
 * Intro fee applies for introFeeDays after creator.createdAt; else standard.
 */

export type FeeSettings = {
  introFeePercent: number;
  standardFeePercent: number;
  introFeeDays: number;
};

export type FeeSplit = {
  feePercentage: number;
  platformFeeCents: number;
  creatorEarningsCents: number;
};

export function calculatePlatformFee(
  amountCents: number,
  creatorCreatedAtMs: number,
  settings: FeeSettings,
  nowMs = Date.now(),
): FeeSplit {
  if (!Number.isFinite(amountCents) || amountCents < 0) {
    throw new Error("Invalid amountCents");
  }
  const ageMs = nowMs - creatorCreatedAtMs;
  const introMs = settings.introFeeDays * 24 * 60 * 60 * 1000;
  const feePercentage =
    ageMs <= introMs ? settings.introFeePercent : settings.standardFeePercent;
  const platformFeeCents = Math.round((amountCents * feePercentage) / 100);
  const creatorEarningsCents = amountCents - platformFeeCents;
  return { feePercentage, platformFeeCents, creatorEarningsCents };
}

/** Convert Postgres numeric dollars to integer cents. */
export function dollarsToCents(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}
