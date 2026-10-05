import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = [
  'convex/lib/notify.ts',
  'convex/lib/entitlements.ts',
  'convex/lib/growthAttribution.ts',
  'convex/lib/auth.ts',
  'convex/discord/queries.ts',
  'convex/discord/mutations.ts',
  'convex/discord/grants.ts',
  'convex/accountRequests.ts',
].map((rel) => ({
  rel,
  src: readFileSync(resolve(__dirname, '../..', rel), 'utf8'),
}));

describe('notify / discord / auth / accountRequests F-012', () => {
  it('has no unbounded .collect() in Wave 64 surfaces', () => {
    for (const { rel, src } of files) {
      expect(src, rel).not.toMatch(/\.collect\(\)/);
      expect(src, rel).toMatch(/ADMIN_SCAN_MAX_DOCS/);
      expect(src, rel).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);
    }
  });

  it('caps notify role fanout, entitlements subs, and accountRequests listMine', () => {
    const notify = files.find((f) => f.rel.endsWith('notify.ts'))!.src;
    const entitlements = files.find((f) => f.rel.endsWith('entitlements.ts'))!.src;
    const accountRequests = files.find((f) =>
      f.rel.endsWith('accountRequests.ts'),
    )!.src;
    expect(notify).toMatch(
      /listUserIdsWithRole[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(entitlements).toMatch(
      /by_userId_creatorId[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(accountRequests).toMatch(
      /export const listMine[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });
});
