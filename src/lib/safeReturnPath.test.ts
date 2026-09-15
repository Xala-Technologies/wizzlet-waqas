import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  buildLoginHref,
  clearStoredReturnTo,
  isAdminOnlyPath,
  isAuthFlowPath,
  postAuthDestination,
  postRoleSelectDestination,
  resolveSafeReturnPath,
  RETURN_TO_STORAGE_KEY,
  sanitizeReturnPath,
  storeReturnTo,
  readStoredReturnTo,
} from './safeReturnPath';

describe('sanitizeReturnPath', () => {
  it('accepts relative app paths with query', () => {
    expect(sanitizeReturnPath('/dashboard/saved')).toBe('/dashboard/saved');
    expect(sanitizeReturnPath('/dashboard/discover?q=nba')).toBe('/dashboard/discover?q=nba');
  });

  it('rejects open redirects and non-paths', () => {
    expect(sanitizeReturnPath('https://evil.example/phish')).toBeNull();
    expect(sanitizeReturnPath('//evil.example')).toBeNull();
    expect(sanitizeReturnPath('dashboard')).toBeNull();
    expect(sanitizeReturnPath('')).toBeNull();
    expect(sanitizeReturnPath(null)).toBeNull();
  });

  it('strips hash fragments', () => {
    expect(sanitizeReturnPath('/creator#secret')).toBe('/creator');
  });
});

describe('resolveSafeReturnPath', () => {
  it('blocks auth-flow destinations', () => {
    expect(resolveSafeReturnPath('/login', ['subscriber'])).toBeNull();
    expect(resolveSafeReturnPath('/select-role', ['creator'])).toBeNull();
  });

  it('blocks admin paths without admin role', () => {
    expect(isAdminOnlyPath('/admin/fees')).toBe(true);
    expect(resolveSafeReturnPath('/admin', ['subscriber'])).toBeNull();
    expect(resolveSafeReturnPath('/admin/fees', ['admin'])).toBe('/admin/fees');
  });

  it('allows member and creator destinations when held', () => {
    expect(resolveSafeReturnPath('/dashboard/messages', ['subscriber'])).toBe(
      '/dashboard/messages',
    );
    expect(resolveSafeReturnPath('/creator/posts', ['creator'])).toBe('/creator/posts');
  });
});

describe('buildLoginHref', () => {
  it('encodes returnTo for protected locations', () => {
    expect(buildLoginHref('/dashboard/saved', '')).toBe(
      `/login?returnTo=${encodeURIComponent('/dashboard/saved')}`,
    );
  });

  it('omits returnTo for auth pages', () => {
    expect(buildLoginHref('/login', '')).toBe('/login');
    expect(isAuthFlowPath('/signup')).toBe(true);
  });
});

describe('postAuthDestination', () => {
  it('sends role-less users to select-role with pending return', () => {
    expect(
      postAuthDestination({ roles: [], returnTo: '/dashboard/activity' }),
    ).toBe(`/select-role?returnTo=${encodeURIComponent('/dashboard/activity')}`);
  });

  it('prefers safe return over home when roles allow', () => {
    expect(
      postAuthDestination({
        roles: ['subscriber'],
        returnTo: '/dashboard/saved',
      }),
    ).toBe('/dashboard/saved');
  });

  it('falls back to role home when return is admin without privilege', () => {
    expect(
      postAuthDestination({
        roles: ['subscriber'],
        returnTo: '/admin',
      }),
    ).toBe('/dashboard');
  });
});

describe('postRoleSelectDestination', () => {
  it('always sends new creators to onboarding', () => {
    expect(
      postRoleSelectDestination({
        selected: 'creator',
        returnTo: '/dashboard',
        heldRoles: ['creator'],
      }),
    ).toBe('/creator/onboarding');
  });

  it('honors safe return for subscribers', () => {
    expect(
      postRoleSelectDestination({
        selected: 'subscriber',
        returnTo: '/dashboard/discover',
        heldRoles: ['subscriber'],
      }),
    ).toBe('/dashboard/discover');
  });
});

describe('sessionStorage returnTo', () => {
  beforeEach(() => {
    clearStoredReturnTo();
  });
  afterEach(() => {
    clearStoredReturnTo();
  });

  it('stores and reads a sanitized path', () => {
    storeReturnTo('/creator/earnings');
    expect(readStoredReturnTo()).toBe('/creator/earnings');
    expect(sessionStorage.getItem(RETURN_TO_STORAGE_KEY)).toBe('/creator/earnings');
  });

  it('ignores unsafe values', () => {
    storeReturnTo('https://evil.test');
    expect(readStoredReturnTo()).toBeNull();
  });
});
