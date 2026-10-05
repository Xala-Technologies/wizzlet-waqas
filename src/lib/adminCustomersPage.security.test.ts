import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/paginatedLists.ts'),
  'utf8',
);

describe('listCustomersPage F-012', () => {
  it('is admin-only', () => {
    expect(src).toMatch(/export const listCustomersPage[\s\S]*requireAdmin/);
  });

  it('cursor-paginates subscriptions instead of adminScanAll', () => {
    const fn = src.slice(src.indexOf('export const listCustomersPage'));
    const next = fn.search(/\nexport const /);
    const body = next === -1 ? fn : fn.slice(0, next);
    expect(body).toMatch(/\.paginate\(args\.paginationOpts\)/);
    expect(body).not.toMatch(/adminScanAll/);
    expect(body).not.toMatch(/Number\.parseInt/);
    expect(body).toMatch(/withIndex\("by_userId"/);
    expect(body).toMatch(/\.take\(joinCap\)/);
    expect(body).toMatch(/cancelled/);
  });
});
