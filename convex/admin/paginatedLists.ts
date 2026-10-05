import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { listRolesForUser, requireAdmin } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS, adminJoinCap } from "../lib/adminLists";
import { isPaidOutPayoutStatus } from "../lib/payoutBalance";

const ROLE_DISPLAY_ORDER = [
  "admin",
  "creator",
  "subscriber",
  "moderator",
  "user",
] as const;

function sortRolesForDisplay(roles: string[]): string[] {
  return [...roles].sort((a, b) => {
    const ai = ROLE_DISPLAY_ORDER.indexOf(a as (typeof ROLE_DISPLAY_ORDER)[number]);
    const bi = ROLE_DISPLAY_ORDER.indexOf(b as (typeof ROLE_DISPLAY_ORDER)[number]);
    const aRank = ai === -1 ? ROLE_DISPLAY_ORDER.length : ai;
    const bRank = bi === -1 ? ROLE_DISPLAY_ORDER.length : bi;
    return aRank - bRank || a.localeCompare(b);
  });
}

const adminUserRowValidator = v.object({
  id: v.id("users"),
  email: v.string(),
  fullName: v.union(v.string(), v.null()),
  createdAt: v.number(),
  subCount: v.number(),
  /** Primary role for legacy single-badge consumers. */
  role: v.string(),
  /** All held `userRoles` (sorted admin → creator → subscriber → …). */
  roles: v.array(v.string()),
  totalSpend: v.number(),
  creatorEarnings: v.number(),
  paidOut: v.number(),
  /** True when a per-row join hit ADMIN_JOIN_LIMIT (spend/earnings may be incomplete). */
  metricsTruncated: v.boolean(),
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
  metricsTruncated: v.boolean(),
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
 * Indexed joins are `.take(ADMIN_JOIN_LIMIT)`, never `.collect()`.
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
      const joinCap = adminJoinCap();
      const subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .take(joinCap);
      const activeSubs = subs.filter((s) => s.status === "active");
      const totalSpend = subs.reduce((a, s) => a + s.amountCents / 100, 0);

      const ownedCreators = await ctx.db
        .query("creators")
        .withIndex("by_userId", (q) => q.eq("userId", u._id))
        .take(joinCap);

      let creatorEarnings = 0;
      let paidOut = 0;
      let metricsTruncated =
        subs.length >= joinCap || ownedCreators.length >= joinCap;
      for (const c of ownedCreators) {
        const creatorSubs = await ctx.db
          .query("subscriptions")
          .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
          .take(joinCap);
        if (creatorSubs.length >= joinCap) metricsTruncated = true;
        creatorEarnings += creatorSubs
          .filter((s) => s.status === "active")
          .reduce((a, s) => a + s.creatorEarningsCents / 100, 0);

        const payouts = await ctx.db
          .query("payouts")
          .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
          .take(joinCap);
        if (payouts.length >= joinCap) metricsTruncated = true;
        paidOut += payouts
          .filter((p) => isPaidOutPayoutStatus(p.status))
          .reduce((a, p) => a + p.amountCents / 100, 0);
      }

      const heldRoles = sortRolesForDisplay(roles);
      let role = heldRoles[0] ?? "user";
      if (heldRoles.length === 0) {
        if (ownedCreators.length > 0) role = "creator";
        else if (activeSubs.length > 0) role = "subscriber";
      } else if (
        !heldRoles.includes("creator") &&
        ownedCreators.length > 0 &&
        !heldRoles.includes("admin")
      ) {
        // Creator profile without role row — keep primary as creator for display.
        role = "creator";
      }

      page.push({
        id: u._id,
        email: u.email ?? "",
        fullName: u.fullName ?? null,
        createdAt: u.createdAt ?? u._creationTime,
        subCount: activeSubs.length,
        role,
        roles:
          heldRoles.length > 0
            ? heldRoles
            : role !== "user"
              ? [role]
              : ["user"],
        totalSpend,
        creatorEarnings,
        paidOut,
        metricsTruncated,
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
      const joinCap = adminJoinCap();
      const subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_creatorId", (q) => q.eq("creatorId", c._id))
        .take(joinCap);
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
        metricsTruncated: subs.length >= joinCap,
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

const adminCustomerRowValidator = v.object({
  id: v.id("users"),
  email: v.string(),
  fullName: v.union(v.string(), v.null()),
  createdAt: v.number(),
  subCount: v.number(),
  activeCount: v.number(),
  canceledCount: v.number(),
  totalSpent: v.number(),
  lastActivity: v.number(),
  metricsTruncated: v.boolean(),
});

const adminCaseRowValidator = v.object({
  id: v.id("resolutionCases"),
  creatorId: v.id("creators"),
  creatorName: v.string(),
  subject: v.string(),
  category: v.string(),
  description: v.union(v.string(), v.null()),
  status: v.string(),
  priority: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const adminSupportRowValidator = v.object({
  id: v.id("supportMessages"),
  creatorId: v.id("creators"),
  creatorName: v.string(),
  senderRole: v.string(),
  channel: v.string(),
  body: v.string(),
  read: v.boolean(),
  createdAt: v.number(),
});

const adminTransactionRowValidator = v.object({
  id: v.id("subscriptions"),
  status: v.string(),
  createdAt: v.number(),
  userName: v.string(),
  creatorName: v.string(),
  amountCents: v.number(),
  creatorEarningsCents: v.number(),
  platformFeeCents: v.number(),
  feePercentage: v.number(),
});

/**
 * Cursor-paginated customers from newest subscriptions (F-012).
 * Dedupes userIds within the page; per-user stats use indexed `.take(ADMIN_JOIN_LIMIT)`.
 * `canceledCount` includes `canceled` and `cancelled`.
 */
export const listCustomersPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminCustomerRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("subscriptions")
      .order("desc")
      .paginate(args.paginationOpts);

    const seen = new Set<Id<"users">>();
    const page = [];
    const joinCap = adminJoinCap();

    for (const row of result.page) {
      if (seen.has(row.userId)) continue;
      seen.add(row.userId);
      const u = await ctx.db.get(row.userId);
      if (!u) continue;
      const subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId", (q) => q.eq("userId", row.userId))
        .take(joinCap);
      const active = subs.filter((s) => s.status === "active");
      const canceled = subs.filter(
        (s) => s.status === "canceled" || s.status === "cancelled",
      );
      const totalSpent = subs.reduce((a, s) => a + s.amountCents / 100, 0);
      const createdAt = u.createdAt ?? u._creationTime;
      const lastActivity = subs.reduce((max, s) => Math.max(max, s.createdAt), createdAt);
      page.push({
        id: u._id,
        email: u.email ?? "",
        fullName: u.fullName ?? null,
        createdAt,
        subCount: subs.length,
        activeCount: active.length,
        canceledCount: canceled.length,
        totalSpent,
        lastActivity,
        metricsTruncated: subs.length >= joinCap,
      });
    }

    return { ...result, page };
  },
});

/** Cursor-paginated resolution cases with creator display name. */
export const listCasesPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminCaseRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("resolutionCases")
      .order("desc")
      .paginate(args.paginationOpts);

    const page = [];
    for (const c of result.page) {
      const creator = await ctx.db.get(c.creatorId);
      page.push({
        id: c._id,
        creatorId: c.creatorId,
        creatorName: creator
          ? (creator.displayName || creator.username || "Unnamed creator")
          : "Unknown creator",
        subject: c.subject,
        category: c.category ?? "general",
        description: c.description ?? null,
        status: c.status,
        priority: c.priority ?? "normal",
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    return { ...result, page };
  },
});

/** Cursor-paginated support messages with creator display name. */
export const listSupportMessagesPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminSupportRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("supportMessages")
      .order("desc")
      .paginate(args.paginationOpts);

    const page = [];
    for (const m of result.page) {
      const creator = await ctx.db.get(m.creatorId);
      page.push({
        id: m._id,
        creatorId: m.creatorId,
        creatorName: creator
          ? (creator.displayName || creator.username || "Unnamed creator")
          : "Unknown creator",
        senderRole: m.senderRole,
        channel: m.channel ?? "growth",
        body: m.body,
        read: m.read,
        createdAt: m.createdAt,
      });
    }

    return { ...result, page };
  },
});

