import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/queries.ts'),
  'utf8',
);

describe('dashboardStats F-012', () => {
  it('is admin-only and uses status indexes for money and cases', () => {
    const start = src.indexOf('export const dashboardStats');
    const next = src.indexOf('\nconst announcementAudienceValidator', start);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/requireAdmin/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "active"\)/);
    expect(body).toMatch(/takePayoutsByStatus\(ctx, "paid"\)/);
    expect(body).toMatch(/takeCasesByStatus\(ctx, "open"\)/);
    expect(body).toMatch(/takeCreatorsByPublished\(ctx, true\)/);
    expect(body).toMatch(/takePaymentEventsByStatus\(ctx, "settled"\)/);
    expect(body).toMatch(/takeUserRolesByRole\(ctx, "subscriber"\)/);
    expect(body).not.toMatch(/adminScanAll/);
    expect(body).not.toMatch(/query\("users"\)\.order\("desc"\)\.take\(ADMIN_SCAN_MAX_DOCS\)/);
  });
});
