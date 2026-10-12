import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import { requireAppUser, getOptionalAppUser } from '../../convex/lib/auth';
import * as mfa from '../../convex/mfa';
import * as requests from '../../convex/accountRequests';
import * as users from '../../convex/users/queries';
import * as notifications from '../../convex/notifications/mutations';
import { currentUserId } from '../../convex/session';
import * as payments from '../../convex/payments/stripeNode';
import { createNotification } from '../../convex/lib/notify';
import { hashOtp } from '../../convex/lib/emailOtp';
import { totpAt } from '../../convex/lib/totp';

// Real exported handlers, with transaction rollback matching Convex mutations.
// No mail, Stripe calls, or live data are used by this suite.
type Row = Record<string, unknown> & { _id: string; _creationTime: number };
function invoke<T = unknown>(fn: unknown, ctx: unknown, args: Record<string, unknown> = {}): Promise<T> {
  return (fn as { _handler: (ctx: unknown, args: unknown) => Promise<T> })._handler(ctx, args);
}
function fixture() {
  let rows = new Map<string, Row>();
  let tables = new Map<string, string>();
  let sequence = 0;
  let subject: string | null = 'user1|session1';
  const add = (table: string, id: string, data: Record<string, unknown>) => {
    rows.set(id, { _id: id, _creationTime: Date.now(), ...data }); tables.set(id, table); return id;
  };
  const ctx = {
    auth: { getUserIdentity: async () => subject ? { subject } : null },
    db: {
      get: async (id: string) => rows.get(id) ?? null,
      insert: async (table: string, data: Record<string, unknown>) => add(table, `${table}_${++sequence}`, data),
      delete: async (id: string) => { rows.delete(id); tables.delete(id); },
      patch: async (id: string, patch: Record<string, unknown>) => {
        const row = rows.get(id)!;
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) delete row[key]; else row[key] = value;
        }
      },
      query: (table: string) => ({
        withIndex: (_index: string, build: (q: unknown) => unknown) => {
          const filters: Array<[string, unknown]> = [];
          const q = { eq: (key: string, value: unknown) => { filters.push([key, value]); return q; } };
          build(q);
          const found = () => [...rows.values()].filter(r => tables.get(r._id) === table && filters.every(([key, value]) => r[key] === value));
          return { unique: async () => { const list = found(); if (list.length > 1) throw new Error('Not unique'); return list[0] ?? null; },
            take: async (limit: number) => found().slice(0, limit) };
        },
      }),
    },
    scheduler: { runAfter: vi.fn() },
    runQuery: vi.fn(async (ref: Parameters<typeof getFunctionName>[0]) => {
      if (getFunctionName(ref) === 'session:currentUserId') return invoke(currentUserId, ctx);
      throw new Error('Unexpected downstream query');
    }),
    runMutation: vi.fn(),
  };
  add('users', 'user1', { email: 'fixture@example.invalid', fullName: 'Private name', phone: 'fixture phone' });
  add('authSessions', 'session1', { userId: 'user1', expirationTime: Date.now() + 86400_000 });
  const transaction = async <T = unknown>(fn: unknown, args: Record<string, unknown> = {}) => {
    const snapshot = structuredClone(rows), tableSnapshot = structuredClone(tables);
    try { return await invoke<T>(fn, ctx, args); }
    catch (error) { rows = snapshot; tables = tableSnapshot; throw error; }
  };
  const session = (id: string, userId = 'user1') => {
    add('authSessions', id, { userId, expirationTime: Date.now() + 86400_000 }); subject = `${userId}|${id}`;
  };
  const enroll = async () => {
    const { secret } = await transaction<{ secret: string }>(mfa.startEnroll);
    const { backupCodes } = await transaction<{ backupCodes: string[] }>(mfa.confirmEnroll, { code: await totpAt(secret, Date.now() / 1000) });
    return { secret, backupCodes };
  };
  return { ctx, add, transaction, session, enroll, get: (id: string) => rows.get(id),
    all: (table: string) => [...rows.values()].filter(r => tables.get(r._id) === table),
    anonymous: () => { subject = null; } };
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-12T08:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('session and MFA enforcement at backend boundaries', () => {
  it('allows a normal live session and denies anonymous callers', async () => {
    const f = fixture(); expect((await requireAppUser(f.ctx as never))._id).toBe('user1');
    f.anonymous(); await expect(requireAppUser(f.ctx as never)).rejects.toThrow('UNAUTHENTICATED');
    expect(await getOptionalAppUser(f.ctx as never)).toBeNull();
  });
  it.each(['deleted', 'expired', 'foreign'])('denies a %s session even with a signed JWT', async state => {
    const f = fixture();
    if (state === 'deleted') await f.ctx.db.delete('session1');
    if (state === 'expired') await f.ctx.db.patch('session1', { expirationTime: Date.now() });
    if (state === 'foreign') await f.ctx.db.patch('session1', { userId: 'other' });
    await expect(f.transaction(users.updateProfile, { fullName: 'overwrite' })).rejects.toThrow('UNAUTHENTICATED');
    expect(await invoke(users.me, f.ctx)).toBeNull();
    expect(await getOptionalAppUser(f.ctx as never)).toBeNull();
  });
  it('blocks reads, mutations, financial actions, and email actions before the second factor', async () => {
    const f = fixture(); await f.enroll(); f.session('session2');
    await expect(f.transaction(users.updateProfile, { fullName: 'overwrite' })).rejects.toThrow('MFA_REQUIRED');
    await expect(invoke(notifications.unreadCount, f.ctx)).rejects.toThrow('MFA_REQUIRED');
    await expect(invoke(payments.createBillingPortalSession, f.ctx)).rejects.toThrow('MFA_REQUIRED');
    await expect(invoke(requests.startEmailChange, f.ctx, { requestedEmail: 'new@example.invalid' })).rejects.toThrow('MFA_REQUIRED');
    expect(f.ctx.runMutation).not.toHaveBeenCalled();
    expect(await getOptionalAppUser(f.ctx as never)).toBeNull();
    expect(await invoke(mfa.status, f.ctx)).toMatchObject({ required: true });
    const bootstrap = await invoke<Record<string, unknown>>(users.me, f.ctx);
    expect(bootstrap.email).toBe('fixture@example.invalid');
    expect(bootstrap).not.toHaveProperty('phone'); expect(bootstrap).not.toHaveProperty('fullName');
  });
  it.each([
    ['checkout', payments.createCheckoutSession], ['checkout confirmation', payments.confirmCheckoutSession],
    ['billing portal', payments.createBillingPortalSession], ['subscription cancellation', payments.cancelCreatorSubscription],
    ['admin cancellation', payments.cancelStripeSubscriptionsAdmin], ['Connect onboarding', payments.createConnectOnboardingSession],
    ['Connect balance', payments.getConnectPlatformBalance], ['Connect status', payments.refreshConnectAccountStatus], ['Connect payout', payments.sendConnectPayout],
    ['referral payout', payments.sendReferralCommissionConnect],
  ])('denies %s before any provider work when MFA is pending', async (_label, handler) => {
    const f = fixture(); await f.enroll(); f.session('session2');
    await expect(invoke(handler, f.ctx, {})).rejects.toThrow('MFA_REQUIRED');
    expect(f.ctx.runQuery).toHaveBeenCalledOnce();
    expect(f.ctx.runMutation).not.toHaveBeenCalled();
  });
  it('grants only the challenged session and never accepts another user’s grant', async () => {
    const f = fixture(); const { secret } = await f.enroll(); f.session('session2');
    f.add('mfaSessionGrants', 'forged', { sessionId: 'session2', userId: 'other', verifiedAt: Date.now() });
    await expect(requireAppUser(f.ctx as never)).rejects.toThrow('MFA_REQUIRED');
    await f.transaction(mfa.verifyLogin, { code: await totpAt(secret, Date.now() / 1000) });
    expect((await requireAppUser(f.ctx as never))._id).toBe('user1');
    f.session('session3'); await expect(requireAppUser(f.ctx as never)).rejects.toThrow('MFA_REQUIRED');
  });
  it('consumes a backup code once and regeneration invalidates all prior codes', async () => {
    const f = fixture(); const { secret, backupCodes } = await f.enroll(); f.session('session2');
    expect(await f.transaction(mfa.verifyLogin, { code: backupCodes[0] })).toEqual({ usedBackupCode: true });
    f.session('session3'); expect(await f.transaction(mfa.verifyLogin, { code: backupCodes[0] })).toEqual({ error: 'INVALID_CODE' });
    await f.transaction(mfa.verifyLogin, { code: await totpAt(secret, Date.now() / 1000) });
    await f.transaction(mfa.regenerateBackupCodes, { code: await totpAt(secret, Date.now() / 1000) });
    f.session('session4'); expect(await f.transaction(mfa.verifyLogin, { code: backupCodes[1] })).toEqual({ error: 'INVALID_CODE' });
  });
  it('persists failed MFA attempts across sessions, then permits recovery after the timeout', async () => {
    const f = fixture(); const { backupCodes } = await f.enroll(); f.session('session2');
    for (let i = 0; i < 5; i++) expect(await f.transaction(mfa.verifyLogin, { code: 'invalid' })).toEqual({ error: 'INVALID_CODE' });
    f.session('session3'); expect(await f.transaction(mfa.verifyLogin, { code: backupCodes[0] })).toEqual({ error: 'MFA_RATE_LIMITED' });
    expect(f.all('mfaChallengeAttempts')[0].attempts).toBe(5);
    vi.advanceTimersByTime(5 * 60_000);
    expect(await f.transaction(mfa.verifyLogin, { code: backupCodes[0] })).toEqual({ usedBackupCode: true });
    expect(f.all('mfaChallengeAttempts')).toHaveLength(0);
  });
  it('cancels enrollment, rejects a wrong disabling code, and clears grants when disabled', async () => {
    const f = fixture(); await f.transaction(mfa.startEnroll); await f.transaction(mfa.cancelEnroll);
    expect(await invoke(mfa.status, f.ctx)).toMatchObject({ pendingEnroll: false, totpEnabled: false });
    const { secret } = await f.enroll();
    await expect(f.transaction(mfa.disable, { code: 'invalid' })).rejects.toThrow('INVALID_CODE');
    await f.transaction(mfa.disable, { code: await totpAt(secret, Date.now() / 1000) });
    expect(f.all('mfaSessionGrants')).toHaveLength(0); expect(f.get('user1')).not.toHaveProperty('totpSecret');
  });
});

