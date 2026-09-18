import { describe, expect, it } from "vitest";
import {
  assertProductionSafeEnv,
  parseEnvBool,
  resolveSiteUrl,
} from "../../convex/lib/envGuards";
import { ConvexError } from "convex/values";

describe("convex envGuards", () => {
  it("parseEnvBool rejects truthy non-true strings", () => {
    expect(parseEnvBool("false")).toBe(false);
    expect(parseEnvBool("true")).toBe(true);
  });

  it("resolveSiteUrl allows localhost default only without live Stripe", () => {
    expect(resolveSiteUrl(undefined, undefined)).toBe("http://localhost:8080");
    expect(resolveSiteUrl(undefined, "sk_test_x")).toBe("http://localhost:8080");
  });

  it("resolveSiteUrl fails closed for live Stripe without SITE_URL", () => {
    expect(() => resolveSiteUrl(undefined, "sk_live_x")).toThrow(ConvexError);
  });

  it("resolveSiteUrl fails closed for live Stripe with localhost SITE_URL", () => {
    expect(() =>
      resolveSiteUrl("http://localhost:8080", "sk_live_x"),
    ).toThrow(ConvexError);
  });

  it("assertProductionSafeEnv blocks sandbox on production origin", () => {
    expect(() =>
      assertProductionSafeEnv({
        siteUrl: "https://www.prizelet.com",
        allowSandboxCheckout: "true",
      }),
    ).toThrow(ConvexError);
  });

  it("assertProductionSafeEnv blocks dev-admin with live Stripe", () => {
    expect(() =>
      assertProductionSafeEnv({
        siteUrl: "https://example.com",
        allowDevAdminGrant: "true",
        stripeSecretKey: "sk_live_x",
      }),
    ).toThrow(ConvexError);
  });

  it("assertProductionSafeEnv allows sandbox on local SITE_URL", () => {
    expect(() =>
      assertProductionSafeEnv({
        siteUrl: "http://localhost:8080",
        allowSandboxCheckout: "true",
        allowDevAdminGrant: "true",
        stripeSecretKey: "sk_test_x",
      }),
    ).not.toThrow();
  });
});
