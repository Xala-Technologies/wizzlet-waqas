import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { getCreatorForUser, requireAppUser, hasActiveSubscription } from "../lib/auth";
import { canSendDirectMessage } from "../lib/messagingAccess";
import { directMessageDocValidator } from "../lib/validators";

export const listThread = query({
  args: {
    creatorId: v.id("creators"),
    subscriberId: v.id("users"),
  },
  returns: v.array(directMessageDocValidator),
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
  returns: v.id("directMessages"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");

    const subscriberHasActiveSub = await hasActiveSubscription(
      ctx,
      args.subscriberId,
      args.creatorId,
    );
    const decision = canSendDirectMessage({
      messagingEnabled: creator.messagingEnabled,
      senderRole: args.senderRole,
      callerIsCreatorOwner: creator.userId === user._id,
      callerIsNamedSubscriber: user._id === args.subscriberId,
      subscriberHasActiveSub,
      body: args.body,
    });
    if (!decision.ok) {
      throw new ConvexError(decision.reason);
    }

    return ctx.db.insert("directMessages", {
      creatorId: args.creatorId,
      subscriberId: args.subscriberId,
      senderRole: args.senderRole,
      body: args.body.trim(),
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const myCreatorInbox = query({
  args: {},
  returns: v.array(directMessageDocValidator),
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
  returns: v.array(directMessageDocValidator),
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    await ctx.db.patch(creator._id, {
      messagingEnabled: args.enabled,
      updatedAt: Date.now(),
    });
    return null;
  },
});