async function emailFixture() {
  const f = fixture();
  f.add('authAccounts', 'password1', { userId: 'user1', provider: 'password', providerAccountId: 'fixture@example.invalid' });
  f.add('accountRequests', 'request1', { userId: 'user1', category: 'email_change', requestedEmail: 'next@example.invalid',
    status: 'open', reason: 'fixture', createdAt: Date.now(), updatedAt: Date.now(), otpAttemptCount: 0,
    otpSalt: 'fixture-salt', otpHash: await hashOtp('fixture-salt', '123456'), otpExpiresAt: Date.now() + 600_000, otpLastSentAt: Date.now() });
  return f;
}
describe('email change and account lifecycle transactions', () => {
  it('commits every invalid code attempt and locks even the correct code after five failures', async () => {
    const f = await emailFixture();
    for (let i = 1; i <= 5; i++) {
      expect(await f.transaction(requests.verifyEmailChangeOtp, { code: '000000' })).toEqual({ status: 'invalid', error: 'OTP_INVALID' });
      expect(f.get('request1')?.otpAttemptCount).toBe(i);
    }
    await expect(f.transaction(requests.verifyEmailChangeOtp, { code: '123456' })).rejects.toThrow('OTP_LOCKED');
    expect(f.get('user1')?.email).toBe('fixture@example.invalid');
  });
  it('rotates the owned password identity, clears secrets and revokes every session after valid verification', async () => {
    const f = await emailFixture(); f.session('session2');
    expect(await f.transaction(requests.verifyEmailChangeOtp, { code: '123456' })).toMatchObject({ status: 'fulfilled' });
    expect(f.get('password1')?.providerAccountId).toBe('next@example.invalid');
    expect(f.get('request1')).not.toHaveProperty('otpHash'); expect(f.all('authSessions')).toHaveLength(0);
    await expect(f.transaction(users.updateProfile, { fullName: 'old token' })).rejects.toThrow('UNAUTHENTICATED');
  });
  it('rejects expired codes and resending during cooldown without changing the request', async () => {
    const f = await emailFixture();
    await expect(f.transaction(requests.requestEmailChange, { requestedEmail: 'next@example.invalid' })).rejects.toThrow('OTP_RESEND_COOLDOWN');
    vi.advanceTimersByTime(600_000);
    await expect(f.transaction(requests.verifyEmailChangeOtp, { code: '123456' })).rejects.toThrow('OTP_EXPIRED');
  });
  it('does not return OTP material or another account’s requests', async () => {
    const f = await emailFixture();
    f.add('accountRequests', 'otherRequest', { userId: 'other', category: 'email_change', status: 'open' });
    const mine = await invoke<Array<Record<string, unknown>>>(requests.listMine, f.ctx);
    expect(mine).toHaveLength(1); expect(mine[0]).not.toHaveProperty('otpHash'); expect(mine[0]).not.toHaveProperty('otpSalt');
  });
  it('refuses an email collision without revoking the caller', async () => {
    const f = await emailFixture(); f.add('users', 'other', { email: 'next@example.invalid' });
    await expect(f.transaction(requests.verifyEmailChangeOtp, { code: '123456' })).rejects.toThrow('EMAIL_TAKEN');
    expect(f.all('authSessions')).toHaveLength(1); expect(f.get('request1')?.status).toBe('open');
  });
  it('deduplicates deletion requests and rejects non-admin resolution', async () => {
    const f = fixture(); await f.transaction(requests.requestAccountDeletion);
    await expect(f.transaction(requests.requestAccountDeletion)).rejects.toThrow('REQUEST_ALREADY_OPEN');
    await expect(f.transaction(requests.resolveAdmin, { requestId: f.all('accountRequests')[0]._id, disposition: 'fulfill' })).rejects.toThrow('FORBIDDEN');
  });
  it('admin deletion revokes access, removes credentials and unpublishes a creator', async () => {
    const f = fixture(); await f.enroll();
    f.add('authAccounts', 'password1', { userId: 'user1', provider: 'password', providerAccountId: 'fixture@example.invalid' });
    f.add('userRoles', 'role1', { userId: 'user1', role: 'creator' });
    f.add('creators', 'creator1', { userId: 'user1', isPublished: true });
    const requestId = await f.transaction<string>(requests.requestAccountDeletion);
    f.add('users', 'admin', {}); f.add('userRoles', 'adminRole', { userId: 'admin', role: 'admin' }); f.session('adminSession', 'admin');
    expect(await f.transaction(requests.resolveAdmin, { requestId, disposition: 'fulfill' })).toMatchObject({ status: 'fulfilled' });
    expect(f.get('password1')).toBeUndefined(); expect(f.get('role1')).toBeUndefined();
    expect(f.get('creator1')?.isPublished).toBe(false); expect(f.get('session1')).toBeUndefined();
    expect(f.get('user1')).not.toHaveProperty('totpSecret'); expect(f.all('mfaSessionGrants')).toHaveLength(0);
  });
});


