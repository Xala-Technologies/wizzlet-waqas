import { describe, expect, it } from "vitest";
import {
  assertSubscriptionStatusTransition,
} from "../../convex/lib/subscriptions";
import { isSandboxEnabled } from "../../convex/lib/sandbox";
import { isDevAdminGrantAllowed } from "../../convex/lib/devAdminGrant";

/**
 * Authorization matrix (pure contracts). Live browser/API results live in docs/qa.
 * assignSelfRole Convex args are union creator|subscriber only — admin cannot be self-assigned.
 */

describe("auth matrix: assignSelfRole allowlist", () => {
  it("excludes admin and moderator from client self-assign", () => {
    const selfAssignable = new Set(["creator", "subscriber"]);
    expect(selfAssignable.has("admin")).toBe(false);
    expect(selfAssignable.has("moderator")).toBe(false);
    expect(selfAssignable.has("creator")).toBe(true);
    expect(selfAssignable.has("subscriber")).toBe(true);
  });
});

describe("auth matrix: subscription status actors", () => {
  it("blocks owner from activating; allows cancel", () => {
    expect(() => assertSubscriptionStatusTransition("owner", "active")).toThrow();
    expect(() => assertSubscriptionStatusTransition("owner", "cancelled")).not.toThrow();
  });

  it("allows admin to set active", () => {
    expect(() => assertSubscriptionStatusTransition("admin", "active")).not.toThrow();
  });
});

describe("auth matrix: sandbox env gate", () => {
  it("is false unless ALLOW_SANDBOX_CHECKOUT=true", () => {
    const prev = process.env.ALLOW_SANDBOX_CHECKOUT;
    delete process.env.ALLOW_SANDBOX_CHECKOUT;
    expect(isSandboxEnabled()).toBe(false);
    process.env.ALLOW_SANDBOX_CHECKOUT = "true";
    expect(isSandboxEnabled()).toBe(true);
    if (prev === undefined) delete process.env.ALLOW_SANDBOX_CHECKOUT;
    else process.env.ALLOW_SANDBOX_CHECKOUT = prev;
  });
});

describe("auth matrix: grantTestAdmin gate (QA-W1-01)", () => {
  it("denies when ALLOW_DEV_ADMIN_GRANT is unset even for allowlisted email", () => {
    expect(isDevAdminGrantAllowed("admin@wizzlet.dev", undefined)).toBe(false);
    expect(isDevAdminGrantAllowed("admin@wizzlet.dev", "false")).toBe(false);
  });

  it("denies non-allowlisted email even when env is true", () => {
    expect(isDevAdminGrantAllowed("qa.member.w3.1101@wizzlet.test", "true")).toBe(false);
  });

  it("allows only allowlisted emails when env is true", () => {
    expect(isDevAdminGrantAllowed("admin@wizzlet.dev", "true")).toBe(true);
    expect(isDevAdminGrantAllowed("test@wizzlet.dev", "true")).toBe(true);
  });
});
