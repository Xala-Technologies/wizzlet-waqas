import { describe, expect, it } from "vitest";
import { subscriptionGrantsContentAccess } from "../../convex/lib/contentAccess";
import {
  computeWinRate,
  isSettledPickResult,
  normalizePickResult,
} from "../../convex/lib/results";

describe("subscriptionGrantsContentAccess", () => {
  const now = 1_700_000_000_000;

  it("allows active subscriptions", () => {
    expect(subscriptionGrantsContentAccess({ status: "active" }, now)).toBe(true);
  });

  it("denies past_due and unpaid", () => {
    expect(subscriptionGrantsContentAccess({ status: "past_due" }, now)).toBe(false);
    expect(
      subscriptionGrantsContentAccess({ status: "active", billingStatus: "past_due" }, now),
    ).toBe(false);
    expect(subscriptionGrantsContentAccess({ status: "unpaid" }, now)).toBe(false);
  });

  it("denies cancelled", () => {
    expect(subscriptionGrantsContentAccess({ status: "cancelled" }, now)).toBe(false);
    expect(subscriptionGrantsContentAccess({ status: "canceled" }, now)).toBe(false);
  });

  it("allows cancel_pending until period end", () => {
    expect(
      subscriptionGrantsContentAccess(
        {
          status: "active",
          billingStatus: "cancel_pending",
          currentPeriodEnd: now + 86_400_000,
        },
        now,
      ),
    ).toBe(true);
    expect(
      subscriptionGrantsContentAccess(
        {
          status: "active",
          billingStatus: "cancel_pending",
          currentPeriodEnd: now - 1,
        },
        now,
      ),
    ).toBe(false);
  });

  it("allows cancelAtPeriodEnd while period open", () => {
    expect(
      subscriptionGrantsContentAccess(
        {
          status: "active",
          cancelAtPeriodEnd: true,
          currentPeriodEnd: now + 1000,
        },
        now,
      ),
    ).toBe(true);
  });
});

describe("normalizePickResult / lock helpers", () => {
  it("maps legacy synonyms", () => {
    expect(normalizePickResult("win")).toBe("won");
    expect(normalizePickResult("loss")).toBe("lost");
    expect(normalizePickResult("W")).toBe("won");
    expect(normalizePickResult("push")).toBe("push");
    expect(normalizePickResult("pending")).toBe("pending");
  });

  it("rejects unknown values", () => {
    expect(() => normalizePickResult("maybe")).toThrow();
  });

  it("treats won/lost/push as settled", () => {
    expect(isSettledPickResult("pending")).toBe(false);
    expect(isSettledPickResult("won")).toBe(true);
    expect(isSettledPickResult("lost")).toBe(true);
    expect(isSettledPickResult("push")).toBe(true);
  });
});

describe("computeWinRate", () => {
  it("excludes push and pending from denominator", () => {
    const r = computeWinRate(["won", "lost", "push", "pending", "win"]);
    expect(r.wins).toBe(2);
    expect(r.losses).toBe(1);
    expect(r.decided).toBe(3);
    expect(r.winRatePct).toBe(67);
  });

  it("returns 0 when no decided picks", () => {
    expect(computeWinRate(["push", "pending"]).winRatePct).toBe(0);
  });
});
