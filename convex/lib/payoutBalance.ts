/**
 * Available payout balance for a creator.
 * Earnings = settled paymentEvents.creatorEarningsCents excluding sandbox/test
 * Reserved = payouts not cancelled/rejected
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

const RESERVED_PAYOUT_STATUSES = new Set([
  "requested",
  "pending",
  "processing",
  "approved",
  "completed",
  "paid",
]);

const EXCLUDED_PAYMENT_MODES = new Set(["sandbox"]);

export async function getCreatorAvailableBalanceCents(
  ctx: Ctx,
  creatorId: Id<"creators">,
): Promise<{
  earnedCents: number;
  reservedCents: number;
  availableCents: number;
}> {
  const events = await ctx.db
    .query("paymentEvents")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .collect();
  const earnedCents = events
    .filter((e) => e.status === "settled" || e.status === "paid")
    .filter((e) => !e.paymentMode || !EXCLUDED_PAYMENT_MODES.has(e.paymentMode))
    .reduce((sum, e) => sum + e.creatorEarningsCents, 0);

  const payouts = await ctx.db
    .query("payouts")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .collect();
  const reservedCents = payouts
    .filter((p) => RESERVED_PAYOUT_STATUSES.has(p.status))
    .reduce((sum, p) => sum + p.amountCents, 0);

  return {
    earnedCents,
    reservedCents,
    availableCents: Math.max(0, earnedCents - reservedCents),
  };
}
