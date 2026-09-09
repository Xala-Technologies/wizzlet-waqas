import { ConvexError } from "convex/values";
import {
  assertProductionSafeEnv,
  isSandboxFlagEnabled,
} from "./envGuards";

/**
 * Server-side sandbox gate. Never trust a client boolean.
 * Set ALLOW_SANDBOX_CHECKOUT=true on the Convex deployment for non-prod only.
 */
export function assertSandboxEnabled(): void {
  assertProductionSafeEnv();
  if (!isSandboxFlagEnabled()) {
    throw new ConvexError("SANDBOX_DISABLED");
  }
}

export function isSandboxEnabled(): boolean {
  if (isSandboxFlagEnabled()) {
    // Still refuse if production-shaped (assert would throw; treat as disabled for reads).
    try {
      assertProductionSafeEnv();
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
