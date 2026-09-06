import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import {
  getCreatorForUser,
  logMutation,
  requireAppUser,
  requireCreatorOwner,
  requireAdmin,
} from "../lib/auth";
import {
  creatorDocValidator,
  creatorPublicValidator,
  creatorPublishedPageValidator,
} from "../lib/validators";

export const getByUsername = query({
  args: { username: v.string() },
  returns: v.union(creatorPublicValidator, v.null()),
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

/** Public discovery — published creators only (no mock list). Paginated. */
export const listPublished = query({
  args: {
    search: v.optional(v.string()),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: creatorPublishedPageValidator,
  handler: async (ctx, args) => {
    const pageSize = Math.min(Math.max(args.limit ?? 24, 1), 50);
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
    const sorted = filtered.sort((a, b) => b.createdAt - a.createdAt);
    let start = 0;
    if (args.cursor) {
      const idx = sorted.findIndex((c) => c._id === args.cursor);
      start = idx >= 0 ? idx + 1 : 0;
    }
    const page = sorted.slice(start, start + pageSize);
    const mapped = [];
    for (const c of page) {
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
    const last = page[page.length - 1];
    return {
      items: mapped,
      continueCursor: last && start + pageSize < sorted.length ? last._id : null,
      isDone: start + pageSize >= sorted.length,
    };
  },
});

export const myCreator = query({
  args: {},
  returns: v.union(creatorDocValidator, v.null()),
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
  returns: v.id("creators"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const username = args.username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(username)) {
      throw new Error("INVALID_USERNAME");
    }
    const taken = await ctx.db
      .query("creators")
      .withIndex("by_username", (q) => q.eq("username", username))
      .unique();
    const existing = await getCreatorForUser(ctx, user._id);
    if (taken && (!existing || taken._id !== existing._id)) {
      throw new Error("USERNAME_TAKEN");
    }
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        username,
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
      username,
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireCreatorOwner(ctx, args.creatorId);
    await ctx.db.patch(args.creatorId, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const listAllAdmin = query({
  args: {},
  returns: v.array(creatorDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("creators").collect();
  },
});

export const updateSettings = mutation({
  args: {
    displayName: v.optional(v.union(v.string(), v.null())),
    bio: v.optional(v.union(v.string(), v.null())),
    avatarUrl: v.optional(v.union(v.string(), v.null())),
    bannerUrl: v.optional(v.union(v.string(), v.null())),
    monthlyPriceCents: v.optional(v.number()),
    messagingEnabled: v.optional(v.boolean()),
    referralCode: v.optional(v.union(v.string(), v.null())),
    discordServerId: v.optional(v.union(v.string(), v.null())),
    discordRoleId: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.id("creators"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    // null clears; undefined omits (leave unchanged)
    const patch: Record<string, string | number | boolean | undefined> = {
      updatedAt: Date.now(),
    };
    if (args.displayName !== undefined) {
      patch.displayName = args.displayName === null ? undefined : args.displayName;
    }
    if (args.bio !== undefined) {
      patch.bio = args.bio === null ? undefined : args.bio;
    }
    if (args.avatarUrl !== undefined) {
      patch.avatarUrl = args.avatarUrl === null ? undefined : args.avatarUrl;
    }
    if (args.bannerUrl !== undefined) {
      patch.bannerUrl = args.bannerUrl === null ? undefined : args.bannerUrl;
    }
    if (args.monthlyPriceCents !== undefined) patch.monthlyPriceCents = args.monthlyPriceCents;
    if (args.messagingEnabled !== undefined) patch.messagingEnabled = args.messagingEnabled;
    if (args.referralCode !== undefined) {
      patch.referralCode = args.referralCode === null ? undefined : args.referralCode;
    }
    if (args.discordServerId !== undefined) {
      patch.discordServerId = args.discordServerId === null ? undefined : args.discordServerId;
    }
    if (args.discordRoleId !== undefined) {
      patch.discordRoleId = args.discordRoleId === null ? undefined : args.discordRoleId;
    }
    await ctx.db.patch(creator._id, patch);
    return creator._id;
  },
});
