import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stripeDb = readFileSync(
  resolve(__dirname, '../../convex/payments/stripeDb.ts'),
  'utf8',
);
const sandbox = readFileSync(
  resolve(__dirname, '../../convex/payments/sandbox.ts'),
  'utf8',
);
const migrations = readFileSync(
  resolve(__dirname, '../../convex/migrations/load.ts'),
  'utf8',
);

describe('stripeDb / sandbox / migrations F-012', () => {
  it('caps stripeDb and sandbox subscription lookups', () => {
    expect(stripeDb).not.toMatch(/\.collect\(\)/);
    expect(stripeDb).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);
    expect(sandbox).not.toMatch(/\.collect\(\)/);
    expect(sandbox).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);
  });

  it('caps migration countTable reads instead of full collects', () => {
    expect(migrations).not.toMatch(/\.collect\(\)/);
    expect(migrations).toMatch(
      /countTable[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });
});
