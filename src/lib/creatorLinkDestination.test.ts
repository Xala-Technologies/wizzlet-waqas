import { expect, it, vi } from 'vitest';
import { getLinkPublic, upsertLink } from '../../convex/creators/growth';

vi.mock('../../convex/lib/auth', () => ({
  requireAppUser: async () => ({ _id: 'owner' }),
  getCreatorForUser: async () => ({ _id: 'creator' }),
  requireCreatorOwner: async () => {},
  requireAdmin: async () => {},
  logMutation: async () => {},
}));
type Handler = { _handler: (ctx: unknown, args: unknown) => Promise<unknown> };
const invoke = (fn: unknown, ctx: unknown, args: unknown) => (fn as Handler)._handler(ctx, args);
function fixture(url = 'https://example.com/test') {
  return { db: {
    insert: vi.fn(async () => 'new-link'), patch: vi.fn(),
    normalizeId: vi.fn(() => 'link'),
    get: vi.fn(async () => ({ _id: 'link', creatorId: 'creator', url, name: 'Test' })),
  } };
}
const invalid = ['not-a-url', '/relative', '//example.com', 'javascript:void(0)', 'data:text/plain,hello', 'ftp://example.com', 'https://user:pass@example.com'];
it.each(invalid)('rejects unsafe or invalid destination %s on create and update', async (url) => {
  for (const linkId of [undefined, 'link']) {
    const ctx = fixture();
    await expect(invoke(upsertLink, ctx, { name: 'Test', url, linkId })).rejects.toThrow('INVALID_LINK_URL');
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  }
});
it.each(invalid)('withholds legacy invalid destination %s from public redirects', async (url) => {
  expect(await invoke(getLinkPublic, fixture(url), { linkId: 'link' })).toBeNull();
});
it.each(['https://example.com/path?q=1#anchor', 'http://example.com/path'])('preserves an allowed destination %s', async (url) => {
  const ctx = fixture(url);
  await expect(invoke(upsertLink, ctx, { name: 'Test', url })).resolves.toBe('new-link');
  expect(ctx.db.insert).toHaveBeenCalledWith('creatorLinks', expect.objectContaining({ url }));
  expect(await invoke(getLinkPublic, ctx, { linkId: 'link' })).toEqual({ name: 'Test', url });
});
