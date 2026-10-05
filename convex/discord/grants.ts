import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";

const grantStatus = v.union(
  v.literal("pending"),
  v.literal("granted"),
  v.literal("revoked"),
  v.literal("failed"),
);

export const upsertGrant = internalMutation({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    guildId: v.string(),
    roleId: v.string(),
    status: grantStatus,
    lastError: v.optional(v.union(v.string(), v.null())),
    inviteUrl: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.id("discordAccessGrants"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const rows = args.productId
      ? await ctx.db
          .query("discordAccessGrants")
          .withIndex("by_userId_productId", (q) =>
            q.eq("userId", args.userId).eq("productId", args.productId),
          )
          .take(ADMIN_SCAN_MAX_DOCS)
      : await ctx.db
          .query("discordAccessGrants")
          .withIndex("by_userId_creatorId", (q) =>
            q.eq("userId", args.userId).eq("creatorId", args.creatorId),
          )
          .take(ADMIN_SCAN_MAX_DOCS);
    const existing =
      rows.find((r) => r.roleId === args.roleId && r.guildId === args.guildId) ??
      rows[0];
    if (existing) {
      await ctx.db.patch(existing._id, {
        productId: args.productId,
        guildId: args.guildId,
        roleId: args.roleId,
        status: args.status,
        lastError: args.lastError === null ? undefined : args.lastError,
        inviteUrl: args.inviteUrl === null ? undefined : args.inviteUrl,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("discordAccessGrants", {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: args.productId,
      guildId: args.guildId,
      roleId: args.roleId,
      status: args.status,
      lastError: args.lastError ?? undefined,
      inviteUrl: args.inviteUrl ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listPending = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      creatorId: v.id("creators"),
      productId: v.optional(v.id("products")),
      updatedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 40, 1), 100);
    const rows = await ctx.db
      .query("discordAccessGrants")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .take(limit);
    return rows.map((r) => ({
      userId: r.userId,
      creatorId: r.creatorId,
      productId: r.productId,
      updatedAt: r.updatedAt,
    }));
  },
});

export const listActiveForUserCreator = internalQuery({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
  },
  returns: v.array(
    v.object({
      productId: v.optional(v.id("products")),
      guildId: v.string(),
      roleId: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("discordAccessGrants")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    return rows
      .filter((r) => r.status === "granted" || r.status === "pending")
      .map((r) => ({
        productId: r.productId,
        guildId: r.guildId,
        roleId: r.roleId,
      }));
  },
});

export const listCancelledDueForRevoke = internalQuery({
  args: { now: v.number(), limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      creatorId: v.id("creators"),
      productId: v.optional(v.id("products")),
    }),
  ),
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 40, 1), 80);
    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_status", (q) => q.eq("status", "cancelled"))
      .take(200);
    const due = rows.filter((s) => {
      if (s.currentPeriodEnd != null && s.currentPeriodEnd > args.now) return false;
      return true;
    });
    const seen = new Set<string>();
    const out: Array<{
      userId: Id<"users">;
      creatorId: Id<"creators">;
      productId?: Id<"products">;
    }> = [];
    for (const s of due) {
      const key = `${s.userId}:${s.creatorId}`;
      if (seen.has(key)) continue;
      const grants = await ctx.db
        .query("discordAccessGrants")
        .withIndex("by_userId_creatorId", (q) =>
          q.eq("userId", s.userId).eq("creatorId", s.creatorId),
        )
        .take(ADMIN_SCAN_MAX_DOCS);
      if (!grants.some((g) => g.status === "granted" || g.status === "pending")) {
        continue;
      }
      seen.add(key);
      out.push({
        userId: s.userId,
        creatorId: s.creatorId,
        productId: s.productId,
      });
      if (out.length >= limit) break;
    }
    return out;
  },
});

export const setInviteUrl = internalMutation({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    guildId: v.string(),
    roleId: v.string(),
    inviteUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("discordAccessGrants")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId),
      )
      .take(ADMIN_SCAN_MAX_DOCS);
    const existing =
      (args.productId
        ? rows.find((r) => r.productId === args.productId)
        : null) ??
      rows.find((r) => r.roleId === args.roleId) ??
      rows[0];
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        inviteUrl: args.inviteUrl,
        updatedAt: now,
      });
      return null;
    }
    await ctx.db.insert("discordAccessGrants", {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: args.productId,
      guildId: args.guildId,
      roleId: args.roleId,
      status: "pending",
      inviteUrl: args.inviteUrl,
      createdAt: now,
      updatedAt: now,
    });
    return null;
  },
});
