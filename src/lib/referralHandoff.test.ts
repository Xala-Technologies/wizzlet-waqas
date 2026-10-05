import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  REFERRAL_CODE_STORAGE_KEY,
  clearStoredReferralCode,
  readStoredReferralCode,
  sanitizeReferralCode,
  storeReferralCode,
} from './referralHandoff';

describe('sanitizeReferralCode', () => {
  it('accepts product-style codes', () => {
    expect(sanitizeReferralCode('j2creator-jn73sz')).toBe('j2creator-jn73sz');
    expect(sanitizeReferralCode('  J2Creator_AB  ')).toBe('j2creator_ab');
  });

  it('rejects empty, oversized, and unsafe values', () => {
    expect(sanitizeReferralCode('')).toBeNull();
    expect(sanitizeReferralCode('a')).toBeNull();
    expect(sanitizeReferralCode('x'.repeat(65))).toBeNull();
    expect(sanitizeReferralCode('evil.com/phish')).toBeNull();
    expect(sanitizeReferralCode('code with spaces')).toBeNull();
    expect(sanitizeReferralCode(null)).toBeNull();
  });
});

describe('referral handoff storage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('stores and reads a sanitized code', () => {
    storeReferralCode('J2creator-jn73sz');
    expect(sessionStorage.getItem(REFERRAL_CODE_STORAGE_KEY)).toBe('j2creator-jn73sz');
    expect(readStoredReferralCode()).toBe('j2creator-jn73sz');
  });

  it('clears invalid codes and on clear()', () => {
    storeReferralCode('bad code!');
    expect(readStoredReferralCode()).toBeNull();
    storeReferralCode('j2creator-jn73sz');
    clearStoredReferralCode();
    expect(readStoredReferralCode()).toBeNull();
  });
});
