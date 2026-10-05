import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Static auth contracts for bookmarks — live soak evidence lives in docs/qa.
 */
describe('bookmarks: Convex mutations require app user', () => {
  it('toggleCreatorBookmark and toggleSavedPost call requireAppUser', () => {
    const src = readFileSync(
      resolve(__dirname, '../../convex/bookmarks/mutations.ts'),
      'utf8',
    );
    expect(src).toMatch(/export const toggleCreatorBookmark[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const toggleSavedPost[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const listCreatorBookmarks[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const listSavedPosts[\s\S]*requireAppUser/);
  });
});

describe('bookmarks: profile Favorite is not a local-only toast', () => {
  it('CreatorProfile wires toggleCreatorBookmark', () => {
    const src = readFileSync(resolve(__dirname, '../pages/CreatorProfile.tsx'), 'utf8');
    expect(src).toContain('toggleCreatorBookmark');
    expect(src).toContain('listCreatorBookmarks');
    expect(src).not.toMatch(/Saved to favorites/);
  });
});
