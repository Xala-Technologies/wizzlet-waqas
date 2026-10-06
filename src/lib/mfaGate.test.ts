import { describe, expect, it } from 'vitest';
import { buildMfaHref, destinationAfterMfa, destinationAfterMfaVerify } from './mfaGate';

describe('mfaGate', () => {
  it('carries a safe returnTo onto /mfa', () => {
    expect(buildMfaHref('/creator/settings')).toBe(
      '/mfa?returnTo=%2Fcreator%2Fsettings',
    );
    expect(buildMfaHref('/mfa')).toBe('/mfa');
    expect(buildMfaHref('/login')).toBe('/mfa');
  });

  it('skips /mfa when the session is already granted', () => {
    expect(destinationAfterMfa({ mfaRequired: false, dest: '/admin' })).toBe('/admin');
    expect(destinationAfterMfa({ mfaRequired: true, dest: '/admin' })).toBe(
      '/mfa?returnTo=%2Fadmin',
    );
  });

  it('keeps select-role after verify when the account has no roles yet', () => {
    expect(
      destinationAfterMfaVerify({
        roles: [],
        returnTo: '/select-role?returnTo=/dashboard',
      }),
    ).toBe('/select-role?returnTo=/dashboard');
  });
});
