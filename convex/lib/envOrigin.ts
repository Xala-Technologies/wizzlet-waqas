/**
 * Shared production-origin and Stripe-mode rules.
 * Imported by Convex guards and the Vite/script validator so the lists cannot drift.
 */

export const PRODUCTION_ORIGINS = [
  "https://www.prizelet.com",
  "https://prizelet.com",
  "https://www.wizzlet.com",
  "https://wizzlet.com",
] as const;

/** Booleans are enabled only when the value is exactly the string "true". */
export function parseEnvBool(value: string | undefined | null): boolean {
  return value === "true";
}

export function stripeKeyMode(
  key: string | undefined | null,
): "test" | "live" | "unknown" | "absent" {
  if (!key || !key.trim()) return "absent";
  if (key.startsWith("pk_live_") || key.startsWith("sk_live_")) return "live";
  if (key.startsWith("pk_test_") || key.startsWith("sk_test_")) return "test";
  return "unknown";
}

export function isLocalhostOrigin(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

export function isProductionOrigin(url: string | undefined | null): boolean {
  if (!url) return false;
  const normalized = url.replace(/\/$/, "").toLowerCase();
  return (PRODUCTION_ORIGINS as readonly string[]).some(
    (origin) => normalized === origin || normalized.startsWith(`${origin}/`),
  );
}
