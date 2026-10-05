import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/** After a successful subscribe: bump promo uses, mark referrals converted, attribute /go/ links. */
export async function applySubscribeGrowthAttribution(
  ctx: MutationCtx,
  args: {
    userId: Id<"users">;
    creatorId: Id<"creators">;
    promoId?: Id<"promoCodes">;
    creatorLinkId?: Id<"creatorLinks">;
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

  const referrals = await ctx.db
    .query("referrals")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", args.creatorId))
    .collect();
  for (const row of referrals) {
    if (row.referredUserId === args.userId && !row.converted) {
      await ctx.db.patch(row._id, {
        converted: true,
        updatedAt: args.nowMs,
      });
    }
  }
}
