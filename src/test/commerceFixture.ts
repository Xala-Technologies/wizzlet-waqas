export type Row = Record<string, unknown> & { _id: string; _creationTime: number };
export async function invoke(fn: unknown, ctx: unknown, args = {}): Promise<Record<string, unknown>> {
  return (fn as { _handler: (ctx: unknown, args: unknown) => Promise<Record<string, unknown>> })._handler(ctx, args);
}
export function fixture() {
  const rows = new Map<string, Row>();
  const tables = new Map<string, string>();
  const now = Date.UTC(2026, 9, 12);
  const add = (table: string, id: string, fields: Record<string, unknown>) => {
    rows.set(id, { _id: id, _creationTime: now, ...fields }); tables.set(id, table);
  };
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: 'owner|session' }) },
    db: {
      insert: async (table: string, fields: Record<string, unknown>) => { const id = `${table}_${rows.size}`; add(table, id, fields); return id; },
      get: async (id: string) => rows.get(id) ?? null,
      query: (table: string) => {
        const filters: Array<[string, unknown]> = [];
        let descending = false;
        const found = () => [...rows.values()].filter(r => tables.get(r._id) === table && filters.every(([k, v]) => r[k] === v))
          .sort((a, b) => (descending ? -1 : 1) * (Number(a.createdAt ?? a._creationTime) - Number(b.createdAt ?? b._creationTime)));
        const chain = {
          withIndex: (_index: string, build?: (q: unknown) => unknown) => {
            const q = { eq: (k: string, v: unknown) => { filters.push([k, v]); return q; } };
            build?.(q); return chain;
          },
          order: (direction: string) => { descending = direction === 'desc'; return chain; },
          take: async (n: number) => found().slice(0, n),
          unique: async () => found()[0] ?? null,
          first: async () => found()[0] ?? null,
          paginate: async () => ({ page: found().slice(0, 25), isDone: true, continueCursor: '' }),
        }; return chain;
      },
    },
  };
  add('users', 'owner', { email: 'owner@example.invalid', fullName: 'Owner' });
  add('authSessions', 'session', { userId: 'owner', expirationTime: Date.now() + 86400_000 });
  add('userRoles', 'role', { userId: 'owner', role: 'admin' });
  add('creators', 'creator', { userId: 'owner', displayName: 'Fixture', isPublished: true, createdAt: now, monthlyPriceCents: 1000 });
  add('subscriptions', 'sub', { userId: 'owner', creatorId: 'creator', status: 'cancelled', amountCents: 1000,
    platformFeeCents: 100, creatorEarningsCents: 900, feePercentage: 10, createdAt: now, updatedAt: now });
  const event = (id: string, amountCents: number, fields: Record<string, unknown> = {}) => add('paymentEvents', id, {
    creatorId: 'creator', userId: 'owner', subscriptionId: 'sub', amountCents,
    platformFeeCents: amountCents / 10, creatorEarningsCents: amountCents * 0.9,
    type: 'subscription_charge', status: 'settled', currency: 'USD', createdAt: now, ...fields,
  });
  event('initial', 1000);
  event('renewal', 1000, { type: 'renewal' });
  event('refund', -500, { type: 'refund' });
  event('failed', 3000, { status: 'failed' });
  event('sandbox', 4000, { paymentMode: 'sandbox' });
  event('cancel', 0, { type: 'subscription_cancel' });
  return { ctx, add, event, now, all: (table: string) => [...rows.values()].filter(row => tables.get(row._id) === table) };
}

