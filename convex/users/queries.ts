import { mutation, query, action } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId, modifyAccountCredentials } from "@convex-dev/auth/server";
import { listRolesForUser, logMutation, requireAppUser } from "../lib/auth";
import { api } from "../_generated/api";

/** Ensure profile fields exist on the Convex Auth user document. */
export const ensureUser = mutation({
  args: {
    email: v.optional(v.string()),
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
      email: args.email ?? existing.email,
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
    notificationPrefs: v.optional(v.any()),
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

/** Change password for the signed-in password account. */
export const changePassword = action({
  args: { newPassword: v.string() },
  handler: async (ctx, args) => {
    if (args.newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const user = await ctx.runQuery(api.users.queries.me, {});
    if (!user?.email) throw new Error("EMAIL_REQUIRED");
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: user.email, secret: args.newPassword },
    });
    return { ok: true };
  },
});
