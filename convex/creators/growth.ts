import { internalMutation, internalQuery, mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import {
  getCreatorForUser,
  logMutation,
  requireAdmin,
  requireAppUser,
  requireCreatorOwner,
} from "../lib/auth";
import {
  isPromoRedeemable,
  isValidDiscountDuration,
  isValidDiscountPercent,
  isValidPromoCodeFormat,
  normalizePromoCode,
  resolveDiscountDuration,
} from "../lib/promoCodes";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";
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
      .take(ADMIN_SCAN_MAX_DOCS);
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

/** Public destination lookup for `/go/:linkId` tracking redirects. */
export const getLinkPublic = query({
  args: { linkId: v.id("creatorLinks") },
  returns: v.union(
    v.object({
      url: v.string(),
      name: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) return null;
    return { url: link.url, name: link.name };
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
      .take(ADMIN_SCAN_MAX_DOCS);
  },
});

export const upsertPromo = mutation({
  args: {
    promoId: v.optional(v.id("promoCodes")),
    code: v.string(),
    discountPercent: v.number(),
    discountDuration: v.optional(
      v.union(v.literal("once"), v.literal("forever")),
    ),
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
    const discountDuration = args.discountDuration ?? "once";
    if (!isValidDiscountDuration(discountDuration)) {
      throw new ConvexError("INVALID_DURATION");
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
        discountDuration,
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
      discountDuration,
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
      discountDuration: v.union(v.literal("once"), v.literal("forever")),
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
      discountDuration: resolveDiscountDuration(promo),
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
      .take(ADMIN_SCAN_MAX_DOCS);
  },
});

/**
 * Attribute signup via creator referral code (`?ref=`).
 * Tracks referral row; commission accrues on paid convert via growthAttribution.
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
      .take(ADMIN_SCAN_MAX_DOCS);
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
      .take(ADMIN_SCAN_MAX_DOCS);
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

const unpaidCommissionRowValidator = v.object({
  _id: v.id("referrals"),
  creatorId: v.id("creators"),
  creatorName: v.string(),
  referredEmail: v.union(v.string(), v.null()),
  commissionEarnedCents: v.number(),
  createdAt: v.number(),
  convertedAt: v.number(),
  stripeAccountId: v.union(v.string(), v.null()),
});

/** Admin: accrued referral commissions not yet marked paid in the ledger. */
export const listUnpaidCommissionsAdmin = query({
  args: {},
  returns: v.array(unpaidCommissionRowValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const recent = await ctx.db.query("referrals").order("desc").take(200);
    const unpaid = recent.filter(
      (r) =>
        r.converted &&
        r.commissionEarnedCents > 0 &&
        (r.commissionPaidAt === undefined || r.commissionPaidAt === null),
    );
    return Promise.all(
      unpaid.map(async (row) => {
        const creator = await ctx.db.get(row.creatorId);
        return {
          _id: row._id,
          creatorId: row.creatorId,
          creatorName: creator?.displayName ?? creator?.username ?? "Creator",
          referredEmail: row.referredEmail ?? null,
          commissionEarnedCents: row.commissionEarnedCents,
          createdAt: row.createdAt,
          convertedAt: row.updatedAt,
          stripeAccountId: creator?.stripeAccountId ?? null,
        };
      }),
    );
  },
});

/**
 * Admin: mark referral commission paid in the Prizelet ledger only.
 * Prefer sendReferralCommissionConnect so cash actually moves on Stripe.
 */
export const markCommissionPaidAdmin = mutation({
  args: {
    referralId: v.id("referrals"),
  },
  returns: v.object({
    commissionPaidCents: v.number(),
    commissionPaidAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const row = await ctx.db.get(args.referralId);
    if (!row) throw new ConvexError("NOT_FOUND");
    if (!row.converted || row.commissionEarnedCents <= 0) {
      throw new ConvexError("NOTHING_TO_PAY");
    }
    if (row.commissionPaidAt != null) {
      throw new ConvexError("ALREADY_PAID");
    }
    const now = Date.now();
    const commissionPaidCents = row.commissionEarnedCents;
    await ctx.db.patch(row._id, {
      commissionPaidCents,
      commissionPaidAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "referrals",
      documentId: row._id,
      action: "markCommissionPaidAdmin",
      actorExternalAuthId: admin.externalAuthId,
    });
    return { commissionPaidCents, commissionPaidAt: now };
  },
});

export const getReferralConnectContext = internalQuery({
  args: { referralId: v.id("referrals") },
  returns: v.object({
    referralId: v.id("referrals"),
    creatorId: v.id("creators"),
    amountCents: v.number(),
    commissionPaidAt: v.optional(v.number()),
    commissionTransferId: v.optional(v.string()),
    stripeAccountId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.referralId);
    if (!row) throw new ConvexError("NOT_FOUND");
    if (!row.converted || row.commissionEarnedCents <= 0) {
      throw new ConvexError("NOTHING_TO_PAY");
    }
    const creator = await ctx.db.get(row.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    return {
      referralId: row._id,
      creatorId: creator._id,
      amountCents: row.commissionEarnedCents,
      commissionPaidAt: row.commissionPaidAt,
      commissionTransferId: row.commissionTransferId,
      stripeAccountId: creator.stripeAccountId,
    };
  },
});

export const recordReferralConnectTransfer = internalMutation({
  args: {
    referralId: v.id("referrals"),
    transferId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.referralId);
    if (!row) throw new ConvexError("NOT_FOUND");
    if (row.commissionTransferId === args.transferId && row.commissionPaidAt != null) {
      return null;
    }
    if (row.commissionPaidAt != null) {
      throw new ConvexError("ALREADY_PAID");
    }
    const now = Date.now();
    await ctx.db.patch(row._id, {
      commissionPaidCents: row.commissionEarnedCents,
      commissionPaidAt: now,
      commissionTransferId: args.transferId,
      updatedAt: now,
    });
    return null;
  },
});
