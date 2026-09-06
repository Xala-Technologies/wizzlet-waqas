import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser, logMutation } from "../lib/auth";

export const listSavedPosts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("savedPosts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const toggleSavedPost = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId_postId", (q) => q.eq("userId", user._id).eq("postId", args.postId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    const id = await ctx.db.insert("savedPosts", {
      userId: user._id,
      postId: args.postId,
      createdAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "savedPosts",
      documentId: id,
      action: "toggle",
      actorExternalAuthId: user.externalAuthId,
    });
    return { saved: true };
  },
});

export const listCreatorBookmarks = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("creatorBookmarks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const toggleCreatorBookmark = mutation({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await ctx.db
      .query("creatorBookmarks")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", user._id).eq("creatorId", args.creatorId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { bookmarked: false };
    }
    const id = await ctx.db.insert("creatorBookmarks", {
      userId: user._id,
      creatorId: args.creatorId,
      createdAt: Date.now(),
    });
    await logMutation(ctx, {
      table: "creatorBookmarks",
      documentId: id,
      action: "toggle",
      actorExternalAuthId: user.externalAuthId,
    });
    return { bookmarked: true };
  },
});
