import { describe, expect, it } from 'vitest';
import {
  findBackupCodeIndex,
  formatBackupCode,
  generateBackupCodes,
  hashBackupCodes,
  isValidBackupCode,
  normalizeBackupCode,
} from '../../convex/lib/mfaBackup';
import { publicUserFields } from '../../convex/lib/publicUser';

describe('mfaBackup helpers', () => {
  it('normalizes and validates XXXX-XXXX codes', () => {
    expect(normalizeBackupCode('ab23-cd45')).toBe('AB23CD45');
    expect(isValidBackupCode('AB23-CD45')).toBe(true);
    expect(isValidBackupCode('AB23CD45')).toBe(true);
    expect(isValidBackupCode('AB12-CD34')).toBe(false); // 1 not in alphabet
    expect(isValidBackupCode('123456')).toBe(false);
    expect(isValidBackupCode('AB23-CD4')).toBe(false);
    expect(formatBackupCode('ab23cd45')).toBe('AB23-CD45');
  });

  it('generates 8 valid formatted codes', () => {
    let n = 0;
    const codes = generateBackupCodes({
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) arr[i] = (n * 17 + i * 31) % 256;
        n += 1;
        return arr;
      },
    });
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
    for (const code of codes) {
      expect(isValidBackupCode(code)).toBe(true);
      expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    }
  });

  it('hashes codes and finds a match by index', async () => {
    const codes = ['AB23-CD45', 'EF67-GH89'];
    const hashes = await hashBackupCodes(codes);
    expect(hashes).toHaveLength(2);
    expect(await findBackupCodeIndex(hashes, 'ab23cd45')).toBe(0);
    expect(await findBackupCodeIndex(hashes, 'EF67-GH89')).toBe(1);
    expect(await findBackupCodeIndex(hashes, 'ZZZZ-ZZZZ')).toBe(-1);
  });
});

describe('publicUserFields backup hygiene', () => {
  it('never returns totpBackupCodeHashes', () => {
    const stripped = publicUserFields({
      _id: 'jd7users' as never,
      _creationTime: 1,
      totpSecret: 'SECRET',
      totpEnabled: true,
      totpBackupCodeHashes: [{ salt: 's', hash: 'h' }],
    });
    expect('totpBackupCodeHashes' in stripped).toBe(false);
    expect('totpSecret' in stripped).toBe(false);
  });
});
