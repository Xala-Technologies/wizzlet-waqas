import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCreatorForUser, requireAdmin, requireAppUser } from "../lib/auth";
import { supportMessageDocValidator } from "../lib/validators";
import { adminTakeNewest } from "../lib/adminLists";
import {
  createNotification,
  markNotificationsReadByLink,
  notifyAdmins,
  previewBody,
} from "../lib/notify";

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
    const channel = args.channel ?? "support";
    if (isAdmin) {
      if (channel === "growth" && settings?.featureFlags?.growthManagerEnabled === false) {
        throw new Error("Growth Manager chat is disabled in Settings");
      }
      if (channel === "support" && settings?.featureFlags?.creatorMessagingEnabled === false) {
        throw new Error("Creator messaging is disabled in Settings");
      }
    }

    const body = args.body.trim();
    const id = await ctx.db.insert("supportMessages", {
      creatorId: args.creatorId,
      senderRole: args.senderRole,
      channel,
      body,
      read: false,
      createdAt: Date.now(),
    });

    const creatorLabel = creator.displayName ?? creator.username;
    const preview = previewBody(body);

    if (!isAdmin) {
      // Creator → admins (growth coaching or support reply)
      const isGrowth = channel === "growth";
      await notifyAdmins(ctx, {
        type: isGrowth ? "growth_message" : "support_message",
        title: isGrowth
          ? `${creatorLabel} messaged Growth`
          : `Message from ${creatorLabel}`,
        description: preview,
        link: isGrowth
          ? `/admin/growth-manager-inbox?creatorId=${args.creatorId}`
          : `/admin/creator-messaging?creatorId=${args.creatorId}`,
        exceptUserId: user._id,
      });
    } else {
      // Admin → creator
      const isGrowth = channel === "growth";
      await createNotification(ctx, {
        userId: creator.userId,
        type: isGrowth ? "growth_message" : "support_message",
        title: isGrowth ? "Reply from Prizelet Growth" : "Message from Prizelet Support",
        description: preview,
        link: isGrowth
          ? "/creator/personal-growth-manager"
          : "/creator/messages",
      });
    }

    return id;
  },
});

/** Unread growth messages waiting on admin (creator → admin). */
export const unreadCountAdminGrowth = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("supportMessages")
      .withIndex("by_channel", (q) => q.eq("channel", "growth"))
      .order("desc")
      .take(500);
    return rows.filter((m) => m.senderRole === "creator" && !m.read).length;
  },
});

/** Unread growth replies for the signed-in creator (admin → creator). */
export const unreadCountCreatorGrowth = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return 0;
    const rows = await ctx.db
      .query("supportMessages")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
    return rows.filter(
      (m) => m.channel === "growth" && m.senderRole === "admin" && !m.read,
    ).length;
  },
});

/** Admin marks creator messages as read (D3). */
export const markReadAdmin = mutation({
  args: {
    messageIds: v.array(v.id("supportMessages")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    let updated = 0;
    const creatorIds = new Set<string>();
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.read) continue;
      await ctx.db.patch(id, { read: true });
      creatorIds.add(msg.creatorId);
      updated += 1;
    }
    for (const creatorId of creatorIds) {
      await markNotificationsReadByLink(ctx, {
        userId: admin._id,
        linkIncludes: `creatorId=${creatorId}`,
      });
    }
    return updated;
  },
});

/** Creator marks admin support/growth messages as read when opening the thread. */
export const markReadCreator = mutation({
  args: {
    messageIds: v.array(v.id("supportMessages")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    let updated = 0;
    let sawGrowth = false;
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.creatorId !== creator._id || msg.read) continue;
      if (msg.senderRole !== "admin") continue;
      await ctx.db.patch(id, { read: true });
      if (msg.channel === "growth") sawGrowth = true;
      updated += 1;
    }
    if (sawGrowth) {
      await markNotificationsReadByLink(ctx, {
        userId: user._id,
        linkIncludes: "/creator/personal-growth-manager",
      });
    }
    return updated;
  },
});
