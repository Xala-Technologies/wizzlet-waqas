import { describe, expect, it } from "vitest";
import { getTodaysEvents, todayBoundsMs } from "./events";

describe("todayBoundsMs", () => {
  it("returns a local calendar day window", () => {
    const fixed = new Date("2026-10-05T15:30:00").getTime();
    const { fromMs, toMs } = todayBoundsMs(fixed);
    expect(toMs - fromMs).toBe(24 * 60 * 60 * 1000);
    expect(fromMs).toBeLessThanOrEqual(fixed);
    expect(toMs).toBeGreaterThan(fixed);
  });
});

describe("getTodaysEvents", () => {
  it("never returns fake client games", () => {
    expect(getTodaysEvents()).toEqual([]);
  });
});
