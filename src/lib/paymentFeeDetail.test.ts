import { describe, expect, it } from "vitest";
import { paymentTypeLabel } from "./paymentFeeDetail";

describe("paymentTypeLabel", () => {
  it("maps known tokens", () => {
    expect(paymentTypeLabel("subscription_charge")).toBe("Subscription");
    expect(paymentTypeLabel("one_time_purchase")).toBe("One-time purchase");
  });

  it("replaces underscores without String.replaceAll (ES2020 target)", () => {
    expect(paymentTypeLabel("custom_fee_item")).toBe("custom fee item");
  });
});
