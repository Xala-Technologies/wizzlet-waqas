/**
 * Available payout balance for a creator.
 * Earnings = settled paymentEvents.creatorEarningsCents excluding sandbox
 * Reserved = payouts not cancelled/rejected
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

type Ctx = QueryCtx | MutationCtx;

export const RESERVED_PAYOUT_STATUSES = new Set([
  "requested",
  "pending",
  "processing",
  "approved",
  "completed",
  "paid",
]);

export const PAID_OUT_PAYOUT_STATUSES = new Set(["completed", "paid"]);

const EXCLUDED_PAYMENT_MODES = new Set(["sandbox"]);

export function isSettledEarningEvent(event: {
  status: string;
  paymentMode?: string;
}): boolean {
  if (event.status !== "settled" && event.status !== "paid") return false;
  if (event.paymentMode && EXCLUDED_PAYMENT_MODES.has(event.paymentMode)) {
    return false;
  }
  return true;
}

export function isReservedPayoutStatus(status: string): boolean {
  return RESERVED_PAYOUT_STATUSES.has(status);
}

export function isPaidOutPayoutStatus(status: string): boolean {
  return PAID_OUT_PAYOUT_STATUSES.has(status);
}

export function computeAvailableBalanceCents(
  earnedCents: number,
  reservedCents: number,
): number {
  return Math.max(0, earnedCents - reservedCents);
}

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
    .filter(isSettledEarningEvent)
    .reduce((sum, e) => sum + e.creatorEarningsCents, 0);

  const payouts = await ctx.db
    .query("payouts")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .collect();
  const reservedCents = payouts
    .filter((p) => isReservedPayoutStatus(p.status))
    .reduce((sum, p) => sum + p.amountCents, 0);

  return {
    earnedCents,
    reservedCents,
    availableCents: computeAvailableBalanceCents(earnedCents, reservedCents),
  };
}
