import { ReactNode } from "react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { convex } from "./client";

/**
 * Convex Auth provider — no Supabase.
 */
export function ConvexAppProvider({ children }: { children: ReactNode }) {
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
}
