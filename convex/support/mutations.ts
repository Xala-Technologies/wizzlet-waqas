import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCreatorForUser, requireAdmin, requireAppUser } from "../lib/auth";
import { supportMessageDocValidator, memberSupportMessageDocValidator } from "../lib/validators";
import {
  ADMIN_LIST_LIMIT,
  ADMIN_SCAN_MAX_DOCS,
  adminTakeNewest,
} from "../lib/adminLists";
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
      .take(ADMIN_SCAN_MAX_DOCS);
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
          : "/creator/messages?thread=support",
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
      .take(ADMIN_LIST_LIMIT);
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
      .take(ADMIN_SCAN_MAX_DOCS);
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
    let sawSupport = false;
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.creatorId !== creator._id || msg.read) continue;
      if (msg.senderRole !== "admin") continue;
      await ctx.db.patch(id, { read: true });
      if (msg.channel === "growth") sawGrowth = true;
      if (msg.channel === "support") sawSupport = true;
      updated += 1;
    }
    if (sawGrowth) {
      await markNotificationsReadByLink(ctx, {
        userId: user._id,
        linkIncludes: "/creator/personal-growth-manager",
      });
    }
    if (sawSupport) {
      await markNotificationsReadByLink(ctx, {
        userId: user._id,
        linkIncludes: "/creator/messages",
      });
    }
    return updated;
  },
});

/** Member floating support chat — list thread for signed-in user. */
export const listForMember = query({
  args: {},
  returns: v.array(memberSupportMessageDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("memberSupportMessages")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(ADMIN_SCAN_MAX_DOCS);
  },
});

/** Member sends a support message (or admin replies). */
export const sendMember = mutation({
  args: {
    body: v.string(),
    senderRole: v.union(v.literal("member"), v.literal("admin")),
    userId: v.optional(v.id("users")),
  },
  returns: v.id("memberSupportMessages"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const isAdmin = args.senderRole === "admin";
    if (isAdmin) await requireAdmin(ctx);

    const targetUserId = isAdmin ? args.userId : user._id;
    if (!targetUserId) throw new Error("MISSING_USER");
    if (!isAdmin && targetUserId !== user._id) throw new Error("FORBIDDEN");

    const body = args.body.trim();
    if (!body) throw new Error("EMPTY_BODY");

    const id = await ctx.db.insert("memberSupportMessages", {
      userId: targetUserId,
      senderRole: args.senderRole,
      body,
      read: false,
      createdAt: Date.now(),
    });

    const preview = previewBody(body);
    if (!isAdmin) {
      await notifyAdmins(ctx, {
        type: "support_message",
        title: `Member support: ${user.fullName ?? user.username ?? user.email ?? "Member"}`,
        description: preview,
        link: "/admin/creator-messaging",
        exceptUserId: user._id,
      });
    } else {
      await createNotification(ctx, {
        userId: targetUserId,
        type: "support_message",
        title: "Message from Sweeph Support",
        description: preview,
        link: "/dashboard",
      });
    }

    return id;
  },
});

/** Member marks admin replies as read. */
export const markReadMember = mutation({
  args: {
    messageIds: v.array(v.id("memberSupportMessages")),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    let updated = 0;
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.userId !== user._id || msg.read) continue;
      if (msg.senderRole !== "admin") continue;
      await ctx.db.patch(id, { read: true });
      updated += 1;
    }
    return updated;
  },
});
