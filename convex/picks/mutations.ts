import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser, logMutation } from "../lib/auth";
import { normalizePickResult } from "../lib/results";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("pickTracker")
      .withIndex("by_userId_date", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const upsert = mutation({
  args: {
    pickId: v.optional(v.id("pickTracker")),
    postId: v.optional(v.id("posts")),
    date: v.string(),
    pickEvent: v.string(),
    sport: v.string(),
    odds: v.optional(v.string()),
    euOdds: v.optional(v.number()),
    usOdds: v.optional(v.string()),
    unitsRisked: v.number(),
    unitsWonLost: v.optional(v.number()),
    result: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const now = Date.now();
    const result = normalizePickResult(args.result);
    if (args.pickId) {
      const existing = await ctx.db.get(args.pickId);
      if (!existing || existing.userId !== user._id) throw new Error("FORBIDDEN");
      await ctx.db.patch(args.pickId, {
        postId: args.postId,
        date: args.date,
        pickEvent: args.pickEvent,
        sport: args.sport,
        odds: args.odds,
        euOdds: args.euOdds,
        usOdds: args.usOdds,
        unitsRisked: args.unitsRisked,
        unitsWonLost: args.unitsWonLost,
        result,
        notes: args.notes,
      });
      return args.pickId;
    }
    const id = await ctx.db.insert("pickTracker", {
      userId: user._id,
      postId: args.postId,
      date: args.date,
      pickEvent: args.pickEvent,
      sport: args.sport,
      odds: args.odds,
      euOdds: args.euOdds,
      usOdds: args.usOdds,
      unitsRisked: args.unitsRisked,
      unitsWonLost: args.unitsWonLost,
      result,
      notes: args.notes,
      createdAt: now,
    });
    await logMutation(ctx, {
      table: "pickTracker",
      documentId: id,
      action: "upsert",
      actorExternalAuthId: user.externalAuthId,
    });
    return id;
  },
});

export const remove = mutation({
  args: { pickId: v.id("pickTracker") },
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await ctx.db.get(args.pickId);
    if (!existing || existing.userId !== user._id) throw new Error("FORBIDDEN");
    await ctx.db.delete(args.pickId);
  },
});
