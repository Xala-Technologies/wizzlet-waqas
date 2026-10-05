import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/snapshots.ts'),
  'utf8',
);
const schema = readFileSync(
  resolve(__dirname, '../../convex/schema.ts'),
  'utf8',
);
const takes = readFileSync(
  resolve(__dirname, '../../convex/lib/adminIndexedTakes.ts'),
  'utf8',
);

describe('payoutsOverview F-012', () => {
  it('indexes paymentEvents by status in schema', () => {
    const start = schema.indexOf('paymentEvents: defineTable');
    const next = schema.indexOf('\n  creatorLinks:', start);
    const body = next === -1 ? schema.slice(start) : schema.slice(start, next);
    expect(body).toMatch(/\.index\("by_status", \["status"\]\)/);
  });

  it('is admin-only and does not adminScanAll events/payouts/creators', () => {
    const start = src.indexOf('export const payoutsOverview');
    const next = src.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takePaymentEventsByStatus\(ctx, "settled"\)/);
    expect(body).toMatch(/takePayoutsByStatus\(ctx, "completed"\)/);
    expect(body).toMatch(/ctx\.db\.get\(id\)/);
    expect(body).not.toMatch(/adminScanAll/);
  });

  it('exposes a status take helper for paymentEvents', () => {
    expect(takes).toMatch(/export async function takePaymentEventsByStatus/);
  });
});
