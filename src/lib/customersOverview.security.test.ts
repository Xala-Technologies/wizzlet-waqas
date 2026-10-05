import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/snapshots.ts'),
  'utf8',
);

describe('customersOverview F-012', () => {
  it('is admin-only and uses per-status indexes', () => {
    const start = src.indexOf('export const customersOverview');
    const next = src.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "active"\)/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "cancelled"\)/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "canceled"\)/);
    expect(body).not.toMatch(/adminScanAll/);
  });
});
