import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAdmin, requireAppUser } from "../lib/auth";
import { normalizeReferralCommissionPercent } from "../lib/referralCommission";
import { platformSettingsDocValidator } from "../lib/validators";

export const get = query({
  args: {},
  returns: v.union(platformSettingsDocValidator, v.null()),
  handler: async (ctx) => {
    await requireAppUser(ctx);
    return ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
  },
});

export const upsert = mutation({
  args: {
    introFeePercent: v.number(),
    standardFeePercent: v.number(),
    introFeeDays: v.number(),
    referralCommissionPercent: v.optional(v.number()),
    branding: v.optional(v.any()),
    payoutDefaults: v.optional(v.any()),
    featureFlags: v.optional(v.any()),
  },
  returns: v.id("platformSettings"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (
      args.referralCommissionPercent !== undefined &&
      (!Number.isFinite(args.referralCommissionPercent) ||
        args.referralCommissionPercent < 0 ||
        args.referralCommissionPercent > 100)
    ) {
      throw new ConvexError("INVALID_REFERRAL_COMMISSION");
    }
    const referralCommissionPercent =
      args.referralCommissionPercent === undefined
        ? undefined
        : normalizeReferralCommissionPercent(args.referralCommissionPercent);
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    const now = Date.now();
    const patch = {
      introFeePercent: args.introFeePercent,
      standardFeePercent: args.standardFeePercent,
      introFeeDays: args.introFeeDays,
      branding: args.branding,
      payoutDefaults: args.payoutDefaults,
      featureFlags: args.featureFlags,
      ...(referralCommissionPercent !== undefined
        ? { referralCommissionPercent }
        : {}),
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, patch);
      return existing._id;
    }
    return ctx.db.insert("platformSettings", {
      singletonKey: "default",
      introFeePercent: args.introFeePercent,
      standardFeePercent: args.standardFeePercent,
      introFeeDays: args.introFeeDays,
      referralCommissionPercent:
        referralCommissionPercent ?? normalizeReferralCommissionPercent(undefined),
      branding: args.branding,
      payoutDefaults: args.payoutDefaults,
      featureFlags: args.featureFlags,
      updatedAt: now,
    });
  },
});
