import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/snapshots.ts'),
  'utf8',
);

describe('feesOverview F-012', () => {
  it('is admin-only and uses the active-status index instead of table scans', () => {
    const start = src.indexOf('export const feesOverview');
    const next = src.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "active"\)/);
    expect(body).toMatch(/ctx\.db\.get\(id\)/);
    expect(body).not.toMatch(/adminScanAll/);
  });
});
