import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Discord role sync surface (J-DISCORD)", () => {
  it("registers a 5-minute pending-grants cron", () => {
    const crons = readFileSync(join(process.cwd(), "convex/crons.ts"), "utf8");
    expect(crons).toContain("retryPendingGrants");
    expect(crons).toMatch(/minutes:\s*5/);
  });

  it("keeps bot-install callback as http → internalAction", () => {
    const http = readFileSync(join(process.cwd(), "convex/http.ts"), "utf8");
    expect(http).toContain("/discord/bot-install/callback");
    expect(http).toContain("completeBotInstall");
    expect(http).toContain("internal.discord.roles.completeBotInstall");
  });

  it("implements completeBotInstall and retryPendingGrants as internalAction", () => {
    const roles = readFileSync(join(process.cwd(), "convex/discord/roles.ts"), "utf8");
    expect(roles).toMatch(/export const completeBotInstall = internalAction\(/);
    expect(roles).toMatch(/export const retryPendingGrants = internalAction\(/);
  });
});
