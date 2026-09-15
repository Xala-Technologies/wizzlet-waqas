import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!url) {
  console.warn("[convex] VITE_CONVEX_URL is not set");
}

/** Shared Convex client — authenticated by ConvexAuthProvider. */
export const convex = new ConvexReactClient(url ?? "https://missing.convex.cloud");
