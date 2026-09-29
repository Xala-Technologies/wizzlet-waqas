import { describe, expect, it } from "vitest";
import {
  commercialRefForCheckout,
  commercialRefForInvoice,
  isSameCheckoutFulfillment,
  isStripeAlreadyCanceledError,
  normalizeBillingPeriod,
  normalizeImportSubscriptionStatus,
  normalizeProductBillingPeriod,
  parseImportTimestamp,
  yearMonthKey,
} from "../../convex/lib/commerceIdentity";

describe("PAY-01/02 commerce identity", () => {
  it("uses the same commercial ref for redirect and webhook paths", () => {
    const sessionId = "cs_test_abc";
    const ref = commercialRefForCheckout(sessionId);
    expect(ref).toBe("checkout:cs_test_abc");
    expect(isSameCheckoutFulfillment(ref, ref, sessionId)).toBe(true);
  });

  it("does not treat webhook event ids as commerce identity", () => {
    const sessionId = "cs_test_abc";
    const ledgerKey = commercialRefForCheckout(sessionId);
    const webhookEventId = "evt_123";
    expect(ledgerKey).not.toBe(webhookEventId);
    expect(ledgerKey).not.toBe(`cs_${sessionId}`);
  });

  it("uses invoice id for renewals", () => {
    expect(commercialRefForInvoice("in_99")).toBe("invoice:in_99");
  });
});

describe("PAY-05 cancel truthfulness", () => {
  it("treats already-canceled Stripe errors as success-compatible", () => {
    expect(isStripeAlreadyCanceledError("No such subscription: sub_x")).toBe(true);
    expect(isStripeAlreadyCanceledError("Subscription is already canceled")).toBe(true);
  });

  it("does not treat other Stripe errors as canceled", () => {
    expect(isStripeAlreadyCanceledError("Rate limit exceeded")).toBe(false);
    expect(isStripeAlreadyCanceledError("network timeout")).toBe(false);
  });
});

describe("PAY-06 / catalogue helpers", () => {
  it("forces monthly billing at launch checkout", () => {
    expect(normalizeBillingPeriod("monthly")).toBe("monthly");
    expect(normalizeBillingPeriod("month")).toBe("monthly");
    expect(() => normalizeBillingPeriod("weekly")).toThrow("UNSUPPORTED_BILLING_PERIOD");
    expect(() => normalizeBillingPeriod("daily")).toThrow("UNSUPPORTED_BILLING_PERIOD");
  });

  it("accepts product catalog billing periods including daily", () => {
    expect(normalizeProductBillingPeriod("daily")).toBe("daily");
    expect(normalizeProductBillingPeriod("day")).toBe("daily");
    expect(normalizeProductBillingPeriod("weekly")).toBe("weekly");
    expect(normalizeProductBillingPeriod("monthly")).toBe("monthly");
    expect(normalizeProductBillingPeriod("yearly")).toBe("yearly");
    expect(normalizeProductBillingPeriod("one-time")).toBe("one-time");
    expect(() => normalizeProductBillingPeriod("biweekly")).toThrow(
      "UNSUPPORTED_BILLING_PERIOD",
    );
  });

  it("quarantines missing import status instead of inventing active", () => {
    expect(normalizeImportSubscriptionStatus(undefined)).toEqual({
      ok: false,
      reason: "MISSING_STATUS",
    });
    expect(normalizeImportSubscriptionStatus("active")).toEqual({
      ok: true,
      status: "active",
    });
  });

  it("quarantines invalid timestamps", () => {
    expect(parseImportTimestamp("not-a-date").ok).toBe(false);
    expect(parseImportTimestamp("2024-01-15T00:00:00.000Z").ok).toBe(true);
  });

  it("builds YYYY-MM finance keys", () => {
    expect(yearMonthKey(Date.UTC(2026, 8, 6))).toBe("2026-09");
  });
});
