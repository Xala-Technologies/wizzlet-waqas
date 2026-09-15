import { describe, expect, it } from "vitest";
import {
  isPromoRedeemable,
  isValidDiscountDuration,
  isValidDiscountPercent,
  isValidPromoCodeFormat,
  normalizePromoCode,
  resolveDiscountDuration,
  stripeCouponDuration,
} from "../../convex/lib/promoCodes";

describe("promo codes (J6)", () => {
  it("normalizes and validates code format", () => {
    expect(normalizePromoCode("  welcome 20 ")).toBe("WELCOME20");
    expect(isValidPromoCodeFormat("ABC")).toBe(true);
    expect(isValidPromoCodeFormat("ab")).toBe(false);
    expect(isValidPromoCodeFormat("WELCOME_20")).toBe(true);
  });

  it("accepts discount percent 1–100", () => {
    expect(isValidDiscountPercent(1)).toBe(true);
    expect(isValidDiscountPercent(90)).toBe(true);
    expect(isValidDiscountPercent(100)).toBe(true);
    expect(isValidDiscountPercent(0)).toBe(false);
    expect(isValidDiscountPercent(101)).toBe(false);
    expect(isValidDiscountPercent(15.5)).toBe(false);
  });

  it("supports once and forever durations like Whop", () => {
    expect(isValidDiscountDuration("once")).toBe(true);
    expect(isValidDiscountDuration("forever")).toBe(true);
    expect(isValidDiscountDuration("repeating")).toBe(false);
    expect(stripeCouponDuration("once")).toEqual({ duration: "once" });
    expect(stripeCouponDuration("forever")).toEqual({ duration: "forever" });
    expect(resolveDiscountDuration({ discountDuration: "forever" })).toBe("forever");
    expect(resolveDiscountDuration({})).toBe("once");
    expect(resolveDiscountDuration({ durationInPayments: 3 })).toBe("forever");
  });

  it("blocks inactive, expired, or exhausted promos", () => {
    const now = 1_000_000;
    expect(
      isPromoRedeemable(
        { isActive: true, usedCount: 0, maxUses: 5 },
        now,
      ),
    ).toBe(true);
    expect(
      isPromoRedeemable({ isActive: false, usedCount: 0 }, now),
    ).toBe(false);
    expect(
      isPromoRedeemable(
        { isActive: true, usedCount: 0, expiresAt: now - 1 },
        now,
      ),
    ).toBe(false);
    expect(
      isPromoRedeemable(
        { isActive: true, usedCount: 5, maxUses: 5 },
        now,
      ),
    ).toBe(false);
  });
});
