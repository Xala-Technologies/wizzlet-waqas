import { mutation, query } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAdmin, requireAppUser } from "../lib/auth";
import { sportEventDocValidator } from "../lib/validators";

export const listPublishedToday = query({
  args: {
    fromMs: v.number(),
    toMs: v.number(),
  },
  returns: v.array(sportEventDocValidator),
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

/**
 * Dev-only: publish a small today's slate when empty.
 * Requires ALLOW_DEV_ADMIN_GRANT=true on the Convex deployment — never enable on prod.
 */
export const seedTodayDev = mutation({
  args: {
    fromMs: v.number(),
    toMs: v.number(),
  },
  returns: v.object({
    inserted: v.number(),
    skipped: v.boolean(),
  }),
  handler: async (ctx, args) => {
    if (process.env.ALLOW_DEV_ADMIN_GRANT !== "true") {
      throw new ConvexError("FORBIDDEN");
    }
    await requireAppUser(ctx);

    const published = await ctx.db
      .query("sportEvents")
      .withIndex("by_published_startsAt", (q) => q.eq("isPublished", true))
      .collect();
    const todayCount = published.filter(
      (e) => e.startsAt >= args.fromMs && e.startsAt < args.toMs,
    ).length;
    if (todayCount > 0) {
      return { inserted: 0, skipped: true };
    }

    const now = Date.now();
    const mid = args.fromMs + 12 * 60 * 60 * 1000;
    const slate = [
      {
        sport: "Football",
        league: "NFL",
        homeTeam: "Denver Broncos",
        awayTeam: "Kansas City Chiefs",
        startsAt: mid + 2 * 60 * 60 * 1000,
        status: "featured",
        homeOdds: 2.1,
        awayOdds: 1.75,
        priority: 100,
      },
      {
        sport: "Baseball",
        league: "MLB",
        homeTeam: "Los Angeles Dodgers",
        awayTeam: "San Diego Padres",
        startsAt: mid + 4 * 60 * 60 * 1000,
        status: "upcoming",
        homeOdds: 1.9,
        awayOdds: 1.95,
        priority: 80,
      },
      {
        sport: "Basketball",
        league: "NBA",
        homeTeam: "Boston Celtics",
        awayTeam: "New York Knicks",
        startsAt: mid + 6 * 60 * 60 * 1000,
        status: "starting_soon",
        homeOdds: 1.65,
        awayOdds: 2.25,
        priority: 90,
      },
    ] as const;

    let inserted = 0;
    for (const row of slate) {
      await ctx.db.insert("sportEvents", {
        ...row,
        isPublished: true,
        createdAt: now,
        updatedAt: now,
      });
      inserted += 1;
    }
    return { inserted, skipped: false };
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
  returns: v.id("sportEvents"),
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.eventId);
    return null;
  },
});
