import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { requireCreatorOwner, requireAppUser, logMutation } from "../lib/auth";
import { normalizeBillingPeriod } from "../lib/commerceIdentity";

/** Public projection — active, non-closed products only. */
export const listPublicByCreator = query({
  args: { creatorId: v.id("creators") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();
    return rows
      .filter((p) => p.isActive && !p.isClosed)
      .map((p) => ({
        _id: p._id,
        creatorId: p.creatorId,
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        billingPeriod: p.billingPeriod,
        isFeatured: p.isFeatured,
        isLimited: p.isLimited,
        maxSpots: p.maxSpots,
        isClosed: p.isClosed,
      }));
  },
});

/** Owner projection — all products including inactive/archived. */
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
    const billingPeriod = normalizeBillingPeriod(args.billingPeriod);
    const now = Date.now();

    // Featured atomicity: at most one featured product per creator
    if (args.isFeatured) {
      const siblings = await ctx.db
        .query("products")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
        .collect();
      for (const sibling of siblings) {
        if (sibling.isFeatured && sibling._id !== args.productId) {
          await ctx.db.patch(sibling._id, { isFeatured: false, updatedAt: now });
        }
      }
    }

    if (args.productId) {
      const existing = await ctx.db.get(args.productId);
      if (!existing || existing.creatorId !== args.creatorId) {
        throw new ConvexError("NOT_FOUND");
      }
      await ctx.db.patch(args.productId, {
        name: args.name,
        description: args.description,
        priceCents: args.priceCents,
        billingPeriod,
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
      billingPeriod,
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

/** Soft-archive instead of hard delete when product may have history. */
export const remove = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, product.creatorId);
    await requireAppUser(ctx);
    const linked = await ctx.db
      .query("subscriptions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .first();
    if (linked) {
      await ctx.db.patch(args.productId, {
        isActive: false,
        isClosed: true,
        updatedAt: Date.now(),
      });
      return { archived: true as const };
    }
    await ctx.db.delete(args.productId);
    return { archived: false as const };
  },
});
