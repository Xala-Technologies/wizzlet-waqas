import { describe, expect, it } from "vitest";
import { normalizePickResult } from "../../convex/lib/results";

describe("normalizePickResult", () => {
  it("maps legacy synonyms", () => {
    expect(normalizePickResult("win")).toBe("won");
    expect(normalizePickResult("loss")).toBe("lost");
    expect(normalizePickResult("W")).toBe("won");
    expect(normalizePickResult("push")).toBe("push");
    expect(normalizePickResult("pending")).toBe("pending");
  });

  it("rejects unknown values", () => {
    expect(() => normalizePickResult("maybe")).toThrow();
  });
});
