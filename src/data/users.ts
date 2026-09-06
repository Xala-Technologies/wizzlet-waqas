/**
 * Thin identity adapter — Convex is authoritative.
 */

import { isConvexBackend } from './backend';

export async function fetchAppUserIdForAuthUid(_authUid: string): Promise<string | null> {
  if (isConvexBackend()) {
    console.warn('[data] fetchAppUserIdForAuthUid: use convex users.me / useAppUser hook');
    return null;
  }
  return null;
}
