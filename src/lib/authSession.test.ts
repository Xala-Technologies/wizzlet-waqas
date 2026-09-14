import { describe, expect, it, vi, afterEach } from "vitest";
import { authCallbackUrl, isAuthOriginAligned, waitForAuthenticated } from "./authSession";

describe("authCallbackUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers VITE_SITE_URL over window origin", () => {
    vi.stubEnv("VITE_SITE_URL", "http://127.0.0.1:8080");
    expect(authCallbackUrl("/auth/callback")).toBe(
      "http://127.0.0.1:8080/auth/callback",
    );
  });

  it("builds an absolute URL for the current origin when unset", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    expect(authCallbackUrl("/auth/callback")).toMatch(/\/auth\/callback$/);
    expect(authCallbackUrl("/auth/callback")).toContain("://");
  });
});

describe("isAuthOriginAligned", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns true when VITE_SITE_URL is unset", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    expect(isAuthOriginAligned()).toBe(true);
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
