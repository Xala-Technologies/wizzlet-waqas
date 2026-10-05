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

  it('member mutations require an authenticated app user', () => {
    expect(src).toMatch(/export const requestAccountDeletion[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const requestEmailChange[\s\S]*requireAppUser/);
    expect(src).toMatch(/export const listMine[\s\S]*requireAppUser/);
  });
});