describe('notification preferences and ownership', () => {
  it.each([['message', 'messages'], ['subscription', 'billing']])('suppresses opted-out %s alerts', async (type, preference) => {
    const f = fixture(); await f.ctx.db.patch('user1', { notificationPrefs: { [preference]: false } });
    expect(await createNotification(f.ctx as never, { userId: 'user1' as never, type, title: 'Fixture' })).toBeNull();
    expect(f.all('notifications')).toHaveLength(0);
    await f.ctx.db.patch('user1', { notificationPrefs: { [preference]: true } });
    await createNotification(f.ctx as never, { userId: 'user1' as never, type, title: 'Fixture' });
    expect(f.all('notifications')).toHaveLength(1);
  });
  it('defaults delivery on and preserves support/security alerts', async () => {
    const f = fixture(); await createNotification(f.ctx as never, { userId: 'user1' as never, type: 'message', title: 'Fixture' });
    await f.ctx.db.patch('user1', { notificationPrefs: { messages: false, billing: false } });
    await createNotification(f.ctx as never, { userId: 'user1' as never, type: 'security', title: 'Fixture' });
    expect(f.all('notifications')).toHaveLength(2);
  });
  it('denies cross-user marking and marks only the caller’s notifications', async () => {
    const f = fixture(); f.add('notifications', 'mine', { userId: 'user1', read: false });
    f.add('notifications', 'other', { userId: 'other', read: false });
    await expect(f.transaction(notifications.markRead, { notificationId: 'other' })).rejects.toThrow('FORBIDDEN');
    await f.transaction(notifications.markAllRead);
    expect(f.get('mine')?.read).toBe(true); expect(f.get('other')?.read).toBe(false);
    expect(await invoke(notifications.unreadCount, f.ctx)).toBe(0);
  });
});
