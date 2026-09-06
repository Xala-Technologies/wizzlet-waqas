import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getCreatorForUser, requireAppUser, hasActiveSubscription } from "../lib/auth";

export const listThread = query({
  args: {
    creatorId: v.id("creators"),
    subscriberId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    const isCreator = creator.userId === user._id;
    const isSubscriber = user._id === args.subscriberId;
    if (!isCreator && !isSubscriber) throw new ConvexError("FORBIDDEN");
    return ctx.db
      .query("directMessages")
      .withIndex("by_creatorId_subscriberId", (q) =>
        q.eq("creatorId", args.creatorId).eq("subscriberId", args.subscriberId),
      )
      .collect();
  },
});

export const send = mutation({
  args: {
    creatorId: v.id("creators"),
    subscriberId: v.id("users"),
    body: v.string(),
    senderRole: v.union(v.literal("creator"), v.literal("subscriber")),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    if (!creator.messagingEnabled) {
      throw new ConvexError("MESSAGING_DISABLED");
    }
    if (args.senderRole === "creator" && creator.userId !== user._id) {
      throw new ConvexError("FORBIDDEN");
    }
    if (args.senderRole === "subscriber" && user._id !== args.subscriberId) {
      throw new ConvexError("FORBIDDEN");
    }
    if (args.senderRole === "subscriber") {
      const ok = await hasActiveSubscription(ctx, user._id, args.creatorId);
      if (!ok) throw new ConvexError("FORBIDDEN");
    }
    return ctx.db.insert("directMessages", {
      creatorId: args.creatorId,
      subscriberId: args.subscriberId,
      senderRole: args.senderRole,
      body: args.body,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const myCreatorInbox = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("directMessages")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const mySubscriberInbox = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("directMessages")
      .withIndex("by_subscriberId", (q) => q.eq("subscriberId", user._id))
      .collect();
  },
});

export const setMessagingEnabled = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    await ctx.db.patch(creator._id, {
      messagingEnabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});
