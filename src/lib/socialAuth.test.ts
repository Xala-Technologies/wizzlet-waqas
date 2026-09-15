import { describe, expect, it } from "vitest";
import { configuredSocialProviders } from "../../convex/lib/socialAuth";

describe("social OAuth gating", () => {
  it("reports twitter/discord disabled when env is unset", () => {
    // Vitest process env has no AUTH_* pair by default in this project.
    const cfg = configuredSocialProviders();
    expect(cfg).toEqual({ twitter: false, discord: false });
  });
});
