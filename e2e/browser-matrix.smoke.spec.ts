import { test, expect } from "@playwright/test";

test.describe("public smoke", () => {
  test("home loads main content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).not.toContainText("Something went wrong");
  });

  test("login page renders form and optional social buttons", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    // Social providers appear when Convex reports them configured
    const xBtn = page.getByRole("button", { name: /continue with x/i });
    const discordBtn = page.getByRole("button", { name: /continue with discord/i });
    await expect
      .poll(async () => (await xBtn.count()) + (await discordBtn.count()), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(0);
    if ((await xBtn.count()) > 0) await expect(xBtn).toBeVisible();
    if ((await discordBtn.count()) > 0) await expect(discordBtn).toBeVisible();
  });

  test("critical public routes respond", async ({ page }) => {
    const paths = ["/", "/creators", "/network", "/todays-events", "/login"];
    for (const path of paths) {
      const res = await page.goto(path);
      expect(res?.ok() || res?.status() === 304).toBeTruthy();
      await expect(page.locator("body")).not.toContainText("Something went wrong");
    }
  });
});
