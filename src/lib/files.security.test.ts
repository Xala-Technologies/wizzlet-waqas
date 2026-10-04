import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const storageSource = readFileSync(
  join(process.cwd(), "convex/files/storage.ts"),
  "utf8",
);

describe("files/storage getUrl ACL (J-FILES / F-008)", () => {
  it("requires an authenticated app user", () => {
    expect(storageSource).toContain("requireAppUser");
    expect(storageSource).toMatch(/export const getUrl = query\(/);
  });

  it("denies missing fileAssets and non-owners", () => {
    expect(storageSource).toContain('withIndex("by_storageId"');
    expect(storageSource).toMatch(/if \(!asset\)[\s\S]*throw new Error\("FORBIDDEN"\)/);
    expect(storageSource).toMatch(
      /if \(asset\.ownerUserId !== user\._id\)[\s\S]*throw new Error\("FORBIDDEN"\)/,
    );
  });

  it("does not fall back to raw storage.getUrl without ownership", () => {
    const handler = storageSource.slice(storageSource.indexOf("export const getUrl"));
    const forbidIdx = handler.indexOf('throw new Error("FORBIDDEN")');
    const storageUrlIdx = handler.indexOf("ctx.storage.getUrl");
    expect(forbidIdx).toBeGreaterThan(-1);
    expect(storageUrlIdx).toBeGreaterThan(forbidIdx);
  });

  it("registers ownership before URL resolve in client upload helper", () => {
    const upload = readFileSync(join(process.cwd(), "src/lib/upload.ts"), "utf8");
    const fn = upload.slice(upload.indexOf("export async function uploadImageToConvex"));
    expect(fn.indexOf("registerOwnedFile")).toBeGreaterThan(-1);
    expect(fn.indexOf("registerOwnedFile")).toBeLessThan(fn.indexOf(".getUrl"));
  });
});
