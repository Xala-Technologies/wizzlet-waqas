import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

// Auth failures must not capture passwords, session state, or DOM snapshots.
process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
test.use({ trace: 'off', screenshot: 'off' });
const fixturePath = process.env.E2E_FORM_FIXTURES;
const creator = fixturePath
  ? (JSON.parse(readFileSync(fixturePath, 'utf8')) as { actors: { creator: { email: string; password: string } } }).actors.creator
  : undefined;
test.skip(!creator, 'Requires an unpublished, unverified development creator with no Stripe account');

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px account status`, () => {
    test.use({ viewport });

    test('uses saved status in normal and demo settings and links to payouts', async ({ page }, testInfo) => {
      expect(['localhost', '127.0.0.1']).toContain(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname);
      await page.goto('/login');
      await page.getByLabel('Email', { exact: true }).fill(creator!.email);
      await page.getByLabel('Password', { exact: true }).fill(creator!.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/creator$/, { timeout: 30_000 });
      try {
        for (const query of ['demo=0', '', 'demo=1']) {
          await page.goto(`/creator/settings?tab=general&${query}`);
          const card = page.getByRole('region', { name: 'Account Status' });
          await expect(card).toBeVisible();
          for (const [label, value] of [
            ['Email verification', 'Not verified'],
            ['Creator verification', 'Not verified'],
            ['Payouts', 'Not connected'],
            ['Public profile', 'Unpublished'],
          ]) {
            await expect(card.locator('dl > div').filter({ has: page.getByText(label, { exact: true }) }).locator('dd')).toHaveText(value);
          }
          await expect(card).not.toContainText(/Identity verified|No active restrictions|good standing|Active/);
          await expect(card.getByRole('link', { name: 'Manage payouts' })).toHaveAttribute('href', '/creator/payouts');
          await card.scrollIntoViewIfNeeded();
          const box = await card.boundingBox();
          expect(box!.x).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
          expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
          if (query === 'demo=0' && process.env.E2E_STATUS_EVIDENCE) {
            const out = process.env.E2E_STATUS_EVIDENCE;
            mkdirSync(out, { recursive: true });
            const name = `${testInfo.project.name}-${viewport.width}`;
            await page.screenshot({ path: join(out, `${name}.png`) });
            await card.screenshot({ path: join(out, `${name}-card.png`) });
          }
        }
        await page.getByRole('link', { name: 'Manage payouts' }).click();
        await expect(page).toHaveURL(/\/creator\/payouts$/);
        await expect(page.getByRole('heading', { name: 'Payout History', exact: true })).toBeVisible();
      } finally {
        const menu = page.getByRole('button', { name: 'Account menu' });
        const navigation = page.getByRole('button', { name: 'Open navigation menu' });
        await expect(menu.or(navigation)).toBeVisible();
        if (await menu.isVisible()) {
          await menu.click();
          await page.getByRole('menuitem', { name: 'Log out', exact: true }).click();
        } else {
          await navigation.click();
          await page.getByRole('button', { name: /^(Sign out|Log out)$/ }).click();
        }
        await expect(page).toHaveURL(/\/$/);
      }
    });
  });
}
