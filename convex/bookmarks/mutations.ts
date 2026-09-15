import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser, logMutation } from "../lib/auth";
import { creatorBookmarkDocValidator, savedPostDocValidator } from "../lib/validators";

export const listSavedPosts = query({
  args: {},
  returns: v.array(savedPostDocValidator),
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
  returns: v.object({ saved: v.boolean() }),
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
  returns: v.array(creatorBookmarkDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("creatorBookmarks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/** Bookmarks joined to creator docs by id (not discover page slice). */
export const listCreatorBookmarksDetailed = query({
  args: {},
  returns: v.array(
    v.object({
      bookmarkId: v.id("creatorBookmarks"),
      createdAt: v.number(),
      creator: v.object({
        _id: v.id("creators"),
        username: v.string(),
        displayName: v.optional(v.string()),
        bio: v.optional(v.string()),
        monthlyPriceCents: v.optional(v.number()),
        isPublished: v.boolean(),
      }),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const rows = await ctx.db
      .query("creatorBookmarks")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const row of rows) {
      const creator = await ctx.db.get(row.creatorId);
      if (!creator) continue;
      out.push({
        bookmarkId: row._id,
        createdAt: row.createdAt,
        creator: {
          _id: creator._id,
          username: creator.username,
          displayName: creator.displayName,
          bio: creator.bio,
          monthlyPriceCents: creator.monthlyPriceCents,
          isPublished: creator.isPublished,
        },
      });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const toggleCreatorBookmark = mutation({
  args: { creatorId: v.id("creators") },
  returns: v.object({ bookmarked: v.boolean() }),
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
