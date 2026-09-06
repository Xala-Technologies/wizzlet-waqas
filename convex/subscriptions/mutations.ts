import { internalMutation, mutation, query, type MutationCtx } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import {
  getCreatorForUser,
  logMutation,
  requireAdmin,
  requireAppUser,
} from "../lib/auth";
import { calculatePlatformFee } from "../lib/money";
import { assertSubscriptionStatusTransition } from "../lib/subscriptions";
import {
  subscriptionDocValidator,
  subscriptionWithCreatorValidator,
  subscriptionWithUserValidator,
} from "../lib/validators";
import { adminTakeNewest } from "../lib/adminLists";

async function loadFeeSettings(ctx: MutationCtx) {
  const row = await ctx.db
    .query("platformSettings")
    .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
    .unique();
  return {
    introFeePercent: row?.introFeePercent ?? 5,
    standardFeePercent: row?.standardFeePercent ?? 10,
    introFeeDays: row?.introFeeDays ?? 90,
  };
}

/**
 * Trusted payment / webhook path only — not callable from the client.
 */
export const createSubscriptionRecord = internalMutation({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    amountCents: v.number(),
    stripeSubscriptionId: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("incomplete"),
    ),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    const settings = await loadFeeSettings(ctx);
    const split = calculatePlatformFee(args.amountCents, creator.createdAt, settings);
    const now = Date.now();
    const id = await ctx.db.insert("subscriptions", {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: args.productId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      status: args.status,
      amountCents: args.amountCents,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      feePercentage: split.feePercentage,
      createdAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "subscriptions",
      documentId: id,
      action: "create",
    });
    return id;
  },
});

export const mySubscriptions = query({
  args: {},
  returns: v.array(subscriptionDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
  },
});

/** Public active subscriber count for creator profiles. */
export const countActiveByCreator = query({
  args: { creatorId: v.id("creators") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator || !creator.isPublished) return 0;
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();
    return subs.filter((s) => s.status === "active").length;
  },
});

/** Subscriptions with creator details for billing / dashboard. */
export const mySubscriptionsDetailed = query({
  args: {},
  returns: v.array(subscriptionWithCreatorValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    const out = [];
    for (const s of subs) {
      const creator = await ctx.db.get(s.creatorId);
      if (!creator) continue;
      out.push({
        ...s,
        creator: {
          _id: creator._id,
          username: creator.username,
          displayName: creator.displayName,
          avatarUrl: creator.avatarUrl,
          monthlyPriceCents: creator.monthlyPriceCents,
          messagingEnabled: creator.messagingEnabled,
        },
      });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/** Creator view: subscribers with user profile. */
export const listSubscribersDetailed = query({
  args: {},
  returns: v.array(subscriptionWithUserValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
    const out = [];
    for (const s of subs) {
      const u = await ctx.db.get(s.userId);
      out.push({
        ...s,
        user: u
          ? { _id: u._id, email: u.email, fullName: u.fullName, username: u.username }
          : null,
      });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listForMyCreator = query({
  args: {},
  returns: v.array(subscriptionDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("subscriptions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const listAllAdmin = query({
  args: {},
  returns: v.array(subscriptionDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return adminTakeNewest(ctx, "subscriptions");
  },
});

export const setStatus = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    status: v.union(
      v.literal("active"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("incomplete"),
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Public invent-billing blocked: only admins may set status here.
    // Subscribers cancel via cancelCreatorSubscription (Stripe-backed).
    await requireAdmin(ctx);
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) throw new ConvexError("NOT_FOUND");
    assertSubscriptionStatusTransition("admin", args.status);
    await ctx.db.patch(args.subscriptionId, {
      status: args.status,
      billingStatus: args.status === "cancelled" ? "canceled" : args.status,
      updatedAt: Date.now(),
    });
    return null;
  },
});
