import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCreatorForUser, requireAppUser, requireCreatorOwner } from "../lib/auth";

export const listMyLinks = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("creatorLinks")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const upsertLink = mutation({
  args: {
    linkId: v.optional(v.id("creatorLinks")),
    name: v.string(),
    url: v.string(),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    await requireCreatorOwner(ctx, creator._id);
    const now = Date.now();
    if (args.linkId) {
      const existing = await ctx.db.get(args.linkId);
      if (!existing || existing.creatorId !== creator._id) {
        throw new Error("FORBIDDEN");
      }
      await ctx.db.patch(args.linkId, {
        name: args.name,
        url: args.url,
        slug: args.slug,
        updatedAt: now,
      });
      return args.linkId;
    }
    return ctx.db.insert("creatorLinks", {
      creatorId: creator._id,
      name: args.name,
      url: args.url,
      slug: args.slug,
      clicks: 0,
      conversions: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeLink = mutation({
  args: { linkId: v.id("creatorLinks") },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("NOT_FOUND");
    await requireCreatorOwner(ctx, link.creatorId);
    await ctx.db.delete(args.linkId);
  },
});

export const recordLinkClick = mutation({
  args: { linkId: v.id("creatorLinks") },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("NOT_FOUND");
    await ctx.db.patch(args.linkId, {
      clicks: link.clicks + 1,
      updatedAt: Date.now(),
    });
  },
});

export const listMyPromos = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("promoCodes")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const upsertPromo = mutation({
  args: {
    promoId: v.optional(v.id("promoCodes")),
    code: v.string(),
    discountPercent: v.number(),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    isActive: v.boolean(),
  },
  handler: async (_ctx, _args) => {
    // Checkout does not apply promos yet — block commercial claims.
    throw new Error("PROMO_UNAVAILABLE");
  },
});

export const removePromo = mutation({
  args: { promoId: v.id("promoCodes") },
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.promoId);
    if (!promo) throw new Error("NOT_FOUND");
    await requireCreatorOwner(ctx, promo.creatorId);
    await ctx.db.delete(args.promoId);
  },
});

export const listMyReferrals = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("referrals")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

/** Referral tracking only — no commission until checkout applies referrals. */
export const recordReferral = mutation({
  args: {
    creatorId: v.id("creators"),
    referredEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const now = Date.now();
    return ctx.db.insert("referrals", {
      creatorId: args.creatorId,
      referredUserId: user._id,
      referredEmail: args.referredEmail,
      converted: false,
      commissionEarnedCents: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});
