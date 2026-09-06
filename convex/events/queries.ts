import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../lib/auth";

export const listPublishedToday = query({
  args: {
    fromMs: v.number(),
    toMs: v.number(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("sportEvents")
      .withIndex("by_published_startsAt", (q) => q.eq("isPublished", true))
      .collect();
    return rows
      .filter((e) => e.startsAt >= args.fromMs && e.startsAt < args.toMs)
      .sort((a, b) => b.priority - a.priority || a.startsAt - b.startsAt);
  },
});

export const upsertAdmin = mutation({
  args: {
    eventId: v.optional(v.id("sportEvents")),
    sport: v.string(),
    league: v.string(),
    homeTeam: v.string(),
    awayTeam: v.string(),
    startsAt: v.number(),
    status: v.string(),
    homeOdds: v.optional(v.number()),
    awayOdds: v.optional(v.number()),
    drawOdds: v.optional(v.number()),
    priority: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const { eventId, ...fields } = args;
    if (eventId) {
      await ctx.db.patch(eventId, { ...fields, updatedAt: now });
      return eventId;
    }
    return ctx.db.insert("sportEvents", {
      ...fields,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const removeAdmin = mutation({
  args: { eventId: v.id("sportEvents") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.eventId);
  },
});
