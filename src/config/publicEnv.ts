import {
  isAppEnv,
  isValidConvexUrl,
  parseEnvBool,
  stripeKeyMode,
  type AppEnv,
  validateEnvProfile,
} from "./envRules";

export type PublicEnv = {
  appEnv: AppEnv;
  convexUrl: string;
  convexSiteUrl: string | undefined;
  stripePublishableKey: string | undefined;
  stripeMode: "stripe" | "sandbox";
  stripeKeyMode: "test" | "live" | "unknown" | "absent";
  sandboxCheckoutAllowed: boolean;
  releaseSha: string | undefined;
  releaseChannel: string | undefined;
};

function readRaw(): {
  appEnv: string | undefined;
  convexUrl: string | undefined;
  convexSiteUrl: string | undefined;
  stripePublishableKey: string | undefined;
  allowSandbox: string | undefined;
  releaseSha: string | undefined;
  releaseChannel: string | undefined;
  isDev: boolean;
} {
  return {
    appEnv: import.meta.env.VITE_APP_ENV,
    convexUrl: import.meta.env.VITE_CONVEX_URL,
    convexSiteUrl: import.meta.env.VITE_CONVEX_SITE_URL,
    stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
    allowSandbox: import.meta.env.VITE_ALLOW_SANDBOX_CHECKOUT,
    releaseSha: import.meta.env.VITE_RELEASE_SHA,
    releaseChannel: import.meta.env.VITE_RELEASE_CHANNEL,
    isDev: import.meta.env.DEV,
  };
}

/**
 * Resolve and validate browser-safe configuration.
 * Fail closed for non-local identities when Convex URL is missing/placeholder.
 */
export function resolvePublicEnv(
  overrides?: Partial<ReturnType<typeof readRaw>>,
): PublicEnv {
  const raw = { ...readRaw(), ...overrides };
  let appEnv: AppEnv = "local";
  if (isAppEnv(raw.appEnv)) {
    appEnv = raw.appEnv;
  } else if (raw.isDev) {
    appEnv = "local";
  } else {
    // Production-style builds without VITE_APP_ENV default to production (fail closed on URL).
    appEnv = "production";
  }

  const issues = validateEnvProfile({
    appEnv,
    convexUrl: raw.convexUrl,
    stripePublishableKey: raw.stripePublishableKey,
    viteAllowSandboxCheckout: raw.allowSandbox,
    requireProductionBindings: false,
  }).filter((issue) => {
    // Client cannot see server SITE_URL / sandbox secrets — only enforce browser-visible rules here.
    return (
      issue.code === "APP_ENV_INVALID" ||
      issue.code === "CONVEX_URL_INVALID" ||
      issue.code === "PROD_CLIENT_SANDBOX" ||
      issue.code === "PROD_DEV_BACKEND"
    );
  });

  // Local may warn; non-local must throw on invalid Convex URL.
  const convexOk = isValidConvexUrl(raw.convexUrl);
  if (!convexOk) {
    if (appEnv === "local" || appEnv === "development") {
      console.error(
        "[config] VITE_CONVEX_URL is missing or invalid. Set it in .env.local — see docs/environments.md",
      );
    } else {
      throw new Error(
        `[config] Refusing to start (${appEnv}): invalid VITE_CONVEX_URL. ${issues.map((i) => i.message).join("; ")}`,
      );
    }
  }

  if (appEnv === "production" && parseEnvBool(raw.allowSandbox)) {
    throw new Error(
      "[config] Refusing to start: VITE_ALLOW_SANDBOX_CHECKOUT must not be true in production",
    );
  }

  const stripePublishableKey = raw.stripePublishableKey?.trim() || undefined;

  return {
    appEnv,
    convexUrl: convexOk ? (raw.convexUrl as string) : "",
    convexSiteUrl: raw.convexSiteUrl,
    stripePublishableKey,
    stripeMode: stripePublishableKey ? "stripe" : "sandbox",
    stripeKeyMode: stripeKeyMode(stripePublishableKey),
    sandboxCheckoutAllowed:
      raw.isDev || parseEnvBool(raw.allowSandbox),
    releaseSha: raw.releaseSha,
    releaseChannel: raw.releaseChannel,
  };
}

/** Singleton resolved at module load for the SPA. */
export const publicEnv = resolvePublicEnv();
