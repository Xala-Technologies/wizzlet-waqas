/**
 * Pure environment rules — usable from Vite, Vitest, and Node scripts.
 * Booleans are enabled only when the value is exactly the string "true".
 */

export const APP_ENVS = [
  "local",
  "development",
  "preview",
  "staging",
  "production",
] as const;

export type AppEnv = (typeof APP_ENVS)[number];

export const PRODUCTION_ORIGINS = [
  "https://www.prizelet.com",
  "https://prizelet.com",
  "https://www.wizzlet.com",
  "https://wizzlet.com",
] as const;

export type EnvBag = Record<string, string | undefined>;

export function parseEnvBool(value: string | undefined | null): boolean {
  return value === "true";
}

export function isAppEnv(value: string | undefined | null): value is AppEnv {
  return APP_ENVS.includes(value as AppEnv);
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

export function looksLikePlaceholderConvexUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  const lower = url.toLowerCase();
  return (
    lower.includes("your_deployment") ||
    lower.includes("missing.convex.cloud") ||
    lower.includes("placeholder.invalid")
  );
}

/** Stricter: treat placeholder / empty as invalid. */
export function isValidConvexUrl(url: string | undefined | null): boolean {
  if (!url || !url.trim()) return false;
  if (url.includes("YOUR_DEPLOYMENT") || url.includes("missing.convex.cloud")) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.endsWith(".convex.cloud");
  } catch {
    return false;
  }
}

export type ValidationIssue = { code: string; message: string };

export type ValidateEnvInput = {
  appEnv: string | undefined;
  convexUrl: string | undefined;
  stripePublishableKey?: string | undefined;
  stripeSecretKey?: string | undefined;
  siteUrl?: string | undefined;
  allowSandboxCheckout?: string | undefined;
  allowDevAdminGrant?: string | undefined;
  viteAllowSandboxCheckout?: string | undefined;
  /** When true, require production-grade bindings (CI production profile / release). */
  requireProductionBindings?: boolean;
};

/**
 * Validate a configuration profile. Returns issues (empty = PASS).
 */
export function validateEnvProfile(input: ValidateEnvInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const appEnv = input.appEnv;
  const sandbox = parseEnvBool(input.allowSandboxCheckout);
  const devAdmin = parseEnvBool(input.allowDevAdminGrant);
  const clientSandbox = parseEnvBool(input.viteAllowSandboxCheckout);
  const pkMode = stripeKeyMode(input.stripePublishableKey);
  const skMode = stripeKeyMode(input.stripeSecretKey);

  if (!isAppEnv(appEnv)) {
    issues.push({
      code: "APP_ENV_INVALID",
      message: `VITE_APP_ENV must be one of: ${APP_ENVS.join(", ")} (got ${JSON.stringify(appEnv)})`,
    });
  }

  if (!isValidConvexUrl(input.convexUrl)) {
    issues.push({
      code: "CONVEX_URL_INVALID",
      message: "VITE_CONVEX_URL must be a real https://*.convex.cloud URL (no placeholder)",
    });
  }

  const isProd = appEnv === "production";
  const requireProd = isProd || input.requireProductionBindings === true;

  if (requireProd) {
    if (sandbox) {
      issues.push({
        code: "PROD_SANDBOX",
        message: "ALLOW_SANDBOX_CHECKOUT must not be true in production",
      });
    }
    if (devAdmin) {
      issues.push({
        code: "PROD_DEV_ADMIN",
        message: "ALLOW_DEV_ADMIN_GRANT must not be true in production",
      });
    }
    if (clientSandbox) {
      issues.push({
        code: "PROD_CLIENT_SANDBOX",
        message: "VITE_ALLOW_SANDBOX_CHECKOUT must not be true in production",
      });
    }
    if (input.siteUrl && isLocalhostOrigin(input.siteUrl)) {
      issues.push({
        code: "PROD_SITE_LOCALHOST",
        message: "SITE_URL must not be localhost in production",
      });
    }
    if (!input.siteUrl || !isProductionOrigin(input.siteUrl)) {
      issues.push({
        code: "PROD_SITE_URL",
        message: "Production SITE_URL must be a known production origin (e.g. https://www.prizelet.com)",
      });
    }
    if (pkMode === "test" || skMode === "test") {
      issues.push({
        code: "PROD_STRIPE_TEST",
        message: "Production must not use Stripe test keys",
      });
    }
  }

  // Non-production must not point checkout redirects at live money destinations with sandbox on
  // and must not use live Stripe secrets when sandbox is enabled.
  if (!requireProd) {
    if ((pkMode === "live" || skMode === "live") && sandbox) {
      issues.push({
        code: "LIVE_STRIPE_WITH_SANDBOX",
        message: "Live Stripe keys must not combine with ALLOW_SANDBOX_CHECKOUT=true",
      });
    }
    if ((pkMode === "live" || skMode === "live") && isLocalhostOrigin(input.siteUrl)) {
      issues.push({
        code: "LIVE_STRIPE_LOCALHOST",
        message: "Live Stripe keys must not use a localhost SITE_URL",
      });
    }
  }

  // Production frontend must not bind a clearly invalid / placeholder backend
  if (isProd && input.convexUrl?.includes("missing.convex.cloud")) {
    issues.push({
      code: "PROD_DEV_BACKEND",
      message: "Production configuration references an invalid development backend placeholder",
    });
  }

  // Truthiness trap documentation — "false" must not enable
  if (input.allowSandboxCheckout === "false" && sandbox) {
    issues.push({
      code: "BOOL_PARSE",
      message: 'ALLOW_SANDBOX_CHECKOUT="false" must not enable sandbox',
    });
  }

  return issues;
}

export function assertCandidateShaMatch(
  approvedSha: string | undefined,
  candidateSha: string | undefined,
): ValidationIssue[] {
  if (!approvedSha || !candidateSha) {
    return [
      {
        code: "SHA_MISSING",
        message: "Approved and candidate SHAs are required for release revalidation",
      },
    ];
  }
  if (approvedSha !== candidateSha) {
    return [
      {
        code: "SHA_MISMATCH",
        message: "Candidate SHA changed after approval — revalidation required",
      },
    ];
  }
  return [];
}
