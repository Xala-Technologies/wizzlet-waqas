import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(
  resolve(__dirname, '../../convex/accountRequests.ts'),
  'utf8',
);

describe('accountRequests security', () => {
  it('listOpenAdmin requires admin and joins user identity', () => {
    expect(src).toMatch(/export const listOpenAdmin[\s\S]*requireAdmin/);
    expect(src).toMatch(/export const listOpenAdmin[\s\S]*email:/);
    expect(src).toMatch(/export const listOpenAdmin[\s\S]*fullName:/);
  });

  it('mailerStatusAdmin is admin-only and returns no secrets', () => {
    expect(src).toMatch(/export const mailerStatusAdmin[\s\S]*requireAdmin/);
    expect(src).toMatch(/mailerOpsStatus/);
    expect(src).not.toMatch(/mailerStatusAdmin[\s\S]*RESEND_API_KEY/);
  });

  it('member mutations require an authenticated app user', () => {
    expect(src).toMatch(/export const requestAccountDeletion[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const requestEmailChange[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const listMine[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const verifyEmailChangeOtp[\s\S]*requireAppUser/);
  });

  it('self-serve OTP hashes the code, never returns hash on listMine, and gates delivery', () => {
    expect(src).toMatch(/export const startEmailChange[\s\S]*mintEmailChangeOtp/);
    expect(src).toMatch(/export const resendEmailChangeOtp[\s\S]*remintOpenEmailChangeOtp/);
    expect(src).toMatch(/verifyEmailChangeOtp[\s\S]*otpMatches/);
    expect(src).toMatch(/MAILER_NOT_CONFIGURED/);
    expect(src).toMatch(/allowDevOtpEcho/);
    expect(src).toMatch(/rows\.map\(stripOtpFields\)/);
    expect(src).not.toMatch(/listOpenAdmin[\s\S]*\.\.\.row/);
    expect(src).toMatch(/OTP_MAX_ATTEMPTS/);
    expect(src).toMatch(/EMAIL_TAKEN/);
  });

  it('resolveAdmin is admin-only and gates fulfill/reject', () => {
    expect(src).toMatch(/export const resolveAdmin[\s\S]*requireAdmin/);
    expect(src).toMatch(/disposition: v\.union\(v\.literal\("fulfill"\), v\.literal\("reject"\)\)/);
    expect(src).toMatch(/CANNOT_RESOLVE_OWN_REQUEST/);
    expect(src).toMatch(/REQUEST_NOT_OPEN/);
    expect(src).toMatch(/EMAIL_TAKEN/);
    expect(src).toMatch(/providerAccountId: requestedEmail/);
    expect(src).toMatch(/deleted\+/);
    expect(src).toMatch(/clearAuthSessions/);
    expect(src).toMatch(/stripUserRoles/);
  });

  it('deletion fulfill returns Stripe sub_* ids and schedules remote cancel', () => {
    expect(src).toMatch(/stripeSubscriptionIds/);
    expect(src).toMatch(/startsWith\("sub_"\)/);
    expect(src).toMatch(/return stripeSubscriptionIds/);
    expect(src).toMatch(
      /internal\.payments\.stripeNode\.cancelStripeSubscriptionsBestEffort/,
    );
    expect(src).toMatch(/account_deletion:/);
  });
});
