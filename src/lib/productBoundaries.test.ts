import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listPublicByCreator, upsert } from '../../convex/products/mutations';

const state = vi.hoisted(() => ({ creator: { _id: 'creator1', userId: 'owner', isPublished: true } }));
vi.mock('../../convex/lib/auth', () => ({
  requireCreatorOwner: async () => ({ user: { _id: 'owner' }, creator: state.creator }),
  requireAppUser: async () => ({ _id: 'owner' }),
  logMutation: async () => {},
}));

function fixture(assetOwner: string | null = 'owner') {
  const product = { _id: 'product1', creatorId: 'creator1', name: 'Test product', priceCents: 500,
    billingPeriod: 'monthly', isActive: true, isClosed: false, imageStorageId: 'asset1' };
  const ctx = {
    db: {
      get: vi.fn(async () => state.creator),
      query: vi.fn((table: string) => ({ withIndex: () => ({
        take: async () => table === 'products' ? [product] : [],
        unique: async () => assetOwner ? { ownerUserId: assetOwner } : null,
      }) })),
      insert: vi.fn(async () => 'new-product'), patch: vi.fn(),
    },
    storage: { getUrl: vi.fn(async () => 'https://storage.example/asset') },
  };
  return ctx;
}
const args = { creatorId: 'creator1', name: 'Test', priceCents: 500, billingPeriod: 'monthly',
  isFeatured: false, isActive: true, isLimited: false, isClosed: false };
type Handler = { _handler: (ctx: unknown, args: unknown) => Promise<unknown> };
const save = (ctx: unknown, extra = {}) => (upsert as unknown as Handler)._handler(ctx, { ...args, ...extra });
const publicList = (ctx: unknown) => (listPublicByCreator as unknown as Handler)._handler(ctx, { creatorId: 'creator1' }) as Promise<Array<{ imageUrl: string | null }>>;
beforeEach(() => { state.creator.isPublished = true; });

describe('product storage and public catalog boundaries', () => {
  it.each(['other-user', null])('rejects attaching an asset owned by %s', async (owner) => {
    const ctx = fixture(owner);
    await expect(save(ctx, { imageStorageId: 'asset1' })).rejects.toThrow('FORBIDDEN');
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
  it('allows attaching an owned asset', async () => {
    await expect(save(fixture(), { imageStorageId: 'asset1' })).resolves.toBe('new-product');
  });
  it('allows clearing an image without accessing storage', async () => {
    await expect(save(fixture(null), { imageStorageId: null })).resolves.toBe('new-product');
  });
  it.each(['other-user', null])('withholds legacy public URLs for assets owned by %s', async (owner) => {
    const ctx = fixture(owner);
    expect((await publicList(ctx))[0].imageUrl).toBeNull();
    expect(ctx.storage.getUrl).not.toHaveBeenCalled();
  });
  it('shows an owned image on a published creator product', async () => {
    expect((await publicList(fixture()))[0].imageUrl).toBe('https://storage.example/asset');
  });
  it('hides the catalog when the creator is unpublished', async () => {
    state.creator.isPublished = false;
    const ctx = fixture();
    expect(await publicList(ctx)).toEqual([]);
    expect(ctx.storage.getUrl).not.toHaveBeenCalled();
  });
});

describe('product monetary input', () => {
  it.each([-100, 0.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid cent amount %s before any write', async (priceCents) => {
    const ctx = fixture();
    await expect(save(ctx, { priceCents })).rejects.toThrow('INVALID_PRICE');
    expect(ctx.db.insert).not.toHaveBeenCalled();
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });
});
