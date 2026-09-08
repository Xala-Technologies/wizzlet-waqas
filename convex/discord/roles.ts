"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

async function discordApi(
  method: "PUT" | "DELETE",
  guildId: string,
  userId: string,
  roleId: string,
  botToken: string,
): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleId}`,
    {
      method,
      headers: {
        Authorization: `Bot ${botToken}`,
        "Content-Type": "application/json",
      },
    },
  );
  const body = await res.text();
  return { ok: res.ok || res.status === 204, status: res.status, body };
}

/**
 * Assign or remove a Discord role for a subscriber when a bot token is configured.
 * No-ops when Discord is not fully configured (env or creator/member ids missing).
 */
export const syncSubscriberRole = internalAction({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    assign: v.boolean(),
  },
  returns: v.object({
    attempted: v.boolean(),
    ok: v.boolean(),
    reason: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    if (!botToken) {
      return { attempted: false, ok: true, reason: "DISCORD_BOT_TOKEN_UNSET" };
    }

    const prep = await ctx.runQuery(internal.discord.queries.roleSyncPrep, {
      userId: args.userId,
      creatorId: args.creatorId,
    });
    if (!prep) {
      return { attempted: false, ok: true, reason: "NOT_CONFIGURED" };
    }

    const result = await discordApi(
      args.assign ? "PUT" : "DELETE",
      prep.guildId,
      prep.discordUserId,
      prep.roleId,
      botToken,
    );

    if (!result.ok) {
      console.error("Discord role sync failed", {
        assign: args.assign,
        status: result.status,
        body: result.body.slice(0, 300),
        creatorId: args.creatorId,
        userId: args.userId,
      });
      return {
        attempted: true,
        ok: false,
        reason: `HTTP_${result.status}`,
      };
    }

    return { attempted: true, ok: true };
  },
});
