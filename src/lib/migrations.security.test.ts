import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationsDir = join(process.cwd(), "convex/migrations");

function migrationSources(): string[] {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".ts"))
    .map((name) => readFileSync(join(migrationsDir, name), "utf8"));
}

describe("migration ETL surface (J8 / F-005)", () => {
  it("only exports internalMutation handlers", () => {
    for (const source of migrationSources()) {
      expect(source).toContain('from "../_generated/server"');
      expect(source).toMatch(/internalMutation/);
      expect(source).not.toMatch(/\bexport const \w+ = mutation\(/);
      expect(source).not.toMatch(/\bexport const \w+ = query\(/);
      expect(source).not.toMatch(/\bexport const \w+ = action\(/);
      expect(source).not.toMatch(/\bexport const \w+ = httpAction\(/);
    }
  });

  it("gates importBatch with MIGRATION_SECRET", () => {
    const importBatch = readFileSync(join(migrationsDir, "importBatch.ts"), "utf8");
    expect(importBatch).toContain("MIGRATION_SECRET");
    expect(importBatch).toContain("FORBIDDEN_MIGRATION");
    expect(importBatch).toContain("assertMigrationSecret");
  });

  it("is not referenced from the client API surface", () => {
    const srcRoot = join(process.cwd(), "src");
    const stack = [srcRoot];
    const offenders: string[] = [];
    while (stack.length) {
      const dir = stack.pop()!;
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          stack.push(path);
          continue;
        }
        if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) continue;
        const text = readFileSync(path, "utf8");
        if (
          text.includes("api.migrations") ||
          text.includes('api["migrations') ||
          text.includes("migrations/importBatch") ||
          text.includes("migrations/load")
        ) {
          offenders.push(path);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
