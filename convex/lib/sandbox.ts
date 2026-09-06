import { ConvexError } from "convex/values";

/**
 * Server-side sandbox gate. Never trust a client boolean.
 * Set ALLOW_SANDBOX_CHECKOUT=true on the Convex deployment for non-prod.
 */
export function assertSandboxEnabled(): void {
  if (process.env.ALLOW_SANDBOX_CHECKOUT !== "true") {
    throw new ConvexError("SANDBOX_DISABLED");
  }
}

export function isSandboxEnabled(): boolean {
  return process.env.ALLOW_SANDBOX_CHECKOUT === "true";
}
