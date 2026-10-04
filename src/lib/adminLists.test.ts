import { describe, expect, it } from "vitest";
import {
  ADMIN_JOIN_LIMIT,
  ADMIN_LIST_LIMIT,
  adminJoinCap,
  adminListTruncated,
} from "../../convex/lib/adminLists";

describe("admin join caps (F-012)", () => {
  it("clamps join reads between 1 and ADMIN_LIST_LIMIT", () => {
    expect(adminJoinCap()).toBe(ADMIN_JOIN_LIMIT);
    expect(adminJoinCap(0)).toBe(1);
    expect(adminJoinCap(ADMIN_LIST_LIMIT + 50)).toBe(ADMIN_LIST_LIMIT);
  });

  it("treats hitting the cap as truncated", () => {
    expect(adminListTruncated(ADMIN_JOIN_LIMIT, ADMIN_JOIN_LIMIT)).toBe(true);
    expect(adminListTruncated(ADMIN_JOIN_LIMIT - 1, ADMIN_JOIN_LIMIT)).toBe(false);
  });
});
