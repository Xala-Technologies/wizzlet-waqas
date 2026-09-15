import { ConvexError } from "convex/values";

export const SUBSCRIPTION_STATUSES = [
  "active",
  "cancelled",
  "past_due",
  "incomplete",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type SubscriptionActorKind = "owner" | "creator" | "admin";

/**
 * Who may transition a subscription to which status.
 * Owners/creators may only cancel. Only admin (or trusted payment paths) may activate.
 */
export function assertSubscriptionStatusTransition(
  actor: SubscriptionActorKind,
  next: string,
): asserts next is SubscriptionStatus {
  if (!SUBSCRIPTION_STATUSES.includes(next as SubscriptionStatus)) {
    throw new ConvexError("INVALID_STATUS");
  }
  if (actor === "admin") return;
  if (next === "cancelled") return;
  throw new ConvexError("FORBIDDEN_STATUS_TRANSITION");
}
