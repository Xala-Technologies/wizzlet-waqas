import { describe, expect, it } from "vitest";
import {
  assertSubscriptionStatusTransition,
  SUBSCRIPTION_STATUSES,
} from "../../convex/lib/subscriptions";
import { isSandboxEnabled } from "../../convex/lib/sandbox";

describe("assertSubscriptionStatusTransition", () => {
  it("allows owner to cancel only", () => {
    expect(() => assertSubscriptionStatusTransition("owner", "cancelled")).not.toThrow();
    expect(() => assertSubscriptionStatusTransition("owner", "active")).toThrow();
    expect(() => assertSubscriptionStatusTransition("owner", "past_due")).toThrow();
  });

  it("allows creator to cancel only", () => {
    expect(() => assertSubscriptionStatusTransition("creator", "cancelled")).not.toThrow();
    expect(() => assertSubscriptionStatusTransition("creator", "active")).toThrow();
  });

  it("allows admin any valid status", () => {
    for (const status of SUBSCRIPTION_STATUSES) {
      expect(() => assertSubscriptionStatusTransition("admin", status)).not.toThrow();
    }
  });

  it("rejects unknown statuses", () => {
    expect(() => assertSubscriptionStatusTransition("admin", "bogus")).toThrow();
    expect(() => assertSubscriptionStatusTransition("owner", "reactivated")).toThrow();
  });
});

describe("isSandboxEnabled", () => {
  it("is false unless ALLOW_SANDBOX_CHECKOUT=true", () => {
    const prev = process.env.ALLOW_SANDBOX_CHECKOUT;
    delete process.env.ALLOW_SANDBOX_CHECKOUT;
    expect(isSandboxEnabled()).toBe(false);
    process.env.ALLOW_SANDBOX_CHECKOUT = "true";
    expect(isSandboxEnabled()).toBe(true);
    process.env.ALLOW_SANDBOX_CHECKOUT = "false";
    expect(isSandboxEnabled()).toBe(false);
    if (prev === undefined) delete process.env.ALLOW_SANDBOX_CHECKOUT;
    else process.env.ALLOW_SANDBOX_CHECKOUT = prev;
  });
});
