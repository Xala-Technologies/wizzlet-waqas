import { useEffect, useRef } from "react";
import { useConvexAuth } from "convex/react";

/** Poll until Convex Auth reports an authenticated session (post-signIn race). */
export async function waitForAuthenticated(
  getState: () => { isAuthenticated: boolean; isLoading: boolean },
  timeoutMs = 8_000,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { isAuthenticated, isLoading } = getState();
    if (isAuthenticated && !isLoading) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error("Sign-in succeeded but the session is not ready yet. Try again.");
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
