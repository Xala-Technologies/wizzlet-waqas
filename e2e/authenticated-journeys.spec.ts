import { readFileSync } from 'node:fs';
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

// Opt-in development fixtures, generated outside the repository. Never use production accounts.
type Actor = { email: string; password: string; handle: string; creatorId?: string };
type Fixtures = { devUrl: string; admin: Actor; actors: Record<string, Actor> };
const fixturePath = process.env.E2E_AUTH_FIXTURES;
const fixtures: Fixtures | undefined = fixturePath ? JSON.parse(readFileSync(fixturePath, 'utf8')) : undefined;
test.skip(!fixtures, 'Requires disposable development accounts in E2E_AUTH_FIXTURES');
test.use({ trace: 'off' }); // Auth traces would contain credentials and session tokens.

async function login(page: Page, actor: Actor, path: string) {
  if (!['localhost', '127.0.0.1'].includes(new URL(process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8080').hostname)) {
    throw new Error('Authenticated regression requires a local app connected to development');
  }
  await page.goto(`/login?returnTo=${encodeURIComponent(path)}`);
  await page.getByLabel('Email', { exact: true }).fill(actor.email);
  await page.getByLabel('Password', { exact: true }).fill(actor.password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(path.replace(/[?]/g, '\\?')), { timeout: 30_000 });
}

async function clientFor(actor: Actor) {
  const client = new ConvexHttpClient(fixtures!.devUrl);
  const auth = await client.action('auth:signIn' as never, { provider: 'password', params: { flow: 'signIn', email: actor.email, password: actor.password } } as never) as { tokens: { token: string } };
  client.setAuth(auth.tokens.token);
  return client;
}

async function evidence(page: Page, info: TestInfo, name: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: 'image/png' });
}

