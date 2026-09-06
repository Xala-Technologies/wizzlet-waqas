/**
 * SEC-01 helpers: password account identity must not follow editable profile email.
 */

export function resolvePasswordAccountId(args: {
  authUserId: string;
  ownedProviderAccountId: string | null;
  /** Forged client email — must never be used when owned id exists */
  forgedEmail?: string;
}): string {
  if (!args.ownedProviderAccountId) {
    throw new Error("PASSWORD_ACCOUNT_MISSING");
  }
  // Explicitly ignore forgedEmail — credential target is ownership-bound only
  void args.forgedEmail;
  void args.authUserId;
  return args.ownedProviderAccountId;
}

export function assertCredentialTargetMatchesCaller(
  callerUserId: string,
  accountUserId: string,
): void {
  if (callerUserId !== accountUserId) {
    throw new Error("FORBIDDEN");
  }
}
