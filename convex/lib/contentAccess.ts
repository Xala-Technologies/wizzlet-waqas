/**
 * Pure content-access rules for subscription rows.
 * Keep in sync with docs/product-improvements/decisions.md.
 */

export type SubscriptionAccessFields = {
  status: string;
  billingStatus?: string | null;
  currentPeriodEnd?: number | null;
  cancelAtPeriodEnd?: boolean | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

/** Whether a single subscription row grants paid content / messaging eligibility. */
export function subscriptionGrantsContentAccess(
  sub: SubscriptionAccessFields,
  nowMs: number,
): boolean {
  const status = norm(sub.status);
  const billing = norm(sub.billingStatus);

  if (status === "cancelled" || status === "canceled") return false;
  if (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    billing === "past_due" ||
    billing === "unpaid" ||
    billing === "incomplete"
  ) {
    return false;
  }

  if (status !== "active") return false;

  const canceling =
    billing === "cancel_pending" ||
    billing === "canceled" ||
    sub.cancelAtPeriodEnd === true;

  if (canceling) {
    if (typeof sub.currentPeriodEnd === "number" && nowMs > sub.currentPeriodEnd) {
      return false;
    }
    // cancel_pending / cancel_at_period_end with active status: allow through period
    if (billing === "canceled" && status === "active") {
      // billing says canceled but access status still active — honor period end if present
      if (typeof sub.currentPeriodEnd === "number") {
        return nowMs <= sub.currentPeriodEnd;
      }
    }
    return true;
  }

  return true;
}
