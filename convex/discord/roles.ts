"use node";

import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

function botToken(): string | null {
  return process.env.DISCORD_BOT_TOKEN?.trim() || null;
}

function clientId(): string | null {
  return (
    process.env.DISCORD_CLIENT_ID?.trim() ||
    process.env.AUTH_DISCORD_ID?.trim() ||
    null
  );
}

function clientSecret(): string | null {
  return (
    process.env.DISCORD_CLIENT_SECRET?.trim() ||
    process.env.AUTH_DISCORD_SECRET?.trim() ||
    null
  );
}

async function discordFetch(
  path: string,
  init: RequestInit & { bot?: boolean } = {},
): Promise<{ ok: boolean; status: number; json: unknown; text: string }> {
  const token = botToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.bot !== false) {
    if (!token) {
      return { ok: false, status: 0, json: null, text: "NO_TOKEN" };
    }
    headers.set("Authorization", `Bot ${token}`);
  }
  const res = await fetch(`https://discord.com/api/v10${path}`, {
    ...init,
    headers,
    body:
      init.body ??
      (init.method === "PUT" || init.method === "POST" ? "{}" : undefined),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok || res.status === 204, status: res.status, json, text };
}

async function createInviteUrl(guildId: string): Promise<string | null> {
  const channels = await discordFetch(`/guilds/${guildId}/channels`);
  if (!channels.ok || !Array.isArray(channels.json)) return null;
  type Channel = { id: string; type: number; position?: number };
  const textChannels = (channels.json as Channel[])
    .filter((c) => c.type === 0)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  for (const channel of textChannels.slice(0, 8)) {
    const invite = await discordFetch(`/channels/${channel.id}/invites`, {
      method: "POST",
      body: JSON.stringify({ max_age: 86400, max_uses: 5, unique: true }),
    });
    const code =
      invite.ok && invite.json && typeof invite.json === "object"
        ? (invite.json as { code?: string }).code
        : undefined;
    if (code) return `https://discord.gg/${code}`;
  }
  return null;
}

export const completeBotInstall = internalAction({
  args: { code: v.string(), nonce: v.string() },
  returns: v.object({ ok: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const creatorId = await ctx.runQuery(
      internal.discord.queries.lookupInstallNonce,
      { nonce: args.nonce },
    );
    if (!creatorId) return { ok: false, reason: "INVALID_STATE" };
    const id = clientId();
    const secret = clientSecret();
    const convexSite = (process.env.CONVEX_SITE_URL ?? "").replace(/\/$/, "");
    if (!id || !secret || !convexSite) {
      return { ok: false, reason: "DISCORD_BOT_NOT_CONFIGURED" };
    }
    const redirectUri = `${convexSite}/discord/bot-install/callback`;
    const body = new URLSearchParams({
      client_id: id,
      client_secret: secret,
      grant_type: "authorization_code",
      code: args.code,
      redirect_uri: redirectUri,
    });
    const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const tokenJson = (await tokenRes.json()) as {
      guild?: {
        id: string;
        name: string;
        icon?: string | null;
        approximate_member_count?: number;
      };
      error?: string;
    };
    if (!tokenRes.ok || !tokenJson.guild?.id) {
      return { ok: false, reason: tokenJson.error ?? "TOKEN_EXCHANGE_FAILED" };
    }
    const guild = tokenJson.guild;
    let memberCount = guild.approximate_member_count ?? null;
    const counted = await discordFetch(`/guilds/${guild.id}?with_counts=true`);
    if (counted.ok && counted.json && typeof counted.json === "object") {
      const g = counted.json as { approximate_member_count?: number };
      if (typeof g.approximate_member_count === "number") {
        memberCount = g.approximate_member_count;
      }
    }
    await ctx.runMutation(internal.discord.queries.saveGuildConnection, {
      creatorId,
      guildId: guild.id,
      guildName: guild.name,
      guildIcon: guild.icon ?? null,
      memberCount,
    });
    await ctx.runMutation(internal.discord.queries.consumeInstallNonce, {
      nonce: args.nonce,
    });
    return { ok: true };
  },
});

export const listAssignableRoles = action({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      color: v.number(),
    }),
  ),
  handler: async (ctx): Promise<Array<{ id: string; name: string; color: number }>> => {
    const guildId = await ctx.runQuery(internal.discord.queries.guildIdForAuthedUser, {});
    if (!guildId || !botToken()) return [];

    const [rolesRes, meUserRes] = await Promise.all([
      discordFetch(`/guilds/${guildId}/roles`),
      discordFetch(`/users/@me`),
    ]);
    if (!rolesRes.ok || !Array.isArray(rolesRes.json)) return [];
    type Role = {
      id: string;
      name: string;
      color: number;
      position: number;
      managed?: boolean;
    };
    const roles = rolesRes.json as Role[];
    let botRoleIds: string[] = [];
    const botUserId =
      meUserRes.ok && meUserRes.json && typeof meUserRes.json === "object"
        ? (meUserRes.json as { id?: string }).id
        : undefined;
    if (botUserId) {
      const meRes = await discordFetch(`/guilds/${guildId}/members/${botUserId}`);
      if (meRes.ok && meRes.json && typeof meRes.json === "object") {
        botRoleIds = (meRes.json as { roles?: string[] }).roles ?? [];
      }
    }
    const botMaxPos = Math.max(
      0,
      ...roles.filter((r) => botRoleIds.includes(r.id)).map((r) => r.position),
    );
    const assignable = roles.filter(
      (r) => r.id !== guildId && !r.managed && r.name !== "@everyone",
    );
    const belowBot =
      botMaxPos > 0
        ? assignable.filter((r) => r.position < botMaxPos)
        : assignable;
    return belowBot
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, name: r.name, color: r.color ?? 0 }));
  },
});

