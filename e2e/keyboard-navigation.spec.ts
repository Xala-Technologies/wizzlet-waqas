import { expect, test } from '@playwright/test';

// This file includes an opt-in authenticated journey; do not record credentials or sessions.
test.use({ trace: 'off', screenshot: 'off' });

test('landing calls to action have one keyboard stop per link', async ({ page, browserName }) => {
  // macOS WebKit uses Option-Tab for links unless full keyboard navigation is enabled.
  const nextControl = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const login = page.getByRole('link', { name: 'Log in', exact: true });
  await expect(login).toBeVisible();
  await login.focus();
  await page.keyboard.press(nextControl);
  await expect(page.locator('nav').getByRole('link', { name: 'Get Started', exact: true })).toBeFocused();
  await page.keyboard.press(nextControl);
  await expect(page.locator('main').getByRole('link', { name: 'Get Started', exact: true })).toBeFocused();
  await expect(page.locator('a button, button a')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/signup$/);
});

test('mobile menu closes with Escape and returns focus to its toggle', async ({ page, browserName }) => {
  const nextControl = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Open menu', exact: true });
  await toggle.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('navigation', { name: 'Mobile', exact: true });
  await expect(menu).toBeVisible();
  await page.keyboard.press(nextControl);
  await expect(menu.getByRole('link', { name: 'Home', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  // Reopening and selecting a destination must still work without a mouse.
  await page.keyboard.press('Enter');
  await page.keyboard.press(nextControl);
  await page.keyboard.press(nextControl);
  await expect(menu.getByRole('link', { name: 'Discover', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/discover$/);
  await expect(menu).not.toBeVisible();
});

test.describe('development admin document titles', () => {
  test.skip(process.env.E2E_DEV_ADMIN !== '1', 'Opt-in existing local development admin session');

  test('sign-in and sidebar navigation update the browser title', async ({ page }) => {
    const base = new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080');
    expect(['localhost', '127.0.0.1']).toContain(base.hostname);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/login');
    await expect(page).toHaveTitle('Sign in — Sweeph');
    await page.getByRole('button', { name: 'Sign in as platform owner', exact: true }).click();
    try {
      await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
      await expect(page).toHaveTitle('Overview — Sweeph');
      await page.getByRole('link', { name: 'Customers', exact: true }).click();
      await expect(page).toHaveTitle('Customers — Sweeph');
      await page.getByRole('link', { name: 'All Accounts', exact: true }).click();
      await expect(page).toHaveTitle('All Accounts — Sweeph');
    } finally {
      const signOut = page.getByRole('button', { name: 'Sign out', exact: true });
      if (await signOut.isVisible()) {
        await signOut.click();
        await expect(page).toHaveURL(base.href);
      }
    }
    await expect(page).toHaveTitle('Sweeph — Private Creator Infrastructure');
  });
});
