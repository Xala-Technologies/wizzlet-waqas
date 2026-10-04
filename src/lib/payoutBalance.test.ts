import { describe, expect, it } from "vitest";
import {
  computeAvailableBalanceCents,
  isPaidOutPayoutStatus,
  isReservedPayoutStatus,
  isSettledEarningEvent,
  sumSettledEarningsByCreatorCents,
} from "../../convex/lib/payoutBalance";

describe("payout available balance (J5)", () => {
  it("includes Stripe test settled earnings and excludes sandbox", () => {
    expect(
      isSettledEarningEvent({ status: "settled", paymentMode: "test" }),
    ).toBe(true);
    expect(
      isSettledEarningEvent({ status: "settled", paymentMode: "live" }),
    ).toBe(true);
    expect(
      isSettledEarningEvent({ status: "settled", paymentMode: "sandbox" }),
    ).toBe(false);
    expect(isSettledEarningEvent({ status: "failed", paymentMode: "test" })).toBe(
      false,
    );
  });

  it("reserves in-flight and completed payouts", () => {
    expect(isReservedPayoutStatus("requested")).toBe(true);
    expect(isReservedPayoutStatus("completed")).toBe(true);
    expect(isReservedPayoutStatus("rejected")).toBe(false);
    expect(isReservedPayoutStatus("cancelled")).toBe(false);
  });

  it("treats only completed/paid as paid-out for UI", () => {
    expect(isPaidOutPayoutStatus("completed")).toBe(true);
    expect(isPaidOutPayoutStatus("paid")).toBe(true);
    expect(isPaidOutPayoutStatus("requested")).toBe(false);
  });

  it("subtracts reserved from earned and never goes negative", () => {
    expect(computeAvailableBalanceCents(10_000, 5_000)).toBe(5_000);
    expect(computeAvailableBalanceCents(100, 500)).toBe(0);
  });

  it("rejects over-available requests by math (server uses same formula)", () => {
    const available = computeAvailableBalanceCents(1_898, 0);
    expect(available).toBe(1_898);
    expect(2_000 > available).toBe(true);
  });

  it("sums Lifetime from settled paymentEvents even when the sub is cancelled", () => {
    const byCreator = sumSettledEarningsByCreatorCents([
      {
        creatorId: "c1",
        creatorEarningsCents: 2849,
        status: "settled",
        paymentMode: "test",
      },
      {
        creatorId: "c1",
        creatorEarningsCents: 1000,
        status: "settled",
        paymentMode: "sandbox",
      },
      {
        creatorId: "c2",
        creatorEarningsCents: 500,
        status: "failed",
        paymentMode: "test",
      },
    ]);
    expect(byCreator.get("c1")).toBe(2849);
    expect(byCreator.has("c2")).toBe(false);
  });
});
