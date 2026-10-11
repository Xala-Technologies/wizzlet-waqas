import { test, expect } from '@playwright/test';

test('malformed tracking links show a recoverable page instead of crashing', async ({ page }) => {
  for (const id of ['wave2-inventory-unknown', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa']) {
    await page.goto(`/go/${id}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Tracking link unavailable' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Browse creators' })).toBeVisible();
    await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
  }
});

test('checkout return cannot manufacture a subscription', async ({ page }) => {
  await page.goto('/subscription/success?creator=audit_missing_creator&sandbox=1');
  await expect(page.getByRole('heading', { name: 'Subscription not confirmed' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in to confirm' })).toHaveAttribute('href', /returnTo=/);
  await expect(page.getByText(/You're subscribed/)).toHaveCount(0);
});

test('checkout cancellation keeps untrusted creator handles on the same origin', async ({ page }) => {
  await page.goto('/subscription/cancel?creator=%2Fevil.example');
  const href = await page.getByRole('link', { name: 'Back to Creator' }).getAttribute('href');
  expect(new URL(href!, page.url()).origin).toBe(new URL(page.url()).origin);
});

test('protected deep link survives login to signup navigation', async ({ page }) => {
  await page.goto('/creator/products?filter=archived');
  await expect(page).toHaveURL(/\/login\?/);
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/creator/products?filter=archived');
  await page.getByRole('link', { name: 'Sign up', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
  expect(new URL(page.url()).searchParams.get('returnTo')).toBe('/creator/products?filter=archived');
});

test('signup rejects invalid fields before account creation', async ({ page }) => {
  await page.goto('/signup');
  const submit = page.getByRole('button', { name: /create account/i });
  await submit.click();
  await expect(page.getByRole('alert')).toContainText('Username must be');
  await page.getByLabel('Username', { exact: true }).fill('x');
  await page.getByLabel('Email', { exact: true }).fill('not-an-email');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await submit.click();
  await expect(page.getByRole('alert')).toContainText('Username must be');
  await page.getByLabel('Username', { exact: true }).fill('audit_fixture');
  await page.getByLabel('Email', { exact: true }).fill('audit@example.invalid');
  await page.getByLabel('Password', { exact: true }).fill('Test-only-2026!');
  await expect(submit).toBeEnabled();
  // Validation only: never submit or create an account on the shared backend.
});

test('login password visibility preserves the entered value', async ({ page }) => {
  await page.goto('/login');
  const password = page.getByLabel('Password', { exact: true });
  await password.fill('Test-only-2026!');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('Test-only-2026!');
  await page.getByRole('button', { name: 'Hide password', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('member demo saved-library tabs update the visible selection', async ({ page }) => {
  await page.goto('/demo/member/saved');
  const creators = page.getByRole('tab', { name: /Bookmarked Creators/ });
  await creators.click();
  await expect(creators).toHaveAttribute('aria-selected', 'true');
  const posts = page.getByRole('tab', { name: /Saved Posts/ });
  await expect(posts).toHaveAttribute('aria-selected', 'false');
  await posts.click();
  await expect(posts).toHaveAttribute('aria-selected', 'true');
});

test('admin demo search returns an empty state and recovers when cleared', async ({ page }) => {
  await page.goto('/demo/admin/users');
  const search = page.getByPlaceholder(/search/i);
  await search.fill('no_matching_audit_user_90210');
  await expect(page.getByText('No accounts match this filter.')).toBeVisible();
  await search.fill('');
  await expect(page.getByText('No accounts match this filter.')).not.toBeVisible();
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('home and login fit the viewport with usable entry points', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await testInfo.attach('mobile-home', { body: await page.screenshot(), contentType: 'image/png' });
    await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    await page.getByRole('link', { name: 'Log in', exact: true }).click();
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    await testInfo.attach('mobile-login', { body: await page.screenshot(), contentType: 'image/png' });
  });
});
