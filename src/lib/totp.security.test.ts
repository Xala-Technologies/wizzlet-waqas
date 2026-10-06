import { describe, expect, it } from 'vitest';
import { publicUserFields } from '../../convex/lib/publicUser';
import {
  decodeBase32,
  encodeBase32,
  generateTotpSecret,
  otpauthUrl,
  totpAt,
  verifyTotp,
} from '../../convex/lib/totp';

describe('TOTP helpers', () => {
  it('round-trips 20-byte secrets through base32', () => {
    const bytes = new Uint8Array(20);
    for (let i = 0; i < 20; i++) bytes[i] = i + 1;
    const encoded = encodeBase32(bytes);
    expect(encoded).toMatch(/^[A-Z2-7]+$/);
    expect([...decodeBase32(encoded)]).toEqual([...bytes]);
  });

  it('matches RFC 6238 SHA-1 test vector at t=59', async () => {
    const secret = encodeBase32(new TextEncoder().encode('12345678901234567890'));
    expect(await totpAt(secret, 59)).toBe('287082');
  });

  it('accepts ±1 step window and rejects other codes', async () => {
    const secret = encodeBase32(new TextEncoder().encode('12345678901234567890'));
    const nowMs = 59_000;
    const code = await totpAt(secret, 59);
    expect(await verifyTotp(secret, code, nowMs)).toBe(true);
    expect(await verifyTotp(secret, code, nowMs + 30_000)).toBe(true);
    expect(await verifyTotp(secret, '000000', nowMs)).toBe(false);
    expect(await verifyTotp(secret, '28708', nowMs)).toBe(false);
  });

  it('builds an otpauth URL without leaking a QR CDN', () => {
    const url = otpauthUrl({ email: 'a@b.co', secret: 'JBSWY3DPEHPK3PXP' });
    expect(url.startsWith('otpauth://totp/')).toBe(true);
    expect(url).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(url).toContain('issuer=Prizelet');
  });

  it('generates a 20-byte secret from injected entropy', () => {
    const secret = generateTotpSecret({
      getRandomValues: (arr) => {
        arr.fill(7);
        return arr;
      },
    });
    expect(decodeBase32(secret)).toHaveLength(20);
  });
});

describe('publicUserFields', () => {
  it('never returns totpSecret', () => {
    const stripped = publicUserFields({
      _id: 'jd7users' as never,
      _creationTime: 1,
      email: 'a@b.co',
      totpSecret: 'SHOULD_NOT_LEAK',
      totpEnabled: true,
    });
    expect('totpSecret' in stripped).toBe(false);
    expect(stripped.totpEnabled).toBe(true);
  });
});
