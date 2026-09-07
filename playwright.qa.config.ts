import { defineConfig, devices } from "@playwright/test";

/**
 * Standalone QA smoke config — avoids missing lovable-agent-playwright-config.
 * Run: npx playwright test -c playwright.qa.config.ts
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:8080",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