for (const screen of ['desktop', 'mobile'] as const) {
  test.describe(screen, () => {
    test.use({ viewport: screen === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 1000 } });

    test('member odds input retains keyboard focus', async ({ page }, info) => {
      const actor = fixtures!.actors[`${info.project.name}-${screen}-member`];
      await login(page, actor, '/dashboard/results');
      await page.getByRole('button', { name: 'Add Pick', exact: true }).click();
      const odds = page.getByPlaceholder('1.91', { exact: true });
      await odds.click();
      await odds.pressSequentially('1.91', { delay: 80 });
      await expect(odds).toHaveValue('1.91');
      await expect(odds).toBeFocused();
      await evidence(page, info, 'member-odds-keyboard');
    });

    test('member cannot silently save zero risk as one unit', async ({ page }, info) => {
      const actor = fixtures!.actors[`${info.project.name}-${screen}-member`];
      const client = await clientFor(actor);
      const title = `Zero risk ${info.project.name} ${screen}`;
      try {
        await login(page, actor, '/dashboard/results');
        await page.getByRole('button', { name: 'Add Pick', exact: true }).click();
        await page.getByPlaceholder('Chiefs -3.5').fill(title);
        await page.getByPlaceholder('1.91', { exact: true }).fill('1.91');
        await page.locator('label').filter({ hasText: /^Risked$/ }).locator('..').locator('input').fill('0');
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        await expect(page.getByText('Units risked must be a positive number', { exact: true })).toBeVisible();
        const picks = await client.query('picks/mutations:listMine' as never, {} as never) as { _id: string; pickEvent: string }[];
        expect(picks.filter(p => p.pickEvent === title)).toHaveLength(0);
      } finally {
        const picks = await client.query('picks/mutations:listMine' as never, {} as never) as { _id: string; pickEvent: string }[];
        for (const pick of picks.filter(p => p.pickEvent === title)) await client.mutation('picks/mutations:remove' as never, { pickId: pick._id } as never);
        await client.action('auth:signOut' as never, {} as never);
      }
    });

    test('member pick CRUD, CSV retry and role boundary', async ({ page }, info) => {
      const actor = fixtures!.actors[`${info.project.name}-${screen}-member`];
      const client = await clientFor(actor);
      const title = `Journey ${info.project.name} ${screen}`;
      try {
        await login(page, actor, '/dashboard/results');
        await page.getByRole('button', { name: 'Add Pick', exact: true }).click();
        await page.getByLabel('Pick / Event', { exact: true }).fill(title);
        await page.getByLabel('EU Odds', { exact: true }).fill('1.91');
        await page.getByLabel('Risked', { exact: true }).fill('2');
        await page.getByRole('button', { name: 'Add', exact: true }).click();
        await expect.poll(async () => (await client.query(api.picks.mutations.listMine, {})).find(p => p.pickEvent === title)?.unitsRisked).toBe(2);
        await page.reload();
        const record = page.getByRole(screen === 'mobile' ? 'listitem' : 'row').filter({ has: page.getByText(title, { exact: true }) });
        await record.getByRole('button', { name: screen === 'mobile' ? 'Edit' : 'Edit pick', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Edit Pick' });
        await dialog.getByLabel('Notes', { exact: true }).fill('=1+1');
        await dialog.getByLabel('Units Risked', { exact: true }).fill('2.5');
        await dialog.getByRole('button', { name: 'Update', exact: true }).click();
        await expect(dialog).not.toBeVisible();
        await expect.poll(async () => (await client.query(api.picks.mutations.listMine, {})).find(p => p.pickEvent === title)?.unitsRisked).toBe(2.5);
        const downloading = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Export', exact: true }).click();
        const download = await downloading;
        const csv = readFileSync((await download.path())!, 'utf8');
        expect(csv).toContain(title);
        expect(csv).toContain("'=1+1");
        const imported = `Date,Pick/Event,Sport,EU Odds,US Odds,Units Risked,Result,Units Won/Lost,Notes\n2026-10-12,${title} CSV,NBA,2,+100,1,pending,0,import regression\n`;
        for (let attempt = 0; attempt < 2; attempt++) {
          await page.locator('input[type=file]').setInputFiles({ name: 'regression.csv', mimeType: 'text/csv', buffer: Buffer.from(imported) });
          await expect(page.getByText(attempt ? /1 duplicates skipped/ : /Imported 1 pick/).first()).toBeVisible();
        }
        expect((await client.query(api.picks.mutations.listMine, {})).filter(p => p.pickEvent === `${title} CSV`)).toHaveLength(1);
        await evidence(page, info, 'member-results');
        await record.getByRole('button', { name: screen === 'mobile' ? 'Delete' : 'Delete pick', exact: true }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
        await expect.poll(async () => (await client.query(api.picks.mutations.listMine, {})).filter(p => p.pickEvent === title).length).toBe(0);
        await page.goto('/admin/reports');
        await expect(page).toHaveURL(/\/dashboard/);
        await expect(client.action(api.admin.exportReports.exportReportBundle, {})).rejects.toThrow();
      } finally {
        for (const p of (await client.query(api.picks.mutations.listMine, {})).filter(p => p.pickEvent.startsWith(title))) await client.mutation(api.picks.mutations.remove, { pickId: p._id });
        await client.action('auth:signOut' as never, {} as never);
      }
    });

    test('creator post and product lifecycle persists', async ({ page }, info) => {
      const actor = fixtures!.actors[`${info.project.name}-${screen}-creator`];
      const client = await clientFor(actor);
      const title = `Browser post ${info.project.name} ${screen}`;
      const product = `Browser product ${info.project.name} ${screen}`;
      try {
        await login(page, actor, '/creator/posts?demo=0');
        await page.getByRole('button', { name: 'Create Post', exact: true }).first().click();
        await page.getByLabel('Title', { exact: false }).fill(title);
        await page.getByPlaceholder('Write your post here...').fill('Disposable browser regression post.');
        await page.getByRole('button', { name: 'Publish Post', exact: true }).click();
        await page.getByRole('button', { name: 'Back to posts', exact: true }).click();
        await page.reload();
        const row = page.getByRole('row').filter({ hasText: title });
        await row.getByRole('button', { name: 'Post actions' }).click();
        await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
        await page.getByPlaceholder('Write your post here...').fill('Updated browser regression post.');
        await page.getByRole('button', { name: 'Save changes', exact: true }).click();
        await expect.poll(async () => (await client.query(api.posts.queries.listMine, {})).find(p => p.title === title)?.content ?? '').toContain('Updated browser regression post.');
        await page.goto('/creator/posts?demo=0');
        await expect(row).toBeVisible();
        await evidence(page, info, 'creator-posts');
        await row.getByRole('button', { name: 'Post actions' }).click();
        await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
        await expect.poll(async () => (await client.query(api.posts.queries.listMine, {})).filter(p => p.title === title).length).toBe(0);
        await page.goto('/creator/products?demo=0');
        await page.getByRole('button', { name: 'Create Product', exact: true }).first().click();
        await page.getByLabel('Product Name', { exact: true }).fill(product);
        await page.getByLabel('Price', { exact: true }).fill('12.34');
        await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
        await expect.poll(async () => (await client.query(api.products.mutations.listByCreator, { creatorId: actor.creatorId as Id<'creators'> })).find(p => p.name === product)?.priceCents).toBe(1234);
        await page.reload();
        const productRow = page.getByRole('row').filter({ hasText: product });
        await expect(productRow).toContainText('Draft');
        await productRow.getByRole('button', { name: 'Actions', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Edit', exact: true }).click();
        await page.getByLabel('Price', { exact: true }).fill('15.67');
        await page.getByRole('button', { name: 'Save as Draft', exact: true }).click();
        await expect.poll(async () => (await client.query(api.products.mutations.listByCreator, { creatorId: actor.creatorId as Id<'creators'> })).find(p => p.name === product)?.priceCents).toBe(1567);
        await evidence(page, info, 'creator-products');
        await productRow.getByRole('button', { name: 'Actions', exact: true }).click();
        await page.getByRole('menuitem', { name: 'Delete', exact: true }).click();
        await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click();
        await expect.poll(async () => (await client.query(api.products.mutations.listByCreator, { creatorId: actor.creatorId as Id<'creators'> })).filter(p => p.name === product).length).toBe(0);
      } finally {
        for (const p of (await client.query(api.posts.queries.listMine, {})).filter(p => p.title === title)) await client.mutation(api.posts.queries.remove, { postId: p._id });
        for (const p of (await client.query(api.products.mutations.listByCreator, { creatorId: actor.creatorId as Id<'creators'> })).filter(p => p.name === product)) await client.mutation(api.products.mutations.remove, { productId: p._id });
        await client.action('auth:signOut' as never, {} as never);
      }
    });

    test('admin financial exports and account search', async ({ page }, info) => {
      await login(page, fixtures!.admin, '/admin/reports');
      for (const name of ['Transactions Report', 'Creators Report']) {
        const card = page.locator('div').filter({ has: page.getByText(name, { exact: true }) }).filter({ has: page.getByRole('button', { name: 'CSV', exact: true }) }).last();
        const downloading = page.waitForEvent('download');
        await card.getByRole('button', { name: 'CSV', exact: true }).click();
        const download = await downloading;
        const csv = readFileSync((await download.path())!, 'utf8');
        expect(csv.split('\n').length).toBeGreaterThan(1);
        expect(csv).toContain(name === 'Transactions Report' ? 'payment_id' : 'net_paid_revenue');
      }
      await evidence(page, info, 'admin-reports');
      await page.goto('/admin/users');
      const actor = fixtures!.actors[`${info.project.name}-${screen}-member`];
      await page.getByRole('textbox', { name: 'Search users' }).fill(actor.email);
      await expect(page.getByText(actor.email, { exact: true }).filter({ visible: true })).toBeVisible();
      await page.getByRole('textbox', { name: 'Search users' }).fill('no_match_regression_90210');
      await expect(page.getByRole('heading', { name: 'No matching users', exact: true })).toBeVisible();
      await page.getByRole('textbox', { name: 'Search users' }).fill('');
      await expect(page.getByRole('heading', { name: 'No matching users', exact: true })).not.toBeVisible();
      await evidence(page, info, 'admin-users');
    });

    test('member saved library removes real posts and creator bookmarks', async ({ page }, info) => {
      const member = fixtures!.actors[`${info.project.name}-${screen}-member`];
      const creator = fixtures!.actors[`${info.project.name}-${screen}-creator`];
      const client = await clientFor(member);
      const author = await clientFor(creator);
      const creatorId = creator.creatorId as Id<'creators'>;
      const title = `Saved regression ${info.project.name} ${screen}`;
      const postId = await author.mutation(api.posts.queries.upsert, { creatorId, title, content: 'Public fixture for saved library regression.', isPremium: false });
      try {
        await client.mutation(api.bookmarks.mutations.toggleSavedPost, { postId });
        await client.mutation(api.bookmarks.mutations.toggleCreatorBookmark, { creatorId });
        await login(page, member, '/dashboard/saved');
        const post = page.getByRole('article').filter({ hasText: title });
        await expect(post).toContainText('Public fixture for saved library regression.');
        await page.reload();
        await post.getByRole('button', { name: 'Remove', exact: true }).click();
        await expect(post).toHaveCount(0);
        expect((await client.query(api.bookmarks.mutations.listSavedPosts, {})).some(p => p.postId === postId)).toBe(false);
        await page.getByRole('tab', { name: /Bookmarked Creators/ }).click();
        await page.getByRole('button', { name: `Remove ${creator.handle} from bookmarks`, exact: true }).click();
        await expect(page.getByRole('heading', { name: 'No bookmarked creators' })).toBeVisible();
        expect((await client.query(api.bookmarks.mutations.listCreatorBookmarks, {})).some(c => c.creatorId === creatorId)).toBe(false);
        await evidence(page, info, 'member-saved');
      } finally {
        if ((await client.query(api.bookmarks.mutations.listSavedPosts, {})).some(p => p.postId === postId)) await client.mutation(api.bookmarks.mutations.toggleSavedPost, { postId });
        if ((await client.query(api.bookmarks.mutations.listCreatorBookmarks, {})).some(c => c.creatorId === creatorId)) await client.mutation(api.bookmarks.mutations.toggleCreatorBookmark, { creatorId });
        await author.mutation(api.posts.queries.remove, { postId });
        await client.action('auth:signOut' as never, {} as never);
        await author.action('auth:signOut' as never, {} as never);
      }
    });

    for (const role of ['member', 'creator', 'admin'] as const) {
      test(`${role} route inventory renders without crashes`, async ({ page }, info) => {
        const routes = role === 'member'
          ? ['/dashboard', '/dashboard/subscriptions-billing', '/dashboard/notifications', '/dashboard/discover', '/dashboard/activity', '/dashboard/settings', '/dashboard/messages']
          : role === 'creator'
            ? ['/creator', '/creator/subscribers', '/creator/promo', '/creator/promo/codes', '/creator/personal-growth-manager', '/creator/resolution-case', '/creator/smart-pricing', '/creator/access-control', '/creator/performance-tracker', '/creator/messages', '/creator/notifications', '/creator/links', '/creator/referrals', '/creator/earnings', '/creator/payouts', '/creator/transactions', '/creator/settings', '/creator/integrations', '/creator/support']
            : ['/admin', '/admin/creators', '/admin/customers', '/admin/finance', '/admin/transactions', '/admin/fees', '/admin/creator-messaging', '/admin/customer-email', '/admin/growth-manager-inbox', '/admin/resolution-cases', '/admin/payouts', '/admin/alerts', '/admin/notifications', '/admin/settings'];
        const actor = role === 'admin' ? fixtures!.admin : fixtures!.actors[`${info.project.name}-${screen}-${role}`];
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await login(page, actor, routes[0]);
        for (const route of routes) {
          await page.goto(`${route}?demo=0`);
          await expect(page).toHaveURL(new RegExp(`${route.replaceAll('/', '\\/')}\\?demo=0$`));
          const main = page.getByRole('main');
          await expect(main).toBeVisible();
          await expect(main.locator('.animate-spin')).toHaveCount(0);
          await expect.poll(async () => (await main.innerText()).trim().length, { message: route }).toBeGreaterThan(30);
          await expect(page.getByText('Something went wrong', { exact: true })).toHaveCount(0);
          expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), route).toBeLessThanOrEqual(1);
        }
        expect(errors).toEqual([]);
        await info.attach(`${role}-routes`, { body: Buffer.from(JSON.stringify(routes, null, 2)), contentType: 'application/json' });
      });
    }

    test.describe('calendar dates west of UTC', () => {
      test.use({ timezoneId: 'America/Los_Angeles' });
      test('member analytics retain the recorded weekday and month', async ({ page }, info) => {
        const actor = fixtures!.actors[`${info.project.name}-${screen}-member`];
        const client = await clientFor(actor);
        const pickId = await client.mutation(api.picks.mutations.upsert, {
          date: '2026-10-12', pickEvent: 'Calendar date regression', sport: 'NFL',
          euOdds: 2, unitsRisked: 1, unitsWonLost: 1, result: 'won',
        });
        try {
          await login(page, actor, '/dashboard/results');
          await page.getByRole('tab', { name: 'Insights', exact: true }).click();
          await expect.soft(page.getByText('Best Day', { exact: true }).locator('..')).toContainText('Monday');
          await page.getByRole('tab', { name: 'Monthly', exact: true }).click();
          await expect.soft(page.getByRole('tabpanel')).toContainText('Oct 2026');
          await evidence(page, info, 'member-calendar-dates');
        } finally {
          await client.mutation(api.picks.mutations.remove, { pickId });
          await client.action('auth:signOut' as never, {} as never);
        }
      });
    });
  });
}
