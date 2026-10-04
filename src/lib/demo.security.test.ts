import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const libDir = join(process.cwd(), "src/lib");
const pagesDir = join(process.cwd(), "src/pages");

const MONEY_MUTATION_MARKERS = [
  "api.payouts.mutations",
  "api.payments.",
  "api.subscriptions.mutations",
  "createCheckoutSession",
  "requestPayout",
  "createSubscriptionRecord",
];

describe("demo data surface (J-DEMO)", () => {
  it("*Demo.ts modules do not call Convex money APIs", () => {
    const demoFiles = readdirSync(libDir).filter((n) => n.endsWith("Demo.ts"));
    expect(demoFiles.length).toBeGreaterThan(10);
    for (const name of demoFiles) {
      const text = readFileSync(join(libDir, name), "utf8");
      expect(text).not.toMatch(/from ["']convex\/react["']/);
      expect(text).not.toMatch(/from ["']@convex\//);
      for (const marker of MONEY_MUTATION_MARKERS) {
        expect(text.includes(marker), `${name} must not reference ${marker}`).toBe(false);
      }
    }
  });

  it("money-critical creator pages toast and return when useDemo", () => {
    const targets = ["CreatorPayouts.tsx", "CreatorPromoCodes.tsx", "CreatorLinks.tsx"];
    for (const name of targets) {
      const text = readFileSync(join(pagesDir, name), "utf8");
      expect(text).toContain("useDemo");
      expect(text).toMatch(/Sample preview/);
      expect(text).toMatch(/if \(useDemo\)/);
    }
  });
});
