import { describe, expect, it } from 'vitest';
import {
  generateNumericOtp,
  hashOtp,
  isValidEmail,
  isValidOtpCode,
  otpExpired,
  otpMatches,
  otpResendTooSoon,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from '../../convex/lib/emailOtp';
import {
  allowDevOtpEcho,
  emailChangeOtpMessage,
  emailFromDomainHint,
  mailerConfigured,
  mailerOpsStatus,
} from '../../convex/lib/transactionalEmail';

describe('email OTP helpers', () => {
  it('normalizes and validates email / 6-digit codes', () => {
    expect(isValidEmail('  A@B.co ')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidOtpCode('123456')).toBe(true);
    expect(isValidOtpCode('12345')).toBe(false);
    expect(isValidOtpCode('abcdef')).toBe(false);
  });

  it('hashes OTP with salt and matches timing-safe', async () => {
    const salt = 'ab'.repeat(16);
    const hash = await hashOtp(salt, '123456');
    expect(hash).toHaveLength(64);
    expect(await otpMatches(salt, '123456', hash)).toBe(true);
    expect(await otpMatches(salt, '000000', hash)).toBe(false);
  });

  it('generates a 6-digit code from random bytes', () => {
    const code = generateNumericOtp({
      getRandomValues: (arr) => {
        arr[0] = 42;
        return arr;
      },
    });
    expect(code).toBe('000042');
  });

  it('enforces TTL, cooldown, and max attempts constants', () => {
    expect(OTP_TTL_MS).toBe(10 * 60 * 1000);
    expect(OTP_MAX_ATTEMPTS).toBe(5);
    expect(otpExpired(1, 2)).toBe(true);
    expect(otpExpired(10, 2)).toBe(false);
    expect(otpResendTooSoon(1000, 1000 + OTP_RESEND_COOLDOWN_MS - 1)).toBe(true);
    expect(otpResendTooSoon(1000, 1000 + OTP_RESEND_COOLDOWN_MS)).toBe(false);
  });

  it('never echoes OTP on production origins even with the dev-admin flag', () => {
    expect(
      allowDevOtpEcho({
        SITE_URL: 'https://www.sweeph.com',
        ALLOW_DEV_ADMIN_GRANT: 'true',
      }),
    ).toBe(false);
    expect(
      allowDevOtpEcho({
        SITE_URL: 'http://127.0.0.1:8080',
        ALLOW_DEV_ADMIN_GRANT: 'true',
      }),
    ).toBe(true);
    expect(mailerConfigured({})).toBe(false);
    expect(mailerConfigured({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'Prizelet <a@b.co>' })).toBe(true);
    expect(emailChangeOtpMessage('123456').text).toContain('123456');
  });

  it('mailerOpsStatus exposes readiness without secrets', () => {
    expect(emailFromDomainHint('Sweeph <noreply@sweeph.com>')).toBe('sweeph.com');
    expect(
      mailerOpsStatus({
        RESEND_API_KEY: 're_x',
        EMAIL_FROM: 'Sweeph <noreply@sweeph.com>',
        SITE_URL: 'https://www.sweeph.com',
        ALLOW_DEV_ADMIN_GRANT: 'true',
      }),
    ).toEqual({
      configured: true,
      fromDomain: 'sweeph.com',
      productionOrigin: true,
      devEchoAllowed: false,
    });
  });
});