export const syncSubscriberRole = internalAction({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    assign: v.boolean(),
  },
  returns: v.object({
    attempted: v.boolean(),
    ok: v.boolean(),
    reason: v.optional(v.string()),
    inviteUrl: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    attempted: boolean;
    ok: boolean;
    reason?: string;
    inviteUrl?: string;
  }> => {
    const token = botToken();
    if (!token) {
      return { attempted: false, ok: true, reason: "DISCORD_BOT_TOKEN_UNSET" };
    }

    if (!args.assign) {
      let grants = await ctx.runQuery(
        internal.discord.grants.listActiveForUserCreator,
        { userId: args.userId, creatorId: args.creatorId },
      );
      if (grants.length === 0) {
        const prep = await ctx.runQuery(internal.discord.queries.roleSyncPrep, {
          userId: args.userId,
          creatorId: args.creatorId,
          productId: args.productId,
        });
        if (prep?.discordUserId) {
          grants = [
            {
              productId: prep.productId,
              guildId: prep.guildId,
              roleId: prep.roleId,
            },
          ];
        }
      }
      let anyFail = false;
      for (const grant of grants) {
        const prepUser = await ctx.runQuery(internal.discord.queries.roleSyncPrep, {
          userId: args.userId,
          creatorId: args.creatorId,
          productId: grant.productId,
        });
        const discordUserId = prepUser?.discordUserId;
        if (!discordUserId) continue;
        const result = await discordFetch(
          `/guilds/${grant.guildId}/members/${discordUserId}/roles/${grant.roleId}`,
          { method: "DELETE" },
        );
        await ctx.runMutation(internal.discord.grants.upsertGrant, {
          userId: args.userId,
          creatorId: args.creatorId,
          productId: grant.productId,
          guildId: grant.guildId,
          roleId: grant.roleId,
          status: result.ok ? "revoked" : "failed",
          lastError: result.ok ? null : `HTTP_${result.status}`,
        });
        if (!result.ok) anyFail = true;
      }
      return { attempted: grants.length > 0, ok: !anyFail };
    }

    const prep = await ctx.runQuery(internal.discord.queries.roleSyncPrep, {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: args.productId,
    });
    if (!prep) {
      return { attempted: false, ok: true, reason: "NOT_CONFIGURED" };
    }

    let inviteUrl: string | undefined;
    if (!prep.discordUserId) {
      inviteUrl = (await createInviteUrl(prep.guildId)) ?? undefined;
      await ctx.runMutation(internal.discord.grants.upsertGrant, {
        userId: args.userId,
        creatorId: args.creatorId,
        productId: prep.productId,
        guildId: prep.guildId,
        roleId: prep.roleId,
        status: "pending",
        lastError: "NO_DISCORD_ID",
        inviteUrl: inviteUrl ?? null,
      });
      return {
        attempted: false,
        ok: true,
        reason: "NO_DISCORD_ID",
        inviteUrl,
      };
    }

    const result = await discordFetch(
      `/guilds/${prep.guildId}/members/${prep.discordUserId}/roles/${prep.roleId}`,
      { method: "PUT" },
    );

    if (result.ok) {
      await ctx.runMutation(internal.discord.grants.upsertGrant, {
        userId: args.userId,
        creatorId: args.creatorId,
        productId: prep.productId,
        guildId: prep.guildId,
        roleId: prep.roleId,
        status: "granted",
        lastError: null,
      });
      return { attempted: true, ok: true };
    }

    const needsJoin = result.status === 404 || result.status === 400;
    if (needsJoin) {
      inviteUrl = (await createInviteUrl(prep.guildId)) ?? undefined;
    }
    await ctx.runMutation(internal.discord.grants.upsertGrant, {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: prep.productId,
      guildId: prep.guildId,
      roleId: prep.roleId,
      status: "pending",
      lastError: `HTTP_${result.status}`,
      inviteUrl: inviteUrl ?? null,
    });
    console.error("Discord role sync failed", {
      assign: args.assign,
      status: result.status,
      body: result.text.slice(0, 300),
      creatorId: args.creatorId,
      userId: args.userId,
    });
    return {
      attempted: true,
      ok: false,
      reason: `HTTP_${result.status}`,
      inviteUrl,
    };
  },
});

