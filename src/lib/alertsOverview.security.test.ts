import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/snapshots.ts'),
  'utf8',
);

describe('alertsOverview F-012', () => {
  it('is admin-only and uses status/published indexes instead of five adminScanAlls', () => {
    const start = src.indexOf('export const alertsOverview');
    const next = src.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "past_due"\)/);
    expect(body).toMatch(/takeCasesByStatus\(ctx, "open"\)/);
    expect(body).toMatch(/takePayoutsByStatus\(ctx, "pending"\)/);
    expect(body).toMatch(/takeCreatorsByPublished\(ctx, false\)/);
    expect(body).not.toMatch(/adminScanAll/);
  });
});
