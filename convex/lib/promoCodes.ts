/**
 * Promo code normalization and validation (shared with unit tests).
 */

export type PromoDiscountDuration = "once" | "forever";

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidPromoCodeFormat(code: string): boolean {
  return /^[A-Z0-9_-]{3,32}$/.test(code);
}

export function isValidDiscountPercent(percent: number): boolean {
  return Number.isFinite(percent) && Number.isInteger(percent) && percent >= 1 && percent <= 100;
}

export function isValidDiscountDuration(duration: string): duration is PromoDiscountDuration {
  return duration === "once" || duration === "forever";
}

/**
 * Resolve stored promo duration. Legacy `durationInPayments` maps to once (1) or forever (>1).
 */
export function resolveDiscountDuration(promo: {
  discountDuration?: string;
  durationInPayments?: number;
}): PromoDiscountDuration {
  if (promo.discountDuration === "once" || promo.discountDuration === "forever") {
    return promo.discountDuration;
  }
  if (promo.durationInPayments != null && promo.durationInPayments > 1) {
    return "forever";
  }
  return "once";
}

/** Stripe coupon duration for first-month vs forever promos. */
export function stripeCouponDuration(duration: PromoDiscountDuration): {
  duration: "once" | "forever";
} {
  return { duration };
}

export function isPromoRedeemable(
  promo: {
    isActive: boolean;
    expiresAt?: number;
    maxUses?: number;
    usedCount: number;
  },
  nowMs: number,
): boolean {
  if (!promo.isActive) return false;
  if (promo.expiresAt != null && promo.expiresAt <= nowMs) return false;
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return false;
  return true;
}
