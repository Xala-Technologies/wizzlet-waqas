/**
 * Dev-only bootstrap for minting platform admin via `grantTestAdmin`.
 * Production deployments must leave `ALLOW_DEV_ADMIN_GRANT` unset.
 */
export const DEV_ADMIN_GRANT_EMAILS = [
  "admin@wizzlet.dev",
  "test@wizzlet.dev",
] as const;

export function isDevAdminGrantAllowed(
  email: string | undefined | null,
  allowEnvFlag: string | undefined | null,
): boolean {
  if (allowEnvFlag !== "true") return false;
  const normalized = (email ?? "").trim().toLowerCase();
  return (DEV_ADMIN_GRANT_EMAILS as readonly string[]).includes(normalized);
}
