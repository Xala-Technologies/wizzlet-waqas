import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const earnings = readFileSync(
  resolve(__dirname, '../../convex/creators/earnings.ts'),
  'utf8',
);
const subs = readFileSync(
  resolve(__dirname, '../../convex/subscriptions/mutations.ts'),
  'utf8',
);

describe('creator earnings F-012', () => {
  it('caps myEarnings subscription and paymentEvent reads', () => {
    const start = earnings.indexOf('export const myEarnings');
    const body = earnings.slice(start);
    expect(body).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);
    expect(body).not.toMatch(/\.collect\(\)/);
    expect(body).toMatch(/truncated/);
  });

  it('caps public active count and creator subscription list takes', () => {
    expect(subs).toMatch(
      /export const countActiveByCreator[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(subs).toMatch(
      /export const listForMyCreator[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });
});
