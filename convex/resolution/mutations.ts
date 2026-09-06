import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCreatorForUser, requireAdmin, requireAppUser, requireCreatorOwner } from "../lib/auth";

export const listMine = query({
  args: {},
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
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("resolutionCases").collect();
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
  handler: async (ctx, args) => {
    await requireCreatorOwner(ctx, args.creatorId);
    const now = Date.now();
    return ctx.db.insert("resolutionCases", {
      creatorId: args.creatorId,
      subject: args.subject,
      category: args.category,
      description: args.description,
      status: "open",
      priority: args.priority,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const addMessage = mutation({
  args: {
    caseId: v.id("resolutionCases"),
    body: v.string(),
    senderRole: v.string(),
  },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("NOT_FOUND");
    if (args.senderRole === "admin") await requireAdmin(ctx);
    else await requireCreatorOwner(ctx, c.creatorId);
    return ctx.db.insert("resolutionCaseMessages", {
      caseId: args.caseId,
      senderRole: args.senderRole,
      body: args.body,
      createdAt: Date.now(),
    });
  },
});

export const listMessages = query({
  args: { caseId: v.id("resolutionCases") },
  handler: async (ctx, args) => {
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("NOT_FOUND");
    const user = await requireAppUser(ctx);
    try {
      await requireAdmin(ctx);
    } catch {
      await requireCreatorOwner(ctx, c.creatorId);
    }
    void user;
    return ctx.db
      .query("resolutionCaseMessages")
      .withIndex("by_caseId", (q) => q.eq("caseId", args.caseId))
      .collect();
  },
});

export const setStatus = mutation({
  args: {
    caseId: v.id("resolutionCases"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("NOT_FOUND");
    await ctx.db.patch(args.caseId, { status: args.status, updatedAt: Date.now() });
  },
});
