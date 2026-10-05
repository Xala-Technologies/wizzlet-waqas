/** Default creator-referral commission when platformSettings omits the field. */
export const DEFAULT_REFERRAL_COMMISSION_PERCENT = 10;

/** Clamp a configured referral commission percent to a safe 0–100 range. */
export function normalizeReferralCommissionPercent(
  raw: number | null | undefined,
): number {
  if (raw == null || !Number.isFinite(raw)) {
    return DEFAULT_REFERRAL_COMMISSION_PERCENT;
  }
  return Math.min(100, Math.max(0, Math.floor(raw)));
}

/** Floor of amount × rate%; never negative. */
export function referralCommissionCents(
  amountCents: number,
  ratePercent: number,
): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  const rate = normalizeReferralCommissionPercent(ratePercent);
  if (rate <= 0) return 0;
  return Math.floor((amountCents * rate) / 100);
}
