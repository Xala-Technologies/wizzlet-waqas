import { test, expect } from "@playwright/test";

test.describe("J9 public navigation smoke", () => {
  test("landing and primary nav routes respond", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 });

    const paths = ["/", "/creators", "/network", "/todays-events", "/login"];
    for (const path of paths) {
      const res = await page.goto(path);
      expect(res?.ok() || res?.status() === 304).toBeTruthy();
      await expect(page.locator("body")).not.toContainText("Something went wrong");
    }
  });

  test("login shows platform owner bootstrap in DEV", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText("admin@wizzlet.dev")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in as platform owner/i })).toBeVisible();
  });
});
