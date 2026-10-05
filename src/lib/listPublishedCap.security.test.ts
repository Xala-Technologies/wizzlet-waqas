import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const creators = readFileSync(
  resolve(__dirname, '../../convex/creators/queries.ts'),
  'utf8',
);
const payouts = readFileSync(
  resolve(__dirname, '../../convex/payouts/mutations.ts'),
  'utf8',
);
const picks = readFileSync(
  resolve(__dirname, '../../convex/picks/mutations.ts'),
  'utf8',
);
const posts = readFileSync(
  resolve(__dirname, '../../convex/posts/queries.ts'),
  'utf8',
);

describe('listPublished + listMine F-012', () => {
  it('caps published creator discovery instead of collecting the table', () => {
    const start = creators.indexOf('export const listPublished');
    const next = creators.indexOf('\nexport const ', start + 1);
    const body = next === -1 ? creators.slice(start) : creators.slice(start, next);
    expect(body).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);
    expect(body).toMatch(/\.take\(ADMIN_JOIN_LIMIT\)/);
    expect(body).not.toMatch(/\.collect\(\)/);
    expect(body).toMatch(/truncated:/);
  });

  it('caps payouts, picks, and post preview / member-feed reads', () => {
    expect(payouts).toMatch(
      /export const listMine[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(picks).toMatch(
      /export const listMine[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(posts).toMatch(
      /export const listPreviewsByCreator[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(posts).toMatch(
      /export const memberFeed[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });
});