export const createMemberInvite = action({
  args: { creatorId: v.id("creators") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const userId = await ctx.runQuery(internal.discord.queries.authedUserId, {});
    const allowed = await ctx.runQuery(internal.discord.queries.hasActiveAccess, {
      userId: userId as Id<"users">,
      creatorId: args.creatorId,
    });
    if (!allowed) return null;
    const prep = await ctx.runQuery(internal.discord.queries.roleSyncPrep, {
      userId: userId as Id<"users">,
      creatorId: args.creatorId,
    });
    if (!prep) return null;
    const inviteUrl = await createInviteUrl(prep.guildId);
    if (inviteUrl) {
      await ctx.runMutation(internal.discord.grants.setInviteUrl, {
        userId: userId as Id<"users">,
        creatorId: args.creatorId,
        productId: prep.productId,
        guildId: prep.guildId,
        roleId: prep.roleId,
        inviteUrl,
      });
    }
    return inviteUrl;
  },
});

export const retryPendingGrants = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx): Promise<null> => {
    const pending = await ctx.runQuery(internal.discord.grants.listPending, {
      limit: 40,
    });
    const now = Date.now();
    for (const row of pending) {
      if (now - row.updatedAt < 30_000) continue;
      await ctx.runAction(internal.discord.roles.syncSubscriberRole, {
        userId: row.userId,
        creatorId: row.creatorId,
        productId: row.productId,
        assign: true,
      });
    }
    const due = await ctx.runQuery(internal.discord.grants.listCancelledDueForRevoke, {
      now,
      limit: 40,
    });
    for (const row of due) {
      await ctx.runAction(internal.discord.roles.syncSubscriberRole, {
        userId: row.userId,
        creatorId: row.creatorId,
        productId: row.productId,
        assign: false,
      });
    }
    return null;
  },
});
