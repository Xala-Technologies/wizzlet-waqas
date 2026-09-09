import { ConvexError } from "convex/values";

const PRODUCTION_ORIGINS = [
  "https://www.prizelet.com",
  "https://prizelet.com",
  "https://www.wizzlet.com",
  "https://wizzlet.com",
] as const;

/** Booleans are enabled only when the value is exactly the string "true". */
export function parseEnvBool(value: string | undefined | null): boolean {
  return value === "true";
}

function stripeKeyMode(
  key: string | undefined | null,
): "test" | "live" | "unknown" | "absent" {
  if (!key || !key.trim()) return "absent";
  if (key.startsWith("pk_live_") || key.startsWith("sk_live_")) return "live";
  if (key.startsWith("pk_test_") || key.startsWith("sk_test_")) return "test";
  return "unknown";
}

function isLocalhostOrigin(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

function isProductionOrigin(url: string | undefined | null): boolean {
  if (!url) return false;
  const normalized = url.replace(/\/$/, "").toLowerCase();
  return (PRODUCTION_ORIGINS as readonly string[]).some(
    (origin) => normalized === origin || normalized.startsWith(`${origin}/`),
  );
}

/**
 * Resolve SITE_URL for redirects.
 * Live Stripe must not silently fall back to localhost.
 */
export function resolveSiteUrl(
  siteUrlEnv: string | undefined | null = process.env.SITE_URL,
  stripeSecretKey: string | undefined | null = process.env.STRIPE_SECRET_KEY,
): string {
  const trimmed = (siteUrlEnv ?? "").trim().replace(/\/$/, "");
  const mode = stripeKeyMode(stripeSecretKey);

  if (!trimmed) {
    if (mode === "live") {
      throw new ConvexError("SITE_URL_REQUIRED_FOR_LIVE_STRIPE");
    }
    return "http://localhost:8080";
  }

  if (mode === "live" && isLocalhostOrigin(trimmed)) {
    throw new ConvexError("SITE_URL_LOCALHOST_WITH_LIVE_STRIPE");
  }

  return trimmed;
}

/**
 * Fail closed when dangerous flags are enabled on a production-shaped deployment.
 * Call at sandbox subscribe, grantTestAdmin, and migration entrypoints.
 */
export function assertProductionSafeEnv(env: {
  siteUrl?: string | undefined | null;
  allowSandboxCheckout?: string | undefined | null;
  allowDevAdminGrant?: string | undefined | null;
  stripeSecretKey?: string | undefined | null;
} = {}): void {
  const siteUrl = env.siteUrl ?? process.env.SITE_URL;
  const sandbox = parseEnvBool(
    env.allowSandboxCheckout ?? process.env.ALLOW_SANDBOX_CHECKOUT,
  );
  const devAdmin = parseEnvBool(
    env.allowDevAdminGrant ?? process.env.ALLOW_DEV_ADMIN_GRANT,
  );
  const sk = env.stripeSecretKey ?? process.env.STRIPE_SECRET_KEY;
  const productionShaped =
    isProductionOrigin(siteUrl) || stripeKeyMode(sk) === "live";

  if (!productionShaped) return;

  if (sandbox) {
    throw new ConvexError("SANDBOX_FORBIDDEN_IN_PRODUCTION");
  }
  if (devAdmin) {
    throw new ConvexError("DEV_ADMIN_FORBIDDEN_IN_PRODUCTION");
  }
}

export function isSandboxFlagEnabled(
  flag: string | undefined | null = process.env.ALLOW_SANDBOX_CHECKOUT,
): boolean {
  return parseEnvBool(flag);
}
