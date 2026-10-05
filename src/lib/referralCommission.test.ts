import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REFERRAL_COMMISSION_PERCENT,
  normalizeReferralCommissionPercent,
  referralCommissionCents,
} from '../../convex/lib/referralCommission';

describe('referralCommission', () => {
  it('defaults missing rates to 10%', () => {
    expect(normalizeReferralCommissionPercent(undefined)).toBe(
      DEFAULT_REFERRAL_COMMISSION_PERCENT,
    );
    expect(normalizeReferralCommissionPercent(null)).toBe(
      DEFAULT_REFERRAL_COMMISSION_PERCENT,
    );
  });

  it('clamps rates to 0–100', () => {
    expect(normalizeReferralCommissionPercent(-5)).toBe(0);
    expect(normalizeReferralCommissionPercent(150)).toBe(100);
    expect(normalizeReferralCommissionPercent(12.9)).toBe(12);
  });

  it('floors commission on amount × rate', () => {
    expect(referralCommissionCents(1499, 10)).toBe(149);
    expect(referralCommissionCents(1000, 0)).toBe(0);
    expect(referralCommissionCents(0, 10)).toBe(0);
  });
});
