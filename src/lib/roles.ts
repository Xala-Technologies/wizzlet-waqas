import { supabase } from '@/lib/supabase';

export type AppRole = 'creator' | 'subscriber' | 'admin';

/**
 * Deterministic precedence used whenever a user holds more than one role.
 * Higher privilege wins so a multi-role account always lands in the same place.
 */
export const ROLE_PRIORITY: AppRole[] = ['admin', 'creator', 'subscriber'];

export const ROLE_LABEL: Record<AppRole, string> = {
  admin: 'Admin',
  creator: 'Creator',
  subscriber: 'Member',
};

export const ACTIVE_ROLE_STORAGE_KEY = 'wizzlet.activeRole';

export function isAppRole(value: unknown): value is AppRole {
  return value === 'admin' || value === 'creator' || value === 'subscriber';
}

/** Sort a set of held roles by precedence (highest privilege first). */
export function sortRoles(roles: AppRole[]): AppRole[] {
  return [...roles].sort((a, b) => ROLE_PRIORITY.indexOf(a) - ROLE_PRIORITY.indexOf(b));
}

/**
 * Pick the active role deterministically: a previously chosen role wins when the
 * user still holds it, otherwise fall back to the highest-privilege role.
 */
export function resolveActiveRole(roles: AppRole[], preferred?: string | null): AppRole | null {
  if (roles.length === 0) return null;
  if (isAppRole(preferred) && roles.includes(preferred)) return preferred;
  return sortRoles(roles)[0];
}

export function homePathForRole(role: AppRole | null): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'creator':
      return '/creator';
    case 'subscriber':
      return '/dashboard';
    default:
      return '/select-role';
  }
}

/** Fetch every role a user holds. Never returns duplicates. */
export async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data) return [];

  const roles = data.map((r) => r.role).filter(isAppRole);
  return sortRoles(Array.from(new Set(roles)));
}
