import { test, expect } from "@playwright/test";

const PUBLIC_PATHS = [
  "/",
  "/network",
  "/creators",
  "/todays-events",
  "/discover",
  "/top-creators",
  "/pricing",
  "/support",
  "/community",
  "/login",
  "/signup",
  "/auth/callback",
  "/select-role",
  "/subscription/success",
  "/subscription/cancel",
  "/go/wave2-inventory-unknown",
  "/c/wave2-inventory-unknown",
  "/wave2-inventory-unknown-user",
  "/this-path-should-404-zzzz",
];

const DEMO_PATHS = [
  "/demo/creator",
  "/demo/admin",
  "/demo/admin/creators",
  "/demo/admin/users",
  "/demo/admin/transactions",
  "/demo/admin/fees",
  "/demo/admin/settings",
  "/demo/member",
  "/demo/member/results",
  "/demo/member/subscriptions-billing",
  "/demo/member/saved",
  "/demo/member/notifications",
  "/demo/member/discover",
  "/demo/member/activity",
  "/demo/member/settings",
];

const PROTECTED_PATHS = [
  "/dashboard",
  "/dashboard/results",
  "/dashboard/subscriptions-billing",
  "/dashboard/subscriptions-billing/manage/wave2",
  "/dashboard/saved",
  "/dashboard/notifications",
  "/dashboard/discover",
  "/dashboard/activity",
  "/dashboard/settings",
  "/dashboard/messages",
  "/creator",
  "/creator/posts",
  "/creator/products",
  "/creator/subscribers",
  "/creator/promo",
  "/creator/promo/codes",
  "/creator/personal-growth-manager",
  "/creator/resolution-case",
  "/creator/smart-pricing",
  "/creator/access-control",
  "/creator/performance-tracker",
  "/creator/messages",
  "/creator/notifications",
  "/creator/links",
  "/creator/referrals",
  "/creator/earnings",
  "/creator/payouts",
  "/creator/transactions",
  "/creator/settings",
  "/creator/integrations",
  "/creator/support",
  "/creator/onboarding",
  "/admin",
  "/admin/creators",
  "/admin/users",
  "/admin/customers",
  "/admin/finance",
  "/admin/transactions",
  "/admin/fees",
  "/admin/creator-messaging",
  "/admin/customer-email",
  "/admin/growth-manager-inbox",
  "/admin/resolution-cases",
  "/admin/payouts",
  "/admin/alerts",
  "/admin/notifications",
  "/admin/reports",
  "/admin/settings",
];

async function assertNoCrash(page: import("@playwright/test").Page) {
  await expect(page.locator("body")).not.toContainText("Something went wrong");
}

test.describe("Wave 2 world-ready surface smoke", () => {
  test.describe.configure({ mode: "serial", timeout: 180_000 });

  test.skip(({ browserName }) => browserName !== "chromium");

  test("public and marketing routes load without ErrorBoundary", async ({ page }) => {
    for (const path of PUBLIC_PATHS) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20_000 });
      expect(res, path).toBeTruthy();
      expect(res!.status(), `${path} status`).toBeLessThan(500);
      await assertNoCrash(page);
    }
  });

  test("demo fixture routes load without ErrorBoundary", async ({ page }) => {
    for (const path of DEMO_PATHS) {
      const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20_000 });
      expect(res, path).toBeTruthy();
      expect(res!.status(), `${path} status`).toBeLessThan(500);
      await assertNoCrash(page);
    }
  });

  test("protected routes send anonymous users toward login", async ({ page }) => {
    for (const path of PROTECTED_PATHS) {
      await page.goto(path, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await assertNoCrash(page);
      await expect(page, path).toHaveURL(/\/login/, { timeout: 20_000 });
    }
  });
});
