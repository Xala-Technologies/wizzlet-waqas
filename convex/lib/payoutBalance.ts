/**
 * Available payout balance for a creator.
 * Earnings = settled paymentEvents.creatorEarningsCents excluding sandbox
 * Reserved = payouts not cancelled/rejected
 */

import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import { ADMIN_SCAN_MAX_DOCS } from "./adminLists";

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

/**
 * Lifetime earned cents by creator from settled paymentEvents.
 * Includes charges from cancelled subscriptions (events persist); excludes sandbox.
 */
export function sumSettledEarningsByCreatorCents(
  events: Array<{
    creatorId: string;
    creatorEarningsCents: number;
    status: string;
    paymentMode?: string;
  }>,
): Map<string, number> {
  const earnedBy = new Map<string, number>();
  for (const event of events) {
    if (!isSettledEarningEvent(event)) continue;
    earnedBy.set(
      event.creatorId,
      (earnedBy.get(event.creatorId) ?? 0) + event.creatorEarningsCents,
    );
  }
  return earnedBy;
}

export async function getCreatorAvailableBalanceCents(
  ctx: Ctx,
  creatorId: Id<"creators">,
): Promise<{
  earnedCents: number;
  reservedCents: number;
  availableCents: number;
  truncated: boolean;
  listLimit: number;
}> {
  const events = await ctx.db
    .query("paymentEvents")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .take(ADMIN_SCAN_MAX_DOCS);
  const earnedCents = events
    .filter(isSettledEarningEvent)
    .reduce((sum, e) => sum + e.creatorEarningsCents, 0);

  const payouts = await ctx.db
    .query("payouts")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .take(ADMIN_SCAN_MAX_DOCS);
  const reservedCents = payouts
    .filter((p) => isReservedPayoutStatus(p.status))
    .reduce((sum, p) => sum + p.amountCents, 0);

  const truncated =
    events.length >= ADMIN_SCAN_MAX_DOCS ||
    payouts.length >= ADMIN_SCAN_MAX_DOCS;

  return {
    earnedCents,
    reservedCents,
    availableCents: computeAvailableBalanceCents(earnedCents, reservedCents),
    truncated,
    listLimit: ADMIN_SCAN_MAX_DOCS,
  };
}
