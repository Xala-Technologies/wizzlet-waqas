import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/queries.ts'),
  'utf8',
);

describe('announcement audience F-012', () => {
  it('resolves recipients from status indexes instead of scanning subscriptions', () => {
    const start = src.indexOf('async function resolveAnnouncementRecipients');
    const next = src.indexOf('\n/** Preview recipient count', start);
    const body = next === -1 ? src.slice(start) : src.slice(start, next);
    expect(body).toMatch(/takeSubsByStatus\(ctx, "active"\)/);
    expect(body).toMatch(/takeSubsByStatus\(ctx, status\)/);
    expect(body).toMatch(/withIndex\("by_creatorId"/);
    expect(body).not.toMatch(/adminScanAll/);
  });
});
