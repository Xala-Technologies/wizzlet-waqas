import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const growthSrc = readFileSync(
  resolve(__dirname, '../../convex/creators/growth.ts'),
  'utf8',
);
const schemaSrc = readFileSync(resolve(__dirname, '../../convex/schema.ts'), 'utf8');

describe('referral commission paid ledger', () => {
  it('schema tracks commissionPaidCents / commissionPaidAt', () => {
    expect(schemaSrc).toMatch(/commissionPaidCents:\s*v\.optional\(v\.number\(\)\)/);
    expect(schemaSrc).toMatch(/commissionPaidAt:\s*v\.optional\(v\.number\(\)\)/);
  });

  it('admin mark-paid requires admin and gates already-paid / nothing-to-pay', () => {
    expect(growthSrc).toMatch(/export const markCommissionPaidAdmin[\s\S]*requireAdmin/);
    expect(growthSrc).toMatch(/ALREADY_PAID/);
    expect(growthSrc).toMatch(/NOTHING_TO_PAY/);
    expect(growthSrc).toMatch(/commissionPaidCents/);
    expect(growthSrc).toMatch(/commissionPaidAt:\s*now/);
  });

  it('admin unpaid list is admin-only and filters accrued unpaid rows', () => {
    expect(growthSrc).toMatch(/export const listUnpaidCommissionsAdmin[\s\S]*requireAdmin/);
    expect(growthSrc).toMatch(/commissionEarnedCents > 0/);
    expect(growthSrc).toMatch(/commissionPaidAt === undefined/);
  });
});
