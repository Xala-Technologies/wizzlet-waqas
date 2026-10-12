import { describe, expect, it } from 'vitest';
import { chargesByType, earningsSeries, transactionStatus } from './earningsReporting';

describe('creator earnings charts', () => {
  it('uses recorded net earnings without deducting fees a second time, and never invents payouts', () => {
    expect(earningsSeries([{ month: '2026-10', grossCents: 1500, revenueCents: 1350 }], []))
      .toEqual([{ label: '2026-10', revenue: 15, net: 13.5, payouts: 0 }]);
  });
  it('uses the actual completion month and excludes pending or failed payouts', () => {
    expect(earningsSeries([], [
      { status: 'paid', amountCents: 1350, processedAt: Date.UTC(2026, 9, 12), createdAt: Date.UTC(2026, 8, 30) },
      { status: 'pending', amountCents: 9999, createdAt: Date.UTC(2026, 9, 12) },
      { status: 'failed', amountCents: 9999, createdAt: Date.UTC(2026, 9, 12) },
    ])).toEqual([{ label: '2026-10', revenue: 0, net: 0, payouts: 13.5 }]);
  });
  it('derives charge mix from payment types and keeps empty history empty', () => {
    expect(chargesByType([])).toEqual([]);
    const result = chargesByType([
      { type: 'renewal', status: 'settled', amountCents: 1000 },
      { type: 'tip', status: 'paid', amountCents: 1000 },
      { type: 'subscription_charge', status: 'failed', amountCents: 9999 },
    ]);
    expect(result.map(({ name, value }) => ({ name, value }))).toEqual([{ name: 'Subscriptions', value: 50 }, { name: 'Tips', value: 50 }]);
    expect(result.reduce((sum, row) => sum + row.cents, 0)).toBe(2000);
  });
  it('does not present pending or failed reversals as completed refunds', () => {
    expect(transactionStatus({ type: 'refund', status: 'pending', amountCents: -500 })).toBe('pending');
    expect(transactionStatus({ type: 'refund', status: 'failed', amountCents: -500 })).toBe('failed');
    expect(transactionStatus({ type: 'refund', status: 'settled', amountCents: -500 })).toBe('refunded');
    expect(transactionStatus({ type: 'dispute', status: 'settled', amountCents: -500 })).toBe('chargeback');
  });
});
