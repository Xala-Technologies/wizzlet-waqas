import { isAuthFlowPath, postAuthDestination, sanitizeReturnPath } from '@/lib/safeReturnPath';
import type { AppRole } from '@/lib/roles';

export function buildMfaHref(returnTo: string | null | undefined): string {
  if (!returnTo) return '/mfa';
  const path = returnTo.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/mfa')) {
    return '/mfa';
  }
  if (path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth/')) {
    return '/mfa';
  }
  return `/mfa?returnTo=${encodeURIComponent(path)}`;
}

export function destinationAfterMfa(args: {
  mfaRequired: boolean;
  dest: string;
}): string {
  if (args.mfaRequired) return buildMfaHref(args.dest);
  return args.dest;
}

/** After a successful authenticator code, honor returnTo including /select-role. */
export function destinationAfterMfaVerify(args: {
  roles: readonly AppRole[];
  preferred?: AppRole | null;
  returnTo?: string | null;
}): string {
  const pending = sanitizeReturnPath(args.returnTo);
  if (args.roles.length === 0 && pending?.startsWith('/select-role')) {
    return pending;
  }
  return postAuthDestination({
    roles: args.roles,
    preferred: args.preferred,
    returnTo: pending && !isAuthFlowPath(pending) ? pending : null,
  });
}

