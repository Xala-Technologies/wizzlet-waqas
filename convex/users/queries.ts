import { mutation, query, action, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import {
  getAuthUserId,
  modifyAccountCredentials,
  retrieveAccount,
  invalidateSessions,
} from "@convex-dev/auth/server";
import { listRolesForUser, logMutation, requireAppUser } from "../lib/auth";
import { internal } from "../_generated/api";

/**
 * Ensure profile fields exist. Never accepts client email — email is Auth-owned.
 */
export const ensureUser = mutation({
  args: {
    fullName: v.optional(v.string()),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const existing = await ctx.db.get(userId);
    if (!existing) throw new Error("USER_PROFILE_MISSING");
    const now = Date.now();
    await ctx.db.patch(userId, {
      // Do not patch email from client args
      fullName: args.fullName ?? existing.fullName,
      username: args.username ?? existing.username,
      name: args.fullName ?? existing.name ?? existing.email,
      updatedAt: now,
      createdAt: existing.createdAt ?? now,
    });
    await logMutation(ctx, {
      table: "users",
      documentId: userId,
      action: "ensureUser",
    });
    return userId;
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const roles = await listRolesForUser(ctx, user._id);
    return { ...user, roles };
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const meUser = await requireAppUser(ctx);
    const roles = await listRolesForUser(ctx, meUser._id);
    if (!roles.includes("admin") && meUser._id !== args.userId) {
      throw new Error("FORBIDDEN");
    }
    return ctx.db.get(args.userId);
  },
});

export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    username: v.optional(v.string()),
    notificationPrefs: v.optional(
      v.object({
        new_posts: v.boolean(),
        price_changes: v.boolean(),
        promotions: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    await ctx.db.patch(user._id, {
      ...(args.fullName !== undefined ? { fullName: args.fullName, name: args.fullName } : {}),
      ...(args.username !== undefined ? { username: args.username } : {}),
      ...(args.notificationPrefs !== undefined
        ? { notificationPrefs: args.notificationPrefs }
        : {}),
      updatedAt: Date.now(),
    });
    return user._id;
  },
});

/** Password provider account owned by this user (immutable providerAccountId). */
export const getPasswordAccountId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", args.userId).eq("provider", "password"),
      )
      .unique();
    if (!account) return null;
    return {
      providerAccountId: account.providerAccountId,
      userId: account.userId,
    };
  },
});

/**
 * Change password for the caller's owned password account only.
 * Uses authAccounts.providerAccountId bound to getAuthUserId — never profile email.
 */
export const changePassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args): Promise<{ ok: boolean }> => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");

    const owned = await ctx.runQuery(internal.users.queries.getPasswordAccountId, {
      userId,
    });
    if (!owned) throw new Error("PASSWORD_ACCOUNT_MISSING");

    // Verify current password against the owned account id (not a client email)
    try {
      const verified = await retrieveAccount(ctx, {
        provider: "password",
        account: { id: owned.providerAccountId, secret: args.currentPassword },
      });
      if (verified.user._id !== userId) {
        throw new Error("FORBIDDEN");
      }
    } catch {
      throw new Error("INVALID_CURRENT_PASSWORD");
    }

    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: owned.providerAccountId, secret: args.newPassword },
    });

    await invalidateSessions(ctx, { userId });
    return { ok: true };
  },
});
