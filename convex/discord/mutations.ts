import { mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import {
  getCreatorForUser,
  requireAppUser,
  requireCreatorOwner,
} from "../lib/auth";
import { internal } from "../_generated/api";

const BOT_PERMISSIONS = 268435457; // Manage Roles + Create Instant Invite

function discordClientId(): string | null {
  return (
    process.env.DISCORD_CLIENT_ID?.trim() ||
    process.env.AUTH_DISCORD_ID?.trim() ||
    null
  );
}

export const startBotInstall = mutation({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    const clientId = discordClientId();
    const convexSite = (process.env.CONVEX_SITE_URL ?? "").replace(/\/$/, "");
    if (!clientId || !convexSite || !process.env.DISCORD_BOT_TOKEN?.trim()) {
      throw new ConvexError("DISCORD_BOT_NOT_CONFIGURED");
    }
    const secret =
      process.env.DISCORD_CLIENT_SECRET?.trim() ||
      process.env.AUTH_DISCORD_SECRET?.trim();
    if (!secret) throw new ConvexError("DISCORD_BOT_NOT_CONFIGURED");
    const nonce = crypto.randomUUID();
    const now = Date.now();
    await ctx.db.insert("discordBotInstalls", {
      nonce,
      creatorId: creator._id,
      expiresAt: now + 10 * 60 * 1000,
      createdAt: now,
    });
    const redirectUri = `${convexSite}/discord/bot-install/callback`;
    const url =
      `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(clientId)}` +
      `&permissions=${BOT_PERMISSIONS}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent("bot identify")}` +
      `&state=${encodeURIComponent(nonce)}`;
    return { url };
  },
});

export const disconnect = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new ConvexError("NOT_FOUND");
    const now = Date.now();
    await ctx.db.patch(creator._id, {
      discordServerId: undefined,
      discordRoleId: undefined,
      discordGuildName: undefined,
      discordGuildIcon: undefined,
      discordApproxMemberCount: undefined,
      discordConnectedAt: undefined,
      updatedAt: now,
    });
    const products = await ctx.db
      .query("products")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
    for (const p of products) {
      if (p.discordRoleId || p.discordRoleName) {
        await ctx.db.patch(p._id, {
          discordRoleId: undefined,
          discordRoleName: undefined,
          updatedAt: now,
        });
      }
    }
    return null;
  },
});

export const setProductRole = mutation({
  args: {
    productId: v.id("products"),
    roleId: v.union(v.string(), v.null()),
    roleName: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new ConvexError("NOT_FOUND");
    await requireCreatorOwner(ctx, product.creatorId);
    const trimmed = args.roleId?.trim() || null;
    await ctx.db.patch(args.productId, {
      discordRoleId: trimmed ?? undefined,
      discordRoleName: trimmed ? (args.roleName?.trim() || undefined) : undefined,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const retryMyAccess = mutation({
  args: { creatorId: v.id("creators") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", user._id).eq("creatorId", args.creatorId),
      )
      .collect();
    const allowed = subs.some((s) => s.status === "active" || s.status === "past_due");
    if (!allowed) throw new ConvexError("FORBIDDEN");
    await ctx.scheduler.runAfter(0, internal.discord.roles.syncSubscriberRole, {
      userId: user._id,
      creatorId: args.creatorId,
      assign: true,
    });
    return null;
  },
});
