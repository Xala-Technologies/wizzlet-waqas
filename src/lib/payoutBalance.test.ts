import { describe, expect, it } from "vitest";

/** Mirrors reserved payout statuses used in convex/lib/payoutBalance.ts */
const RESERVED = new Set([
  "requested",
  "pending",
  "processing",
  "approved",
  "completed",
  "paid",
]);

function availableBalance(earned: number, payouts: { status: string; amountCents: number }[]) {
  const reserved = payouts
    .filter((p) => RESERVED.has(p.status))
    .reduce((s, p) => s + p.amountCents, 0);
  return Math.max(0, earned - reserved);
}

describe("payout available balance", () => {
  it("subtracts requested and completed payouts", () => {
    expect(
      availableBalance(10_000, [
        { status: "requested", amountCents: 3_000 },
        { status: "completed", amountCents: 2_000 },
        { status: "rejected", amountCents: 1_000 },
      ]),
    ).toBe(5_000);
  });

  it("never goes negative", () => {
    expect(availableBalance(100, [{ status: "requested", amountCents: 500 }])).toBe(0);
  });
});
