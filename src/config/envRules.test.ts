import { describe, expect, it } from "vitest";
import {
  assertCandidateShaMatch,
  parseEnvBool,
  validateEnvProfile,
} from "@/config/envRules";

describe("parseEnvBool", () => {
  it('enables only for exact string "true"', () => {
    expect(parseEnvBool("true")).toBe(true);
    expect(parseEnvBool("false")).toBe(false);
    expect(parseEnvBool("TRUE")).toBe(false);
    expect(parseEnvBool("1")).toBe(false);
    expect(parseEnvBool("")).toBe(false);
    expect(parseEnvBool(undefined)).toBe(false);
  });
});

describe("validateEnvProfile", () => {
  const baseDev = {
    appEnv: "development",
    convexUrl: "https://happy-animal-123.convex.cloud",
  };

  it("fails production configuration that references an invalid backend placeholder", () => {
    const issues = validateEnvProfile({
      appEnv: "production",
      convexUrl: "https://missing.convex.cloud",
      siteUrl: "https://www.prizelet.com",
      requireProductionBindings: true,
    });
    expect(issues.some((i) => i.code === "CONVEX_URL_INVALID" || i.code === "PROD_DEV_BACKEND")).toBe(
      true,
    );
  });

  it("fails non-production live Stripe with localhost SITE_URL", () => {
    const issues = validateEnvProfile({
      ...baseDev,
      stripeSecretKey: "sk_live_example",
      siteUrl: "http://localhost:8080",
    });
    expect(issues.some((i) => i.code === "LIVE_STRIPE_LOCALHOST")).toBe(true);
  });

  it("fails non-production live Stripe combined with sandbox", () => {
    const issues = validateEnvProfile({
      ...baseDev,
      stripePublishableKey: "pk_live_example",
      allowSandboxCheckout: "true",
      siteUrl: "https://staging.example.com",
    });
    expect(issues.some((i) => i.code === "LIVE_STRIPE_WITH_SANDBOX")).toBe(true);
  });

  it("fails production with sandbox or dev-admin enabled", () => {
    const sandboxIssues = validateEnvProfile({
      appEnv: "production",
      convexUrl: "https://prod-example.convex.cloud",
      siteUrl: "https://www.prizelet.com",
      allowSandboxCheckout: "true",
      requireProductionBindings: true,
    });
    expect(sandboxIssues.some((i) => i.code === "PROD_SANDBOX")).toBe(true);

    const adminIssues = validateEnvProfile({
      appEnv: "production",
      convexUrl: "https://prod-example.convex.cloud",
      siteUrl: "https://www.prizelet.com",
      allowDevAdminGrant: "true",
      requireProductionBindings: true,
    });
    expect(adminIssues.some((i) => i.code === "PROD_DEV_ADMIN")).toBe(true);
  });

  it("fails clearly when required production SITE_URL is missing", () => {
    const issues = validateEnvProfile({
      appEnv: "production",
      convexUrl: "https://prod-example.convex.cloud",
      requireProductionBindings: true,
    });
    expect(issues.some((i) => i.code === "PROD_SITE_URL")).toBe(true);
  });

  it('does not treat allowSandboxCheckout="false" as enabled', () => {
    expect(parseEnvBool("false")).toBe(false);
    const issues = validateEnvProfile({
      ...baseDev,
      allowSandboxCheckout: "false",
      siteUrl: "http://localhost:8080",
    });
    expect(issues.some((i) => i.code === "BOOL_PARSE")).toBe(false);
    expect(issues.filter((i) => i.code === "PROD_SANDBOX")).toHaveLength(0);
  });

  it("passes a sane local/development profile", () => {
    const issues = validateEnvProfile({
      appEnv: "local",
      convexUrl: "https://happy-animal-123.convex.cloud",
      allowSandboxCheckout: "true",
      allowDevAdminGrant: "true",
      siteUrl: "http://localhost:8080",
      stripePublishableKey: "pk_test_example",
    });
    expect(issues).toEqual([]);
  });

  it("passes a sane production profile", () => {
    const issues = validateEnvProfile({
      appEnv: "production",
      convexUrl: "https://prod-example.convex.cloud",
      siteUrl: "https://www.prizelet.com",
      stripePublishableKey: "pk_live_example",
      stripeSecretKey: "sk_live_example",
      requireProductionBindings: true,
    });
    expect(issues).toEqual([]);
  });
});

describe("assertCandidateShaMatch", () => {
  it("requires revalidation when the candidate changes after approval", () => {
    const issues = assertCandidateShaMatch("abc123", "def456");
    expect(issues.some((i) => i.code === "SHA_MISMATCH")).toBe(true);
  });

  it("passes when SHAs match", () => {
    expect(assertCandidateShaMatch("abc123", "abc123")).toEqual([]);
  });
});
