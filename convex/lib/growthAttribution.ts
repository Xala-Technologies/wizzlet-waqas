import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import {
  normalizeReferralCommissionPercent,
  referralCommissionCents,
} from "./referralCommission";
import { ADMIN_SCAN_MAX_DOCS } from "./adminLists";

/** After a successful subscribe: bump promo uses, mark referrals converted, attribute /go/ links. */
export async function applySubscribeGrowthAttribution(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    creatorId: Id<"creators">;
    promoId?: Id<"promoCodes">;
    creatorLinkId?: Id<"creatorLinks">;
    /** Checkout amount used to accrue referral commission. */
    amountCents?: number;
    nowMs: number;
  },
): Promise<void> {
  if (args.promoId) {
    const promo = await ctx.db.get(args.promoId);
    if (promo && promo.creatorId === args.creatorId) {
      await ctx.db.patch(args.promoId, {
        usedCount: promo.usedCount + 1,
        updatedAt: args.nowMs,
      });
    }
  }

  if (args.creatorLinkId) {
    const link = await ctx.db.get(args.creatorLinkId);
    if (link && link.creatorId === args.creatorId) {
      await ctx.db.patch(args.creatorLinkId, {
        conversions: link.conversions + 1,
        updatedAt: args.nowMs,
      });
    }
  }

  const settings = await ctx.db
    .query("platformSettings")
    .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
    .unique();
  const rate = normalizeReferralCommissionPercent(
    settings?.referralCommissionPercent,
  );
  const commissionCents = referralCommissionCents(args.amountCents ?? 0, rate);

  const referrals = await ctx.db
    .query("referrals")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
    .take(ADMIN_SCAN_MAX_DOCS);
  for (const row of referrals) {
    if (row.referredUserId === args.userId && !row.converted) {
      await ctx.db.patch(row._id, {
        converted: true,
        commissionEarnedCents: commissionCents,
        updatedAt: args.nowMs,
      });
    }
  }
}
