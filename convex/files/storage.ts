import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../lib/auth";

/** Generate a short-lived upload URL for Convex file storage. */
export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireAppUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Register ownership after upload. Callers should invoke this with the storage id
 * returned from the upload response before sharing the file.
 */
export const registerOwnedFile = mutation({
  args: {
    storageId: v.id("_storage"),
    purpose: v.optional(v.string()),
  },
  returns: v.id("fileAssets"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await ctx.db
      .query("fileAssets")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (existing) {
      if (existing.ownerUserId !== user._id) throw new Error("FORBIDDEN");
      return existing._id;
    }
    return await ctx.db.insert("fileAssets", {
      storageId: args.storageId,
      ownerUserId: user._id,
      purpose: args.purpose,
      createdAt: Date.now(),
    });
  },
});

/** Resolve a storage URL — authenticated owner of a registered asset only. */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const asset = await ctx.db
      .query("fileAssets")
      .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
      .unique();
    if (!asset) {
      throw new Error("FORBIDDEN");
    }
    if (asset.ownerUserId !== user._id) {
      throw new Error("FORBIDDEN");
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});
