import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser } from "../lib/auth";

/** Generate a short-lived upload URL for Convex file storage. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAppUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Resolve a storage URL — authenticated only (unguessable ids still need ACL). */
export const getUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    await requireAppUser(ctx);
    return await ctx.storage.getUrl(args.storageId);
  },
});
