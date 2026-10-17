import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as sessions from '../../convex/accountSessions';
import { getSessionUser } from '../../convex/lib/auth';

type Row = { _id: string; _creationTime: number; [key: string]: unknown };
function fixture() {
  const rows = new Map<string, Row>(), tables = new Map<string, string>();
  let subject: string | null = 'owner|current';
  const add = (table: string, id: string, data: Record<string, unknown>) => {
    rows.set(id, { _id: id, _creationTime: Date.now(), ...data }); tables.set(id, table);
  };
  const ctx = {
    auth: { getUserIdentity: async () => subject ? { subject } : null },
    db: {
      get: async (id: string) => rows.get(id) ?? null,
      delete: vi.fn(async (id: string) => { rows.delete(id); tables.delete(id); }),
      insert: async (table: string, data: Record<string, unknown>) => { const id = `${table}_${rows.size}`; add(table, id, data); return id; },
      query: (table: string) => {
        const filters: Array<(r: Row) => boolean> = [];
        let descending = false;
        const found = () => [...rows.values()].filter(r => tables.get(r._id) === table && filters.every(f => f(r)))
          .sort((a, b) => (a._creationTime - b._creationTime) * (descending ? -1 : 1));
        const chain = {
          withIndex: (_: string, fn: (q: unknown) => void) => {
            const q = { eq: (key: string, value: unknown) => { filters.push(r => r[key] === value); return q; } }; fn(q); return chain;
          },
          filter: (fn: (q: unknown) => (r: Row) => boolean) => {
            filters.push(fn({ field: (key: string) => key, gt: (key: string, value: number) => (r: Row) => Number(r[key]) > value })); return chain;
          },
          order: (value: string) => { descending = value === 'desc'; return chain; },
          collect: async () => found(), take: async (n: number) => found().slice(0, n),
          unique: async () => { const values = found(); if (values.length > 1) throw Error('Not unique'); return values[0] ?? null; },
        }; return chain;
      },
    },
  };
  const addSession = (id: string, userId = 'owner', creation = Date.now(), expiration = Date.now() + 86400_000) => {
    add('authSessions', id, { userId, _creationTime: creation, expirationTime: expiration });
    add('authRefreshTokens', `token_${id}`, { sessionId: id, expirationTime: expiration });
    add('mfaSessionGrants', `grant_${id}`, { sessionId: id, userId, verifiedAt: creation });
  };
  add('users', 'owner', { email: 'owner@example.invalid' }); add('users', 'foreign', { email: 'foreign@example.invalid' });
  addSession('current'); addSession('other', 'owner', Date.now() - 60000); addSession('foreignSession', 'foreign');
  return { rows, ctx, add, addSession, subject: (s: string | null) => { subject = s; },
    all: (table: string) => [...rows.values()].filter(r => tables.get(r._id) === table),
    call: <T = unknown>(fn: unknown, args: Record<string, unknown> = {}) => (fn as { _handler: (ctx: unknown, args: unknown) => Promise<T> })._handler(ctx, args),
  };
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

describe('account session ownership and revocation', () => {
  it('returns only active owned sessions, current first, without token or user details', async () => {
    const f = fixture(); f.addSession('expired', 'owner', Date.now() - 50000, Date.now());
    f.addSession('newer', 'owner', Date.now() + 1);
    const result = await f.call<{ sessions: Array<{ id: string; isCurrent: boolean }>; hasMore: boolean }>(sessions.listMine);
    expect(result.sessions.map(s => s.id)).toEqual(['current', 'newer', 'other']);
    expect(result.sessions.filter(s => s.isCurrent)).toHaveLength(1); expect(result.hasMore).toBe(false);
    expect(Object.keys(result.sessions[0]).sort()).toEqual(['createdAt', 'expiresAt', 'id', 'isCurrent']);
  });
  it.each(['anonymous', 'deleted', 'expired', 'foreign', 'pending-mfa'])('does not disclose sessions or allow changes for %s authentication', async state => {
    const f = fixture();
    if (state === 'anonymous') f.subject(null);
    if (state === 'deleted') f.rows.delete('current');
    if (state === 'expired') f.rows.get('current')!.expirationTime = Date.now();
    if (state === 'foreign') f.rows.get('current')!.userId = 'foreign';
    if (state === 'pending-mfa') { Object.assign(f.rows.get('owner')!, { totpEnabled: true, totpSecret: 'synthetic' }); f.rows.delete('grant_current'); }
    expect(await f.call(sessions.listMine)).toBeNull();
    await expect(f.call(sessions.revoke, { sessionId: 'other' })).rejects.toThrow(state === 'pending-mfa' ? 'MFA_REQUIRED' : 'UNAUTHENTICATED');
    await expect(f.call(sessions.revokeAll)).rejects.toThrow(state === 'pending-mfa' ? 'MFA_REQUIRED' : 'UNAUTHENTICATED');
    expect(f.ctx.db.delete).not.toHaveBeenCalled();
  });
  it.each(['foreignSession', 'missing'])('gives the same denial for foreign and missing IDs (%s)', async sessionId => {
    const f = fixture(); await expect(f.call(sessions.revoke, { sessionId })).rejects.toThrow('SESSION_NOT_FOUND');
    expect(f.ctx.db.delete).not.toHaveBeenCalled(); expect(f.rows.has('foreignSession')).toBe(true);
  });
  it('removes every refresh-token descendant and MFA grant of the selected owned session only', async () => {
    const f = fixture();
    for (let i = 0; i < 120; i++) f.add('authRefreshTokens', `descendant${i}`, { sessionId: 'other', parentRefreshTokenId: 'token_other' });
    expect(await f.call(sessions.revoke, { sessionId: 'other' })).toEqual({ currentSessionRevoked: false });
    expect(f.rows.has('other')).toBe(false); expect(f.rows.has('grant_other')).toBe(false);
    expect(f.all('authRefreshTokens').map(r => r.sessionId).sort()).toEqual(['current', 'foreignSession']);
    expect(f.rows.has('current')).toBe(true); expect(f.rows.has('foreignSession')).toBe(true);
    f.subject('owner|other'); expect(await getSessionUser(f.ctx as never)).toBeNull();
    expect(await f.call(sessions.listMine)).toBeNull();
  });
  it('reports revocation of the current session and immediately rejects its JWT', async () => {
    const f = fixture(); expect(await f.call(sessions.revoke, { sessionId: 'current' })).toEqual({ currentSessionRevoked: true });
    expect(await getSessionUser(f.ctx as never)).toBeNull();
    await expect(f.call(sessions.revokeAll)).rejects.toThrow('UNAUTHENTICATED');
  });
  it('keeps an older current session visible when the list is capped', async () => {
    const f = fixture(); for (let i = 0; i < 110; i++) f.addSession(`new${i}`, 'owner', Date.now() + i + 1);
    const result = await f.call<{ sessions: Array<{ id: string }>; hasMore: boolean }>(sessions.listMine);
    expect(result.hasMore).toBe(true); expect(result.sessions).toHaveLength(101); expect(result.sessions[0].id).toBe('current');
  });
  it('does not claim hidden sessions when the current-session exception includes the last record', async () => {
    const f = fixture(); f.rows.delete('other');
    for (let i = 0; i < 100; i++) f.addSession(`new${i}`, 'owner', Date.now() + i + 1);
    const result = await f.call<{ sessions: unknown[]; hasMore: boolean }>(sessions.listMine);
    expect(result.sessions).toHaveLength(101); expect(result.hasMore).toBe(false);
  });
  it('signs out every owned session beyond the display cap, including expired sessions and orphan grants', async () => {
    const f = fixture(); for (let i = 0; i < 110; i++) f.addSession(`new${i}`);
    f.addSession('expired', 'owner', Date.now() - 50000, Date.now() - 1);
    f.add('mfaSessionGrants', 'orphan', { userId: 'owner', sessionId: 'oldDeletedSession' });
    expect(await f.call(sessions.revokeAll)).toBeNull();
    expect(f.all('authSessions').map(s => s._id)).toEqual(['foreignSession']);
    expect(f.all('authRefreshTokens').map(s => s._id)).toEqual(['token_foreignSession']);
    expect(f.all('mfaSessionGrants').map(s => s._id)).toEqual(['grant_foreignSession']);
    expect(await getSessionUser(f.ctx as never)).toBeNull();
    expect(f.all('mutationLog')).toMatchObject([{ action: 'revokeAllSessions', documentId: 'owner' }]);
  });
});
