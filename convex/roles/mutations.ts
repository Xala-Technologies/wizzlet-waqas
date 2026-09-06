import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import {
  listRolesForUser,
  logMutation,
  requireAdmin,
  requireAppUser,
  requireIdentity,
  type AppRole,
} from "../lib/auth";
import { isDevAdminGrantAllowed } from "../lib/devAdminGrant";

const assignableRole = v.union(v.literal("creator"), v.literal("subscriber"));

/** Self-assign creator/subscriber only — never admin (hardening parity). */
export const assignSelfRole = mutation({
  args: { role: assignableRole },
  handler: async (ctx, args) => {
    await requireIdentity(ctx);
    const user = await requireAppUser(ctx);
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_userId_role", (q) => q.eq("userId", user._id).eq("role", args.role))
      .unique();
    if (existing) return existing._id;
    const id = await ctx.db.insert("userRoles", {
      userId: user._id,
      role: args.role,
      createdAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "userRoles",
      documentId: id,
      action: "assignSelfRole",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
  },
});

/** Trusted admin path only — service/admin identity. */
export const grantRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("moderator"),
      v.literal("user"),
      v.literal("creator"),
      v.literal("subscriber"),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_userId_role", (q) => q.eq("userId", args.userId).eq("role", args.role))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("userRoles", {
      userId: args.userId,
      role: args.role as AppRole,
      createdAt: Date.now(),
    });
  },
});

export const myRoles = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return listRolesForUser(ctx, user._id);
  },
});

/**
 * Bootstrap platform-owner role for local/dev only.
 * Requires ALLOW_DEV_ADMIN_GRANT=true on the Convex deployment **and** an allowlisted email.
 * Never set ALLOW_DEV_ADMIN_GRANT on production.
 */
export const grantTestAdmin = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    if (!isDevAdminGrantAllowed(user.email, process.env.ALLOW_DEV_ADMIN_GRANT)) {
      throw new ConvexError("FORBIDDEN");
    }
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_userId_role", (q) => q.eq("userId", user._id).eq("role", "admin"))
      .unique();
    if (!existing) {
      const id = await ctx.db.insert("userRoles", {
        userId: user._id,
        role: "admin",
        createdAt: Date.now(),
      });
      await logMutation(ctx, {
        table: "userRoles",
        documentId: id,
        action: "grantTestAdmin",
        actorExternalAuthId: user.externalAuthId,
      });
    }
    return null;
  },
});
