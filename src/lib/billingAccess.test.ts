import { describe, expect, it } from "vitest";
import { describeSubscriptionAccess } from "./billingAccess";

describe("describeSubscriptionAccess", () => {
  const now = 1_700_000_000_000;

  it("labels active access", () => {
    const d = describeSubscriptionAccess({ status: "active" }, now);
    expect(d.hasAccess).toBe(true);
    expect(d.badge).toBe("Active");
    expect(d.tone).toBe("ok");
  });

  it("labels past due without access", () => {
    const d = describeSubscriptionAccess(
      { status: "active", billingStatus: "past_due" },
      now,
    );
    expect(d.hasAccess).toBe(false);
    expect(d.badge).toBe("Past due");
    expect(d.tone).toBe("danger");
  });

  it("labels cancel pending with continued access", () => {
    const d = describeSubscriptionAccess(
      {
        status: "active",
        billingStatus: "cancel_pending",
        currentPeriodEnd: now + 86_400_000,
      },
      now,
    );
    expect(d.hasAccess).toBe(true);
    expect(d.badge).toBe("Canceling");
    expect(d.detail).toMatch(/continues through/);
  });

  it("labels canceled without access", () => {
    const d = describeSubscriptionAccess({ status: "cancelled" }, now);
    expect(d.hasAccess).toBe(false);
    expect(d.badge).toBe("Canceled");
  });
});
