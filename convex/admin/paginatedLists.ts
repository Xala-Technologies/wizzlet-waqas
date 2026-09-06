import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import { listRolesForUser, requireAdmin } from "../lib/auth";
import { isPaidOutPayoutStatus } from "../lib/payoutBalance";

const adminUserRowValidator = v.object({
  id: v.id("users"),
  email: v.string(),
  fullName: v.union(v.string(), v.null()),
  createdAt: v.number(),
  subCount: v.number(),
  role: v.string(),
  totalSpend: v.number(),
  creatorEarnings: v.number(),
  paidOut: v.number(),
});

const adminCreatorRowValidator = v.object({
  id: v.id("creators"),
  username: v.union(v.string(), v.null()),
  displayName: v.union(v.string(), v.null()),
  monthlyPriceCents: v.union(v.number(), v.null()),
  isPublished: v.boolean(),
  createdAt: v.number(),
  userId: v.id("users"),
  email: v.string(),
  subCount: v.number(),
  revenue: v.number(),
  verificationStatus: v.optional(v.string()),
});

const adminPayoutRowValidator = v.object({
  id: v.id("payouts"),
  creatorId: v.id("creators"),
  creatorName: v.string(),
  amountCents: v.number(),
  status: v.string(),
  method: v.union(v.string(), v.null()),
  reference: v.union(v.string(), v.null()),
  processedAt: v.union(v.number(), v.null()),
  createdAt: v.number(),
});

/**
 * Cursor-paginated users with per-row enrichment via indexes (F-012).
 * Does not full-scan subscriptions/creators/payouts tables.
 */
export const listUsersPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminUserRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db.query("users").order("desc").paginate(args.paginationOpts);

    const page = [];
    for (const u of result.page) {
      const roles = await listRolesForUser(ctx, u._id);
      const subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .collect();
      const activeSubs = subs.filter((s) => s.status === "active");
      const totalSpend = subs.reduce((a, s) => a + s.amountCents / 100, 0);

      const ownedCreators = await ctx.db
        .query("creators")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .collect();

      let creatorEarnings = 0;
      let paidOut = 0;
      for (const c of ownedCreators) {
        const creatorSubs = await ctx.db
          .query("subscriptions")
          .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
          .collect();
        creatorEarnings += creatorSubs
          .filter((s) => s.status === "active")
          .reduce((a, s) => a + s.creatorEarningsCents / 100, 0);

        const payouts = await ctx.db
          .query("payouts")
          .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
          .collect();
        paidOut += payouts
          .filter((p) => isPaidOutPayoutStatus(p.status))
          .reduce((a, p) => a + p.amountCents / 100, 0);
      }

      let role = "user";
      if (roles.includes("admin")) role = "admin";
      else if (ownedCreators.length > 0 || roles.includes("creator")) role = "creator";
      else if (activeSubs.length > 0 || roles.includes("subscriber")) role = "subscriber";

      page.push({
        id: u._id,
        email: u.email ?? "",
        fullName: u.fullName ?? null,
        createdAt: u.createdAt ?? u._creationTime,
        subCount: activeSubs.length,
        role,
        totalSpend,
        creatorEarnings,
        paidOut,
      });
    }

    return { ...result, page };
  },
});

/** Cursor-paginated creators with email + active subscriber count. */
export const listCreatorsPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminCreatorRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db.query("creators").order("desc").paginate(args.paginationOpts);

    const page = [];
    for (const c of result.page) {
      const user = await ctx.db.get(c.userId);
      const subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
        .collect();
      const activeCount = subs.filter((s) => s.status === "active").length;
      const monthly = (c.monthlyPriceCents ?? 999) / 100;
      page.push({
        id: c._id,
        username: c.username ?? null,
        displayName: c.displayName ?? null,
        monthlyPriceCents: c.monthlyPriceCents ?? null,
        isPublished: c.isPublished,
        createdAt: c.createdAt,
        userId: c.userId,
        email: user?.email ?? "—",
        subCount: activeCount,
        revenue: activeCount * monthly,
        verificationStatus: c.verificationStatus,
      });
    }

    return { ...result, page };
  },
});

/** Cursor-paginated payouts with creator display name. */
export const listPayoutsPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminPayoutRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db.query("payouts").order("desc").paginate(args.paginationOpts);

    const page = [];
    for (const p of result.page) {
      const creator = await ctx.db.get(p.creatorId);
      page.push({
        id: p._id,
        creatorId: p.creatorId,
        creatorName: creator
          ? (creator.displayName ?? `@${creator.username}`)
          : "Unknown",
        amountCents: p.amountCents,
        status: p.status,
        method: p.method ?? null,
        reference: p.reference ?? null,
        processedAt: p.processedAt ?? null,
        createdAt: p.createdAt,
      });
    }

    return { ...result, page };
  },
});

/** Thin paginated table reads for other admin surfaces still migrating. */
export const listSubscriptionsPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(
    v.object({
      _id: v.id("subscriptions"),
      _creationTime: v.number(),
      userId: v.id("users"),
      creatorId: v.id("creators"),
      status: v.string(),
      amountCents: v.number(),
      creatorEarningsCents: v.number(),
      platformFeeCents: v.number(),
      createdAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("subscriptions")
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((s) => ({
        _id: s._id,
        _creationTime: s._creationTime,
        userId: s.userId,
        creatorId: s.creatorId,
        status: s.status,
        amountCents: s.amountCents,
        creatorEarningsCents: s.creatorEarningsCents,
        platformFeeCents: s.platformFeeCents,
        createdAt: s.createdAt,
      })),
    };
  },
});
