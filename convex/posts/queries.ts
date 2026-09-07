import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  getCreatorForUser,
  hasActiveSubscription,
  requireAppUser,
  requireCreatorOwner,
  logMutation,
} from "../lib/auth";
import { canViewPostContent, redactPostContent } from "../lib/entitlements";
import { normalizePickResult } from "../lib/results";
import type { Id } from "../_generated/dataModel";
import {
  memberFeedItemValidator,
  postDocValidator,
  postPreviewValidator,
  savedPostDetailedValidator,
} from "../lib/validators";

export const listPreviewsByCreator = query({
  args: { creatorId: v.id("creators") },
  returns: v.array(postPreviewValidator),
  handler: async (ctx, args) => {
    const viewerUserId = await getAuthUserId(ctx);
    const posts = await ctx.db
      .query("posts")
      .withIndex("by_creatorId_createdAt", (q) => q.eq("creatorId", args.creatorId))
      .order("desc")
      .collect();

    const out = [];
    for (const post of posts) {
      const allowed = await canViewPostContent(ctx, post, viewerUserId);
      const redacted = redactPostContent(post, allowed);
      out.push({
        _id: redacted._id,
        title: redacted.title,
        content: redacted.content ?? null,
        isPremium: redacted.isPremium,
        result: redacted.result,
        createdAt: redacted.createdAt,
      });
    }
    return out;
  },
});

/** Creator's own posts (full content). */
export const listMine = query({
  args: {},
  returns: v.array(postDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("posts")
      .withIndex("by_creatorId_createdAt", (q) => q.eq("creatorId", creator._id))
      .order("desc")
      .collect();
  },
});

/** Member feed: posts from creators the user actively subscribes to. */
export const memberFeed = query({
  args: {},
  returns: v.array(memberFeedItemValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const activeCreatorIds = subs.filter((s) => s.status === "active").map((s) => s.creatorId);
    const out: Array<{
      _id: Id<"posts">;
      title: string;
      content: string | null;
      isPremium: boolean;
      result: "pending" | "won" | "lost" | "push" | undefined;
      createdAt: number;
      creator: {
        username: string;
        displayName: string | undefined;
        avatarUrl: string | undefined;
      };
    }> = [];

    for (const creatorId of activeCreatorIds) {
      const creator = await ctx.db.get(creatorId);
      if (!creator) continue;
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_creatorId_createdAt", (q) => q.eq("creatorId", creatorId))
        .order("desc")
        .take(50);
      for (const post of posts) {
        const allowed = await canViewPostContent(ctx, post, user._id);
        const redacted = redactPostContent(post, allowed);
        out.push({
          _id: redacted._id,
          title: redacted.title,
          content: redacted.content ?? null,
          isPremium: redacted.isPremium,
          result: redacted.result,
          createdAt: redacted.createdAt,
          creator: {
            username: creator.username,
            displayName: creator.displayName,
            avatarUrl: creator.avatarUrl,
          },
        });
      }
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const upsert = mutation({
  args: {
    postId: v.optional(v.id("posts")),
    creatorId: v.id("creators"),
    title: v.string(),
    content: v.optional(v.string()),
    isPremium: v.boolean(),
    result: v.optional(v.string()),
    trackingMode: v.optional(v.string()),
  },
  returns: v.id("posts"),
  handler: async (ctx, args) => {
    const { user } = await requireCreatorOwner(ctx, args.creatorId);
    const now = Date.now();
    const result = args.result !== undefined ? normalizePickResult(args.result) : undefined;
    if (args.postId) {
      const existing = await ctx.db.get(args.postId);
      if (!existing || existing.creatorId !== args.creatorId) throw new Error("NOT_FOUND");
      await ctx.db.patch(args.postId, {
        title: args.title,
        content: args.content,
        isPremium: args.isPremium,
        result,
        trackingMode: args.trackingMode,
        updatedAt: now,
      });
      return args.postId;
    }
    const id = await ctx.db.insert("posts", {
      creatorId: args.creatorId,
      title: args.title,
      content: args.content,
      isPremium: args.isPremium,
      result,
      trackingMode: args.trackingMode,
      createdAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "posts",
      documentId: id,
      action: "upsert",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
  },
});

export const setResult = mutation({
  args: {
    postId: v.id("posts"),
    result: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("NOT_FOUND");
    await requireCreatorOwner(ctx, post.creatorId);
    await ctx.db.patch(args.postId, {
      result: normalizePickResult(args.result),
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { postId: v.id("posts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("NOT_FOUND");
    await requireCreatorOwner(ctx, post.creatorId);
    await ctx.db.delete(args.postId);
    return null;
  },
});

/** Saved posts with joined post + creator for library UI. */
export const listSavedDetailed = query({
  args: {},
  returns: v.array(savedPostDetailedValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const saved = await ctx.db
      .query("savedPosts")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const s of saved) {
      const post = await ctx.db.get(s.postId);
      if (!post) continue;
      const creator = await ctx.db.get(post.creatorId);
      if (!creator) continue;
      const allowed =
        !post.isPremium ||
        creator.userId === user._id ||
        (await hasActiveSubscription(ctx, user._id, creator._id));
      out.push({
        savedId: s._id,
        savedAt: s.createdAt,
        post: {
          _id: post._id,
          title: post.title,
          content: allowed ? (post.content ?? null) : null,
          isPremium: post.isPremium,
          result: post.result,
          createdAt: post.createdAt,
        },
        creator: {
          _id: creator._id,
          username: creator.username,
          displayName: creator.displayName,
          avatarUrl: creator.avatarUrl,
        },
      });
    }
    return out;
  },
});
