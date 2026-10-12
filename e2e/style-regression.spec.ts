import { test, expect } from '@playwright/test';

// Opt-in snapshots: keep environment-specific images outside source control.
// Capture against the previous build, then compare the candidate with the same directory.
const baselineDir = process.env.E2E_VISUAL_BASELINES;
test.skip(!baselineDir, 'Set E2E_VISUAL_BASELINES to run visual regressions');
test.use({ locale: 'en-US', timezoneId: 'UTC' });
test.beforeEach(async ({ page }) => {
  await page.route('https://api.dicebear.com/**', route => route.abort());
});

const screens = [
  ['home', '/'],
  ['login', '/login'],
  ['signup', '/signup'],
  ['member', '/demo/member'],
  ['member-results', '/demo/member/results'],
  ['member-settings', '/demo/member/settings'],
  ['creator', '/demo/creator'],
  ['admin', '/demo/admin'],
  ['admin-users', '/demo/admin/users'],
  ['admin-settings', '/demo/admin/settings'],
] as const;

for (const viewport of ['desktop', 'mobile'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test.describe(`${viewport} ${theme}`, () => {
      test.use({ viewport: viewport === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 } });

      for (const [name, route] of screens) {
        test(name, async ({ page }) => {
          await page.clock.setFixedTime(new Date('2026-10-12T12:00:00Z'));
          await page.addInitScript(value => localStorage.setItem('theme', value), theme);
          await page.goto(route, { waitUntil: 'domcontentloaded' });
          await expect.poll(async () => (await page.locator('#root').innerText()).trim().length, { timeout: 15_000 }).toBeGreaterThan(30);
          await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
          await page.evaluate(() => document.fonts.ready);
          await expect(page).toHaveScreenshot(`${viewport}-${theme}-${name}.png`, {
            // Remote avatar delivery is independent of the CSS build.
            mask: [page.locator('img[src*="api.dicebear.com"]')],
            fullPage: true,
            animations: 'disabled',
            maxDiffPixelRatio: 0.001,
            timeout: 30_000,
          });
        });
      }

      test('pick-dialog', async ({ page }) => {
        await page.clock.setFixedTime(new Date('2026-10-12T12:00:00Z'));
        await page.addInitScript(value => localStorage.setItem('theme', value), theme);
        await page.goto('/demo/member/results', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: 'Add pick', exact: true }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${viewport}-${theme}-pick-dialog.png`, {
          mask: [page.locator('img[src*="api.dicebear.com"]')],
          fullPage: true,
          animations: 'disabled',
          maxDiffPixelRatio: 0.001,
          timeout: 30_000,
        });
      });
    });
  }
}
