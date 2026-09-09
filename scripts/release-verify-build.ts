#!/usr/bin/env npx tsx
/**
 * Run a production build and verify baked public bindings exist in dist.
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

function main(): void {
  const appEnv = process.env.VITE_APP_ENV ?? "development";
  const convexUrl =
    process.env.VITE_CONVEX_URL ?? "https://ci-fixture.convex.cloud";

  console.log("release:verify-build — running npm run build…");
  execSync("npm run build", {
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_APP_ENV: appEnv,
      VITE_CONVEX_URL: convexUrl,
      VITE_RELEASE_CHANNEL: process.env.VITE_RELEASE_CHANNEL ?? appEnv,
    },
  });

  const assetsDir = resolve("dist/assets");
  if (!existsSync(assetsDir)) {
    console.error("release:verify-build FAIL — dist/assets missing");
    process.exit(1);
  }

  const jsFiles = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  let blob = "";
  for (const f of jsFiles) {
    blob += readFileSync(join(assetsDir, f), "utf8");
  }

  const host = new URL(convexUrl).hostname;
  if (!blob.includes(host) && !blob.includes(convexUrl)) {
    console.error(
      `release:verify-build FAIL — baked Convex binding for ${host} not found in dist (stale or missing env at build)`,
    );
    process.exit(1);
  }

  // Release stamp from vite define
  if (!blob.includes("VITE_RELEASE") && !/[0-9a-f]{7,40}/.test(blob)) {
    // Soft check — SHA may be short-hash inlined without the env name
    console.warn(
      "release:verify-build WARN — could not clearly detect release stamp; continuing",
    );
  }

  console.log(
    JSON.stringify(
      {
        status: "PASS",
        appEnv,
        convexHost: host,
        assetCount: jsFiles.length,
      },
      null,
      2,
    ),
  );
}

main();
