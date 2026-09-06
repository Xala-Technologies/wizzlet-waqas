import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCreatorForUser, requireAppUser, requireAdmin } from "../lib/auth";

export const track = mutation({
  args: {
    eventType: v.string(),
    creatorId: v.optional(v.id("creators")),
    postId: v.optional(v.id("posts")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Soft-no-op when signed out (e.g. late track during signOut).
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    await ctx.db.insert("analyticsEvents", {
      userId: user._id,
      creatorId: args.creatorId,
      postId: args.postId,
      eventType: args.eventType,
      createdAt: Date.now(),
    });
    return null;
  },
});

/** Member activity feed with joined post + creator. */
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const events = (await ctx.db
      .query("analyticsEvents")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);
    const out = [];
    for (const event of events) {
      if (!event.postId) continue;
      const post = await ctx.db.get(event.postId);
      if (!post) continue;
      const creator = await ctx.db.get(post.creatorId);
      out.push({
        _id: event._id,
        eventType: event.eventType,
        createdAt: event.createdAt,
        post: {
          _id: post._id,
          title: post.title,
          creator: creator
            ? {
                username: creator.username,
                displayName: creator.displayName,
              }
            : null,
        },
      });
    }
    return out;
  },
});

export const listForMyCreator = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("analyticsEvents")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const listAllAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("analyticsEvents").collect();
  },
});
