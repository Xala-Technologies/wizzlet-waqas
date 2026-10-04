import { describe, expect, it } from "vitest";
import {
  MAX_PROFILE_PRODUCTS,
  wouldExceedProfileSlots,
} from "../../convex/lib/productProfileSlots";

describe("product profile slots (J2)", () => {
  it("caps public profile pins at 4", () => {
    expect(MAX_PROFILE_PRODUCTS).toBe(4);
    expect(wouldExceedProfileSlots(3, true)).toBe(false);
    expect(wouldExceedProfileSlots(4, true)).toBe(true);
    expect(wouldExceedProfileSlots(4, false)).toBe(false);
    expect(wouldExceedProfileSlots(0, true)).toBe(false);
  });
});
