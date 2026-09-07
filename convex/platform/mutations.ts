import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin, requireAppUser } from "../lib/auth";
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
    branding: v.optional(v.any()),
    payoutDefaults: v.optional(v.any()),
    featureFlags: v.optional(v.any()),
  },
  returns: v.id("platformSettings"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("platformSettings", {
      singletonKey: "default",
      ...args,
      updatedAt: now,
    });
  },
});
