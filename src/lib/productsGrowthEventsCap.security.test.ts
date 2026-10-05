import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const products = readFileSync(
  resolve(__dirname, '../../convex/products/mutations.ts'),
  'utf8',
);
const growth = readFileSync(
  resolve(__dirname, '../../convex/creators/growth.ts'),
  'utf8',
);
const events = readFileSync(
  resolve(__dirname, '../../convex/events/queries.ts'),
  'utf8',
);
const bookmarks = readFileSync(
  resolve(__dirname, '../../convex/bookmarks/mutations.ts'),
  'utf8',
);

describe('products / growth / events / bookmarks F-012', () => {
  it('caps product list and sibling mutations instead of collecting', () => {
    expect(products).not.toMatch(/\.collect\(\)/);
    expect(products).toMatch(
      /export const listPublicByCreator[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(products).toMatch(
      /export const listByCreator[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });

  it('caps growth lists, events range reads, and bookmark lists', () => {
    expect(growth).not.toMatch(/\.collect\(\)/);
    expect(growth).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);

    expect(events).not.toMatch(/\.collect\(\)/);
    expect(events).toMatch(
      /export const listPublishedToday[\s\S]*\.gte\("startsAt"/,
    );
    expect(events).toMatch(
      /export const listPublishedToday[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );

    expect(bookmarks).not.toMatch(/\.collect\(\)/);
    expect(bookmarks).toMatch(
      /export const listSavedPosts[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(bookmarks).toMatch(
      /export const listCreatorBookmarks[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });
});
