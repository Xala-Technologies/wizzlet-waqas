import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/snapshots.ts'),
  'utf8',
);
const takes = readFileSync(
  resolve(__dirname, '../../convex/lib/adminIndexedTakes.ts'),
  'utf8',
);

describe('reportSourceData F-012', () => {
  it('is admin-only and does not adminScanAll source tables', () => {
    const start = src.indexOf('export const reportSourceData');
    const next = src.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takeCreatorsByPublished\(ctx, true\)/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, status\)/);
    expect(body).toMatch(/takePayoutsByStatus\(ctx, status\)/);
    expect(body).not.toMatch(/adminScanAll/);
  });

  it('merges indexed takes by document id', () => {
    expect(takes).toMatch(/export function mergeIndexedTakes/);
  });
});
