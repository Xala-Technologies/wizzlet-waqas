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

/** Configured public app origin (Convex SITE_URL / VITE_SITE_URL), or null if unset. */
export function configuredAuthOrigin(): string | null {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined)
    ?.trim()
    .replace(/\/$/, "");
  return configured || null;
}

/**
 * OAuth return URL for Convex Auth.
 * Must match the Convex deployment `SITE_URL` origin exactly.
 *
 * Prefer `VITE_SITE_URL` so preview servers on random ports (5182, etc.) still
 * send a valid redirectTo. Local: http://127.0.0.1:8080 — never invent ports.
 */
export function authCallbackUrl(path = "/auth/callback"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const configured = configuredAuthOrigin();
  if (configured) {
    return `${configured}${normalized}`;
  }
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${normalized}`;
}

/** True when the browser origin matches configured auth SITE_URL (local hygiene). */
export function isAuthOriginAligned(): boolean {
  if (typeof window === "undefined") return true;
  const configured = configuredAuthOrigin();
  if (!configured) return true;
  return window.location.origin === configured;
}

/**
 * OAuth PKCE verifier lives in localStorage on the start origin. If the app is
 * opened on apex (prizelet.com) while SITE_URL is www, bounce to www first so
 * the verifier and the OAuth return land on the same origin.
 * Returns true when a navigation was triggered (caller should abort).
 */
export function ensureCanonicalAuthOrigin(): boolean {
  if (typeof window === "undefined") return false;
  const configured = configuredAuthOrigin();
  if (!configured || window.location.origin === configured) return false;
  // Never bounce to a malformed origin (e.g. env value with embedded newline).
  try {
    const u = new URL(configured);
    if (u.origin !== configured) return false;
  } catch {
    return false;
  }
  const next = `${configured}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(next);
  return true;
}
