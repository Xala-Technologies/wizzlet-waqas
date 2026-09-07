import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { requireAdmin } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS, adminScanAll } from "../lib/adminLists";
import { isPaidOutPayoutStatus } from "../lib/payoutBalance";

const monthPointValidator = v.object({
  month: v.string(),
  revenue: v.number(),
  fees: v.number(),
  earnings: v.number(),
});

const topCreatorValidator = v.object({
  id: v.id("creators"),
  name: v.string(),
  revenue: v.number(),
  earnings: v.number(),
  fees: v.number(),
  subs: v.number(),
});

const recentTxnValidator = v.object({
  id: v.id("subscriptions"),
  creatorName: v.string(),
  userEmail: v.string(),
  amount: v.number(),
  status: v.string(),
  createdAt: v.number(),
});

/**
 * Exact finance aggregates for Admin Finance (no 500-row take).
 * `nowMs` from client keeps month buckets deterministic.
 */
export const financeOverview = query({
  args: { nowMs: v.number() },
  returns: v.object({
    grossRevenue: v.number(),
    feeRevenue: v.number(),
    creatorEarnings: v.number(),
    mrr: v.number(),
    feeMrr: v.number(),
    paidOut: v.number(),
    inFlight: v.number(),
    liability: v.number(),
    effectiveRate: v.number(),
    activeCount: v.number(),
    monthly: v.array(monthPointValidator),
    topCreators: v.array(topCreatorValidator),
    recentTransactions: v.array(recentTxnValidator),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const subsScan = await adminScanAll(ctx, "subscriptions");
    const payoutsScan = await adminScanAll(ctx, "payouts");
    const creatorsScan = await adminScanAll(ctx, "creators");
    const truncated =
      subsScan.truncated || payoutsScan.truncated || creatorsScan.truncated;

    const subs = subsScan.docs;
    const payouts = payoutsScan.docs;
    const creatorNames = new Map(
      creatorsScan.docs.map((c) => [
        c._id,
        c.displayName || `@${c.username ?? "unknown"}`,
      ]),
    );

    const active = subs.filter((s) => s.status === "active");
    const grossRevenue = subs.reduce((a, b) => a + b.amountCents / 100, 0);
    const feeRevenue = subs.reduce((a, b) => a + b.platformFeeCents / 100, 0);
    const creatorEarnings = subs.reduce(
      (a, b) => a + b.creatorEarningsCents / 100,
      0,
    );
    const mrr = active.reduce((a, b) => a + b.amountCents / 100, 0);
    const feeMrr = active.reduce((a, b) => a + b.platformFeeCents / 100, 0);
    const paidOut = payouts
      .filter((p) => isPaidOutPayoutStatus(p.status))
      .reduce((a, b) => a + b.amountCents / 100, 0);
    const inFlight = payouts
      .filter((p) => p.status === "pending" || p.status === "processing" || p.status === "requested")
      .reduce((a, b) => a + b.amountCents / 100, 0);
    const liability = Math.max(0, creatorEarnings - paidOut - inFlight);
    const effectiveRate = grossRevenue > 0 ? (feeRevenue / grossRevenue) * 100 : 0;

    const now = new Date(args.nowMs);
    const monthly: Array<{
      month: string;
      revenue: number;
      fees: number;
      earnings: number;
    }> = [];
    const monthIndex = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthIndex.set(`${d.getFullYear()}-${d.getMonth()}`, monthly.length);
      monthly.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        revenue: 0,
        fees: 0,
        earnings: 0,
      });
    }
    for (const s of subs) {
      const d = new Date(s.createdAt);
      const pos = monthIndex.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (pos === undefined) continue;
      monthly[pos]!.revenue += s.amountCents / 100;
      monthly[pos]!.fees += s.platformFeeCents / 100;
      monthly[pos]!.earnings += s.creatorEarningsCents / 100;
    }

    const byCreator = new Map<
      string,
      { revenue: number; earnings: number; fees: number; subs: number }
    >();
    for (const s of active) {
      const prev = byCreator.get(s.creatorId) ?? {
        revenue: 0,
        earnings: 0,
        fees: 0,
        subs: 0,
      };
      byCreator.set(s.creatorId, {
        revenue: prev.revenue + s.amountCents / 100,
        earnings: prev.earnings + s.creatorEarningsCents / 100,
        fees: prev.fees + s.platformFeeCents / 100,
        subs: prev.subs + 1,
      });
    }
    const topCreators = [...byCreator.entries()]
      .map(([id, row]) => {
        const creatorId = id as Id<"creators">;
        return {
          id: creatorId,
          name: creatorNames.get(creatorId) ?? "Unknown creator",
          ...row,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);

    const recentSorted = [...subs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8);
    const recentTransactions = [];
    for (const s of recentSorted) {
      const user = await ctx.db.get(s.userId);
      recentTransactions.push({
        id: s._id,
        creatorName: creatorNames.get(s.creatorId) ?? "Unknown creator",
        userEmail: user?.email ?? "Unknown customer",
        amount: s.amountCents / 100,
        status: s.status,
        createdAt: s.createdAt,
      });
    }

    return {
      grossRevenue,
      feeRevenue,
      creatorEarnings,
      mrr,
      feeMrr,
      paidOut,
      inFlight,
      liability,
      effectiveRate,
      activeCount: active.length,
      monthly: monthly.map((b) => ({
        month: b.month,
        revenue: Number(b.revenue.toFixed(2)),
        fees: Number(b.fees.toFixed(2)),
        earnings: Number(b.earnings.toFixed(2)),
      })),
      topCreators,
      recentTransactions,
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});

/**
 * Exact fee aggregates for Admin Fees.
 */
export const feesOverview = query({
  args: { nowMs: v.number() },
  returns: v.object({
    totalRevenue: v.number(),
    totalFees: v.number(),
    totalCreatorEarnings: v.number(),
    introFeeCount: v.number(),
    standardFeeCount: v.number(),
    monthlyFees: v.array(v.object({ month: v.string(), fees: v.number() })),
    creatorFees: v.array(
      v.object({
        name: v.string(),
        feeEarned: v.number(),
        feePercent: v.number(),
        subCount: v.number(),
      }),
    ),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const subsScan = await adminScanAll(ctx, "subscriptions");
    const creatorsScan = await adminScanAll(ctx, "creators");
    const truncated = subsScan.truncated || creatorsScan.truncated;
    const active = subsScan.docs.filter((s) => s.status === "active");
    const creatorMap = new Map(creatorsScan.docs.map((c) => [c._id, c]));

    const now = new Date(args.nowMs);
    const buckets: Array<{ month: string; fees: number }> = [];
    const index = new Map<string, number>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      index.set(`${d.getFullYear()}-${d.getMonth()}`, buckets.length);
      buckets.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        fees: 0,
      });
    }
    for (const s of active) {
      const d = new Date(s.createdAt);
      const pos = index.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (pos !== undefined) buckets[pos]!.fees += s.platformFeeCents / 100;
    }

    const feeByCreator = new Map<
      string,
      { fee: number; count: number; amount: number }
    >();
    for (const s of active) {
      const prev = feeByCreator.get(s.creatorId) ?? { fee: 0, count: 0, amount: 0 };
      feeByCreator.set(s.creatorId, {
        fee: prev.fee + s.platformFeeCents / 100,
        count: prev.count + 1,
        amount: prev.amount + s.amountCents / 100,
      });
    }

    const creatorFees = [...feeByCreator.entries()]
      .map(([rawId, val]) => {
        const c = creatorMap.get(rawId as Id<"creators">);
        const effective =
          val.amount > 0 ? Math.round((val.fee / val.amount) * 1000) / 10 : 0;
        return {
          name: c?.displayName ?? `@${c?.username ?? "unknown"}`,
          feeEarned: val.fee,
          feePercent: effective,
          subCount: val.count,
        };
      })
      .sort((a, b) => b.feeEarned - a.feeEarned);

    return {
      totalRevenue: active.reduce((a, b) => a + b.amountCents / 100, 0),
      totalFees: active.reduce((a, b) => a + b.platformFeeCents / 100, 0),
      totalCreatorEarnings: active.reduce(
        (a, b) => a + b.creatorEarningsCents / 100,
        0,
      ),
      introFeeCount: active.filter((s) => s.feePercentage <= 5).length,
      standardFeeCount: active.filter((s) => s.feePercentage > 5).length,
      monthlyFees: buckets.map((b) => ({
        month: b.month,
        fees: Number(b.fees.toFixed(2)),
      })),
      creatorFees,
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});

/**
 * Exact attention counts for Admin Alerts.
 * `nowMs` from client keeps the query deterministic (no Date.now in query).
 */
export const alertsOverview = query({
  args: { nowMs: v.number() },
  returns: v.object({
    failedPayments: v.number(),
    openCases: v.number(),
    unreadMessages: v.number(),
    pendingPayouts: v.number(),
    pendingPayoutTotal: v.number(),
    unpublishedCreators: v.number(),
    inactiveCreators: v.number(),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const subsScan = await adminScanAll(ctx, "subscriptions");
    const casesScan = await adminScanAll(ctx, "resolutionCases");
    const supportScan = await adminScanAll(ctx, "supportMessages");
    const payoutsScan = await adminScanAll(ctx, "payouts");
    const creatorsScan = await adminScanAll(ctx, "creators");
    const truncated =
      subsScan.truncated ||
      casesScan.truncated ||
      supportScan.truncated ||
      payoutsScan.truncated ||
      creatorsScan.truncated;

    const failedPayments = subsScan.docs.filter(
      (s) => s.status === "past_due" || s.status === "failed",
    ).length;
    const openCases = casesScan.docs.filter(
      (c) => c.status === "open" || c.status === "escalated",
    ).length;
    const unreadMessages = supportScan.docs.filter(
      (m) => m.senderRole === "creator" && !m.read,
    ).length;
    const pendingPayouts = payoutsScan.docs.filter(
      (p) =>
        p.status === "pending" ||
        p.status === "processing" ||
        p.status === "requested",
    );
    const unpublishedCreators = creatorsScan.docs.filter((c) => !c.isPublished)
      .length;

    let inactiveCreators = 0;
    for (const c of creatorsScan.docs) {
      const days = Math.floor(
        (args.nowMs - c.createdAt) / (1000 * 60 * 60 * 24),
      );
      if (days <= 30) continue;
      const activeSubs = subsScan.docs.filter(
        (s) => s.creatorId === c._id && s.status === "active",
      );
      if (activeSubs.length === 0) inactiveCreators += 1;
    }

    return {
      failedPayments,
      openCases,
      unreadMessages,
      pendingPayouts: pendingPayouts.length,
      pendingPayoutTotal: pendingPayouts.reduce(
        (a, b) => a + b.amountCents / 100,
        0,
      ),
      unpublishedCreators,
      inactiveCreators,
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});

const payoutBalanceRowValidator = v.object({
  creatorId: v.id("creators"),
  name: v.string(),
  earned: v.number(),
  paid: v.number(),
  inFlight: v.number(),
  available: v.number(),
});

/**
 * Exact-ish payout balances for Admin Payouts (D1).
 * Does not use paginated history pages for paid/in-flight totals.
 */
export const payoutsOverview = query({
  args: {},
  returns: v.object({
    balances: v.array(payoutBalanceRowValidator),
    totalPaidOut: v.number(),
    pending: v.number(),
    owed: v.number(),
    lastPayoutAt: v.union(v.number(), v.null()),
    processingCount: v.number(),
    completedCount: v.number(),
    failedCount: v.number(),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const subsScan = await adminScanAll(ctx, "subscriptions");
    const payoutsScan = await adminScanAll(ctx, "payouts");
    const creatorsScan = await adminScanAll(ctx, "creators");
    const truncated =
      subsScan.truncated || payoutsScan.truncated || creatorsScan.truncated;

    const earnedBy = new Map<string, number>();
    for (const s of subsScan.docs) {
      if (s.status !== "active") continue;
      earnedBy.set(
        s.creatorId,
        (earnedBy.get(s.creatorId) ?? 0) + s.creatorEarningsCents / 100,
      );
    }

    const paidBy = new Map<string, number>();
    const inFlightBy = new Map<string, number>();
    let totalPaidOut = 0;
    let pending = 0;
    let processingCount = 0;
    let completedCount = 0;
    let failedCount = 0;
    let lastPayoutAt: number | null = null;

    for (const p of payoutsScan.docs) {
      const amount = p.amountCents / 100;
      if (isPaidOutPayoutStatus(p.status)) {
        paidBy.set(p.creatorId, (paidBy.get(p.creatorId) ?? 0) + amount);
        totalPaidOut += amount;
        completedCount += 1;
        const at = p.processedAt ?? p.createdAt;
        if (lastPayoutAt === null || at > lastPayoutAt) lastPayoutAt = at;
      } else if (
        p.status === "pending" ||
        p.status === "processing" ||
        p.status === "requested"
      ) {
        inFlightBy.set(p.creatorId, (inFlightBy.get(p.creatorId) ?? 0) + amount);
        pending += amount;
        processingCount += 1;
      } else if (p.status === "failed") {
        failedCount += 1;
      }
    }

    const balances = creatorsScan.docs
      .map((c) => {
        const earned = earnedBy.get(c._id) ?? 0;
        const paid = paidBy.get(c._id) ?? 0;
        const inFlight = inFlightBy.get(c._id) ?? 0;
        return {
          creatorId: c._id,
          name: c.displayName || `@${c.username ?? "unknown"}`,
          earned,
          paid,
          inFlight,
          available: Math.max(0, earned - paid - inFlight),
        };
      })
      .filter((r) => r.earned > 0 || r.paid > 0 || r.inFlight > 0)
      .sort((a, b) => b.available - a.available);

    const owed = balances.reduce((a, b) => a + b.available, 0);

    return {
      balances,
      totalPaidOut,
      pending,
      owed,
      lastPayoutAt,
      processingCount,
      completedCount,
      failedCount,
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});

/**
 * Scanned source tables for Admin Reports CSV (D2) — honest truncation.
 */
export const reportSourceData = query({
  args: {},
  returns: v.object({
    creators: v.array(
      v.object({
        _id: v.id("creators"),
        displayName: v.union(v.string(), v.null()),
        username: v.union(v.string(), v.null()),
        isPublished: v.boolean(),
        monthlyPriceCents: v.union(v.number(), v.null()),
        createdAt: v.number(),
      }),
    ),
    users: v.array(
      v.object({
        _id: v.id("users"),
        fullName: v.union(v.string(), v.null()),
        username: v.optional(v.string()),
        email: v.optional(v.string()),
        createdAt: v.union(v.number(), v.null()),
      }),
    ),
    subscriptions: v.array(
      v.object({
        _id: v.id("subscriptions"),
        userId: v.id("users"),
        creatorId: v.id("creators"),
        status: v.string(),
        amountCents: v.number(),
        platformFeeCents: v.number(),
        creatorEarningsCents: v.number(),
        feePercentage: v.number(),
        createdAt: v.number(),
      }),
    ),
    payouts: v.array(
      v.object({
        _id: v.id("payouts"),
        creatorId: v.id("creators"),
        amountCents: v.number(),
        status: v.string(),
        method: v.union(v.string(), v.null()),
        reference: v.union(v.string(), v.null()),
        processedAt: v.union(v.number(), v.null()),
        createdAt: v.number(),
      }),
    ),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const creatorsScan = await adminScanAll(ctx, "creators");
    const usersScan = await adminScanAll(ctx, "users");
    const subsScan = await adminScanAll(ctx, "subscriptions");
    const payoutsScan = await adminScanAll(ctx, "payouts");
    const truncated =
      creatorsScan.truncated ||
      usersScan.truncated ||
      subsScan.truncated ||
      payoutsScan.truncated;

    return {
      creators: creatorsScan.docs.map((c) => ({
        _id: c._id,
        displayName: c.displayName ?? null,
        username: c.username ?? null,
        isPublished: c.isPublished,
        monthlyPriceCents: c.monthlyPriceCents ?? null,
        createdAt: c.createdAt,
      })),
      users: usersScan.docs.map((u) => ({
        _id: u._id,
        fullName: u.fullName ?? null,
        username: u.username,
        email: u.email,
        createdAt: u.createdAt ?? null,
      })),
      subscriptions: subsScan.docs.map((s) => ({
        _id: s._id,
        userId: s.userId,
        creatorId: s.creatorId,
        status: s.status,
        amountCents: s.amountCents,
        platformFeeCents: s.platformFeeCents,
        creatorEarningsCents: s.creatorEarningsCents,
        feePercentage: s.feePercentage,
        createdAt: s.createdAt,
      })),
      payouts: payoutsScan.docs.map((p) => ({
        _id: p._id,
        creatorId: p.creatorId,
        amountCents: p.amountCents,
        status: p.status,
        method: p.method ?? null,
        reference: p.reference ?? null,
        processedAt: p.processedAt ?? null,
        createdAt: p.createdAt,
      })),
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});
