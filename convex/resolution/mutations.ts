import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import {
  getCreatorForUser,
  requireAdmin,
  requireAppUser,
  requireCreatorOwner,
} from "../lib/auth";
import {
  resolutionCaseDocValidator,
  resolutionCaseMessageDocValidator,
} from "../lib/validators";
import { adminTakeNewest } from "../lib/adminLists";
import {
  createNotification,
  markNotificationsReadByLink,
  notifyAdmins,
  previewBody,
} from "../lib/notify";

function isUnread(read: boolean | undefined) {
  return read !== true;
}

export const listMine = query({
  args: {},
  returns: v.array(resolutionCaseDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("resolutionCases")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const listAllAdmin = query({
  args: {},
  returns: v.array(resolutionCaseDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return adminTakeNewest(ctx, "resolutionCases");
  },
});

export const create = mutation({
  args: {
    creatorId: v.id("creators"),
    subject: v.string(),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  returns: v.id("resolutionCases"),
  handler: async (ctx, args) => {
    await requireCreatorOwner(ctx, args.creatorId);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new Error("NOT_FOUND");
    const now = Date.now();
    const caseId = await ctx.db.insert("resolutionCases", {
      creatorId: args.creatorId,
      subject: args.subject,
      category: args.category,
      description: args.description,
      status: "open",
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
    });

    const creatorLabel = creator.displayName ?? creator.username;
    await notifyAdmins(ctx, {
      type: "resolution_case",
      title: `New case from ${creatorLabel}`,
      description: args.subject.trim(),
      link: `/admin/resolution-cases?caseId=${caseId}`,
    });

    return caseId;
  },
});

export const addMessage = mutation({
  args: {
    caseId: v.id("resolutionCases"),
    body: v.string(),
    senderRole: v.string(),
  },
  returns: v.id("resolutionCaseMessages"),
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("NOT_FOUND");
    const isAdmin = args.senderRole === "admin";
    if (isAdmin) await requireAdmin(ctx);
    else await requireCreatorOwner(ctx, c.creatorId);

    const body = args.body.trim();
    const id = await ctx.db.insert("resolutionCaseMessages", {
      caseId: args.caseId,
      senderRole: args.senderRole,
      body,
      read: false,
      createdAt: Date.now(),
    });
    await ctx.db.patch(args.caseId, { updatedAt: Date.now() });

    const creator = await ctx.db.get(c.creatorId);
    const creatorLabel = creator?.displayName ?? creator?.username ?? "Creator";
    const preview = previewBody(body);

    if (isAdmin && creator) {
      await createNotification(ctx, {
        userId: creator.userId,
        type: "resolution_message",
        title: "Update on your resolution case",
        description: preview,
        link: `/creator/resolution-case?caseId=${args.caseId}`,
      });
    } else {
      await notifyAdmins(ctx, {
        type: "resolution_message",
        title: `${creatorLabel} replied on a case`,
        description: preview,
        link: `/admin/resolution-cases?caseId=${args.caseId}`,
      });
    }

    return id;
  },
});

export const listMessages = query({
  args: { caseId: v.id("resolutionCases") },
  returns: v.array(resolutionCaseMessageDocValidator),
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("NOT_FOUND");
    try {
      await requireAdmin(ctx);
    } catch {
      await requireCreatorOwner(ctx, c.creatorId);
    }
    return ctx.db
      .query("resolutionCaseMessages")
      .withIndex("by_caseId", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

/** Unread case messages waiting on admin (creator → admin). */
export const unreadCountAdmin = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await adminTakeNewest(ctx, "resolutionCaseMessages", 500);
    return rows.filter((m) => m.senderRole === "creator" && isUnread(m.read)).length;
  },
});

/** Unread case replies for the signed-in creator (admin → creator). */
export const unreadCountCreator = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return 0;
    const cases = await ctx.db
      .query("resolutionCases")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
    let unread = 0;
    for (const c of cases) {
      const msgs = await ctx.db
        .query("resolutionCaseMessages")
        .withIndex("by_caseId", (q) => q.eq("caseId", c._id))
        .collect();
      unread += msgs.filter((m) => m.senderRole === "admin" && isUnread(m.read)).length;
    }
    return unread;
  },
});

export const markReadAdmin = mutation({
  args: { messageIds: v.array(v.id("resolutionCaseMessages")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    let updated = 0;
    const caseIds = new Set<string>();
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.read === true) continue;
      if (msg.senderRole !== "creator") continue;
      await ctx.db.patch(id, { read: true });
      caseIds.add(msg.caseId);
      updated += 1;
    }
    for (const caseId of caseIds) {
      await markNotificationsReadByLink(ctx, {
        userId: admin._id,
        linkIncludes: `caseId=${caseId}`,
      });
    }
    return updated;
  },
});

export const markReadCreator = mutation({
  args: { messageIds: v.array(v.id("resolutionCaseMessages")) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    let updated = 0;
    const caseIds = new Set<string>();
    for (const id of args.messageIds) {
      const msg = await ctx.db.get(id);
      if (!msg || msg.read === true) continue;
      if (msg.senderRole !== "admin") continue;
      const c = await ctx.db.get(msg.caseId);
      if (!c || c.creatorId !== creator._id) continue;
      await ctx.db.patch(id, { read: true });
      caseIds.add(msg.caseId);
      updated += 1;
    }
    for (const caseId of caseIds) {
      await markNotificationsReadByLink(ctx, {
        userId: user._id,
        linkIncludes: `caseId=${caseId}`,
      });
    }
    return updated;
  },
});

export const setStatus = mutation({
  args: {
    caseId: v.id("resolutionCases"),
    status: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("NOT_FOUND");
    await ctx.db.patch(args.caseId, { status: args.status, updatedAt: Date.now() });

    const creator = await ctx.db.get(c.creatorId);
    if (creator) {
      await createNotification(ctx, {
        userId: creator.userId,
        type: "resolution_case",
        title: `Case marked ${args.status.replace(/_/g, " ")}`,
        description: c.subject,
        link: `/creator/resolution-case?caseId=${args.caseId}`,
      });
    }
    return null;
  },
});
