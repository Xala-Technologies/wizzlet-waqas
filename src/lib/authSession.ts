import { useEffect, useRef } from "react";
import { useConvexAuth } from "convex/react";

export type AuthReadyState = { isAuthenticated: boolean; isLoading: boolean };

/**
 * Poll until Convex Auth reports an authenticated session (post-signIn / OAuth race).
 * Waits for loading to settle; distinguishes "still loading" from "never authenticated".
 */
export async function waitForAuthenticated(
  getState: () => AuthReadyState,
  timeoutMs = 20_000,
): Promise<void> {
  const started = Date.now();
  let sawLoading = false;

  while (Date.now() - started < timeoutMs) {
    const { isAuthenticated, isLoading } = getState();
    if (isLoading) sawLoading = true;
    if (isAuthenticated && !isLoading) return;
    await new Promise((r) => setTimeout(r, 50));
  }

  const final = getState();
  if (final.isLoading || sawLoading) {
    throw new Error(
      "Sign-in is taking longer than expected. Check your connection, then try again.",
    );
  }
  throw new Error(
    "Sign-in succeeded but the session is not ready yet. Try again from the login page (OAuth must return to this same origin).",
  );
}

/** Retry a Convex call while auth token catches up after signIn. */
export async function withAuthRetry<T>(
  fn: () => Promise<T>,
  attempts = 12,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const unauthenticated =
        msg.includes("UNAUTHENTICATED") ||
        msg.includes("Unauthenticated") ||
        msg.includes("Not authenticated");
      if (!unauthenticated || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 75 * (i + 1)));
    }
  }
  throw lastError;
}

/** Keep a live ref of Convex auth state for async wait helpers. */
export function useConvexAuthReady() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const ref = useRef({ isAuthenticated, isLoading });
  useEffect(() => {
    ref.current = { isAuthenticated, isLoading };
  }, [isAuthenticated, isLoading]);
  return ref;
}

/**
 * OAuth return URL for Convex Auth.
 * Must be under the Convex deployment `SITE_URL` origin (exact host).
 * Local: set `SITE_URL=http://127.0.0.1:8080` on the **dev** deployment.
 * Production: `SITE_URL=https://www.prizelet.com` on the **prod** deployment.
 */
export function authCallbackUrl(path = "/auth/callback"): string {
  if (typeof window === "undefined") return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalized}`;
}
