import { validatePickInput, pickImportKey } from "../lib/pickInput";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { requireAppUser, logMutation } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";
import { normalizePickResult, isSettledPickResult } from "../lib/results";
import { pickTrackerDocValidator } from "../lib/validators";

export const listMine = query({
  args: {},
  returns: v.array(pickTrackerDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return ctx.db
      .query("pickTracker")
      .withIndex("by_userId_date", (q) => q.eq("userId", user._id))
      .take(ADMIN_SCAN_MAX_DOCS);
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
  returns: v.id("pickTracker"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    validatePickInput(args);
    const now = Date.now();
    const result = normalizePickResult(args.result);
    if (args.pickId) {
      const existing = await ctx.db.get(args.pickId);
      if (!existing || existing.userId !== user._id) throw new Error("FORBIDDEN");
      if (isSettledPickResult(existing.result) && result !== normalizePickResult(existing.result)) {
        throw new Error("RESULT_LOCKED");
      }
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
        result: isSettledPickResult(existing.result)
          ? normalizePickResult(existing.result)
          : result,
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
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const existing = await ctx.db.get(args.pickId);
    if (!existing || existing.userId !== user._id) throw new Error("FORBIDDEN");
    await ctx.db.delete(args.pickId);
    return null;
  },
});

/** One transaction prevents a failed import from leaving a partially written file. */
export const importCsv = mutation({
  args: { rows: v.array(v.object({
    date: v.string(), pickEvent: v.string(), sport: v.string(),
    euOdds: v.optional(v.number()), usOdds: v.optional(v.string()),
    unitsRisked: v.number(), unitsWonLost: v.optional(v.number()),
    result: v.string(), notes: v.optional(v.string()),
  })) },
  returns: v.object({ imported: v.number(), duplicates: v.number() }),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    if (args.rows.length > 500) throw new Error("Import at most 500 rows at a time");
    for (const row of args.rows) validatePickInput(row);
    const existing = await ctx.db.query("pickTracker")
      .withIndex("by_userId", q => q.eq("userId", user._id)).take(ADMIN_SCAN_MAX_DOCS);
    if (existing.length >= ADMIN_SCAN_MAX_DOCS) throw new Error("Import limit reached; no rows were imported");
    const keys = new Set(existing.map(pickImportKey));
    let imported = 0;
    let duplicates = 0;
    for (const row of args.rows) {
      const key = pickImportKey(row);
      if (keys.has(key)) { duplicates++; continue; }
      keys.add(key);
      const id = await ctx.db.insert("pickTracker", {
        ...row, userId: user._id, result: normalizePickResult(row.result), createdAt: Date.now(),
      });
      await logMutation(ctx, { table: "pickTracker", documentId: id, action: "import", actorExternalAuthId: user.externalAuthId });
      imported++;
    }
    return { imported, duplicates };
  },
});
