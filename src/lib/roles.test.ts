import { describe, expect, it } from "vitest";
import {
  postLoginPath,
  resolveActiveRole,
  sortRoles,
} from "./roles";

describe("identity role continuity (J7)", () => {
  it("falls back to highest privilege when preferred storage is empty (new device)", () => {
    expect(resolveActiveRole(["subscriber", "creator"], null)).toBe("creator");
    expect(resolveActiveRole(["subscriber", "creator", "admin"], undefined)).toBe(
      "admin",
    );
    expect(postLoginPath(["creator"], null)).toBe("/creator");
    expect(postLoginPath(["subscriber"], "")).toBe("/dashboard");
  });

  it("honors preferred role when still held", () => {
    expect(resolveActiveRole(["creator", "subscriber"], "subscriber")).toBe(
      "subscriber",
    );
    expect(postLoginPath(["creator", "subscriber"], "subscriber")).toBe(
      "/dashboard",
    );
  });

  it("ignores stale preferred role from another session/device state", () => {
    expect(resolveActiveRole(["subscriber"], "admin")).toBe("subscriber");
    expect(resolveActiveRole(["creator"], "subscriber")).toBe("creator");
    expect(postLoginPath([], "creator")).toBe("/select-role");
  });

  it("sorts by privilege for stable multi-role ordering", () => {
    expect(sortRoles(["subscriber", "admin", "creator"])).toEqual([
      "admin",
      "creator",
      "subscriber",
    ]);
  });
});
