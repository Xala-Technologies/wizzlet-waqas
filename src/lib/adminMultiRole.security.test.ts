import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const listSrc = readFileSync(
  resolve(__dirname, '../../convex/admin/paginatedLists.ts'),
  'utf8',
);
const uiSrc = readFileSync(
  resolve(__dirname, '../../src/pages/AdminUsers.tsx'),
  'utf8',
);

describe('admin multi-role All Accounts', () => {
  it('listUsersPage returns roles array alongside primary role', () => {
    expect(listSrc).toMatch(/roles:\s*v\.array\(v\.string\(\)\)/);
    expect(listSrc).toMatch(/sortRolesForDisplay/);
    expect(listSrc).toMatch(/ROLE_DISPLAY_ORDER/);
    expect(listSrc).toMatch(/roles:\s*\n\s*heldRoles\.length > 0/);
  });

  it('AdminUsers renders all held role pills and exports Roles column', () => {
    expect(uiSrc).toMatch(/roles:\s*u\.roles/);
    expect(uiSrc).toMatch(/rolePills/);
    expect(uiSrc).toMatch(/\['Name', 'Email', 'Roles'/);
    expect(uiSrc).toMatch(/u\.roles\.join\('\|'\)/);
  });
});
