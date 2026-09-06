import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireCreatorOwner, requireAppUser, logMutation } from "../lib/auth";

export const listByCreator = query({
  args: { creatorId: v.id("creators"), activeOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();
    if (args.activeOnly) return rows.filter((p) => p.isActive);
    return rows;
  },
});

export const upsert = mutation({
  args: {
    productId: v.optional(v.id("products")),
    creatorId: v.id("creators"),
    name: v.string(),
    description: v.optional(v.string()),
    priceCents: v.number(),
    billingPeriod: v.string(),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    maxSpots: v.optional(v.number()),
    isLimited: v.boolean(),
    isClosed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireCreatorOwner(ctx, args.creatorId);
    const now = Date.now();
    if (args.productId) {
      const existing = await ctx.db.get(args.productId);
      if (!existing || existing.creatorId !== args.creatorId) throw new Error("NOT_FOUND");
      await ctx.db.patch(args.productId, {
        name: args.name,
        description: args.description,
        priceCents: args.priceCents,
        billingPeriod: args.billingPeriod,
        isFeatured: args.isFeatured,
        isActive: args.isActive,
        maxSpots: args.maxSpots,
        isLimited: args.isLimited,
        isClosed: args.isClosed,
        updatedAt: now,
      });
      return args.productId;
    }
    const id = await ctx.db.insert("products", {
      creatorId: args.creatorId,
      name: args.name,
      description: args.description,
      priceCents: args.priceCents,
      billingPeriod: args.billingPeriod,
      isFeatured: args.isFeatured,
      isActive: args.isActive,
      maxSpots: args.maxSpots,
      isLimited: args.isLimited,
      isClosed: args.isClosed,
      createdAt: now,
      updatedAt: now,
    });
    await logMutation(ctx, {
      table: "products",
      documentId: id,
      action: "upsert",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
  },
});

export const remove = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("NOT_FOUND");
    await requireCreatorOwner(ctx, product.creatorId);
    await requireAppUser(ctx);
    await ctx.db.delete(args.productId);
  },
});
