import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAdmin, requireAppUser, logMutation } from "../lib/auth";
import { notificationDocValidator } from "../lib/validators";

/** Bounded list for secondary callers; prefer listMinePage for the Notifications UI. */
export const listMine = query({
  args: {},
  returns: v.array(notificationDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(200);
  },
});

export const listMinePage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(notificationDocValidator),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const unreadCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const row = await ctx.db.get(args.notificationId);
    if (!row || row.userId !== user._id) throw new ConvexError("FORBIDDEN");
    await ctx.db.patch(args.notificationId, { read: true });
    return null;
  },
});

export const markAllRead = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_read", (q) => q.eq("userId", user._id).eq("read", false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { read: true });
    }
    return null;
  },
});

/** Admin-only insert — hardening parity with RLS. */
export const adminInsert = mutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    link: v.optional(v.string()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const id = await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      description: args.description,
      read: false,
      link: args.link,
      createdAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "notifications",
      documentId: id,
      action: "adminInsert",
      actorExternalAuthId: admin.externalAuthId,
    });
    return id;
  },
});
