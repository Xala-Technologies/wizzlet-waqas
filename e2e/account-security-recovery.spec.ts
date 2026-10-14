import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { expect, test, type Page, type BrowserContext, type Locator } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';
import { totpAt } from '../convex/lib/totp';

process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
test.use({ trace: 'off', screenshot: 'off' });
type Actor = { email: string; username: string; id: Id<'users'>; password: string; nextPassword: string; secret?: string; backupCodes?: string[] };
const path = process.env.E2E_SECURITY_FIXTURES;
const fixtures = path ? JSON.parse(readFileSync(path, 'utf8')) as { devUrl: string; actors: Record<string, Actor> } : null;
test.skip(!fixtures, 'Requires disposable development security accounts');
const persist = () => writeFileSync(path!, JSON.stringify(fixtures, null, 2), { mode: 0o600 });
const code = (secret: string) => totpAt(secret, Math.floor(Date.now() / 1000));
async function enterAuthenticatorCode(field: Locator, value: string) {
  // input-otp manages the selected slot on focus; fill() can replace only that
  // slot when retrying. Exercise the actual select-all and keyboard interaction.
  await field.press('ControlOrMeta+A');
  await field.pressSequentially(value, { delay: 20 });
  expect(await field.inputValue() === value).toBe(true);
}
async function login(page: Page, actor: Actor, password = actor.password, returnTo = '') {
  await page.goto(`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`);
  await page.getByLabel('Email', { exact: true }).fill(actor.email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/(dashboard|creator|mfa)(\?|\/|$)/, { timeout: 30000 });
}
async function apiLogin(actor: Actor) {
  const client = new ConvexHttpClient(fixtures!.devUrl);
  const auth = await client.action(api.auth.signIn, { provider: 'password', params: { flow: 'signIn', email: actor.email, password: actor.password } });
  client.setAuth(auth.tokens.token);
  return client;
}
async function browserClient(page: Page) {
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('__convexAuthJWT_'));
    return key ? localStorage.getItem(key) : null;
  });
  if (!token) throw Error('Test browser has no authentication token');
  const client = new ConvexHttpClient(fixtures!.devUrl); client.setAuth(token);
  return { client, token };
}
async function clearMfa(actor: Actor) {
  const client = await apiLogin(actor);
  try {
    const status = await client.query(api.mfa.status, {});
    if (status.required) {
      if (!actor.secret) throw Error('Disposable fixture needs its enrollment secret for cleanup');
      const verified = await client.mutation(api.mfa.verifyLogin, { code: await code(actor.secret) });
      if ('error' in verified) throw Error('Disposable MFA fixture cleanup was rejected');
    }
    if (status.totpEnabled) await client.mutation(api.mfa.disable, { code: await code(actor.secret!) });
    else if (status.pendingEnroll) await client.mutation(api.mfa.cancelEnroll, {});
    delete actor.secret; delete actor.backupCodes; persist();
  } finally { await client.action(api.auth.signOut, {}); }
}

// The CLI uses the existing operator's development access. Only this disposable
// actor's exact session is shortened; no application helper is deployed.
async function expireFixtureSession(token: string, actor: Actor) {
  if (fixtures!.devUrl !== 'https://combative-mongoose-559.convex.cloud') throw Error('Development only');
  const subject = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).sub as string;
  const [userId, sessionId] = subject.split('|');
  if (userId !== actor.id || !sessionId || !actor.email.endsWith('@example.invalid') || !actor.username.startsWith('sec_')) throw Error('Not a disposable security session');
  const cli = resolve('node_modules/convex/bin/main.js');
  const run = (args: string[]) => execFileSync(process.execPath, [cli, 'run', ...args, '--deployment', 'combative-mongoose-559'], { encoding: 'utf8', timeout: 30000, stdio: ['ignore', 'pipe', 'pipe'] });
  const owned = run(['--inline-query', `const s = await ctx.db.get(${JSON.stringify(sessionId)}); return s?.userId === ${JSON.stringify(actor.id)};`]);
  if (owned.trim() !== 'true') throw Error('Disposable session ownership was not confirmed');
  const adminKey = process.env.E2E_SECURITY_ADMIN_KEY;
  if (!adminKey) throw Error('Session expiry requires E2E_SECURITY_ADMIN_KEY for the named development deployment');
  const admin = new ConvexHttpClient(fixtures!.devUrl);
  // Same existing operator credential used by the development dashboard/CLI.
  (admin as unknown as { setAdminAuth: (key: string) => void }).setAdminAuth(adminKey);
  const response = await admin.mutation('_system/frontend/patchDocumentsFields:default' as never, { table: 'authSessions', ids: [sessionId], fields: { expirationTime: Date.now() - 1000 } });
  if (!response.success) throw Error('Fixture session was not expired');
}

