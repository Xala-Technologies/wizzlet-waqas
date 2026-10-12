import { describe, expect, it } from 'vitest';
import { sumReportPayments, settledReportPayments, paymentFeePercent } from '../../convex/lib/reportingLedger';

const payment = (amountCents: number, extra = {}) => ({ status: 'settled', type: 'subscription_charge', amountCents,
  platformFeeCents: amountCents / 10, creatorEarningsCents: amountCents * 0.9, ...extra });

describe('settled reporting ledger', () => {
  it('reconciles charges, renewals, partial refunds and dispute reversals with exact cents', () => {
    const rows = [payment(1000), payment(1000, { type: 'renewal' }), payment(-500, { type: 'refund' }),
      payment(-1000, { type: 'dispute' }), payment(1000, { type: 'adjustment' }),
      payment(50_000, { status: 'pending' }), payment(50_000, { status: 'failed' }),
      payment(50_000, { paymentMode: 'sandbox' }), payment(-50_000, { type: 'payout' }),
      payment(50_000, { type: 'subscription_cancel' })];
    expect(sumReportPayments(rows)).toEqual({ amountCents: 1500, platformFeeCents: 150, creatorEarningsCents: 1350 });
  });
  it('retains both sides of a legacy explicit refund, without double subtraction', () => {
    const rows = [payment(1000, { balanceState: 'reversed', commercialRef: 'original' }),
      payment(-1000, { type: 'refund', relatedCommercialRef: 'original' })];
    expect(settledReportPayments(rows)).toHaveLength(2);
    expect(sumReportPayments(rows).amountCents).toBe(0);
  });
  it('does not resurrect a legacy reversed credit with no explicit debit', () => {
    expect(sumReportPayments([payment(1000, { balanceState: 'reversed' })]).amountCents).toBe(0);
  });
  it('includes paid legacy and test-provider records, matching the existing payout ledger policy', () => {
    expect(sumReportPayments([payment(1000, { status: 'paid' }), payment(1000, { paymentMode: 'test' })]).amountCents).toBe(2000);
  });
  it('preserves a refund fee percentage and avoids division by zero', () => {
    expect(paymentFeePercent(-500, -50)).toBe(10);
    expect(paymentFeePercent(0, 0)).toBe(0);
  });
});