const transactionStatusFilterValidator = v.union(
  v.literal("all"),
  v.literal("active"),
  v.literal("canceled"),
  v.literal("past_due"),
  v.literal("failed"),
  v.literal("incomplete"),
  v.literal("trialing"),
  v.literal("unpaid"),
);

/**
 * Cursor-paginated subscription “transactions” with user/creator names.
 * `status: "failed"` matches Alerts (failed + past_due payment problems).
 */
export const listTransactionsPage = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(transactionStatusFilterValidator),
  },
  returns: paginationResultValidator(adminTransactionRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const statusFilter = args.status ?? "all";

    async function enrich(
      rows: Array<{
        _id: Id<"subscriptions">;
        status: string;
        createdAt: number;
        userId: Id<"users">;
        creatorId: Id<"creators">;
        amountCents: number;
        creatorEarningsCents: number;
        platformFeeCents: number;
        feePercentage: number;
      }>,
    ) {
      const page = [];
      for (const s of rows) {
        const user = await ctx.db.get(s.userId);
        const creator = await ctx.db.get(s.creatorId);
        page.push({
          id: s._id,
          status: s.status,
          createdAt: s.createdAt,
          userName: user?.fullName ?? user?.email ?? "Unknown",
          creatorName: creator
            ? (creator.displayName ?? `@${creator.username}`)
            : "Unknown",
          amountCents: s.amountCents,
          creatorEarningsCents: s.creatorEarningsCents,
          platformFeeCents: s.platformFeeCents,
          feePercentage: s.feePercentage,
        });
      }
      return page;
    }

    // Alerts deep-link: payment problems = failed + past_due (indexed takes, then offset page).
    if (statusFilter === "failed") {
      const failed = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", "failed"))
        .order("desc")
        .take(ADMIN_SCAN_MAX_DOCS);
      const pastDue = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", "past_due"))
        .order("desc")
        .take(ADMIN_SCAN_MAX_DOCS);
      const merged = [...failed, ...pastDue].sort(
        (a, b) => b.createdAt - a.createdAt,
      );
      const start = args.paginationOpts.cursor
        ? Number.parseInt(args.paginationOpts.cursor, 10)
        : 0;
      const startIndex = Number.isFinite(start) && start > 0 ? start : 0;
      const numItems = args.paginationOpts.numItems;
      const slice = merged.slice(startIndex, startIndex + numItems);
      const nextIndex = startIndex + numItems;
      return {
        page: await enrich(slice),
        isDone: nextIndex >= merged.length,
        continueCursor: String(nextIndex),
      };
    }

    if (statusFilter !== "all") {
      const result = await ctx.db
        .query("subscriptions")
        .withIndex("by_status", (q) => q.eq("status", statusFilter))
        .order("desc")
        .paginate(args.paginationOpts);
      return { ...result, page: await enrich(result.page) };
    }

    const result = await ctx.db
      .query("subscriptions")
      .order("desc")
      .paginate(args.paginationOpts);
    return { ...result, page: await enrich(result.page) };
  },
});

const adminCampaignRowValidator = v.object({
  id: v.id("emailCampaigns"),
  subject: v.string(),
  body: v.string(),
  audience: v.union(v.string(), v.null()),
  recipients: v.number(),
  status: v.string(),
  createdAt: v.number(),
});

/** Cursor-paginated in-app announcement history. */
export const listCampaignsPage = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(adminCampaignRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const result = await ctx.db
      .query("emailCampaigns")
      .order("desc")
      .paginate(args.paginationOpts);
    return {
      ...result,
      page: result.page.map((c) => ({
        id: c._id,
        subject: c.subject,
        body: c.body,
        audience: c.audience ?? null,
        recipients: c.recipients,
        status: c.status,
        createdAt: c.createdAt,
      })),
    };
  },
});
