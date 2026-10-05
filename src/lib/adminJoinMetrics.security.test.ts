import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ADMIN_JOIN_LIMIT, ADMIN_LIST_LIMIT } from '../../convex/lib/adminLists';
import { joinMetricsTruncationNote } from './adminTruncation';

const src = readFileSync(
  resolve(__dirname, '../../convex/admin/paginatedLists.ts'),
  'utf8',
);
const lists = readFileSync(
  resolve(__dirname, '../../convex/lib/adminLists.ts'),
  'utf8',
);

describe('admin join spend metrics F-012', () => {
  it('aligns ADMIN_JOIN_LIMIT with the list ceiling', () => {
    expect(ADMIN_JOIN_LIMIT).toBe(ADMIN_LIST_LIMIT);
    expect(lists).toMatch(/export const ADMIN_JOIN_LIMIT = ADMIN_LIST_LIMIT/);
  });

  it('returns metricsTruncated on users, customers, and creators pages', () => {
    expect(src).toMatch(/metricsTruncated: v\.boolean\(\)/);
    expect(src).toMatch(/metricsTruncated,\n\s*\}\);/);
    expect(src).toMatch(/metricsTruncated: subs\.length >= joinCap/);
  });

  it('exposes an honest join truncation note', () => {
    expect(joinMetricsTruncationNote(false)).toBeNull();
    expect(joinMetricsTruncationNote(true)).toMatch(/500-row join cap/);
  });
});
