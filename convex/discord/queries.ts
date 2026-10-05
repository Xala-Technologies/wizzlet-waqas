import { internalMutation, internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getCreatorForUser, requireAppUser } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";

function discordClientId(): string | null {
  return (
    process.env.DISCORD_CLIENT_ID?.trim() ||
    process.env.AUTH_DISCORD_ID?.trim() ||
    null
  );
}

function botTokenSet(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN?.trim());
}

function clientSecretSet(): boolean {
  return Boolean(
    process.env.DISCORD_CLIENT_SECRET?.trim() ||
      process.env.AUTH_DISCORD_SECRET?.trim(),
  );
}

export const guildIdForUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const creator = await getCreatorForUser(ctx, args.userId);
    return creator?.discordServerId?.trim() || null;
  },
});

/** Node actions have no ctx.db, so resolve guild via this authed query. */
export const guildIdForAuthedUser = internalQuery({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    return creator?.discordServerId?.trim() || null;
  },
});

export const authedUserId = internalQuery({
  args: {},
  returns: v.id("users"),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    return user._id;
  },
});

export const botStatus = query({
  args: {},
  returns: v.object({
    configured: v.boolean(),
  }),
  handler: async () => {
    return { configured: Boolean(discordClientId() && botTokenSet() && clientSecretSet()) };
  },
});

export const connection = query({
  args: {},
  returns: v.union(
    v.object({
      connected: v.literal(false),
    }),
    v.object({
      connected: v.literal(true),
      guildId: v.string(),
      guildName: v.string(),
      guildIconUrl: v.union(v.string(), v.null()),
      memberCount: v.union(v.number(), v.null()),
      connectedAt: v.union(v.number(), v.null()),
    }),
  ),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator?.discordServerId) {
      return { connected: false as const };
    }
    const icon = creator.discordGuildIcon?.trim();
    const guildIconUrl = icon
      ? `https://cdn.discordapp.com/icons/${creator.discordServerId}/${icon}.png`
      : null;
    return {
      connected: true as const,
      guildId: creator.discordServerId,
      guildName: creator.discordGuildName ?? "Discord server",
      guildIconUrl,
      memberCount: creator.discordApproxMemberCount ?? null,
      connectedAt: creator.discordConnectedAt ?? null,
    };
  },
});

export const roleSyncPrep = internalQuery({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
  },
  returns: v.union(
    v.object({
      guildId: v.string(),
      roleId: v.string(),
      roleName: v.optional(v.string()),
      discordUserId: v.union(v.string(), v.null()),
      productId: v.optional(v.id("products")),
      productName: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    const user = await ctx.db.get(args.userId);
    if (!creator || !user) return null;
    const guildId = creator.discordServerId?.trim();
    if (!guildId) return null;

    let productId = args.productId;
    if (!productId) {
      const subs = await ctx.db
        .query("subscriptions")
        .withIndex("by_userId_creatorId", (q) =>
          q.eq("userId", args.userId).eq("creatorId", args.creatorId),
        )
        .take(ADMIN_SCAN_MAX_DOCS);
      const active =
        subs.find((s) => s.status === "active" || s.status === "past_due") ?? subs[0];
      productId = active?.productId;
    }

    let roleId: string | undefined;
    let roleName: string | undefined;
    let productName: string | undefined;
    if (productId) {
      const product = await ctx.db.get(productId);
      if (product && product.creatorId === args.creatorId) {
        roleId = product.discordRoleId?.trim();
        roleName = product.discordRoleName;
        productName = product.name;
      }
    }
    if (!roleId) {
      roleId = creator.discordRoleId?.trim();
    }
    if (!roleId) return null;

    return {
      guildId,
      roleId,
      roleName,
      discordUserId: user.discordId?.trim() || null,
      productId,
      productName,
    };
  },
});

export const memberAccess = query({
  args: { creatorUsername: v.string() },
  returns: v.union(
    v.object({
      includesDiscord: v.literal(false),
    }),
    v.object({
      includesDiscord: v.literal(true),
      creatorId: v.id("creators"),
      guildName: v.string(),
      productName: v.optional(v.string()),
      hasDiscordId: v.boolean(),
      inviteUrl: v.union(v.string(), v.null()),
      granted: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { includesDiscord: false as const };
    }
    const user = await ctx.db.get(userId);
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_username", (q) => q.eq("username", args.creatorUsername))
      .unique();
    if (!user || !creator?.discordServerId) {
      return { includesDiscord: false as const };
    }
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", userId).eq("creatorId", creator._id),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    const sub = subs.find((s) => s.status === "active" || s.status === "past_due");
    if (!sub) return { includesDiscord: false as const };

    let includes = false;
    let productName: string | undefined;
    if (sub.productId) {
      const product = await ctx.db.get(sub.productId);
      includes = Boolean(product?.discordRoleId?.trim());
      productName = product?.name;
    }
    if (!includes && creator.discordRoleId?.trim()) includes = true;
    if (!includes) return { includesDiscord: false as const };

    const grants = await ctx.db
      .query("discordAccessGrants")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", userId).eq("creatorId", creator._id),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    const grant = grants[0];
    return {
      includesDiscord: true as const,
      creatorId: creator._id,
      guildName: creator.discordGuildName ?? "Discord",
      productName,
      hasDiscordId: Boolean(user.discordId?.trim()),
      inviteUrl: grant?.inviteUrl ?? null,
      granted: grant?.status === "granted",
    };
  },
});

export const lookupInstallNonce = internalQuery({
  args: { nonce: v.string() },
  returns: v.union(v.id("creators"), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("discordBotInstalls")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .unique();
    if (!row || row.expiresAt < Date.now()) return null;
    return row.creatorId;
  },
});

export const hasActiveAccess = internalQuery({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    return subs.some((s) => s.status === "active" || s.status === "past_due");
  },
});

export const consumeInstallNonce = internalMutation({
  args: { nonce: v.string() },
  returns: v.union(v.id("creators"), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("discordBotInstalls")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .unique();
    if (!row || row.expiresAt < Date.now()) {
      if (row) await ctx.db.delete(row._id);
      return null;
    }
    await ctx.db.delete(row._id);
    return row.creatorId;
  },
});

export const saveGuildConnection = internalMutation({
  args: {
    creatorId: v.id("creators"),
    guildId: v.string(),
    guildName: v.string(),
    guildIcon: v.optional(v.union(v.string(), v.null())),
    memberCount: v.optional(v.union(v.number(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.creatorId, {
      discordServerId: args.guildId,
      discordGuildName: args.guildName,
      discordGuildIcon: args.guildIcon ?? undefined,
      discordApproxMemberCount: args.memberCount ?? undefined,
      discordConnectedAt: Date.now(),
      updatedAt: Date.now(),
    });
    return null;
  },
});
