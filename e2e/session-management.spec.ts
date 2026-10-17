import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

process.env.PLAYWRIGHT_NO_COPY_PROMPT = '1';
test.use({ trace: 'off', screenshot: 'off' });
type Actor = { id: string; email: string; username: string; password: string };
const fixturePath = process.env.E2E_SECURITY_FIXTURES;
const fixtures = fixturePath ? JSON.parse(readFileSync(fixturePath, 'utf8')) as { devUrl: string; actors: Record<string, Actor> } : null;
test.skip(!fixtures, 'Requires disposable development security fixtures');
async function apiLogin(actor: Actor) {
  const client = new ConvexHttpClient(fixtures!.devUrl);
  const result = await client.action(api.auth.signIn, { provider: 'password', params: { flow: 'signIn', email: actor.email, password: actor.password } });
  if (!result.tokens) throw Error('Fixture sign-in failed');
  client.setAuth(result.tokens.token);
  return { client, refreshToken: result.tokens.refreshToken };
}
async function login(page: Page, actor: Actor) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(actor.email);
  await page.getByLabel('Password', { exact: true }).fill(actor.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(/\/(dashboard|creator)$/, { timeout: 30000 });
  await expect(page.getByRole('button', { name: 'Account menu', exact: true })
    .or(page.getByRole('button', { name: 'Open navigation menu', exact: true }))).toBeVisible();
}
async function pageClient(page: Page) {
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.startsWith('__convexAuthJWT_'));
    return key ? localStorage.getItem(key) : null;
  });
  if (!token) throw Error('Browser fixture has no session');
  const client = new ConvexHttpClient(fixtures!.devUrl); client.setAuth(token); return client;
}

