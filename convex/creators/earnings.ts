import { query } from "../_generated/server";
import { getCreatorForUser, requireAppUser } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";
import { yearMonthKey } from "../lib/commerceIdentity";
import { resolveCreatorFeePolicy } from "../lib/money";
import { creatorEarningsValidator } from "../lib/validators";
import type { Id } from "../_generated/dataModel";

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

function feePercentFromCents(amountCents: number, platformFeeCents: number): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return 0;
  return Math.round((platformFeeCents / amountCents) * 1000) / 10;
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
        perSubCents: 0,
        activeCount: 0,
        monthly: [] as { month: string; revenueCents: number }[],
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
    const grossCents = active.reduce((a, b) => a + b.amountCents, 0);
    const feeCents = active.reduce((a, b) => a + b.platformFeeCents, 0);
    const netCents = active.reduce((a, b) => a + b.creatorEarningsCents, 0);

    const events = await ctx.db
      .query("paymentEvents")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .take(ADMIN_SCAN_MAX_DOCS);
    const truncated =
      subs.length >= ADMIN_SCAN_MAX_DOCS ||
      events.length >= ADMIN_SCAN_MAX_DOCS;
    const sorted = events
      .filter((e) => e.paymentMode !== "sandbox")
      .sort((a, b) => b.createdAt - a.createdAt);

    const monthMap = new Map<string, number>();
    for (const e of sorted) {
      const key = yearMonthKey(e.createdAt);
      monthMap.set(key, (monthMap.get(key) ?? 0) + e.creatorEarningsCents);
    }
    const monthly = [...monthMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenueCents]) => ({
        month,
        revenueCents,
      }));

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
    for (const e of sorted.slice(0, 40)) {
      let customerName = "Subscriber";
      let customerEmail: string | null = null;
      if (e.userId) {
        const u = await ctx.db.get(e.userId);
        customerName = u?.fullName || u?.email || "Subscriber";
        customerEmail = u?.email ?? null;
      }
      let productName: string | null = null;
      if (e.productId) {
        const product = await ctx.db.get(e.productId);
        productName = product?.name ?? null;
      }
      recentPayments.push({
        id: e._id,
        label: `Subscription — ${customerName}`,
        amountCents: e.amountCents,
        platformFeeCents: e.platformFeeCents,
        creatorEarningsCents: e.creatorEarningsCents,
        feePercentage: feePercentFromCents(e.amountCents, e.platformFeeCents),
        status: e.status,
        type: e.type,
        productName,
        customerEmail,
        paymentRef: e.commercialRef ?? e.externalRef ?? e.checkoutSessionId ?? null,
        createdAt: e.createdAt,
      });
    }

    return {
      grossCents,
      feeCents,
      netCents,
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
