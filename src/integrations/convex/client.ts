import { ConvexReactClient } from "convex/react";
import { publicEnv } from "@/config/publicEnv";

if (!publicEnv.convexUrl) {
  console.error(
    "[convex] VITE_CONVEX_URL is not set. The app cannot talk to Convex until it is configured.",
  );
}

/**
 * Shared Convex client — authenticated by ConvexAuthProvider.
 * Non-local builds refuse a missing/placeholder URL in `publicEnv` (fail closed).
 * Local may construct with an empty string only after the error log above — callers
 * still need a valid URL for requests to succeed.
 */
export const convex = new ConvexReactClient(
  publicEnv.convexUrl || "https://placeholder.invalid.convex.cloud",
);
