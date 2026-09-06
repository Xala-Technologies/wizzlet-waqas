import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { getCreatorForUser, requireAdmin, requireAppUser } from "../lib/auth";
import { getCreatorAvailableBalanceCents } from "../lib/payoutBalance";
import {
  availableBalanceValidator,
  creatorPayoutSettingsDocValidator,
  payoutDocValidator,
} from "../lib/validators";

export const listMine = query({
  args: {},
  returns: v.array(payoutDocValidator),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return [];
    return ctx.db
      .query("payouts")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .collect();
  },
});

export const availableBalance = query({
  args: {},
  returns: availableBalanceValidator,
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) {
      return { earnedCents: 0, reservedCents: 0, availableCents: 0 };
    }
    return getCreatorAvailableBalanceCents(ctx, creator._id);
  },
});

export const listAllAdmin = query({
  args: {},
  returns: v.array(payoutDocValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return ctx.db.query("payouts").collect();
  },
});

export const createAdmin = mutation({
  args: {
    creatorId: v.id("creators"),
    amountCents: v.number(),
    status: v.string(),
    method: v.optional(v.string()),
    reference: v.optional(v.string()),
  },
  returns: v.id("payouts"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    return ctx.db.insert("payouts", {
      creatorId: args.creatorId,
      amountCents: args.amountCents,
      status: args.status,
      method: args.method,
      reference: args.reference,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const setStatusAdmin = mutation({
  args: {
    payoutId: v.id("payouts"),
    status: v.string(),
    reference: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch(args.payoutId, {
      status: args.status,
      reference: args.reference,
      processedAt: args.status === "completed" ? now : undefined,
      updatedAt: now,
    });
    return null;
  },
});

export const getMySettings = query({
  args: {},
  returns: v.union(creatorPayoutSettingsDocValidator, v.null()),
  handler: async (ctx) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) return null;
    return ctx.db
      .query("creatorPayoutSettings")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .unique();
  },
});

export const upsertSettings = mutation({
  args: {
    method: v.string(),
    accountLabel: v.optional(v.string()),
    schedule: v.string(),
    minimumPayoutCents: v.number(),
  },
  returns: v.id("creatorPayoutSettings"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    const existing = await ctx.db
      .query("creatorPayoutSettings")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .unique();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }
    return ctx.db.insert("creatorPayoutSettings", {
      creatorId: creator._id,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Persist a payout request (status=requested) — not toast-only / support_messages only. */
export const requestPayout = mutation({
  args: {
    amountCents: v.number(),
    method: v.optional(v.string()),
  },
  returns: v.id("payouts"),
  handler: async (ctx, args) => {
    const user = await requireAppUser(ctx);
    const creator = await getCreatorForUser(ctx, user._id);
    if (!creator) throw new Error("NOT_FOUND");
    if (!Number.isFinite(args.amountCents) || args.amountCents <= 0) {
      throw new Error("INVALID_AMOUNT");
    }

    const settings = await ctx.db
      .query("creatorPayoutSettings")
      .withIndex("by_creatorId", (q) => q.eq("creatorId", creator._id))
      .unique();
    const min = settings?.minimumPayoutCents ?? 5000;
    if (args.amountCents < min) {
      throw new Error("BELOW_MINIMUM");
    }

    const balance = await getCreatorAvailableBalanceCents(ctx, creator._id);
    if (args.amountCents > balance.availableCents) {
      throw new Error("INSUFFICIENT_BALANCE");
    }

    const now = Date.now();
    const payoutId = await ctx.db.insert("payouts", {
      creatorId: creator._id,
      amountCents: args.amountCents,
      status: "requested",
      method: args.method ?? settings?.method,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("supportMessages", {
      creatorId: creator._id,
      senderRole: "creator",
      channel: "payout",
      body: `Payout request for $${(args.amountCents / 100).toFixed(2)} via ${(args.method ?? settings?.method ?? "default").replace(/_/g, " ")}.`,
      read: false,
      createdAt: now,
    });

    return payoutId;
  },
});
