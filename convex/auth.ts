import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import type { DataModel } from "./_generated/dataModel";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password<DataModel>({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        const username =
          typeof params.username === "string"
            ? params.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
            : undefined;
        const fullName =
          typeof params.name === "string"
            ? params.name.trim()
            : typeof params.fullName === "string"
              ? params.fullName.trim()
              : undefined;
        const now = Date.now();
        return {
          email,
          name: fullName || username || email,
          fullName: fullName || undefined,
          username: username || undefined,
          createdAt: now,
          updatedAt: now,
        };
      },
      validatePasswordRequirements(password) {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters");
        }
      },
    }),
  ],
});
