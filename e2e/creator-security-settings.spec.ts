import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
test.use({ trace: 'off', screenshot: 'off' });
const path = process.env.E2E_FORM_FIXTURES;
const fixture = path ? JSON.parse(readFileSync(path, 'utf8')) as {
  devUrl: string; actors: { creator: { email: string; password: string } };
} : null;
test.skip(!fixture, 'Requires dedicated development creator');

// Run with --workers=1: each browser verifies and restores the same test profile's visibility.
for (const width of [1440, 390]) test.describe(`${width}px creator security settings`, () => {
  test.use({ viewport: { width, height: width === 390 ? 844 : 1000 } });
  test('persists public visibility and makes security and advanced actions truthful', async ({ page }, info) => {
    expect(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
    expect(fixture!.devUrl).toBe('https://combative-mongoose-559.convex.cloud');
    const actor = fixture!.actors.creator;
    const client = new ConvexHttpClient(fixture!.devUrl);
    const publicClient = new ConvexHttpClient(fixture!.devUrl);
    const auth = await client.action(api.auth.signIn, { provider: 'password', params: { flow: 'signIn', email: actor.email, password: actor.password } });
    client.setAuth(auth.tokens.token);
    const original = await client.query(api.creators.queries.myCreator, {});
    expect(original?.isPublished).toBe(false);
    let signedIn = false;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const capture = async (name: string) => {
      if (!process.env.E2E_SETTINGS_EVIDENCE) return;
      mkdirSync(process.env.E2E_SETTINGS_EVIDENCE, { recursive: true });
      await page.screenshot({ path: join(process.env.E2E_SETTINGS_EVIDENCE, `${info.project.name}-${width}-${name}-after.png`), fullPage: true, animations: 'disabled' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    };
    try {
      await page.goto('/login');
      await page.getByLabel('Email', { exact: true }).fill(actor.email);
      await page.getByLabel('Password', { exact: true }).fill(actor.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/creator$/, { timeout: 30000 }); signedIn = true;
      await page.goto('/creator/settings?tab=advanced');
      const visibility = page.getByRole('switch', { name: 'Public Profile', exact: true });
      await expect(visibility).not.toBeChecked();
      await expect.poll(() => publicClient.query(api.creators.queries.getByUsername, { username: original!.username })).toBeNull();
      await visibility.click(); await expect(visibility).toBeChecked();
      await expect.poll(async () => (await publicClient.query(api.creators.queries.getByUsername, { username: original!.username }))?.isPublished).toBe(true);
      await page.reload(); await expect(visibility).toBeChecked();
      await visibility.click(); await expect(visibility).not.toBeChecked();
      await page.reload(); await expect(visibility).not.toBeChecked();
      await expect.poll(() => publicClient.query(api.creators.queries.getByUsername, { username: original!.username })).toBeNull();
      for (const name of ['Connect Domain', 'Edit Terms', 'Edit Policy', 'Customize', 'Export Data']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
      await capture('advanced');
      await page.getByRole('link', { name: 'Request account deletion' }).click(); await expect(page).toHaveURL(/\/creator\/support$/);
      await page.goto('/creator/settings?tab=security');
      await expect(page.getByRole('button', { name: 'View Sessions' })).toBeDisabled();
      await expect(page.getByText('Mobile Safari', { exact: true })).toHaveCount(0);
      const alerts = page.getByRole('switch', { name: 'Login Alerts', exact: true });
      await expect(alerts).toBeDisabled(); await expect(alerts).not.toBeChecked();
      for (const name of ['Manage Devices', 'Set Up Recovery']) await expect(page.getByRole('button', { name, exact: true })).toBeDisabled();
      const mfa = await client.query(api.mfa.status, {});
      await expect(page.getByRole('switch', { name: 'Two-factor authentication' })).toHaveAttribute('aria-checked', String(mfa.totpEnabled));
      await capture('security');
      await page.getByRole('button', { name: 'Change Password', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await expect(dialog.getByLabel('Current password', { exact: true })).toBeVisible();
      await capture('password');
      // Exercise form/cancel behavior using synthetic values; never change the account credentials.
      await dialog.getByLabel('Current password', { exact: true }).fill('synthetic-test-value');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Change Password', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Change Password', exact: true }).click();
      await expect(dialog.getByLabel('Current password', { exact: true })).toHaveValue('');
      await dialog.press('Escape'); await expect(dialog).toHaveCount(0);
      await page.getByRole('link', { name: 'Contact support', exact: true }).click(); await expect(page).toHaveURL(/\/creator\/support$/);
      await page.goto('/creator/settings?tab=notifications');
      await expect(page.getByRole('switch', { name: 'Email Notifications', exact: true })).toBeDisabled();
      for (const checkbox of await page.getByRole('checkbox').all()) await expect(checkbox).toBeDisabled();
      await expect(page.getByRole('combobox', { name: 'Notification Frequency' })).toBeDisabled();
      await capture('notifications');
      await page.getByRole('link', { name: 'Contact support', exact: true }).click(); await expect(page).toHaveURL(/\/creator\/support$/);
      await page.goto('/creator/settings?tab=notifications&demo=1');
      await page.getByRole('switch', { name: 'Email Notifications', exact: true }).click();
      for (const checkbox of await page.getByRole('checkbox').all()) await expect(checkbox).toBeDisabled();
      await expect(page.getByRole('combobox', { name: 'Notification Frequency' })).toBeEnabled();
      expect(errors).toEqual([]);
    } finally {
      try {
        if (original) await client.mutation(api.creators.queries.setPublished, { creatorId: original._id, isPublished: original.isPublished });
        expect((await client.query(api.creators.queries.myCreator, {}))?.isPublished).toBe(original?.isPublished);
        if (signedIn) {
          await page.goto('/creator');
          const menu = page.getByRole('button', { name: 'Account menu' });
          const nav = page.getByRole('button', { name: 'Open navigation menu' });
          await expect(menu.or(nav)).toBeVisible();
          if (await menu.isVisible()) {
            await menu.click(); await page.getByRole('menuitem', { name: 'Log out', exact: true }).click();
          } else {
            await nav.click(); await page.getByRole('button', { name: /^(Sign out|Log out)$/ }).click();
          }
          await expect(page).toHaveURL(/\/$/);
        }
      } finally { await client.action(api.auth.signOut, {}); }
    }
  });
});
