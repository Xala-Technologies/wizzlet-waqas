/**
 * Creator payout balance: Pending (hold) → Available → reserved payouts.
 * Adjustments/refunds claw back Pending first, then Available; remainder is debt.
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

const EARNING_TYPES = new Set(["subscription_charge", "renewal"]);
const ADJUSTMENT_TYPES = new Set(["refund", "adjustment", "dispute"]);
const IGNORED_TYPES = new Set(["subscription_cancel", "payout"]);

export type BalanceEvent = {
  creatorId: string;
  creatorEarningsCents: number;
  status: string;
  paymentMode?: string;
  type?: string;
  availableAt?: number;
  balanceState?: string;
  createdAt?: number;
};

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

export type CreatorBalanceBreakdown = {
  /** Lifetime positive earnings (pending + released), excluding reversed. */
  earnedCents: number;
  pendingCents: number;
  /** Released earnings after hold, before reserve/payouts/adjustments. */
  releasedCents: number;
  reservedCents: number;
  reserveHoldCents: number;
  availableCents: number;
  /** Unrecoverable clawback after Pending/Available exhausted. */
  debtCents: number;
  /** True when debt or negative position should block auto-payouts. */
  payoutBlocked: boolean;
};

/**
 * Split settled events into Pending / Available with refund clawback order.
 */
export function computeCreatorBalanceBreakdown(
  events: BalanceEvent[],
  reservedCents: number,
  nowMs: number,
  payoutReservePercent = 0,
): CreatorBalanceBreakdown {
  let pending = 0;
  let released = 0;
  let adjustments = 0;

  for (const event of events) {
    if (!isSettledEarningEvent(event)) continue;
    if (event.balanceState === "reversed") continue;
    const type = event.type ?? "subscription_charge";
    if (IGNORED_TYPES.has(type)) continue;

    if (ADJUSTMENT_TYPES.has(type) || event.creatorEarningsCents < 0) {
      adjustments += event.creatorEarningsCents;
      continue;
    }
    if (!EARNING_TYPES.has(type) && type !== "") {
      // Unknown positive types still count as earnings for forward-compat.
      if (event.creatorEarningsCents <= 0) {
        adjustments += event.creatorEarningsCents;
        continue;
      }
    }

    const availableAt =
      event.availableAt ??
      event.createdAt ??
      0; /* legacy rows: immediately available */
    if (nowMs < availableAt) {
      pending += event.creatorEarningsCents;
    } else {
      released += event.creatorEarningsCents;
    }
  }

  // Clawback: Pending first, then Available (released).
  let adj = adjustments;
  if (adj < 0) {
    const fromPending = Math.min(pending, -adj);
    pending -= fromPending;
    adj += fromPending;
  }
  if (adj < 0) {
    const fromReleased = Math.min(released, -adj);
    released -= fromReleased;
    adj += fromReleased;
  }
  const debtCents = adj < 0 ? -adj : 0;

  const reserveHoldCents =
    payoutReservePercent > 0
      ? Math.floor((released * payoutReservePercent) / 100)
      : 0;

  const availableCents = Math.max(
    0,
    released - reserveHoldCents - reservedCents,
  );
  const earnedCents = pending + released + Math.max(0, adjustments);

  return {
    earnedCents,
    pendingCents: pending,
    releasedCents: released,
    reservedCents,
    reserveHoldCents,
    availableCents,
    debtCents,
    payoutBlocked: debtCents > 0,
  };
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
    type?: string;
    balanceState?: string;
  }>,
): Map<string, number> {
  const earnedBy = new Map<string, number>();
  for (const event of events) {
    if (!isSettledEarningEvent(event)) continue;
    if (event.balanceState === "reversed") continue;
    const type = event.type ?? "subscription_charge";
    if (IGNORED_TYPES.has(type)) continue;
    if (ADJUSTMENT_TYPES.has(type)) continue;
    if (event.creatorEarningsCents <= 0) continue;
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
  nowMs = Date.now(),
  payoutReservePercent = 0,
): Promise<{
  earnedCents: number;
  pendingCents: number;
  releasedCents: number;
  reservedCents: number;
  reserveHoldCents: number;
  availableCents: number;
  debtCents: number;
  payoutBlocked: boolean;
  truncated: boolean;
  listLimit: number;
}> {
  const events = await ctx.db
    .query("paymentEvents")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .take(ADMIN_SCAN_MAX_DOCS);
  const payouts = await ctx.db
    .query("payouts")
    .withIndex("by_creatorId", (q) => q.eq("creatorId", creatorId))
    .take(ADMIN_SCAN_MAX_DOCS);
  const reservedCents = payouts
    .filter((p) => isReservedPayoutStatus(p.status))
    .reduce((sum, p) => sum + p.amountCents, 0);

  const breakdown = computeCreatorBalanceBreakdown(
    events,
    reservedCents,
    nowMs,
    payoutReservePercent,
  );

  const truncated =
    events.length >= ADMIN_SCAN_MAX_DOCS ||
    payouts.length >= ADMIN_SCAN_MAX_DOCS;

  return {
    ...breakdown,
    truncated,
    listLimit: ADMIN_SCAN_MAX_DOCS,
  };
}
