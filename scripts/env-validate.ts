#!/usr/bin/env npx tsx
/**
 * Validate environment profile. Fail closed on dangerous combinations.
 *
 * Usage:
 *   npm run env:validate
 *   APP_ENV_PROFILE=production npm run env:validate
 *
 * Loads process.env (and optionally .env.local keys already exported by the shell).
 * Does not print secret values.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  validateEnvProfile,
  type ValidationIssue,
} from "../src/config/envRules.ts";

function loadDotEnvFile(file: string, into: Record<string, string>) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (into[key] === undefined) into[key] = value;
  }
}

function main(): void {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  // Vite precedence-ish for local runs: shell wins; fill gaps from .env.local then .env
  loadDotEnvFile(resolve(process.cwd(), ".env.local"), env);
  loadDotEnvFile(resolve(process.cwd(), ".env"), env);

  const profile = process.env.APP_ENV_PROFILE ?? env.VITE_APP_ENV ?? "local";
  const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

  // CI fixture when no real Convex URL is present
  if (isCi && !env.VITE_CONVEX_URL) {
    env.VITE_APP_ENV = env.VITE_APP_ENV ?? "development";
    env.VITE_CONVEX_URL =
      env.VITE_CONVEX_URL ?? "https://ci-fixture.convex.cloud";
  }

  const appEnv = process.env.APP_ENV_PROFILE ?? env.VITE_APP_ENV ?? profile;

  const issues: ValidationIssue[] = validateEnvProfile({
    appEnv,
    convexUrl: env.VITE_CONVEX_URL,
    stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY,
    stripeSecretKey: env.STRIPE_SECRET_KEY,
    siteUrl: env.SITE_URL,
    allowSandboxCheckout: env.ALLOW_SANDBOX_CHECKOUT,
    allowDevAdminGrant: env.ALLOW_DEV_ADMIN_GRANT,
    viteAllowSandboxCheckout: env.VITE_ALLOW_SANDBOX_CHECKOUT,
    requireProductionBindings: appEnv === "production",
  });

  if (issues.length) {
    console.error(`env:validate FAIL (${appEnv}) — ${issues.length} issue(s):`);
    for (const issue of issues) {
      console.error(`  [${issue.code}] ${issue.message}`);
    }
    process.exit(1);
  }

  console.log(`env:validate PASS (${appEnv})`);
  console.log(
    JSON.stringify(
      {
        appEnv,
        hasConvexUrl: Boolean(env.VITE_CONVEX_URL),
        hasStripePk: Boolean(env.VITE_STRIPE_PUBLISHABLE_KEY),
        hasSiteUrl: Boolean(env.SITE_URL),
        sandbox: env.ALLOW_SANDBOX_CHECKOUT === "true",
        devAdmin: env.ALLOW_DEV_ADMIN_GRANT === "true",
      },
      null,
      2,
    ),
  );
}

main();
