import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/lib/growthAttribution.ts'),
  'utf8',
);

describe('growthAttribution security', () => {
  it('only bumps creatorLinks.conversions when link belongs to the subscribed creator', () => {
    expect(src).toMatch(/creatorLinkId/);
    expect(src).toMatch(/link\.creatorId === args\.creatorId/);
    expect(src).toMatch(/conversions:\s*link\.conversions \+ 1/);
  });
});
