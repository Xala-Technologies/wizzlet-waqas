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
});
