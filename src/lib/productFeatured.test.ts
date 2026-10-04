import { describe, expect, it } from "vitest";
import { siblingIdsToUnfeature } from "../../convex/lib/productFeatured";

describe("product featured exclusivity (J2)", () => {
  it("clears other featured siblings when a new product is featured", () => {
    expect(
      siblingIdsToUnfeature(
        [
          { _id: "a", isFeatured: true },
          { _id: "b", isFeatured: false },
          { _id: "c", isFeatured: true },
        ],
        "b",
      ),
    ).toEqual(["a", "c"]);
  });

  it("keeps the featured product itself when re-saving", () => {
    expect(
      siblingIdsToUnfeature(
        [
          { _id: "a", isFeatured: true },
          { _id: "b", isFeatured: false },
        ],
        "a",
      ),
    ).toEqual([]);
  });

  it("unfeatures all siblings when creating a new featured product", () => {
    expect(
      siblingIdsToUnfeature(
        [
          { _id: "a", isFeatured: true },
          { _id: "b", isFeatured: false },
        ],
        undefined,
      ),
    ).toEqual(["a"]);
  });
});
