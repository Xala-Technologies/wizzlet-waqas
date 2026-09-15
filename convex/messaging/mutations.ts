import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getCreatorForUser, requireAppUser, hasActiveSubscription } from "../lib/auth";
import { canSendDirectMessage } from "../lib/messagingAccess";
import { directMessageDocValidator } from "../lib/validators";
import {
  createNotification,
  markNotificationsReadByLink,
  previewBody,
} from "../lib/notify";

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
    if (decision.ok === false) {
      throw new ConvexError(decision.reason);
    }

    const body = args.body.trim();
    const id = await ctx.db.insert("directMessages", {
      creatorId: args.creatorId,
      subscriberId: args.subscriberId,
      senderRole: args.senderRole,
      body,
      read: false,
      createdAt: Date.now(),
    });

    const creatorLabel = creator.displayName ?? creator.username;
    const senderLabel =
      args.senderRole === "creator"
        ? creatorLabel
        : (user.fullName ?? user.username ?? user.name ?? "A subscriber");

    if (args.senderRole === "subscriber") {
      await createNotification(ctx, {
        userId: creator.userId,
        type: "message",
        title: `New message from ${senderLabel}`,
        description: previewBody(body),
        link: `/creator/messages?subscriberId=${args.subscriberId}`,
      });
    } else {
      await createNotification(ctx, {
        userId: args.subscriberId,
        type: "message",
        title: `New message from ${creatorLabel}`,
        description: previewBody(body),
        link: `/dashboard/messages?creatorId=${args.creatorId}`,
      });
    }

    return id;
  },
});

/** Bounded inbox for secondary callers; prefer myCreatorInboxPage for the Messages UI. */
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
      .order("desc")
      .take(500);
  },
});

/**
 * Overview panel: latest DM threads with subscriber display name + avatar.
 * Caps threads so the dashboard stays light at scale.
 */
export const overviewInboxThreads = query({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      subscriberId: v.id("users"),
      name: v.string(),
      avatarUrl: v.union(v.string(), v.null()),
      preview: v.string(),
      createdAt: v.number(),
      unread: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];

    const rows = await ctx.db
      .query("directMessages")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .order("desc")
      .take(200);

    const bySub = new Map<
      string,
      {
        id: string;
        subscriberId: Id<"users">;
        body: string;
        createdAt: number;
        unread: number;
      }
    >();

    for (const m of rows) {
      const key = m.subscriberId;
      const existing = bySub.get(key);
      const unreadInc = m.senderRole === "subscriber" && !m.read ? 1 : 0;
      if (!existing || m.createdAt > existing.createdAt) {
        bySub.set(key, {
          id: m._id,
          subscriberId: m.subscriberId,
          body: m.body,
          createdAt: m.createdAt,
          unread: (existing?.unread ?? 0) + unreadInc,
        });
      } else if (unreadInc) {
        existing.unread += unreadInc;
      }
    }

    const threads = [...bySub.values()]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const out = [];
    for (const t of threads) {
      const sub = await ctx.db.get(t.subscriberId);
      const name =
        sub?.fullName?.trim() ||
        sub?.username?.trim() ||
        sub?.name?.trim() ||
        sub?.email?.split("@")[0] ||
        "Subscriber";
      out.push({
        id: t.id,
        subscriberId: t.subscriberId,
        name,
        avatarUrl: sub?.image ?? null,
        preview: t.body,
        createdAt: t.createdAt,
        unread: t.unread,
      });
    }
    return out;
  },
});

/** Cursor-paginated creator DM inbox. */
export const myCreatorInboxPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(directMessageDocValidator),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    return ctx.db
      .query("directMessages")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

/** Unread DM count for the signed-in creator (subscriber → creator). */
export const unreadCountCreator = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return 0;
    const rows = await ctx.db
      .query("directMessages")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .order("desc")
      .take(500);
    return rows.filter((m) => m.senderRole === "subscriber" && !m.read).length;
  },
});

/** Unread DM count for the signed-in subscriber (creator → subscriber). */
export const unreadCountSubscriber = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const rows = await ctx.db
      .query("directMessages")
      .withIndex("by_subscriberId", (q) => q.eq("subscriberId", user._id))
      .order("desc")
      .take(500);
    return rows.filter((m) => m.senderRole === "creator" && !m.read).length;
  },
});

/** Creator marks subscriber messages as read when opening a thread. */
export const markReadCreator = mutation({
  args: {
    messageIds: v.array(v.id("directMessages")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    let updated = 0;
    const subscriberIds = new Set<string>();
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.creatorId !== creator._id || msg.read) continue;
      if (msg.senderRole !== "subscriber") continue;
      await ctx.db.patch(id, { read: true });
      subscriberIds.add(msg.subscriberId);
      updated += 1;
    }
    for (const subscriberId of subscriberIds) {
      await markNotificationsReadByLink(ctx, {
        userId: user._id,
        linkIncludes: `subscriberId=${subscriberId}`,
      });
    }
    return updated;
  },
});

/** Member marks creator messages as read when opening a thread. */
export const markReadSubscriber = mutation({
  args: {
    messageIds: v.array(v.id("directMessages")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    let updated = 0;
    const creatorIds = new Set<string>();
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.subscriberId !== user._id || msg.read) continue;
      if (msg.senderRole !== "creator") continue;
      await ctx.db.patch(id, { read: true });
      creatorIds.add(msg.creatorId);
      updated += 1;
    }
    for (const creatorId of creatorIds) {
      await markNotificationsReadByLink(ctx, {
        userId: user._id,
        linkIncludes: `creatorId=${creatorId}`,
      });
    }
    return updated;
  },
});

/** Bounded subscriber inbox; prefer mySubscriberInboxPage for the Messages UI. */
export const mySubscriberInbox = query({
  args: {},
  returns: v.array(directMessageDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("directMessages")
      .withIndex("by_subscriberId", (q) => q.eq("subscriberId", user._id))
      .order("desc")
      .take(500);
  },
});

/** Cursor-paginated member DM inbox. */
export const mySubscriberInboxPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(directMessageDocValidator),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("directMessages")
      .withIndex("by_subscriberId", (q) => q.eq("subscriberId", user._id))
      .order("desc")
      .paginate(args.paginationOpts);
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
