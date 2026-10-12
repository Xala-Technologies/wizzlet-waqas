import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

// Dedicated non-production accounts only. Never record credentials or auth sessions.
test.use({ trace: 'off', screenshot: 'off' });
const fixturePath = process.env.E2E_FORM_FIXTURES;
type Actor = { email: string; password: string };
const actors = fixturePath
  ? (JSON.parse(readFileSync(fixturePath, 'utf8')) as { actors: Record<'member' | 'creator', Actor> }).actors
  : undefined;
test.skip(!actors, 'Requires dedicated development form-audit accounts');

async function login(page: Page, role: 'member' | 'creator' | 'admin') {
  expect(['localhost', '127.0.0.1']).toContain(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname);
  await page.goto('/login');
  if (role === 'admin') {
    await page.getByRole('button', { name: 'Sign in as platform owner', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
  } else {
    await page.getByLabel('Email', { exact: true }).fill(actors![role].email);
    await page.getByLabel('Password', { exact: true }).fill(actors![role].password);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(role === 'member' ? /\/dashboard$/ : /\/creator$/, { timeout: 30_000 });
  }
  await expect(page.getByRole('button', { name: 'Account menu' }).or(page.getByRole('button', { name: 'Open navigation menu' }))).toBeVisible();
}

test.afterEach(async ({ page }) => {
  await page.keyboard.press('Escape');
  const menu = page.getByRole('button', { name: 'Account menu' });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole('menuitem', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  } else {
    const navigation = page.getByRole('button', { name: 'Open navigation menu' });
    if (await navigation.isVisible()) {
      await navigation.click();
      await page.getByRole('button', { name: /^(Sign out|Log out)$/ }).click();
      await expect(page).toHaveURL(/\/$/);
    }
  }
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px forms`, () => {
    test.use({ viewport });

    test('member Cancel restores the saved profile', async ({ page }) => {
      await login(page, 'member');
      await page.goto('/dashboard/settings?demo=0');
      const name = page.getByLabel('Full Name', { exact: true });
      await expect(name).toHaveValue('Forms Audit member');
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await name.fill('UNSAVED form audit');
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(name).toBeDisabled();
      await expect(name).toHaveValue('Forms Audit member');
      await page.getByRole('button', { name: 'Edit', exact: true }).click();
      await expect(name).toHaveValue('Forms Audit member');
    });

    test('password controls are labelled and dismissal restores focus', async ({ page }) => {
      await login(page, 'member');
      await page.goto('/dashboard/settings?demo=0');
      const opener = page.getByRole('button', { name: 'Change Password', exact: true });
      await opener.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Change password' });
      await expect(dialog).toBeVisible();
      for (const label of ['Current password', 'New password', 'Confirm new password']) {
        await expect.soft(dialog.getByLabel(label, { exact: true })).toHaveCount(1);
      }
      await dialog.getByRole('button', { name: 'Cancel' }).click();
      await expect(dialog).not.toBeVisible();
      await expect.soft(opener).toBeFocused();
      await opener.press('Enter');
      await expect(dialog.getByLabel('Current password', { exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
    });

    test('creator Cancel discards the link draft and returns focus to each opener', async ({ page }) => {
      await login(page, 'creator');
      await page.goto('/creator/links?demo=0');
      const openers = page.getByRole('button', { name: 'Create Link', exact: true });
      await expect(openers.first()).toBeVisible();
      const count = await openers.count();
      for (let i = 0; i < count; i++) {
        const opener = openers.nth(i);
        await opener.press('Enter');
        const dialog = page.getByRole('dialog', { name: 'Create link', exact: true });
        await dialog.getByLabel('Link name').fill('Discarded draft');
        await dialog.getByLabel('Destination URL').fill('https://example.com/forms-audit');
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(dialog).not.toBeVisible();
        await expect.soft(opener).toBeFocused();
        await opener.press('Enter');
        await expect.soft(dialog.getByLabel('Link name')).toHaveValue('');
        await expect.soft(dialog.getByLabel('Destination URL')).toHaveValue('');
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect.soft(opener).toBeFocused();
      }
      await openers.first().click();
      const invalidDialog = page.getByRole('dialog', { name: 'Create link', exact: true });
      await invalidDialog.getByLabel('Link name').fill('Invalid destination audit');
      await invalidDialog.getByLabel('Destination URL').fill('not-a-url');
      await invalidDialog.getByRole('button', { name: 'Create link', exact: true }).click();
      await expect(invalidDialog.getByRole('alert')).toContainText('Enter a complete http:// or https:// URL');
      await expect(invalidDialog.getByLabel('Destination URL')).toHaveAttribute('aria-invalid', 'true');
      await invalidDialog.getByRole('button', { name: 'Cancel' }).click();
    });

    test('admin role selector is labelled and Close restores the selected row focus', async ({ page }) => {
      await login(page, 'admin');
      await page.goto('/admin/users');
      await page.getByRole('textbox', { name: 'Search users' }).fill(actors!.member.email);
      const opener = page.getByRole('button', { name: 'View account', exact: true });
      await expect(opener).toBeVisible();
      await opener.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Forms Audit member', exact: true });
      await expect(dialog).toBeVisible();
      await expect.soft(dialog.getByRole('combobox', { name: 'Grant role', exact: true })).toHaveCount(1);
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(dialog).not.toBeVisible();
      await expect.soft(opener).toBeFocused();
      await opener.press('Enter');
      await expect(dialog.getByRole('combobox', { name: 'Grant role', exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(opener).toBeFocused();
    });
  });
}
