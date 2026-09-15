/**
 * Commerce / ledger identity helpers.
 * Webhook event ids are delivery receipts — not financial identity.
 */

export function commercialRefForCheckout(checkoutSessionId: string): string {
  return `checkout:${checkoutSessionId}`;
}

export function commercialRefForInvoice(invoiceId: string): string {
  return `invoice:${invoiceId}`;
}

/** True when redirect confirm and webhook would collide on the same purchase. */
export function isSameCheckoutFulfillment(
  redirectKey: string,
  webhookKey: string,
  checkoutSessionId: string,
): boolean {
  const expected = commercialRefForCheckout(checkoutSessionId);
  return redirectKey === expected && webhookKey === expected;
}

export function isStripeAlreadyCanceledError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("no such subscription") ||
    m.includes("subscription is already canceled") ||
    m.includes("subscription is canceled") ||
    m.includes("resource_missing")
  );
}

export function yearMonthKey(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export const LAUNCH_BILLING_PERIOD = "monthly" as const;

export function assertLaunchBillingPeriod(period: string): void {
  const normalized = period.trim().toLowerCase();
  if (normalized !== "monthly" && normalized !== "month") {
    throw new Error("UNSUPPORTED_BILLING_PERIOD");
  }
}

export function normalizeBillingPeriod(period: string): "monthly" {
  assertLaunchBillingPeriod(period);
  return "monthly";
}

const ALLOWED_IMPORT_STATUSES = new Set([
  "active",
  "cancelled",
  "canceled",
  "past_due",
  "incomplete",
]);

/** Missing/invalid import status → quarantine (do not invent active). */
export function normalizeImportSubscriptionStatus(
  raw: unknown,
): { ok: true; status: string } | { ok: false; reason: string } {
  if (raw == null || raw === "") {
    return { ok: false, reason: "MISSING_STATUS" };
  }
  const status = String(raw).toLowerCase().trim();
  if (!ALLOWED_IMPORT_STATUSES.has(status)) {
    return { ok: false, reason: "INVALID_STATUS" };
  }
  return { ok: true, status: status === "canceled" ? "cancelled" : status };
}

/** Parse timestamps; invalid values are quarantined (not coerced to now). */
export function parseImportTimestamp(
  value: unknown,
): { ok: true; ms: number } | { ok: false; reason: string } {
  if (value == null || value === "") {
    return { ok: false, reason: "MISSING_TIMESTAMP" };
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return { ok: true, ms: value };
  }
  const t = Date.parse(String(value));
  if (!Number.isFinite(t)) {
    return { ok: false, reason: "INVALID_TIMESTAMP" };
  }
  return { ok: true, ms: t };
}
