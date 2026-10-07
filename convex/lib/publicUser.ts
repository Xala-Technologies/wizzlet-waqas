import type { Doc } from "../_generated/dataModel";

/** Strip TOTP secrets before any client-facing user document. */
export function publicUserFields(user: Doc<"users">) {
  const {
    totpSecret: _secret,
    totpBackupCodeHashes: _hashes,
    totpEnabled,
    ...rest
  } = user;
  return {
    ...rest,
    totpEnabled: Boolean(totpEnabled && user.totpSecret),
  };
}
