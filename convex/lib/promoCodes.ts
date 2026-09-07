/**
 * Promo code normalization and validation (shared with unit tests).
 */

export function normalizePromoCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidPromoCodeFormat(code: string): boolean {
  return /^[A-Z0-9_-]{3,32}$/.test(code);
}

export function isValidDiscountPercent(percent: number): boolean {
  return Number.isFinite(percent) && percent >= 1 && percent <= 90;
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
