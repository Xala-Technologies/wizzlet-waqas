import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const MIGRATION_VERSION = "1.0.0";

export const upsertCheckpoint = internalMutation({
  args: {
    table: v.string(),
    lastProcessedLegacyId: v.optional(v.string()),
    processedCount: v.number(),
    successCount: v.number(),
    failureCount: v.number(),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("migrationCheckpoints")
      .withIndex("by_table", (q) => q.eq("table", args.table))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        lastProcessedLegacyId: args.lastProcessedLegacyId,
        processedCount: args.processedCount,
        successCount: args.successCount,
        failureCount: args.failureCount,
        updatedAt: now,
        completedAt: args.completed ? now : existing.completedAt,
      });
      return existing._id;
    }
    return ctx.db.insert("migrationCheckpoints", {
      table: args.table,
      lastProcessedLegacyId: args.lastProcessedLegacyId,
      processedCount: args.processedCount,
      successCount: args.successCount,
      failureCount: args.failureCount,
      migrationVersion: MIGRATION_VERSION,
      startedAt: now,
      completedAt: args.completed ? now : undefined,
      updatedAt: now,
    });
  },
});

export const upsertUserByLegacy = internalMutation({
  args: {
    legacyId: v.string(),
    externalAuthId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    username: v.optional(v.string()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        externalAuthId: args.externalAuthId,
        email: args.email,
        fullName: args.fullName,
        username: args.username,
        updatedAt: now,
      });
      return existing._id;
    }
    return ctx.db.insert("users", {
      legacyId: args.legacyId,
      externalAuthId: args.externalAuthId,
      email: args.email,
      fullName: args.fullName,
      username: args.username,
      createdAt: args.createdAt,
      updatedAt: now,
    });
  },
});

export const upsertRoleByLegacy = internalMutation({
  args: {
    legacyId: v.string(),
    userLegacyId: v.string(),
    role: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.userLegacyId))
      .unique();
    if (!user) throw new Error(`Missing user legacy ${args.userLegacyId}`);
    const existing = await ctx.db
      .query("userRoles")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
      .unique();
    if (existing) return existing._id;
    const byPair = await ctx.db
      .query("userRoles")
      .withIndex("by_userId_role", (q) =>
        q.eq("userId", user._id).eq("role", args.role as any),
      )
      .unique();
    if (byPair) {
      await ctx.db.patch(byPair._id, { legacyId: args.legacyId });
      return byPair._id;
    }
    return ctx.db.insert("userRoles", {
      legacyId: args.legacyId,
      userId: user._id,
      role: args.role as any,
      createdAt: args.createdAt,
    });
  },
});

export const upsertCreatorByLegacy = internalMutation({
  args: {
    legacyId: v.string(),
    userLegacyId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    bannerUrl: v.optional(v.string()),
    monthlyPriceCents: v.optional(v.number()),
    stripeAccountId: v.optional(v.string()),
    isPublished: v.boolean(),
    referralCode: v.optional(v.string()),
    messagingEnabled: v.boolean(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.userLegacyId))
      .unique();
    if (!user) throw new Error(`Missing user legacy ${args.userLegacyId}`);
    const existing = await ctx.db
      .query("creators")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
      .unique();
    const now = Date.now();
    const fields = {
      userId: user._id,
      username: args.username,
      displayName: args.displayName,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      bannerUrl: args.bannerUrl,
      monthlyPriceCents: args.monthlyPriceCents,
      stripeAccountId: args.stripeAccountId,
      isPublished: args.isPublished,
      referralCode: args.referralCode,
      messagingEnabled: args.messagingEnabled,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return ctx.db.insert("creators", {
      legacyId: args.legacyId,
      ...fields,
      createdAt: args.createdAt,
    });
  },
});

export const upsertSubscriptionByLegacy = internalMutation({
  args: {
    legacyId: v.string(),
    userLegacyId: v.string(),
    creatorLegacyId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.string(),
    amountCents: v.number(),
    platformFeeCents: v.number(),
    creatorEarningsCents: v.number(),
    feePercentage: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.userLegacyId))
      .unique();
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.creatorLegacyId))
      .unique();
    if (!user || !creator) throw new Error("Missing FK for subscription");
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_legacyId", (q) => q.eq("legacyId", args.legacyId))
      .unique();
    const now = Date.now();
    const fields = {
      userId: user._id,
      creatorId: creator._id,
      stripeSubscriptionId: args.stripeSubscriptionId,
      status: args.status,
      amountCents: args.amountCents,
      platformFeeCents: args.platformFeeCents,
      creatorEarningsCents: args.creatorEarningsCents,
      feePercentage: args.feePercentage,
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, fields);
      return existing._id;
    }
    return ctx.db.insert("subscriptions", {
      legacyId: args.legacyId,
      ...fields,
      createdAt: args.createdAt,
    });
  },
});

export const countTable = internalMutation({
  args: { table: v.string() },
  handler: async (ctx, args) => {
    // Used by validate scripts via admin queries instead when possible.
    const map: Record<string, () => Promise<number>> = {
      users: async () => (await ctx.db.query("users").collect()).length,
      creators: async () => (await ctx.db.query("creators").collect()).length,
      subscriptions: async () => (await ctx.db.query("subscriptions").collect()).length,
      posts: async () => (await ctx.db.query("posts").collect()).length,
    };
    const fn = map[args.table];
    if (!fn) return -1;
    return fn();
  },
});
