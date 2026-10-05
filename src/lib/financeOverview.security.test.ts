import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/snapshots.ts'),
  'utf8',
);

describe('financeOverview F-012', () => {
  it('is admin-only and does not adminScanAll subscriptions/payouts/creators', () => {
    const start = src.indexOf('export const financeOverview');
    const next = src.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, status\)/);
    expect(body).toMatch(/takePayoutsByStatus\(ctx, "paid"\)/);
    expect(body).toMatch(/query\("subscriptions"\)\.order\("desc"\)\.take\(8\)/);
    expect(body).not.toMatch(/adminScanAll/);
    expect(body).not.toMatch(/adminScanAll\(ctx, "creators"\)/);
  });
});
