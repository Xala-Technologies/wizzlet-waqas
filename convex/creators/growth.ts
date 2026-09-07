import { internalQuery, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getCreatorForUser, requireAppUser, requireCreatorOwner } from "../lib/auth";
import {
  isPromoRedeemable,
  isValidDiscountPercent,
  isValidPromoCodeFormat,
  normalizePromoCode,
} from "../lib/promoCodes";
import {
  creatorLinkDocValidator,
  promoCodeDocValidator,
  referralDocValidator,
} from "../lib/validators";

export const listMyLinks = query({
  args: {},
  returns: v.array(creatorLinkDocValidator),
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
  returns: v.id("creatorLinks"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, creator._id);
    const now = Date.now();
    if (args.linkId) {
      const existing = await ctx.db.get(args.linkId);
      if (!existing || existing.creatorId !== creator._id) {
        throw new ConvexError("FORBIDDEN");
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, link.creatorId);
    await ctx.db.delete(args.linkId);
    return null;
  },
});

export const recordLinkClick = mutation({
  args: { linkId: v.id("creatorLinks") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) throw new ConvexError("NOT_FOUND");
    await ctx.db.patch(args.linkId, {
      clicks: link.clicks + 1,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const listMyPromos = query({
  args: {},
  returns: v.array(promoCodeDocValidator),
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
  returns: v.id("promoCodes"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, creator._id);

    const code = normalizePromoCode(args.code);
    if (!isValidPromoCodeFormat(code)) {
      throw new ConvexError("INVALID_PROMO_CODE");
    }
    if (!isValidDiscountPercent(args.discountPercent)) {
      throw new ConvexError("INVALID_DISCOUNT");
    }
    if (
      args.maxUses !== undefined &&
      (!Number.isFinite(args.maxUses) || args.maxUses < 1)
    ) {
      throw new ConvexError("INVALID_MAX_USES");
    }

    const conflicting = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (conflicting && conflicting._id !== args.promoId) {
      throw new ConvexError("PROMO_CODE_TAKEN");
    }

    const now = Date.now();
    if (args.promoId) {
      const existing = await ctx.db.get(args.promoId);
      if (!existing || existing.creatorId !== creator._id) {
        throw new ConvexError("FORBIDDEN");
      }
      await ctx.db.patch(args.promoId, {
        code,
        discountPercent: args.discountPercent,
        maxUses: args.maxUses,
        expiresAt: args.expiresAt,
        isActive: args.isActive,
        updatedAt: now,
      });
      return args.promoId;
    }

    return ctx.db.insert("promoCodes", {
      creatorId: creator._id,
      code,
      discountPercent: args.discountPercent,
      maxUses: args.maxUses,
      usedCount: 0,
      expiresAt: args.expiresAt,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removePromo = mutation({
  args: { promoId: v.id("promoCodes") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const promo = await ctx.db.get(args.promoId);
    if (!promo) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, promo.creatorId);
    await ctx.db.delete(args.promoId);
    return null;
  },
});

/** Trusted checkout prep — validates an active promo for a creator. */
export const resolvePromoForCheckout = internalQuery({
  args: {
    creatorId: v.id("creators"),
    code: v.string(),
    nowMs: v.number(),
  },
  returns: v.union(
    v.object({
      promoId: v.id("promoCodes"),
      code: v.string(),
      discountPercent: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const code = normalizePromoCode(args.code);
    if (!code) return null;
    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!promo || promo.creatorId !== args.creatorId) return null;
    if (!isPromoRedeemable(promo, args.nowMs)) return null;
    return {
      promoId: promo._id,
      code: promo.code,
      discountPercent: promo.discountPercent,
    };
  },
});

export const listMyReferrals = query({
  args: {},
  returns: v.array(referralDocValidator),
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

/**
 * Attribute signup via creator referral code (`?ref=`).
 * Tracks referral row only — cash commission stays 0 until payouts productize it.
 */
export const recordReferralByCode = mutation({
  args: {
    code: v.string(),
    referredEmail: v.optional(v.string()),
  },
  returns: v.union(v.id("referrals"), v.null()),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const code = args.code.trim().toLowerCase();
    if (!code) return null;

    const creator = await ctx.db
      .query("creators")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", code))
      .unique();
    if (!creator) return null;
    if (creator.userId === user._id) {
      throw new ConvexError("SELF_REFERRAL");
    }

    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
    const prior = existing.find((r) => r.referredUserId === user._id);
    if (prior) return prior._id;

    const now = Date.now();
    return ctx.db.insert("referrals", {
      creatorId: creator._id,
      referredUserId: user._id,
      referredEmail: args.referredEmail ?? user.email,
      converted: false,
      commissionEarnedCents: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** @deprecated Prefer recordReferralByCode — kept for callers that already have creatorId. */
export const recordReferral = mutation({
  args: {
    creatorId: v.id("creators"),
    referredEmail: v.optional(v.string()),
  },
  returns: v.id("referrals"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    if (creator.userId === user._id) throw new ConvexError("SELF_REFERRAL");

    const existing = await ctx.db
      .query("referrals")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();
    const prior = existing.find((r) => r.referredUserId === user._id);
    if (prior) return prior._id;

    const now = Date.now();
    return ctx.db.insert("referrals", {
      creatorId: args.creatorId,
      referredUserId: user._id,
      referredEmail: args.referredEmail ?? user.email,
      converted: false,
      commissionEarnedCents: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});
