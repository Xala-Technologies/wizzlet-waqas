import type { AppRole } from '@/lib/roles';
import { homePathForRole, resolveActiveRole } from '@/lib/roles';

/** sessionStorage key for OAuth round-trip (query params are lost on provider return). */
export const RETURN_TO_STORAGE_KEY = 'prizelet.returnTo';

/**
 * Structural validation only: relative same-app path, no open redirects.
 * Does not check roles — use {@link resolveSafeReturnPath} for that.
 */
export function sanitizeReturnPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  let path = raw.trim();
  if (!path) return null;

  try {
    // Tolerate double-encoding from nested redirects.
    if (path.includes('%')) {
      path = decodeURIComponent(path);
    }
  } catch {
    return null;
  }

  path = path.trim();
  if (!path.startsWith('/')) return null;
  if (path.startsWith('//')) return null;
  if (path.includes('://')) return null;
  if (path.includes('\\')) return null;
  for (let i = 0; i < path.length; i++) {
    const code = path.charCodeAt(i);
    if (code < 32 || code === 127 || path[i] === '<' || path[i] === '>' || path[i] === '"') {
      return null;
    }
  }

  // Drop hash fragments from deep links (not used for auth handoff).
  const hashIdx = path.indexOf('#');
  if (hashIdx >= 0) path = path.slice(0, hashIdx);
  if (!path.startsWith('/')) return null;

  return path;
}

const AUTH_FLOW_PREFIXES = [
  '/login',
  '/signup',
  '/auth/',
  '/select-role',
] as const;

export function isAuthFlowPath(path: string): boolean {
  const bare = path.split('?')[0] ?? path;
  return AUTH_FLOW_PREFIXES.some(
    (p) => bare === p || bare.startsWith(`${p}/`) || (p.endsWith('/') && bare.startsWith(p)),
  );
}

export function isAdminOnlyPath(path: string): boolean {
  const bare = path.split('?')[0] ?? path;
  return bare === '/admin' || bare.startsWith('/admin/');
}

/**
 * Return a usable in-app destination, or null if unsafe / inaccessible.
 * Admin destinations require an admin role on the account.
 */
export function resolveSafeReturnPath(
  candidate: string | null | undefined,
  heldRoles: readonly AppRole[],
): string | null {
  const path = sanitizeReturnPath(candidate);
  if (!path) return null;
  if (isAuthFlowPath(path)) return null;
  if (isAdminOnlyPath(path) && !heldRoles.includes('admin')) return null;
  return path;
}

/** Build `/login?returnTo=…` from the current protected location. */
export function buildLoginHref(pathname: string, search = ''): string {
  const combined = `${pathname}${search}`;
  const safe = sanitizeReturnPath(combined);
  if (!safe || isAuthFlowPath(safe)) return '/login';
  return `/login?returnTo=${encodeURIComponent(safe)}`;
}

export function readStoredReturnTo(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(RETURN_TO_STORAGE_KEY);
    return sanitizeReturnPath(raw);
  } catch {
    return null;
  }
}

export function storeReturnTo(path: string | null | undefined): void {
  if (typeof sessionStorage === 'undefined') return;
  const safe = sanitizeReturnPath(path);
  try {
    if (safe && !isAuthFlowPath(safe)) {
      sessionStorage.setItem(RETURN_TO_STORAGE_KEY, safe);
    } else {
      sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
    }
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearStoredReturnTo(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(RETURN_TO_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Post-auth navigation target.
 * Empty roles → select-role (optionally carrying returnTo for the next hop).
 */
export function postAuthDestination(args: {
  roles: readonly AppRole[];
  preferred?: AppRole | null;
  returnTo?: string | null;
}): string {
  const { roles, preferred, returnTo } = args;
  if (roles.length === 0) {
    const pending = sanitizeReturnPath(returnTo);
    if (pending && !isAuthFlowPath(pending)) {
      return `/select-role?returnTo=${encodeURIComponent(pending)}`;
    }
    return '/select-role';
  }

  const safe = resolveSafeReturnPath(returnTo, roles);
  if (safe) return safe;
  return homePathForRole(resolveActiveRole([...roles], preferred));
}

/** After first role assignment — creators always complete onboarding first. */
export function postRoleSelectDestination(args: {
  selected: 'creator' | 'subscriber';
  returnTo?: string | null;
  heldRoles: readonly AppRole[];
}): string {
  if (args.selected === 'creator') {
    return '/creator/onboarding';
  }
  const safe = resolveSafeReturnPath(args.returnTo, args.heldRoles);
  return safe ?? '/dashboard';
}
