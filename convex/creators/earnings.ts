import { query } from "../_generated/server";
import { getCreatorForUser, requireAppUser } from "../lib/auth";
import { yearMonthKey } from "../lib/commerceIdentity";
import { creatorEarningsValidator } from "../lib/validators";
import type { Id } from "../_generated/dataModel";

/** Creator earnings dashboard — real subscriptions + paymentEvents (no fake names). */
export const myEarnings = query({
  args: {},
  returns: creatorEarningsValidator,
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) {
      return {
        grossCents: 0,
        feeCents: 0,
        netCents: 0,
        perSubCents: 0,
        activeCount: 0,
        monthly: [] as { month: string; revenueCents: number }[],
        recentPayments: [] as {
          id: Id<"paymentEvents">;
          label: string;
          amountCents: number;
          createdAt: number;
        }[],
      };
    }

    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
    const active = subs.filter((s) => s.status === "active");
    const grossCents = active.reduce((a, b) => a + b.amountCents, 0);
    const feeCents = active.reduce((a, b) => a + b.platformFeeCents, 0);
    const netCents = active.reduce((a, b) => a + b.creatorEarningsCents, 0);

    const events = await ctx.db
      .query("paymentEvents")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
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
      createdAt: number;
    }> = [];
    for (const e of sorted.slice(0, 20)) {
      let label = e.type;
      if (e.userId) {
        const u = await ctx.db.get(e.userId);
        const name = u?.fullName || u?.email || "Subscriber";
        label = `Subscription — ${name}`;
      }
      recentPayments.push({
        id: e._id,
        label,
        amountCents: e.creatorEarningsCents,
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
    };
  },
});
