import { subscriptionGrantsContentAccess, type SubscriptionAccessFields } from "../../convex/lib/contentAccess";

export type BillingAccessLabel = {
  /** Short badge text */
  badge: string;
  /** Badge tone for UI */
  tone: "ok" | "warn" | "danger" | "muted";
  /** One-line member-facing explanation */
  detail: string;
  /** Whether paid content access is currently granted */
  hasAccess: boolean;
};

/**
 * Member-facing billing + access labels aligned with `subscriptionGrantsContentAccess`.
 */
export function describeSubscriptionAccess(
  sub: SubscriptionAccessFields & { currentPeriodEnd?: number | null },
  nowMs: number = Date.now(),
): BillingAccessLabel {
  const hasAccess = subscriptionGrantsContentAccess(sub, nowMs);
  const status = (sub.status ?? "").toLowerCase();
  const billing = (sub.billingStatus ?? "").toLowerCase();
  const periodEnd =
    typeof sub.currentPeriodEnd === "number"
      ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : null;

  if (status === "cancelled" || status === "canceled" || billing === "canceled") {
    return {
      badge: "Canceled",
      tone: "muted",
      detail: "Subscription ended — premium access is off.",
      hasAccess: false,
    };
  }

  if (status === "past_due" || billing === "past_due" || billing === "unpaid" || status === "unpaid") {
    return {
      badge: "Past due",
      tone: "danger",
      detail: "Payment failed — premium access is paused until billing is fixed in the portal.",
      hasAccess: false,
    };
  }

  if (status === "incomplete" || billing === "incomplete") {
    return {
      badge: "Incomplete",
      tone: "warn",
      detail: "Checkout was not completed — no premium access yet.",
      hasAccess: false,
    };
  }

  if (
    hasAccess &&
    (billing === "cancel_pending" || sub.cancelAtPeriodEnd === true)
  ) {
    return {
      badge: "Canceling",
      tone: "warn",
      detail: periodEnd
        ? `Cancellation pending — access continues through ${periodEnd}.`
        : "Cancellation pending — access continues until the current period ends.",
      hasAccess: true,
    };
  }

  if (hasAccess && status === "active") {
    return {
      badge: "Active",
      tone: "ok",
      detail: periodEnd
        ? `Access is active · current period ends ${periodEnd}.`
        : "Access is active.",
      hasAccess: true,
    };
  }

  return {
    badge: status || billing || "Unknown",
    tone: "muted",
    detail: "Status recorded — check Billing Portal if access looks wrong.",
    hasAccess,
  };
}
