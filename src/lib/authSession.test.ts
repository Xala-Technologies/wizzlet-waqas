import { describe, expect, it, vi, afterEach } from "vitest";
import {
  authCallbackUrl,
  configuredAuthOrigin,
  ensureCanonicalAuthOrigin,
  isAuthOriginAligned,
  waitForAuthenticated,
} from "./authSession";

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

  it("reads configuredAuthOrigin from VITE_SITE_URL", () => {
    vi.stubEnv("VITE_SITE_URL", "https://www.prizelet.com/");
    expect(configuredAuthOrigin()).toBe("https://www.prizelet.com");
  });

  it("trims whitespace/newlines from VITE_SITE_URL", () => {
    vi.stubEnv("VITE_SITE_URL", "https://www.prizelet.com\n");
    expect(configuredAuthOrigin()).toBe("https://www.prizelet.com");
  });
});

describe("ensureCanonicalAuthOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when already on the configured origin", () => {
    vi.stubEnv("VITE_SITE_URL", window.location.origin);
    expect(ensureCanonicalAuthOrigin()).toBe(false);
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
