import { afterEach, describe, expect, it } from "vitest";
import { configuredSocialProviders } from "../../convex/lib/socialAuth";

const KEYS = [
  "AUTH_TWITTER_ID",
  "AUTH_TWITTER_SECRET",
  "AUTH_DISCORD_ID",
  "AUTH_DISCORD_SECRET",
] as const;

const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

function stashEnv() {
  for (const k of KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
}

function restoreEnv() {
  for (const k of KEYS) {
    const v = saved[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("social OAuth gating", () => {
  afterEach(() => {
    restoreEnv();
  });

  it("reports twitter/discord disabled when env is unset", () => {
    stashEnv();
    expect(configuredSocialProviders()).toEqual({
      twitter: false,
      discord: false,
    });
  });

  it("enables twitter only when both AUTH_TWITTER_* vars are set", () => {
    stashEnv();
    process.env.AUTH_TWITTER_ID = "tw-id";
    process.env.AUTH_TWITTER_SECRET = "tw-secret";
    expect(configuredSocialProviders()).toEqual({
      twitter: true,
      discord: false,
    });
  });

  it("ignores whitespace-only twitter credentials", () => {
    stashEnv();
    process.env.AUTH_TWITTER_ID = "  ";
    process.env.AUTH_TWITTER_SECRET = "tw-secret";
    expect(configuredSocialProviders().twitter).toBe(false);
  });
});
