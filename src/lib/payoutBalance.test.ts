import { describe, expect, it } from "vitest";
import {
  computeAvailableBalanceCents,
  computeCreatorBalanceBreakdown,
  isPaidOutPayoutStatus,
  isReservedPayoutStatus,
  isSettledEarningEvent,
  sumSettledEarningsByCreatorCents,
} from "../../convex/lib/payoutBalance";
import {
  isScheduleDueThisWeek,
  nextMondayPayoutAtMs,
  utcWeekStartMs,
  weekBatchKey,
} from "../../convex/lib/payoutSchedule";
import {
  computeAvailableAtMs,
  isAutoPayoutsEnabled,
  parsePayoutDefaults,
} from "../../convex/lib/payoutDefaults";

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

describe("pending → available hold", () => {
  const now = Date.parse("2026-10-07T12:00:00.000Z");

  it("keeps earnings pending before availableAt", () => {
    const bal = computeCreatorBalanceBreakdown(
      [
        {
          creatorId: "c1",
          creatorEarningsCents: 4500,
          status: "settled",
          paymentMode: "live",
          type: "subscription_charge",
          availableAt: now + 86_400_000,
          createdAt: now - 86_400_000,
        },
      ],
      0,
      now,
    );
    expect(bal.pendingCents).toBe(4500);
    expect(bal.availableCents).toBe(0);
    expect(bal.releasedCents).toBe(0);
  });

  it("releases earnings after availableAt and subtracts reserved", () => {
    const bal = computeCreatorBalanceBreakdown(
      [
        {
          creatorId: "c1",
          creatorEarningsCents: 4500,
          status: "settled",
          paymentMode: "live",
          type: "renewal",
          availableAt: now - 1,
          createdAt: now - 8 * 86_400_000,
        },
      ],
      1000,
      now,
    );
    expect(bal.pendingCents).toBe(0);
    expect(bal.availableCents).toBe(3500);
  });

  it("treats legacy rows without availableAt as immediately available", () => {
    const bal = computeCreatorBalanceBreakdown(
      [
        {
          creatorId: "c1",
          creatorEarningsCents: 2000,
          status: "settled",
          paymentMode: "test",
          type: "subscription_charge",
          createdAt: now - 1000,
        },
      ],
      0,
      now,
    );
    expect(bal.availableCents).toBe(2000);
    expect(bal.pendingCents).toBe(0);
  });

  it("claws refunds from pending first then available, then debt", () => {
    const bal = computeCreatorBalanceBreakdown(
      [
        {
          creatorId: "c1",
          creatorEarningsCents: 1000,
          status: "settled",
          type: "subscription_charge",
          availableAt: now + 86_400_000,
          createdAt: now,
        },
        {
          creatorId: "c1",
          creatorEarningsCents: 500,
          status: "settled",
          type: "renewal",
          availableAt: now - 1,
          createdAt: now - 10 * 86_400_000,
        },
        {
          creatorId: "c1",
          creatorEarningsCents: -1200,
          status: "settled",
          type: "refund",
          createdAt: now,
        },
      ],
      0,
      now,
    );
    expect(bal.pendingCents).toBe(0);
    expect(bal.availableCents).toBe(300);
    expect(bal.debtCents).toBe(0);
  });

  it("records debt when clawback exceeds pending+available", () => {
    const bal = computeCreatorBalanceBreakdown(
      [
        {
          creatorId: "c1",
          creatorEarningsCents: 500,
          status: "settled",
          type: "subscription_charge",
          availableAt: now - 1,
          createdAt: now,
        },
        {
          creatorId: "c1",
          creatorEarningsCents: -2000,
          status: "settled",
          type: "dispute",
          createdAt: now,
        },
      ],
      0,
      now,
    );
    expect(bal.availableCents).toBe(0);
    expect(bal.debtCents).toBe(1500);
    expect(bal.payoutBlocked).toBe(true);
  });

  it("ignores reversed originals", () => {
    const bal = computeCreatorBalanceBreakdown(
      [
        {
          creatorId: "c1",
          creatorEarningsCents: 4500,
          status: "settled",
          type: "subscription_charge",
          balanceState: "reversed",
          availableAt: now - 1,
          createdAt: now,
        },
      ],
      0,
      now,
    );
    expect(bal.earnedCents).toBe(0);
    expect(bal.availableCents).toBe(0);
  });
});

describe("payout schedule helpers", () => {
  it("builds monday week batch keys", () => {
    const week = utcWeekStartMs(Date.parse("2026-10-07T15:00:00.000Z")); // Wed
    expect(weekBatchKey("creatorA", week)).toMatch(/^creatorA:2026-10-05$/);
  });

  it("skips manual and respects biweekly/monthly", () => {
    const week = utcWeekStartMs(Date.parse("2026-10-05T12:00:00.000Z"));
    expect(isScheduleDueThisWeek("manual", week)).toBe(false);
    expect(isScheduleDueThisWeek("weekly", week)).toBe(true);
    expect(isScheduleDueThisWeek("monthly", week)).toBe(true); // Oct 5 is first Monday week
  });

  it("computes next Monday 09:00 UTC", () => {
    const sunday = Date.parse("2026-10-04T10:00:00.000Z");
    const next = nextMondayPayoutAtMs(sunday, 9);
    expect(new Date(next).toISOString()).toBe("2026-10-05T09:00:00.000Z");
  });
});

describe("payout defaults", () => {
  it("defaults hold to 7 days and parses overrides", () => {
    expect(parsePayoutDefaults(undefined).earningsHoldDays).toBe(7);
    expect(parsePayoutDefaults({ earningsHoldDays: 0 }).earningsHoldDays).toBe(0);
    expect(computeAvailableAtMs(1_000, 7)).toBe(1_000 + 7 * 86_400_000);
    expect(isAutoPayoutsEnabled({ autoPayoutsEnabled: true })).toBe(true);
    expect(isAutoPayoutsEnabled({})).toBe(false);
  });
});
