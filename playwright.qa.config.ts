import { defineConfig, devices } from "@playwright/test";

// Playwright's automatic error-context snapshot includes password input values,
// even when screenshots and tracing are off. Keep private actor runs out of it.
if (process.env.E2E_FORM_FIXTURES) process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";

/**
 * Multi-browser smoke — Chromium, WebKit (Safari), Firefox.
 * Run: npm run test:e2e
 * Requires a local app on http://localhost:8080 (or set PLAYWRIGHT_BASE_URL).
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  // Private journeys share test accounts and may temporarily change their settings.
  workers: process.env.E2E_FORM_FIXTURES ? 1 : 4,
  reporter: "list",
  snapshotPathTemplate: process.env.E2E_VISUAL_BASELINES
    ? `${process.env.E2E_VISUAL_BASELINES}/{projectName}/{arg}{ext}`
    : undefined,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  ],
});
