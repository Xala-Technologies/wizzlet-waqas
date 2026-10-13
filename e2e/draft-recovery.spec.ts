import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";

// Opt-in disposable development actors only. Never save traces or auth storage.
test.use({ trace: "off", screenshot: "off" });
const fixturePath = process.env.E2E_FORM_FIXTURES;
const fixture = fixturePath
  ? (JSON.parse(readFileSync(fixturePath, "utf8")) as {
      devUrl: string;
      actors: Record<"member" | "creator", { email: string; password: string }>;
    })
  : null;
test.skip(!fixture, "Requires dedicated development draft-recovery accounts");
async function signIn(page: Page, role: "member" | "creator") {
  await page
    .getByLabel("Email", { exact: true })
    .fill(fixture!.actors[role].email);
  await page
    .getByLabel("Password", { exact: true })
    .fill(fixture!.actors[role].password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}
async function login(page: Page, role: "member" | "creator") {
  expect(
    new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080")
      .hostname,
  ).toMatch(/^(localhost|127\.0\.0\.1)$/);
  expect(fixture!.devUrl).toBe("https://combative-mongoose-559.convex.cloud");
  await page.goto("/login");
  await signIn(page, role);
  await expect(page).toHaveURL(
    role === "creator" ? /\/creator$/ : /\/dashboard$/,
    { timeout: 30_000 },
  );
}
async function logout(page: Page) {
  const menu = page.getByRole("button", { name: "Account menu" });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole("menuitem", { name: "Log out", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  } else {
    const nav = page.getByRole("button", { name: "Open navigation menu" });
    if (await nav.isVisible()) {
      await nav.click();
      await page.getByRole("button", { name: /^(Sign out|Log out)$/ }).click();
      await expect(page).toHaveURL(/\/$/);
    }
  }
}
async function discard(page: Page) {
  await page
    .getByRole("button", { name: "Discard draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Discard changes", exact: true })
    .click();
  await expect(
    page.getByRole("complementary", { name: "Unsaved changes" }),
  ).toHaveCount(0);
}
test.afterEach(async ({ page }) => {
  await page.keyboard.press("Escape");
  await logout(page);
});

for (const width of [1440, 390]) {
  test.describe(`${width}px draft recovery`, () => {
    test.use({ viewport: { width, height: width === 390 ? 844 : 1000 } });
    test("post survives refresh, leaving the editor, and sign-in; explicit discard stays discarded", async ({
      page,
    }) => {
      await login(page, "creator");
      await page.goto("/creator/posts?demo=0");
      await page
        .getByRole("button", { name: "Create Post", exact: true })
        .first()
        .click();
      await page.getByLabel("Title *").fill("Unpublished recovery test");
      await page
        .getByLabel("Post *", { exact: true })
        .fill("Keep this unpublished body through navigation.");
      await expect(
        page.getByText("Unsaved changes kept in this tab", { exact: true }),
      ).toBeVisible();
      await page.reload();
      await expect(page.getByLabel("Title *")).toHaveValue(
        "Unpublished recovery test",
      );
      await expect(
        page.getByText("Unsaved changes recovered", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "← Back to posts", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Resume draft", exact: true })
        .click();
      await expect(page.getByLabel("Post *", { exact: true })).toHaveValue(
        "Keep this unpublished body through navigation.",
      );
      await logout(page);
      await login(page, "creator");
      await page.goto("/creator/posts?demo=0");
      await expect(page.getByLabel("Title *")).toHaveValue(
        "Unpublished recovery test",
      );
      await discard(page);
      await page.reload();
      await page
        .getByRole("button", { name: "Create Post", exact: true })
        .first()
        .click();
      await expect(page.getByLabel("Title *")).toHaveValue("");
    });

    test("new product recovers fields after refresh and guards replacement", async ({
      page,
    }) => {
      await login(page, "creator");
      await page.goto("/creator/products?demo=0");
      await page
        .getByRole("button", { name: "Create Product", exact: true })
        .first()
        .click();
      await page
        .getByLabel("Product Name", { exact: true })
        .fill("Unsaved product recovery");
      await page
        .getByLabel("Full Description", { exact: true })
        .fill("Unpublished product body");
      await page.getByLabel("Price", { exact: true }).fill("17.25");
      await page.reload();
      await page
        .getByRole("button", { name: "Resume draft", exact: true })
        .click();
      await expect(
        page.getByLabel("Product Name", { exact: true }),
      ).toHaveValue("Unsaved product recovery");
      await expect(
        page.getByLabel("Full Description", { exact: true }),
      ).toHaveValue("Unpublished product body");
      await expect(page.getByLabel("Price", { exact: true })).toHaveValue(
        "17.25",
      );
      await page
        .getByRole("button", { name: "← Back to Products", exact: true })
        .click();
      page.once("dialog", (dialog) => dialog.dismiss());
      await page
        .getByRole("button", { name: "Create Product", exact: true })
        .first()
        .click();
      await expect(
        page.getByRole("button", { name: "Resume draft", exact: true }),
      ).toBeVisible();
      await discard(page);
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Resume draft", exact: true }),
      ).toHaveCount(0);
    });

    test("member draft survives server session revocation; password fields stay excluded", async ({
      page,
    }) => {
      await login(page, "member");
      await page.goto("/dashboard/settings?demo=0");
      await page.getByRole("button", { name: "Edit", exact: true }).click();
      await page
        .getByLabel("Full Name", { exact: true })
        .fill("Unsubmitted member recovery");
      await page
        .getByRole("button", { name: "Change Password", exact: true })
        .click();
      await page
        .getByLabel("Current password", { exact: true })
        .fill("synthetic-unsent-password");
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Cancel", exact: true })
        .click();
      const hasPassword = await page.evaluate(() =>
        Object.entries(sessionStorage)
          .filter(([k]) => k.startsWith("sweeph.draft."))
          .some(([, v]) => v.includes("synthetic-unsent-password")),
      );
      expect(hasPassword).toBe(false);
      const token = await page.evaluate(
        () =>
          Object.entries(localStorage).find(([k]) =>
            k.startsWith("__convexAuthJWT"),
          )?.[1],
      );
      if (!token) throw new Error("Expected a development auth session");
      const client = new ConvexHttpClient(fixture!.devUrl);
      client.setAuth(token);
      await client.action("auth:signOut" as never, {} as never);
      await expect(page).toHaveURL(/\/login\?returnTo=/, { timeout: 30_000 });
      await signIn(page, "member");
      await expect(page).toHaveURL(/\/dashboard\/settings\?demo=0/);
      await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue(
        "Unsubmitted member recovery",
      );
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue(
        "Forms Audit member",
      );
      await page.reload();
      await expect(
        page.getByLabel("Full Name", { exact: true }),
      ).toBeDisabled();
    });

    test("creator profile recovers general and branding changes without submitting them", async ({
      page,
    }) => {
      await login(page, "creator");
      await page.goto("/creator/settings?demo=0");
      const original = await page
        .getByLabel("Display name", { exact: true })
        .inputValue();
      await page
        .getByLabel("Display name", { exact: true })
        .fill("Unsaved creator recovery");
      await page.getByLabel("Bio", { exact: true }).fill("Unsaved biography");
      await page.goto("/creator/settings?demo=0&tab=branding");
      await page
        .getByLabel("Brand name", { exact: true })
        .fill("Unsaved brand");
      await page.reload();
      await expect(page.getByLabel("Brand name", { exact: true })).toHaveValue(
        "Unsaved brand",
      );
      await page.goto("/creator/settings?demo=0");
      await expect(
        page.getByLabel("Display name", { exact: true }),
      ).toHaveValue("Unsaved creator recovery");
      await expect(page.getByLabel("Bio", { exact: true })).toHaveValue(
        "Unsaved biography",
      );
      await discard(page);
      await expect(
        page.getByLabel("Display name", { exact: true }),
      ).toHaveValue(original);
      await page.reload();
      await expect(
        page.getByRole("button", { name: "Discard draft", exact: true }),
      ).toHaveCount(0);
    });
  });
}

test("existing product recovery saves to the original record and removes the local draft", async ({
  page,
}) => {
  await login(page, "creator");
  const { api } = await import("../convex/_generated/api");
  const client = new ConvexHttpClient(fixture!.devUrl);
  const auth = (await client.action(
    "auth:signIn" as never,
    {
      provider: "password",
      params: { flow: "signIn", ...fixture!.actors.creator },
    } as never,
  )) as { tokens: { token: string } };
  client.setAuth(auth.tokens.token);
  const creator = await client.query(api.creators.queries.myCreator, {});
  if (!creator) throw new Error("Development creator missing");
  const productId = await client.mutation(api.products.mutations.upsert, {
    creatorId: creator._id,
    name: "Disposable recovery product",
    description: "Original body",
    priceCents: 500,
    billingPeriod: "monthly",
    isFeatured: false,
    isActive: false,
    isLimited: false,
    isClosed: false,
  });
  try {
    await page.goto("/creator/products?demo=0");
    const row = page
      .getByRole("row")
      .filter({ hasText: "Disposable recovery product" });
    await row.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Discard draft", exact: true }),
    ).toHaveCount(0);
    await page
      .getByLabel("Full Description", { exact: true })
      .fill("Recovered existing product body");
    await page.getByLabel("Price", { exact: true }).fill("8.50");
    await page.reload();
    await page
      .getByRole("button", { name: "Resume draft", exact: true })
      .click();
    await expect(
      page.getByLabel("Full Description", { exact: true }),
    ).toHaveValue("Recovered existing product body");
    await page
      .getByRole("button", { name: "Save as Draft", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Create Product", exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resume draft", exact: true }),
    ).toHaveCount(0);
    const products = await client.query(api.products.mutations.listByCreator, {
      creatorId: creator._id,
    });
    const saved = products.filter(
      (p) => p.name === "Disposable recovery product",
    );
    expect(saved).toHaveLength(1);
    expect(saved[0]._id).toBe(productId);
    expect(saved[0].priceCents).toBe(850);
    expect(saved[0].description).toContain("Recovered existing product body");
    expect(saved[0].isActive).toBe(false);
  } finally {
    await client.mutation(api.products.mutations.remove, { productId });
    await client.action("auth:signOut" as never, {} as never);
  }
});
