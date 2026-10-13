import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
test.use({ trace: 'off', screenshot: 'off' });
const fixturePath = process.env.E2E_FORM_FIXTURES;
const fixture = fixturePath ? JSON.parse(readFileSync(fixturePath, 'utf8')) as {
  devUrl: string; actors: { creator: { email: string; password: string } };
} : null;
test.skip(!fixture, 'Requires dedicated development creator');

for (const width of [1440, 390]) test.describe(`${width}px live creator settings`, () => {
  test.use({ viewport: { width, height: width === 390 ? 844 : 1000 } });
  test('uses saved billing, explains unavailable team access, and verifies Discord state', async ({ page }, info) => {
    expect(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
    expect(fixture!.devUrl).toBe('https://combative-mongoose-559.convex.cloud');
    const actor = fixture!.actors.creator;
    const client = new ConvexHttpClient(fixture!.devUrl);
    const auth = await client.action(api.auth.signIn, { provider: 'password', params: { flow: 'signIn', email: actor.email, password: actor.password } });
    client.setAuth(auth.tokens.token);
    let signedIn = false;
    try {
      const earnings = await client.query(api.creators.earnings.myEarnings, {});
      const bot = await client.query(api.discord.queries.botStatus, {});
      const connection = await client.query(api.discord.queries.connection, {});
      expect(earnings.recentPayments).toHaveLength(0);
      expect(connection.connected).toBe(false);
      await page.goto('/login');
      await page.getByLabel('Email', { exact: true }).fill(actor.email);
      await page.getByLabel('Password', { exact: true }).fill(actor.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/creator$/, { timeout: 30000 });
      signedIn = true;
      const screenshot = async (name: string) => {
        if (!process.env.E2E_SETTINGS_EVIDENCE) return;
        mkdirSync(process.env.E2E_SETTINGS_EVIDENCE, { recursive: true });
        await page.screenshot({ path: join(process.env.E2E_SETTINGS_EVIDENCE, `${info.project.name}-${width}-${name}-after.png`) });
      };
      await page.goto('/creator/settings?tab=billing');
      // Wait for the remote earnings query; the page intentionally withholds fees while it loads.
      await expect(page.getByRole('heading', { name: 'How you pay us' })).toBeVisible({ timeout: 30000 });
      await expect(page.getByText(`${earnings.feePolicy.currentFeePercent}% now`, { exact: true })).toBeVisible();
      await expect(page.getByText('No customer payments yet. Fees only appear after a fan pays.')).toBeVisible();
      await expect(page.getByText('Elvis Alvarenga', { exact: true })).toHaveCount(0);
      await screenshot('billing');
      await page.getByRole('link', { name: 'Contact support', exact: true }).click();
      await expect(page).toHaveURL(/\/creator\/support$/);
      await page.goto('/creator/settings?tab=team');
      await expect(page.getByText(actor.email, { exact: true })).toBeVisible();
      await expect(page.getByText('waqas@sweeph.com', { exact: true })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: 'Role Permissions' })).toHaveCount(0);
      await expect(page.getByLabel('Email address', { exact: true })).toBeDisabled();
      await expect(page.getByRole('combobox', { name: 'Invitation role' })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Send Invite' })).toBeDisabled();
      await page.getByRole('heading', { name: 'Invite Team Member' }).scrollIntoViewIfNeeded();
      await screenshot('team');
      await page.getByRole('link', { name: 'Contact support', exact: true }).click();
      await expect(page).toHaveURL(/\/creator\/support$/);
      await page.goto('/creator/integrations?discord=connected');
      const add = page.getByRole('button', { name: 'Add to Discord', exact: true });
      await expect(add).toBeVisible();
      if (bot.configured) await expect(add).toBeEnabled();
      else await expect(add).toBeDisabled();
      await expect(page.getByText('Discord server connected', { exact: true })).toHaveCount(0);
      await screenshot('integrations');
      await page.getByRole('button', { name: 'View guide' }).click();
      await expect(page.getByRole('heading', { name: 'How it works' })).toBeInViewport();
      await page.goto('/creator/settings?tab=billing&demo=1');
      await expect(page.getByText(/Sample preview data/)).toBeVisible();
      await expect(page.getByText('Elvis Alvarenga', { exact: true })).toBeVisible();
    } finally {
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
      await client.action(api.auth.signOut, {});
    }
  });
});
