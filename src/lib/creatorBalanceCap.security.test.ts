import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const balance = readFileSync(
  resolve(__dirname, '../../convex/lib/payoutBalance.ts'),
  'utf8',
);
const payouts = readFileSync(
  resolve(__dirname, '../../convex/payouts/mutations.ts'),
  'utf8',
);
const validators = readFileSync(
  resolve(__dirname, '../../convex/lib/validators.ts'),
  'utf8',
);

describe('creator available balance F-012', () => {
  it('caps paymentEvents and payouts by creator instead of collecting', () => {
    const start = balance.indexOf('export async function getCreatorAvailableBalanceCents');
    const body = balance.slice(start);
    expect(body).toMatch(/\.take\(ADMIN_SCAN_MAX_DOCS\)/);
    expect(body).not.toMatch(/\.collect\(\)/);
    expect(body).toMatch(/truncated:/);
  });

  it('refuses payout requests when the balance read is truncated', () => {
    expect(payouts).toMatch(/BALANCE_TRUNCATED/);
    expect(validators).toMatch(/truncated: v\.boolean\(\)/);
  });
});
