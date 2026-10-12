import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listByCreator } from '../../convex/products/mutations';

const identity = vi.hoisted(() => ({ userId: 'owner' as string | null, admin: false }));
vi.mock('@convex-dev/auth/server', () => ({ getAuthUserId: async () => identity.userId, getAuthSessionId: async () => identity.userId ? 'session1' : null }));

function fixture() {
  const drafts = [{ _id: 'draft1', creatorId: 'creator1', name: 'Private draft', isActive: false }];
  const readProducts = vi.fn(async () => drafts);
  const ctx = { db: {
    get: vi.fn(async (id: string) => id === 'session1' ? { _id: id, userId: identity.userId, expirationTime: Date.now() + 60_000 } : id === 'creator1' ? { _id: id, userId: 'owner' } : { _id: id }),
    query: vi.fn((table: string) => ({ withIndex: () => ({
      unique: async () => table === 'userRoles' && identity.admin ? { role: 'admin' } : null,
      take: readProducts,
    }) })),
  } };
  const run = () => (listByCreator as unknown as { _handler: (ctx: unknown, args: unknown) => Promise<unknown> })
    ._handler(ctx, { creatorId: 'creator1' });
  return { run, drafts, readProducts };
}
beforeEach(() => { identity.userId = 'owner'; identity.admin = false; });

describe('private product catalog authorization', () => {
  it.each([null, 'other-user'])('denies draft access for %s', async (userId) => {
    identity.userId = userId;
    const f = fixture();
    await expect(f.run()).rejects.toThrow(userId ? 'FORBIDDEN' : 'UNAUTHENTICATED');
    expect(f.readProducts).not.toHaveBeenCalled();
  });
  it('allows the creator owner to read drafts', async () => {
    const f = fixture();
    expect(await f.run()).toEqual(f.drafts);
  });
  it('allows an administrator to read drafts', async () => {
    identity.userId = 'admin'; identity.admin = true;
    const f = fixture();
    expect(await f.run()).toEqual(f.drafts);
  });
});
