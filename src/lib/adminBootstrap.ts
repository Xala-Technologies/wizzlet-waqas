/**
 * Local / bootstrap platform-owner credentials.
 * Used by the login page (dev button) and documented for manual sign-in.
 * Server gate: `ALLOW_DEV_ADMIN_GRANT=true` + email allowlist in `convex/lib/devAdminGrant.ts`.
 */
export const ADMIN_BOOTSTRAP = {
  email: "admin@wizzlet.dev",
  password: "AdminWizzlet1!",
  username: "platformowner",
  fullName: "Platform Owner",
} as const;