for (const [role, width] of [['member', 1440], ['creator', 390]] as const) test.describe(`${role} at ${width}px`, () => {
  test.use({ viewport: { width, height: width === 390 ? 844 : 1000 } });
  test('password rotation, MFA recovery, account switching, expiry, and role boundaries', async ({ page, browser }, info) => {
    test.setTimeout(240_000);
    expect(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
    expect(fixtures!.devUrl).toBe('https://combative-mongoose-559.convex.cloud');
    const actor = fixtures!.actors[`${info.project.name}_${role}`];
    const alternative = fixtures!.actors[`${info.project.name}_${role === 'member' ? 'creator' : 'member'}`];
    const home = role === 'member' ? '/dashboard' : '/creator';
    const settings = role === 'member' ? '/dashboard/settings' : '/creator/settings?tab=security';
    const contexts: BrowserContext[] = [];
    const clients: ConvexHttpClient[] = [];
    const errors: string[] = [];
    const observe = (p: Page) => { p.on('pageerror', e => errors.push(e.message)); return p; };
    observe(page);
    const extra = async () => {
      const context = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL, viewport: { width, height: width === 390 ? 844 : 1000 } });
      contexts.push(context); return observe(await context.newPage());
    };
    const capture = async (p: Page, name: string) => {
      if (!process.env.E2E_SECURITY_EVIDENCE) return;
      const dir = process.env.E2E_SECURITY_EVIDENCE; mkdirSync(dir, { recursive: true });
      await p.screenshot({ path: join(dir, `${info.project.name}-${role}-${name}.png`), animations: 'disabled', fullPage: true,
        mask: [p.locator('#totp-mfa .font-mono'), p.locator('#totp-mfa a[href^="otpauth:"]'), p.locator('input[type="password"]'), p.getByRole('button', { name: 'Sign in as platform owner', exact: true }).locator('..')], maskColor: '#283c50' });
      expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    };
    await clearMfa(actor);
    try {
      await test.step('rotate password and reject old sessions and credentials', async () => {
        await login(page, actor); const other = await extra(); await login(other, actor);
        const originalSession = await apiLogin(actor); clients.push(originalSession);
        await page.goto(settings);
        await page.getByRole('button', { name: 'Change Password', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel('Current password', { exact: true }).fill('intentionally-wrong-current-value');
        await dialog.getByLabel('New password', { exact: true }).fill(actor.nextPassword);
        await dialog.getByLabel('Confirm new password', { exact: true }).fill(actor.nextPassword);
        await dialog.getByRole('button', { name: 'Update password', exact: true }).click();
        await expect(page.getByText('Current password is incorrect', { exact: true })).toBeVisible();
        await dialog.getByLabel('Current password', { exact: true }).fill(actor.password);
        await dialog.getByRole('button', { name: 'Update password', exact: true }).click();
        await expect(dialog).toHaveCount(0, { timeout: 30000 });
        const old = actor.password; actor.password = actor.nextPassword; actor.nextPassword = old; persist();
        await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 });
        await expect(other).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 });
        expect(await originalSession.query(api.users.queries.me, {})).toBeNull();
        await other.getByLabel('Email', { exact: true }).fill(actor.email);
        await other.getByLabel('Password', { exact: true }).fill(old);
        await other.getByRole('button', { name: 'Sign in', exact: true }).click();
        await expect(other.getByRole('alert')).toBeVisible();
        await expect(other).toHaveURL(/\/login(?:\?|$)/);
        await other.getByLabel('Password', { exact: true }).fill('');
        await login(page, actor);
      });
      const client = await apiLogin(actor); clients.push(client);
      await test.step('roles are checked by both browser routes and the API', async () => {
        for (const route of role === 'member' ? ['/admin', '/creator/products'] : ['/admin']) {
          await page.goto(route); await expect(page).toHaveURL(new RegExp(`${home}$`));
        }
        await expect(client.query(api.admin.queries.listUsers, {})).rejects.toThrow('FORBIDDEN');
        await page.goto(settings);
      });
      await test.step('cancel setup, enroll MFA, and verify backup-code availability', async () => {
        await page.getByRole('switch', { name: 'Two-factor authentication' }).click();
        await expect(page.getByRole('textbox', { name: 'Authenticator code' })).toBeVisible();
        await page.locator('#totp-mfa').getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(page.getByRole('textbox', { name: 'Authenticator code' })).toHaveCount(0);
        await expect.poll(async () => (await client.query(api.mfa.status, {})).pendingEnroll).toBe(false);
        await page.getByRole('switch', { name: 'Two-factor authentication' }).click();
        const href = await page.getByRole('link', { name: 'Open in authenticator' }).getAttribute('href');
        actor.secret = new URL(href!).searchParams.get('secret')!; persist();
        await enterAuthenticatorCode(page.getByRole('textbox', { name: 'Authenticator code' }), await code(actor.secret));
        await page.getByRole('button', { name: 'Confirm', exact: true }).click();
        await expect(page.getByRole('button', { name: 'I saved them' })).toBeVisible();
        actor.backupCodes = await page.locator('#totp-mfa li').allTextContents(); persist();
        expect(actor.backupCodes.length).toBeGreaterThan(0);
        await page.getByRole('button', { name: 'I saved them' }).click();
        await expect(page.getByRole('switch', { name: 'Two-factor authentication' })).toBeChecked();
        await capture(page, 'enrolled');
      });
      await test.step('pending MFA blocks protected data and can switch to another account', async () => {
        const pending = await extra(); await login(pending, actor, actor.password, settings);
        await expect(pending).toHaveURL(/\/mfa\?/);
        const { client: pendingClient } = await browserClient(pending); clients.push(pendingClient);
        await expect(pendingClient.query(api.users.queries.getById, { userId: actor.id })).rejects.toThrow('MFA_REQUIRED');
        await expect(pending.getByRole('textbox', { name: 'Authenticator code' })).toBeVisible();
        await capture(pending, 'challenge');
        await pending.getByRole('button', { name: 'Sign in again', exact: true }).click();
        await expect(pending.getByLabel('Email', { exact: true })).toBeVisible();
        expect(new URL(pending.url()).searchParams.get('returnTo')).toBe(settings);
        expect(await pendingClient.query(api.users.queries.me, {})).toBeNull();
        await capture(pending, 'switch-account');
        await login(pending, alternative);
        await expect(pending).toHaveURL(new RegExp(`${role === 'member' ? '/creator' : '/dashboard'}$`));
        const alternate = await browserClient(pending); clients.push(alternate.client);
        await alternate.client.action(api.auth.signOut, {});
      });
      await test.step('authenticator sign-in and backup recovery reject invalid and reused codes', async () => {
        const challenge = await extra(); await login(challenge, actor, actor.password, settings);
        const field = challenge.getByRole('textbox', { name: 'Authenticator code' });
        const validCodes = await Promise.all([-30, 0, 30].map(offset => totpAt(actor.secret!, Math.floor(Date.now() / 1000) + offset)));
        let invalid = '000000';
        while (validCodes.includes(invalid)) invalid = String(Number(invalid) + 1).padStart(6, '0');
        await enterAuthenticatorCode(field, invalid); await challenge.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(challenge.getByText('That code is not valid. Try the current authenticator code.', { exact: true })).toBeVisible();
        await enterAuthenticatorCode(field, await code(actor.secret!)); await challenge.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(challenge).toHaveURL(new RegExp(`${settings.replace('?', '\\?')}$`), { timeout: 15000 });
        const recovered = await extra(); await login(recovered, actor);
        await recovered.getByRole('button', { name: 'Use a backup code', exact: true }).click();
        await recovered.getByRole('textbox', { name: 'Backup code' }).fill(actor.backupCodes![0]);
        await recovered.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(recovered).toHaveURL(new RegExp(`${home}$`));
        const replay = await extra(); await login(replay, actor);
        await replay.getByRole('button', { name: 'Use a backup code', exact: true }).click();
        await replay.getByRole('textbox', { name: 'Backup code' }).fill(actor.backupCodes![0]);
        await replay.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(replay.getByText('That backup code is not valid or was already used.', { exact: true })).toBeVisible();
        await replay.getByRole('textbox', { name: 'Backup code' }).fill('');
        await capture(replay, 'replay-rejected');
      });
      await test.step('regenerate backup codes, reject the old set, then disable MFA', async () => {
        await page.goto(settings); await page.getByRole('button', { name: 'Regenerate backup codes' }).click();
        await enterAuthenticatorCode(page.getByRole('textbox', { name: 'Authenticator code' }), await code(actor.secret!));
        await page.getByRole('button', { name: 'Create new codes' }).click();
        await expect(page.getByRole('button', { name: 'I saved them' })).toBeVisible();
        const replacement = await page.locator('#totp-mfa li').allTextContents();
        const oldUnused = actor.backupCodes![1]; actor.backupCodes = replacement; persist();
        await page.getByRole('button', { name: 'I saved them' }).click();
        const stale = await extra(); await login(stale, actor);
        await stale.getByRole('button', { name: 'Use a backup code', exact: true }).click();
        await stale.getByRole('textbox', { name: 'Backup code' }).fill(oldUnused);
        await stale.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(stale.getByText('That backup code is not valid or was already used.', { exact: true })).toBeVisible();
        await stale.getByRole('textbox', { name: 'Backup code' }).fill(replacement[0]);
        await stale.getByRole('button', { name: 'Continue', exact: true }).click();
        await expect(stale).toHaveURL(new RegExp(`${home}$`));
        await page.getByRole('switch', { name: 'Two-factor authentication' }).click();
        await page.getByRole('button', { name: 'Keep on', exact: true }).click();
        await expect(page.getByRole('switch', { name: 'Two-factor authentication' })).toBeChecked();
        await page.getByRole('switch', { name: 'Two-factor authentication' }).click();
        await enterAuthenticatorCode(page.getByRole('textbox', { name: 'Authenticator code' }), await code(actor.secret!));
        await page.getByRole('button', { name: 'Turn off', exact: true }).click();
        await expect(page.getByRole('switch', { name: 'Two-factor authentication' })).not.toBeChecked();
      });
      await test.step('an expired server session returns to login and permits fresh authentication', async () => {
        const { client: expired, token } = await browserClient(page);
        await expireFixtureSession(token, actor);
        expect(await expired.query(api.users.queries.me, {})).toBeNull();
        await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 20000 });
        await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0);
        await login(page, actor); await expect(page).toHaveURL(new RegExp(`${home}$`));
        await capture(page, 'fresh-session');
      });
      expect(errors).toEqual([]);
    } finally {
      await clearMfa(actor);
      for (const client of clients) await client.action(api.auth.signOut, {}).catch(() => undefined);
      for (const context of contexts) await context.close();
      const cleanup = await apiLogin(actor);
      try {
        expect(await cleanup.query(api.mfa.status, {})).toMatchObject({ totpEnabled: false, pendingEnroll: false });
        if (role === 'creator') expect((await cleanup.query(api.creators.queries.myCreator, {}))?.isPublished).toBe(false);
        // Invalidate any browser/API fixture sessions still open after the journey.
        await cleanup.action(api.users.queries.changePassword, { currentPassword: actor.password, newPassword: actor.nextPassword });
        const previous = actor.password; actor.password = actor.nextPassword; actor.nextPassword = previous; persist();
      } finally { await cleanup.action(api.auth.signOut, {}).catch(() => undefined); }
    }
  });
});
