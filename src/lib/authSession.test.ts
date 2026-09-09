import { describe, expect, it } from "vitest";
import { authCallbackUrl, waitForAuthenticated } from "./authSession";

describe("authCallbackUrl", () => {
  it("builds an absolute URL for the current origin", () => {
    expect(authCallbackUrl("/auth/callback")).toMatch(/\/auth\/callback$/);
    expect(authCallbackUrl("/auth/callback")).toContain("://");
  });
});

describe("waitForAuthenticated", () => {
  it("resolves when auth becomes ready", async () => {
    let n = 0;
    await waitForAuthenticated(() => {
      n += 1;
      return { isAuthenticated: n > 2, isLoading: n <= 2 };
    }, 2_000);
    expect(n).toBeGreaterThan(2);
  });

  it("rejects when the session never arrives", async () => {
    await expect(
      waitForAuthenticated(
        () => ({ isAuthenticated: false, isLoading: false }),
        150,
      ),
    ).rejects.toThrow(/session is not ready|login page/i);
  });
});
