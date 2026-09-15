import { describe, expect, it } from "vitest";
import { calculatePlatformFee, dollarsToCents, centsToDollars } from "../../convex/lib/money";

describe("dollarsToCents", () => {
  it("rounds decimal dollars", () => {
    expect(dollarsToCents(9.99)).toBe(999);
    expect(dollarsToCents("10.00")).toBe(1000);
    expect(dollarsToCents(null)).toBe(0);
  });
});

describe("calculatePlatformFee", () => {
  const settings = { introFeePercent: 5, standardFeePercent: 10, introFeeDays: 90 };
  const created = Date.parse("2026-01-01T00:00:00Z");

  it("uses intro fee within window", () => {
    const now = Date.parse("2026-01-15T00:00:00Z");
    const split = calculatePlatformFee(10000, created, settings, now);
    expect(split.feePercentage).toBe(5);
    expect(split.platformFeeCents).toBe(500);
    expect(split.creatorEarningsCents).toBe(9500);
  });

  it("uses standard fee after window", () => {
    const now = Date.parse("2026-06-01T00:00:00Z");
    const split = calculatePlatformFee(10000, created, settings, now);
    expect(split.feePercentage).toBe(10);
    expect(split.platformFeeCents).toBe(1000);
    expect(split.creatorEarningsCents).toBe(9000);
  });

  it("round-trips cents", () => {
    expect(centsToDollars(999)).toBe(9.99);
  });
});
