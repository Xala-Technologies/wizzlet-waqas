import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { requireAdmin } from "../lib/auth";
import { ADMIN_JOIN_LIMIT, ADMIN_SCAN_MAX_DOCS, adminScanAll } from "../lib/adminLists";
import {
  takeCasesByStatus,
  takeCreatorsByPublished,
  takePaymentEventsByStatus,
  takePayoutsByStatus,
  takeSubsByStatus,
} from "../lib/adminIndexedTakes";
import { sumSettledEarningsByCreatorCents } from "../lib/payoutBalance";

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
 * Finance aggregates from status-indexed subscription/payout buckets (F-012).
 * Does not scan the creators table. Gross is subscription rows in those buckets,
 * not settled paymentEvents (payoutsOverview remains the event-based lifetime).
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
    const subStatuses = [
      "active",
      "canceled",
      "cancelled",
      "past_due",
      "failed",
      "incomplete",
      "unpaid",
      "trialing",
    ] as const;
    const subScans = await Promise.all(
      subStatuses.map((status) => takeSubsByStatus(ctx, status)),
    );
    const [paidScan, completedScan, pendingScan, processingScan, requestedScan] =
      await Promise.all([
        takePayoutsByStatus(ctx, "paid"),
        takePayoutsByStatus(ctx, "completed"),
        takePayoutsByStatus(ctx, "pending"),
        takePayoutsByStatus(ctx, "processing"),
        takePayoutsByStatus(ctx, "requested"),
      ]);
    const recentRows = await ctx.db.query("subscriptions").order("desc").take(8);

    const truncated =
      subScans.some((s) => s.truncated) ||
      paidScan.truncated ||
      completedScan.truncated ||
      pendingScan.truncated ||
      processingScan.truncated ||
      requestedScan.truncated;

    const seenSub = new Set<string>();
    const subs: Doc<"subscriptions">[] = [];
    for (const scan of subScans) {
      for (const s of scan.docs) {
        if (seenSub.has(s._id)) continue;
        seenSub.add(s._id);
        subs.push(s);
      }
    }

    const active = subs.filter((s) => s.status === "active");
    const grossRevenue = subs.reduce((a, b) => a + b.amountCents / 100, 0);
    const feeRevenue = subs.reduce((a, b) => a + b.platformFeeCents / 100, 0);
    const creatorEarnings = subs.reduce(
      (a, b) => a + b.creatorEarningsCents / 100,
      0,
    );
    const mrr = active.reduce((a, b) => a + b.amountCents / 100, 0);
    const feeMrr = active.reduce((a, b) => a + b.platformFeeCents / 100, 0);
    const paidOut = [...paidScan.docs, ...completedScan.docs].reduce(
      (a, b) => a + b.amountCents / 100,
      0,
    );
    const inFlight = [
      ...pendingScan.docs,
      ...processingScan.docs,
      ...requestedScan.docs,
    ].reduce((a, b) => a + b.amountCents / 100, 0);
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
    const topCreatorsRaw = [...byCreator.entries()]
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 8);

    const creatorIds = new Set<Id<"creators">>();
    for (const [id] of topCreatorsRaw) creatorIds.add(id as Id<"creators">);
    for (const s of recentRows) creatorIds.add(s.creatorId);
    const creatorNames = new Map<Id<"creators">, string>();
    for (const id of creatorIds) {
      const c = await ctx.db.get(id);
      creatorNames.set(
        id,
        c ? c.displayName || `@${c.username ?? "unknown"}` : "Unknown creator",
      );
    }

    const topCreators = topCreatorsRaw.map(([id, row]) => {
      const creatorId = id as Id<"creators">;
      return {
        id: creatorId,
        name: creatorNames.get(creatorId) ?? "Unknown creator",
        ...row,
      };
    });

    const recentTransactions = [];
    for (const s of recentRows) {
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
 * Active-subscription fee aggregates for Admin Fees (F-012).
 * Indexed `by_status=active` take; creator names via `db.get` (capped unique ids).
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
    const activeScan = await takeSubsByStatus(ctx, "active");
    const active = activeScan.docs;

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

    const creatorIds = [...feeByCreator.keys()] as Id<"creators">[];
    const namesTruncated = creatorIds.length > ADMIN_JOIN_LIMIT;
    const creatorNames = new Map<Id<"creators">, string>();
    for (const id of creatorIds.slice(0, ADMIN_JOIN_LIMIT)) {
      const c = await ctx.db.get(id);
      creatorNames.set(
        id,
        c ? c.displayName || `@${c.username ?? "unknown"}` : "Unknown creator",
      );
    }

    const creatorFees = [...feeByCreator.entries()]
      .map(([rawId, val]) => {
        const creatorId = rawId as Id<"creators">;
        const effective =
          val.amount > 0 ? Math.round((val.fee / val.amount) * 1000) / 10 : 0;
        return {
          name: creatorNames.get(creatorId) ?? "Unknown creator",
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
      truncated: activeScan.truncated || namesTruncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});

/**
 * Attention counts from status/published indexes (F-012).
 * Caps each bucket at ADMIN_SCAN_MAX_DOCS. Support unread still newest-capped (no read index).
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
    const [
      pastDue,
      failed,
      openCasesScan,
      escalatedCases,
      pendingPay,
      processingPay,
      requestedPay,
      unpublished,
      published,
      activeSubs,
    ] = await Promise.all([
      takeSubsByStatus(ctx, "past_due"),
      takeSubsByStatus(ctx, "failed"),
      takeCasesByStatus(ctx, "open"),
      takeCasesByStatus(ctx, "escalated"),
      takePayoutsByStatus(ctx, "pending"),
      takePayoutsByStatus(ctx, "processing"),
      takePayoutsByStatus(ctx, "requested"),
      takeCreatorsByPublished(ctx, false),
      takeCreatorsByPublished(ctx, true),
      takeSubsByStatus(ctx, "active"),
    ]);

    const supportDocs = await ctx.db
      .query("supportMessages")
      .order("desc")
      .take(ADMIN_SCAN_MAX_DOCS);
    const supportTruncated = supportDocs.length >= ADMIN_SCAN_MAX_DOCS;

    const truncated =
      pastDue.truncated ||
      failed.truncated ||
      openCasesScan.truncated ||
      escalatedCases.truncated ||
      pendingPay.truncated ||
      processingPay.truncated ||
      requestedPay.truncated ||
      unpublished.truncated ||
      published.truncated ||
      activeSubs.truncated ||
      supportTruncated;

    const failedPayments = pastDue.docs.length + failed.docs.length;
    const openCases = openCasesScan.docs.length + escalatedCases.docs.length;
    const unreadMessages = supportDocs.filter(
      (m) => m.senderRole === "creator" && !m.read,
    ).length;
    const pendingPayouts = [
      ...pendingPay.docs,
      ...processingPay.docs,
      ...requestedPay.docs,
    ];
    const unpublishedCreators = unpublished.docs.length;
    const activeCreatorIds = new Set(activeSubs.docs.map((s) => s.creatorId));
    const inactiveCreators = published.docs.filter((c) => {
      const days = Math.floor((args.nowMs - c.createdAt) / (1000 * 60 * 60 * 24));
      return days > 30 && !activeCreatorIds.has(c._id);
    }).length;

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

/**
 * Customer list KPIs from indexed status buckets (F-012).
 * Caps each status at ADMIN_SCAN_MAX_DOCS. Counts `canceled` and `cancelled`.
 */
export const customersOverview = query({
  args: {},
  returns: v.object({
    customerCount: v.number(),
    activeSubscriberCount: v.number(),
    activeSubCount: v.number(),
    revenue: v.number(),
    atRiskCount: v.number(),
    churnedCount: v.number(),
    truncated: v.boolean(),
    listLimit: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [activeScan, canceledScan, cancelledScan, pastDueScan, failedScan] =
      await Promise.all([
        takeSubsByStatus(ctx, "active"),
        takeSubsByStatus(ctx, "canceled"),
        takeSubsByStatus(ctx, "cancelled"),
        takeSubsByStatus(ctx, "past_due"),
        takeSubsByStatus(ctx, "failed"),
      ]);
    const truncated =
      activeScan.truncated ||
      canceledScan.truncated ||
      cancelledScan.truncated ||
      pastDueScan.truncated ||
      failedScan.truncated;

    const byUser = new Map<
      Id<"users">,
      {
        active: number;
        canceled: number;
        problem: number;
        spent: number;
      }
    >();

    const ingest = (
      docs: Doc<"subscriptions">[],
      kind: "active" | "canceled" | "problem",
    ) => {
      for (const s of docs) {
        const cur = byUser.get(s.userId) ?? {
          active: 0,
          canceled: 0,
          problem: 0,
          spent: 0,
        };
        cur.spent += s.amountCents / 100;
        if (kind === "active") cur.active += 1;
        else if (kind === "canceled") cur.canceled += 1;
        else cur.problem += 1;
        byUser.set(s.userId, cur);
      }
    };

    ingest(activeScan.docs, "active");
    ingest(canceledScan.docs, "canceled");
    ingest(cancelledScan.docs, "canceled");
    ingest(pastDueScan.docs, "problem");
    ingest(failedScan.docs, "problem");

    let activeSubscriberCount = 0;
    let activeSubCount = 0;
    let atRiskCount = 0;
    let churnedCount = 0;
    let revenue = 0;

    for (const row of byUser.values()) {
      revenue += row.spent;
      activeSubCount += row.active;
      if (row.active > 0) activeSubscriberCount += 1;
      if (row.problem > 0) atRiskCount += 1;
      else if (row.active === 0 && row.canceled > 0) churnedCount += 1;
    }

    return {
      customerCount: byUser.size,
      activeSubscriberCount,
      activeSubCount,
      revenue,
      atRiskCount,
      churnedCount,
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
 * Payout balances for Admin Payouts (F-012).
 * Lifetime from status-indexed settled/paid paymentEvents; payouts by status;
 * creator names via `db.get`. Caps each bucket at ADMIN_SCAN_MAX_DOCS.
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
    const [settledEvents, paidEvents, paidPayouts, completedPayouts, pendingPayouts, processingPayouts, requestedPayouts, approvedPayouts, failedPayouts] =
      await Promise.all([
        takePaymentEventsByStatus(ctx, "settled"),
        takePaymentEventsByStatus(ctx, "paid"),
        takePayoutsByStatus(ctx, "paid"),
        takePayoutsByStatus(ctx, "completed"),
        takePayoutsByStatus(ctx, "pending"),
        takePayoutsByStatus(ctx, "processing"),
        takePayoutsByStatus(ctx, "requested"),
        takePayoutsByStatus(ctx, "approved"),
        takePayoutsByStatus(ctx, "failed"),
      ]);
    const truncated =
      settledEvents.truncated ||
      paidEvents.truncated ||
      paidPayouts.truncated ||
      completedPayouts.truncated ||
      pendingPayouts.truncated ||
      processingPayouts.truncated ||
      requestedPayouts.truncated ||
      approvedPayouts.truncated ||
      failedPayouts.truncated;

    const eventDocs = [...settledEvents.docs, ...paidEvents.docs];
    const earnedCentsBy = sumSettledEarningsByCreatorCents(eventDocs);
    const earnedBy = new Map<string, number>();
    for (const [creatorId, cents] of earnedCentsBy) {
      earnedBy.set(creatorId, cents / 100);
    }

    const paidBy = new Map<string, number>();
    const inFlightBy = new Map<string, number>();
    let totalPaidOut = 0;
    let pending = 0;
    let processingCount = 0;
    let completedCount = 0;
    let lastPayoutAt: number | null = null;

    for (const p of [...paidPayouts.docs, ...completedPayouts.docs]) {
      const amount = p.amountCents / 100;
      paidBy.set(p.creatorId, (paidBy.get(p.creatorId) ?? 0) + amount);
      totalPaidOut += amount;
      completedCount += 1;
      const at = p.processedAt ?? p.createdAt;
      if (lastPayoutAt === null || at > lastPayoutAt) lastPayoutAt = at;
    }
    for (const p of [
      ...pendingPayouts.docs,
      ...processingPayouts.docs,
      ...requestedPayouts.docs,
      ...approvedPayouts.docs,
    ]) {
      const amount = p.amountCents / 100;
      inFlightBy.set(p.creatorId, (inFlightBy.get(p.creatorId) ?? 0) + amount);
      pending += amount;
      processingCount += 1;
    }
    const failedCount = failedPayouts.docs.length;

    const creatorIds = new Set<Id<"creators">>();
    for (const id of earnedBy.keys()) creatorIds.add(id as Id<"creators">);
    for (const id of paidBy.keys()) creatorIds.add(id as Id<"creators">);
    for (const id of inFlightBy.keys()) creatorIds.add(id as Id<"creators">);
    const idList = [...creatorIds];
    const namesTruncated = idList.length > ADMIN_JOIN_LIMIT;
    const creatorNames = new Map<Id<"creators">, string>();
    for (const id of idList.slice(0, ADMIN_JOIN_LIMIT)) {
      const c = await ctx.db.get(id);
      creatorNames.set(
        id,
        c ? c.displayName || `@${c.username ?? "unknown"}` : "Unknown creator",
      );
    }

    const balances = idList
      .map((creatorId) => {
        const earned = earnedBy.get(creatorId) ?? 0;
        const paid = paidBy.get(creatorId) ?? 0;
        const inFlight = inFlightBy.get(creatorId) ?? 0;
        return {
          creatorId,
          name: creatorNames.get(creatorId) ?? "Unknown creator",
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
      truncated: truncated || namesTruncated,
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
