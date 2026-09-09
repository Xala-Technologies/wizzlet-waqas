#!/usr/bin/env npx tsx
/**
 * Print a nonsecret release manifest for the current checkout.
 * Does not hash or print secret material.
 */

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

function git(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function digestFile(path: string): string | null {
  if (!existsSync(path)) return null;
  const buf = readFileSync(path);
  return createHash("sha256").update(buf).digest("hex");
}

function main(): void {
  const sha = process.env.GITHUB_SHA ?? git("git rev-parse HEAD");
  const branch = git("git rev-parse --abbrev-ref HEAD");
  const lockDigest = digestFile(resolve("package-lock.json"));
  const manifest = {
    schemaVersion: 1,
    sourceSha: sha,
    branch,
    lockfile: {
      name: "package-lock.json",
      sha256: lockDigest,
      note: "bun.lockb is non-canonical; CI uses npm ci",
    },
    toolchain: {
      node: process.version,
      npm: git("npm -v"),
    },
    buildCommand: "npm run build",
    publicEnvProfile: {
      VITE_APP_ENV: process.env.VITE_APP_ENV ?? null,
      VITE_RELEASE_CHANNEL: process.env.VITE_RELEASE_CHANNEL ?? null,
      hasVITE_CONVEX_URL: Boolean(process.env.VITE_CONVEX_URL),
      hasVITE_STRIPE_PUBLISHABLE_KEY: Boolean(
        process.env.VITE_STRIPE_PUBLISHABLE_KEY,
      ),
    },
    intendedConvexTarget:
      process.env.CONVEX_TARGET_LABEL ??
      (process.env.VITE_APP_ENV === "production" ? "production" : "development"),
    generatedAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(manifest, null, 2));
}

main();
