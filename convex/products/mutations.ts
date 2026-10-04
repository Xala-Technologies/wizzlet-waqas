import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { requireCreatorOwner, requireAppUser, logMutation } from "../lib/auth";
import { normalizeProductBillingPeriod } from "../lib/commerceIdentity";
import {
  MAX_PROFILE_PRODUCTS,
  wouldExceedProfileSlots,
} from "../lib/productProfileSlots";
import { siblingIdsToUnfeature } from "../lib/productFeatured";
import { productRemoveMode } from "../lib/productRemove";
import { productDocValidator, productPublicValidator } from "../lib/validators";

/** Public projection — active, non-closed products only. */
export const listPublicByCreator = query({
  args: { creatorId: v.id("creators") },
  returns: v.array(productPublicValidator),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("products")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
      .collect();
    const out = [];
    for (const p of rows) {
      if (!p.isActive || p.isClosed) continue;
      const imageUrl = p.imageStorageId
        ? await ctx.storage.getUrl(p.imageStorageId)
        : null;
      out.push({
        _id: p._id,
        creatorId: p.creatorId,
        name: p.name,
        description: p.description,
        shortDescription: p.shortDescription,
        imageUrl,
        priceCents: p.priceCents,
        billingPeriod: p.billingPeriod,
        isFeatured: p.isFeatured,
        showOnProfile: p.showOnProfile ?? p.isFeatured,
        isLimited: p.isLimited,
        maxSpots: p.maxSpots,
        isClosed: p.isClosed,
        includesDiscordAccess: Boolean(p.discordRoleId?.trim()),
      });
    }
    return out;
  },
});

/** Owner projection — all products including inactive/archived. */
export const listByCreator = query({
  args: { creatorId: v.id("creators"), activeOnly: v.optional(v.boolean()) },
  returns: v.array(productDocValidator),
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
    shortDescription: v.optional(v.string()),
    imageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    priceCents: v.number(),
    billingPeriod: v.string(),
    isFeatured: v.boolean(),
    isActive: v.boolean(),
    maxSpots: v.optional(v.number()),
    isLimited: v.boolean(),
    isClosed: v.boolean(),
  },
  returns: v.id("products"),
  handler: async (ctx, args) => {
    const { user } = await requireCreatorOwner(ctx, args.creatorId);
    const billingPeriod = normalizeProductBillingPeriod(args.billingPeriod);
    const now = Date.now();

    if (args.isFeatured) {
      const siblings = await ctx.db
        .query("products")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
        .collect();
      const clearIds = new Set(siblingIdsToUnfeature(siblings, args.productId));
      for (const sibling of siblings) {
        if (clearIds.has(sibling._id)) {
          await ctx.db.patch(sibling._id, { isFeatured: false, updatedAt: now });
        }
      }
    }

    const imagePatch =
      args.imageStorageId === undefined
        ? {}
        : {
            imageStorageId:
              args.imageStorageId === null ? undefined : args.imageStorageId,
          };

    if (args.productId) {
      const existing = await ctx.db.get(args.productId);
      if (!existing || existing.creatorId !== args.creatorId) {
        throw new ConvexError("NOT_FOUND");
      }
      await ctx.db.patch(args.productId, {
        name: args.name,
        description: args.description,
        shortDescription: args.shortDescription,
        ...imagePatch,
        priceCents: args.priceCents,
        billingPeriod,
        isFeatured: args.isFeatured,
        isActive: args.isActive,
        maxSpots: args.maxSpots,
        isLimited: args.isLimited,
        isClosed: args.isClosed,
        updatedAt: now,
      });
      if (args.isFeatured) {
        await ctx.db.patch(args.creatorId, {
          monthlyPriceCents: args.priceCents,
          updatedAt: now,
        });
      }
      return args.productId;
    }
    const id = await ctx.db.insert("products", {
      creatorId: args.creatorId,
      name: args.name,
      description: args.description,
      shortDescription: args.shortDescription,
      imageStorageId:
        args.imageStorageId === null || args.imageStorageId === undefined
          ? undefined
          : args.imageStorageId,
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
    if (args.isFeatured) {
      await ctx.db.patch(args.creatorId, {
        monthlyPriceCents: args.priceCents,
        updatedAt: now,
      });
    }
    return id;
  },
});

/** Soft-archive instead of hard delete when product may have history. */
export const remove = mutation({
  args: { productId: v.id("products") },
  returns: v.object({ archived: v.boolean() }),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, product.creatorId);
    await requireAppUser(ctx);
    const linked = await ctx.db
      .query("subscriptions")
      .withIndex("by_productId", (q) => q.eq("productId", args.productId))
      .first();
    if (productRemoveMode(Boolean(linked)) === "archive") {
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

/** Toggle whether a product shows on the public profile display strip. */
export const setShowOnProfile = mutation({
  args: {
    productId: v.id("products"),
    showOnProfile: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, product.creatorId);
    const now = Date.now();

    if (args.showOnProfile) {
      const siblings = await ctx.db
        .query("products")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", product.creatorId))
        .collect();
      const currentlyShown = siblings.filter(
        (p) =>
          p._id !== args.productId &&
          (p.showOnProfile === true ||
            (p.showOnProfile === undefined && p.isFeatured)),
      ).length;
      if (wouldExceedProfileSlots(currentlyShown, true, MAX_PROFILE_PRODUCTS)) {
        throw new ConvexError("PROFILE_SLOTS_FULL");
      }
    }

    await ctx.db.patch(args.productId, {
      showOnProfile: args.showOnProfile,
      updatedAt: now,
    });
    return null;
  },
});
