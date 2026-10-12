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

  test("login limits platform owner bootstrap to DEV builds", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    const ownerEmail = page.getByText("admin@prizelet.dev");
    const ownerSignIn = page.getByRole("button", { name: /sign in as platform owner/i });
    if (process.env.E2E_BUILD_MODE === "production") {
      await expect(ownerEmail).toHaveCount(0);
      await expect(ownerSignIn).toHaveCount(0);
    } else {
      await expect(ownerEmail).toBeVisible();
      await expect(ownerSignIn).toBeVisible();
    }
  });
});
