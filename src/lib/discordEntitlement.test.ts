import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import { hasActiveAccess, memberAccess } from '../../convex/discord/queries';
import { retryMyAccess } from '../../convex/discord/mutations';
import { syncSubscriberRole } from '../../convex/discord/roles';
import { applyInvoicePaymentFailed, applySubscriptionUpdated } from '../../convex/payments/stripeDb';

vi.mock('@convex-dev/auth/server', () => ({ getAuthUserId: async () => 'user1' }));

// Execute the registered handlers with isolated DB/network adapters; no live writes.
function invoke<T>(fn: unknown, ctx: unknown, args: Record<string, unknown> = {}): Promise<T> {
  return (fn as { _handler: (ctx: unknown, args: unknown) => Promise<T> })._handler(ctx, args);
}
function context(subscriptions: Array<Record<string, unknown>>) {
  return {
    db: {
      get: vi.fn(async () => ({ _id: 'user1', discordId: 'discord-user' })),
      query: vi.fn((table: string) => ({
        withIndex: vi.fn(() => ({
          take: vi.fn(async () => table === 'subscriptions' ? subscriptions : []),
          unique: vi.fn(async () => ({ _id: 'creator1', discordServerId: 'guild1', discordRoleId: 'role1' })),
        })),
      })),
    },
    scheduler: { runAfter: vi.fn() },
  };
}

beforeEach(() => { vi.stubEnv('DISCORD_BOT_TOKEN', 'isolated-test-token'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('Discord paid access matches content access', () => {
  it.each([
    { status: 'past_due' },
    { status: 'active', billingStatus: 'unpaid' },
    { status: 'active', cancelAtPeriodEnd: true, currentPeriodEnd: 1 },
  ])('denies invite/retry/access for %j', async (sub) => {
    const ctx = context([sub]);
    expect(await invoke(hasActiveAccess, ctx, { userId: 'user1', creatorId: 'creator1' })).toBe(false);
    expect(await invoke(memberAccess, ctx, { creatorUsername: 'alice' })).toEqual({ includesDiscord: false });
    await expect(invoke(retryMyAccess, ctx, { creatorId: 'creator1' })).rejects.toThrow('FORBIDDEN');
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it('allows paid access until a scheduled cancellation reaches its period end', async () => {
    const ctx = context([{ status: 'active', cancelAtPeriodEnd: true, currentPeriodEnd: Date.now() + 60_000 }]);
    expect(await invoke(hasActiveAccess, ctx, { userId: 'user1', creatorId: 'creator1' })).toBe(true);
    await invoke(retryMyAccess, ctx, { creatorId: 'creator1' });
    expect(ctx.scheduler.runAfter).toHaveBeenCalledOnce();
  });

  it('does not authorize a cancelled product because another product is active', async () => {
    const ctx = context([{ status: 'active', productId: 'other-product' }]);
    expect(await invoke(hasActiveAccess, ctx, { userId: 'user1', creatorId: 'creator1', productId: 'cancelled-product' })).toBe(false);
  });

  it('rechecks access before replaying a queued role assignment', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204, text: async () => '' }));
    vi.stubGlobal('fetch', fetchMock);
    const ctx = {
      runQuery: vi.fn(async (ref: Parameters<typeof getFunctionName>[0]) =>
        getFunctionName(ref) === 'discord/queries:hasActiveAccess' ? false : {
          guildId: 'guild1', roleId: 'role1', discordUserId: 'discord-user',
        }),
      runMutation: vi.fn(),
    };
    const result = await invoke<{ attempted: boolean }>(syncSubscriberRole, ctx, { userId: 'user1', creatorId: 'creator1', assign: true });
    expect(result.attempted).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it('schedules revocation when a renewal payment fails', async () => {
    const sub = { _id: 'sub1', userId: 'user1', creatorId: 'creator1', status: 'active' };
    const ctx = {
      db: { query: () => ({ withIndex: () => ({ first: async () => sub }) }), patch: vi.fn() },
      scheduler: { runAfter: vi.fn() },
    };
    await invoke(applyInvoicePaymentFailed, ctx, { stripeSubscriptionId: 'stripe-sub' });
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), expect.objectContaining({ assign: false }));
  });

  it.each([true, false])('delayed revocation rechecks renewed access (%s)', async (renewed) => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204, text: async () => '' }));
    vi.stubGlobal('fetch', fetchMock);
    const ctx = {
      runQuery: vi.fn(async (ref: Parameters<typeof getFunctionName>[0]) => {
        const name = getFunctionName(ref);
        if (name.endsWith(':listActiveForUserCreator')) return [{ productId: 'product1', guildId: 'guild1', roleId: 'role1' }];
        if (name.endsWith(':hasActiveAccess')) return renewed;
        return { discordUserId: 'discord-user' };
      }),
      runMutation: vi.fn(),
    };
    await invoke(syncSubscriberRole, ctx, { userId: 'user1', creatorId: 'creator1', assign: false });
    if (renewed) {
      expect(fetchMock).not.toHaveBeenCalled();
      expect(ctx.runMutation).not.toHaveBeenCalled();
    } else {
      expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/roles/role1'), expect.objectContaining({ method: 'DELETE' }));
      expect(ctx.runMutation).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: 'revoked' }));
    }
  });

  it('keeps paid access now and schedules removal after a cancellation period ends', async () => {
    const sub = { _id: 'sub1', userId: 'user1', creatorId: 'creator1', status: 'active' };
    const ctx = {
      db: { query: () => ({ withIndex: () => ({ first: async () => sub }) }), patch: vi.fn() },
      scheduler: { runAfter: vi.fn() },
    };
    await invoke(applySubscriptionUpdated, ctx, {
      stripeSubscriptionId: 'stripe-sub', billingStatus: 'active', cancelAtPeriodEnd: true,
      currentPeriodEnd: Date.now() + 60_000,
    });
    expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), expect.objectContaining({ assign: true }));
    const expiry = ctx.scheduler.runAfter.mock.calls.find(([delay, , args]) => delay > 0 && args.assign === false);
    expect(expiry).toBeDefined();
  });
});
