import { query } from "../_generated/server";
import { getCreatorForUser, requireAppUser } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";
import { yearMonthKey } from "../lib/commerceIdentity";
import { resolveCreatorFeePolicy } from "../lib/money";
import { creatorEarningsValidator } from "../lib/validators";
import { isReportPayment, settledReportPayments, sumReportPayments, paymentFeePercent } from "../lib/reportingLedger";
import type { Doc, Id } from "../_generated/dataModel";

const DEFAULT_FEE = {
  introFeePercent: 5,
  standardFeePercent: 10,
  introFeeDays: 30,
};

function emptyFeePolicy() {
  return {
    ...DEFAULT_FEE,
    currentFeePercent: DEFAULT_FEE.standardFeePercent,
    introDaysLeft: 0,
  };
}

/** Creator earnings dashboard — real subscriptions + paymentEvents (no fake names). */
export const myEarnings = query({
  args: {},
  returns: creatorEarningsValidator,
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    const settingsRow = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    const settings = {
      introFeePercent: settingsRow?.introFeePercent ?? DEFAULT_FEE.introFeePercent,
      standardFeePercent: settingsRow?.standardFeePercent ?? DEFAULT_FEE.standardFeePercent,
      introFeeDays: settingsRow?.introFeeDays ?? DEFAULT_FEE.introFeeDays,
    };

    if (!creator) {
      return {
        grossCents: 0,
        feeCents: 0,
        netCents: 0,
        monthlyRecurringNetCents: 0,
        perSubCents: 0,
        activeCount: 0,
        monthly: [] as { month: string; revenueCents: number; grossCents: number }[],
        recentPayments: [],
        feePolicy: emptyFeePolicy(),
        truncated: false,
        listLimit: ADMIN_SCAN_MAX_DOCS,
      };
    }

    const feePolicy = resolveCreatorFeePolicy(settings, creator.createdAt);

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .take(ADMIN_SCAN_MAX_DOCS);
    const active = subs.filter((s) => s.status === "active");

    const events = await ctx.db
      .query("paymentEvents")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .order("desc")
      .take(ADMIN_SCAN_MAX_DOCS);
    const truncated =
      subs.length >= ADMIN_SCAN_MAX_DOCS ||
      events.length >= ADMIN_SCAN_MAX_DOCS;
    const sorted = events
      .filter(isReportPayment)
      .sort((a, b) => b.createdAt - a.createdAt);

    const totals = sumReportPayments(events);
    const monthMap = new Map<string, { revenueCents: number; grossCents: number }>();
    for (const e of settledReportPayments(sorted)) {
      const key = yearMonthKey(e.createdAt);
      const previous = monthMap.get(key) ?? { revenueCents: 0, grossCents: 0 };
      monthMap.set(key, { revenueCents: previous.revenueCents + e.creatorEarningsCents, grossCents: previous.grossCents + e.amountCents });
    }
    const monthly = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, totals]) => ({ month, ...totals }));

    const recentPayments: Array<{
      id: Id<"paymentEvents">;
      label: string;
      amountCents: number;
      platformFeeCents: number;
      creatorEarningsCents: number;
      feePercentage: number;
      status: string;
      type: string;
      productName: string | null;
      customerEmail: string | null;
      paymentRef: string | null;
      createdAt: number;
    }> = [];
    const userCache = new Map<Id<"users">, Doc<"users"> | null>();
    const productCache = new Map<Id<"products">, Doc<"products"> | null>();
    for (const e of sorted) {
      let customerName = "Subscriber";
      let customerEmail: string | null = null;
      if (e.userId) {
        if (!userCache.has(e.userId)) userCache.set(e.userId, await ctx.db.get(e.userId));
        const u = userCache.get(e.userId);
        customerName = u?.fullName || u?.email || "Subscriber";
        customerEmail = u?.email ?? null;
      }
      let productName: string | null = null;
      if (e.productId) {
        if (!productCache.has(e.productId)) productCache.set(e.productId, await ctx.db.get(e.productId));
        const product = productCache.get(e.productId);
        productName = product?.name ?? null;
      }
      recentPayments.push({
        id: e._id,
        label: `Subscription — ${customerName}`,
        amountCents: e.amountCents,
        platformFeeCents: e.platformFeeCents,
        creatorEarningsCents: e.creatorEarningsCents,
        feePercentage: paymentFeePercent(e.amountCents, e.platformFeeCents),
        status: e.status,
        type: e.type,
        productName,
        customerEmail,
        paymentRef: e.commercialRef ?? e.externalRef ?? e.checkoutSessionId ?? null,
        createdAt: e.createdAt,
      });
    }

    return {
      grossCents: totals.amountCents,
      feeCents: totals.platformFeeCents,
      netCents: totals.creatorEarningsCents,
      monthlyRecurringNetCents: active.reduce((sum, s) => sum + s.creatorEarningsCents, 0),
      perSubCents: creator.monthlyPriceCents ?? 0,
      activeCount: active.length,
      monthly,
      recentPayments,
      feePolicy,
      truncated,
      listLimit: ADMIN_SCAN_MAX_DOCS,
    };
  },
});
