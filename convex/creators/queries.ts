import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import {
  getCreatorForUser,
  logMutation,
  requireAppUser,
  requireCreatorOwner,
  requireAdmin,
} from "../lib/auth";

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (!creator || !creator.isPublished) return null;
    // Public projection — omit stripe/discord internals
    return {
      _id: creator._id,
      username: creator.username,
      displayName: creator.displayName,
      bio: creator.bio,
      avatarUrl: creator.avatarUrl,
      bannerUrl: creator.bannerUrl,
      monthlyPriceCents: creator.monthlyPriceCents,
      isPublished: creator.isPublished,
      messagingEnabled: creator.messagingEnabled,
      verificationStatus: creator.verificationStatus ?? "none",
      createdAt: creator.createdAt,
    };
  },
});

/** Public discovery — published creators only (no mock list). */
export const listPublished = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("creators")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .collect();
    const q = args.search?.trim().toLowerCase();
    const filtered = q
      ? rows.filter(
          (c) =>
            c.username.toLowerCase().includes(q) ||
            (c.displayName ?? "").toLowerCase().includes(q) ||
            (c.bio ?? "").toLowerCase().includes(q),
        )
      : rows;
    const mapped = [];
    for (const c of filtered.sort((a, b) => b.createdAt - a.createdAt)) {
      const posts = await ctx.db
        .query("posts")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
        .collect();
      mapped.push({
        _id: c._id,
        username: c.username,
        displayName: c.displayName,
        bio: c.bio,
        avatarUrl: c.avatarUrl,
        monthlyPriceCents: c.monthlyPriceCents,
        verificationStatus: c.verificationStatus ?? "none",
        createdAt: c.createdAt,
        postCount: posts.length,
      });
    }
    return mapped;
  },
});

export const myCreator = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return getCreatorForUser(ctx, user._id);
  },
});

export const upsertOnboarding = mutation({
  args: {
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    monthlyPriceCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await getCreatorForUser(ctx, user._id);
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
        bio: args.bio,
        avatarUrl: args.avatarUrl,
        bannerUrl: args.bannerUrl,
        monthlyPriceCents: args.monthlyPriceCents,
        updatedAt: now,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("creators", {
      userId: user._id,
      username: args.username,
      displayName: args.displayName,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      bannerUrl: args.bannerUrl,
      monthlyPriceCents: args.monthlyPriceCents,
      isPublished: false,
      messagingEnabled: true,
      createdAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "creators",
      documentId: id,
      action: "upsertOnboarding",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
  },
});

export const setPublished = mutation({
  args: { creatorId: v.id("creators"), isPublished: v.boolean() },
  handler: async (ctx, args) => {
    await requireCreatorOwner(ctx, args.creatorId);
    await ctx.db.patch(args.creatorId, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
  },
});

export const listAllAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("creators").collect();
  },
});

export const updateSettings = mutation({
  args: {
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    monthlyPriceCents: v.optional(v.number()),
    messagingEnabled: v.optional(v.boolean()),
    referralCode: v.optional(v.string()),
    discordServerId: v.optional(v.string()),
    discordRoleId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    const patch: Record<string, string | number | boolean | undefined> = {
      updatedAt: Date.now(),
    };
    if (args.displayName !== undefined) patch.displayName = args.displayName;
    if (args.bio !== undefined) patch.bio = args.bio;
    if (args.avatarUrl !== undefined) patch.avatarUrl = args.avatarUrl;
    if (args.bannerUrl !== undefined) patch.bannerUrl = args.bannerUrl;
    if (args.monthlyPriceCents !== undefined) patch.monthlyPriceCents = args.monthlyPriceCents;
    if (args.messagingEnabled !== undefined) patch.messagingEnabled = args.messagingEnabled;
    if (args.referralCode !== undefined) patch.referralCode = args.referralCode;
    if (args.discordServerId !== undefined) patch.discordServerId = args.discordServerId;
    if (args.discordRoleId !== undefined) patch.discordRoleId = args.discordRoleId;
    await ctx.db.patch(creator._id, patch);
    return creator._id;
  },
});