for (const role of ['member', 'creator'] as const) {
  test(`${role}: isolate accounts, revoke sessions, and sign out everywhere`, async ({ page, browser, browserName, baseURL }) => {
    test.setTimeout(120000);
    if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname) || fixtures!.devUrl !== 'https://combative-mongoose-559.convex.cloud') throw Error('Development only');
    const actor = fixtures!.actors[`${browserName}_${role}`];
    const foreign = fixtures!.actors[`${browserName}_${role === 'member' ? 'creator' : 'member'}`];
    for (const a of [actor, foreign]) if (!a.email.endsWith('@example.invalid') || !a.username.startsWith('sec_')) throw Error('Disposable fixture required');
    const reset = await apiLogin(actor); await reset.client.mutation(api.accountSessions.revokeAll, {});
    const width = role === 'member' ? 1440 : 390;
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    const otherContext = await browser.newContext({ baseURL, viewport: { width, height: 844 } });
    const otherPage = await otherContext.newPage();
    const errors: string[] = [];
    for (const p of [page, otherPage]) p.on('pageerror', e => errors.push(e.message));
    const foreignAuth = await apiLogin(foreign);
    const settings = role === 'member' ? '/dashboard/settings' : '/creator/settings?tab=security';
    const capture = async (name: string) => {
      const dialog = page.getByRole('dialog');
      // The shared dialog slides in for 200 ms; measure its settled layout.
      await expect.poll(async () => {
        const box = await dialog.boundingBox();
        return Boolean(box && box.x >= 0 && box.x + box.width <= width + 1);
      }).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      if (browserName === 'chromium' && process.env.E2E_SESSION_EVIDENCE) {
        mkdirSync(process.env.E2E_SESSION_EVIDENCE, { recursive: true });
        // Capture only the dialog: no account fields or development sign-in
        // helpers are included, and masks behind the modal cannot cover controls.
        await dialog.screenshot({ path: join(process.env.E2E_SESSION_EVIDENCE, `${browserName}-${role}-${name}.png`), animations: 'disabled' });
      }
    };
    try {
      await login(page, actor); await login(otherPage, actor);
      await otherPage.goto(settings);
      const ownerClient = await pageClient(page), otherClient = await pageClient(otherPage);
      const extra = await apiLogin(actor);
      const extraSummary = await extra.client.query(api.accountSessions.listMine, {});
      const extraId = extraSummary!.sessions.find(s => s.isCurrent)!.id;
      const foreignSummary = await foreignAuth.client.query(api.accountSessions.listMine, {});
      const foreignId = foreignSummary!.sessions.find(s => s.isCurrent)!.id;

      await test.step('isolate identities and keep refresh credentials private', async () => {
        const own = await ownerClient.query(api.accountSessions.listMine, {});
        expect(own!.sessions).toHaveLength(3);
        expect(own!.sessions.some(s => s.id === foreignId)).toBe(false);
        expect(own!.sessions.filter(s => s.isCurrent)).toHaveLength(1);
        expect(Object.keys(own!.sessions[0]).sort()).toEqual(['createdAt', 'expiresAt', 'id', 'isCurrent']);
        await expect(ownerClient.mutation(api.accountSessions.revoke, { sessionId: foreignId })).rejects.toThrow('SESSION_NOT_FOUND');
        const anonymous = new ConvexHttpClient(fixtures!.devUrl);
        expect(await anonymous.query(api.accountSessions.listMine, {})).toBeNull();
        await expect(anonymous.mutation(api.accountSessions.revokeAll, {})).rejects.toThrow('UNAUTHENTICATED');
        expect((await foreignAuth.client.query(api.users.queries.me, {}))?._id).toBe(foreign.id);
      });

      await page.goto(settings);
      const opener = page.getByRole('button', { name: 'View Sessions', exact: true });
      await opener.click();
      await expect(page.getByRole('listitem', { name: 'Current session', exact: true })).toBeVisible();
      const list = () => page.getByRole('dialog', { name: 'Active sessions', exact: true });
      await expect(list().getByRole('listitem')).toHaveCount(3);
      await capture('sessions');
      await page.getByRole('dialog').press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0); await expect(opener).toBeFocused(); await opener.click();
      await expect(list().getByRole('listitem')).toHaveCount(3);

      await test.step('confirm cancellation is safe, then invalidate refresh and access tokens', async () => {
        const own = await ownerClient.query(api.accountSessions.listMine, {});
        const index = own!.sessions.findIndex(s => s.id === extraId);
        const extraRow = () => list().getByRole('listitem', { name: `Other session ${index}`, exact: true });
        await extraRow().getByRole('button', { name: 'Sign out', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Refresh sessions', exact: true })).toBeFocused();
        expect((await extra.client.query(api.users.queries.me, {}))?._id).toBe(actor.id);
        await extraRow().getByRole('button', { name: 'Sign out', exact: true }).click();
        await page.getByRole('button', { name: 'Sign out session', exact: true }).click();
        await expect(list().getByRole('listitem')).toHaveCount(2);
        expect(await extra.client.query(api.users.queries.me, {})).toBeNull();
        expect(await extra.client.query(api.accountSessions.listMine, {})).toBeNull();
        const refresh = new ConvexHttpClient(fixtures!.devUrl);
        const result = await refresh.action(api.auth.signIn, { refreshToken: extra.refreshToken });
        expect(result.tokens === null).toBe(true);
      });

      await test.step('revoke another browser while keeping this account and other users signed in', async () => {
        await list().getByRole('button', { name: 'Sign out', exact: true }).click();
        await page.getByRole('button', { name: 'Sign out session', exact: true }).click();
        await expect(list().getByRole('listitem')).toHaveCount(1);
        await expect(otherPage).toHaveURL(/\/login(?:\?|$)/, { timeout: 15000 });
        expect(await otherClient.query(api.users.queries.me, {})).toBeNull();
        expect((await ownerClient.query(api.users.queries.me, {}))?._id).toBe(actor.id);
        expect((await foreignAuth.client.query(api.users.queries.me, {}))?._id).toBe(foreign.id);
        await capture('revoked');
      });

      await login(otherPage, actor); await otherPage.goto(settings);
      const renewedClient = await pageClient(otherPage);
      await list().getByRole('button', { name: 'Refresh sessions', exact: true }).click();
      await expect(list().getByRole('listitem')).toHaveCount(2);
      await test.step('sign out everywhere, reject both sessions, and allow a fresh sign-in', async () => {
        await list().getByRole('button', { name: 'Sign out everywhere', exact: true }).click();
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        expect((await renewedClient.query(api.users.queries.me, {}))?._id).toBe(actor.id);
        await list().getByRole('button', { name: 'Sign out everywhere', exact: true }).click();
        await capture('confirm-all');
        await page.getByRole('button', { name: 'Sign out everywhere', exact: true }).click();
        await expect(page).toHaveURL(/\/login(?:\?|$)/, { timeout: 15000 });
        await expect(otherPage).toHaveURL(/\/login(?:\?|$)/, { timeout: 15000 });
        expect(await ownerClient.query(api.users.queries.me, {})).toBeNull();
        expect(await renewedClient.query(api.users.queries.me, {})).toBeNull();
        expect((await foreignAuth.client.query(api.users.queries.me, {}))?._id).toBe(foreign.id);
        await login(page, actor); await page.goto(settings); await opener.click();
        await expect(list().getByRole('listitem')).toHaveCount(1);
        await expect(page.getByRole('heading', { name: 'Something went wrong' })).toHaveCount(0);
        expect(errors).toEqual([]);
      });
    } finally {
      await otherContext.close();
      await foreignAuth.client.action(api.auth.signOut, {});
      const cleanup = await apiLogin(actor);
      const mfa = await cleanup.client.query(api.mfa.status, {});
      expect(mfa.totpEnabled).toBe(false); expect(mfa.pendingEnroll).toBe(false);
      await cleanup.client.mutation(api.accountSessions.revokeAll, {});
      expect(await cleanup.client.query(api.users.queries.me, {})).toBeNull();
    }
  });
}
