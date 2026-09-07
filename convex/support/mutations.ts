import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCreatorForUser, requireAdmin, requireAppUser } from "../lib/auth";
import { supportMessageDocValidator } from "../lib/validators";
import { adminTakeNewest } from "../lib/adminLists";

export const listForMyCreator = query({
  args: {},
  returns: v.array(supportMessageDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("supportMessages")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const listAllAdmin = query({
  args: {},
  returns: v.array(supportMessageDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return adminTakeNewest(ctx, "supportMessages");
  },
});

export const send = mutation({
  args: {
    creatorId: v.id("creators"),
    body: v.string(),
    senderRole: v.string(),
    channel: v.optional(v.string()),
  },
  returns: v.id("supportMessages"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("NOT_FOUND");
    const isAdmin = args.senderRole === "admin";
    if (isAdmin) await requireAdmin(ctx);
    else if (creator.userId !== user._id) throw new Error("FORBIDDEN");

    const settings = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    if (isAdmin) {
      const channel = args.channel ?? "support";
      if (channel === "growth" && settings?.featureFlags?.growthManagerEnabled === false) {
        throw new Error("Growth Manager chat is disabled in Settings");
      }
      if (channel === "support" && settings?.featureFlags?.creatorMessagingEnabled === false) {
        throw new Error("Creator messaging is disabled in Settings");
      }
    }

    return ctx.db.insert("supportMessages", {
      creatorId: args.creatorId,
      senderRole: args.senderRole,
      channel: args.channel,
      body: args.body,
      read: false,
      createdAt: Date.now(),
    });
  },
});

/** Admin marks creator messages as read (D3). */
export const markReadAdmin = mutation({
  args: {
    messageIds: v.array(v.id("supportMessages")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let updated = 0;
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.read) continue;
      await ctx.db.patch(id, { read: true });
      updated += 1;
    }
    return updated;
  },
});
