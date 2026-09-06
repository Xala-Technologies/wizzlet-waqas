import { internalMutation, internalQuery, type MutationCtx } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { calculatePlatformFee } from "../lib/money";
import type { Id } from "../_generated/dataModel";

async function loadFeeSettings(ctx: MutationCtx) {
  const row = await ctx.db
    .query("platformSettings")
    .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
    .unique();
  return {
    introFeePercent: row?.introFeePercent ?? 5,
    standardFeePercent: row?.standardFeePercent ?? 10,
    introFeeDays: row?.introFeeDays ?? 90,
  };
}

/** Prepare amounts / emails for Stripe Checkout (trusted). */
export const getCheckoutContext = internalQuery({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("USER_NOT_FOUND");
    const creator = await ctx.db.get(args.creatorId);
    if (!creator || !creator.isPublished) throw new ConvexError("NOT_FOUND");

    let amountCents = creator.monthlyPriceCents ?? 999;
    let productName: string | undefined;
    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      if (!product || product.creatorId !== creator._id || !product.isActive) {
        throw new ConvexError("PRODUCT_UNAVAILABLE");
      }
      amountCents = product.priceCents;
      productName = product.name;
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new ConvexError("PRICE_NOT_SET");
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId),
      )
      .collect();
    const active = existing.find((s) => s.status === "active");

    return {
      email: user.email ?? undefined,
      fullName: user.fullName ?? user.name,
      username: creator.username,
      displayName: creator.displayName,
      amountCents,
      productName,
      alreadySubscribed: !!active,
      activeSubscriptionId: active?._id,
      existingStripeSubscriptionId: active?.stripeSubscriptionId,
    };
  },
});

/**
 * Idempotent fulfill after Checkout completion (webhook or client confirm).
 * externalRef should be Stripe event id or checkout session id.
 */
export const fulfillCheckout = internalMutation({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    amountCents: v.number(),
    stripeSubscriptionId: v.optional(v.string()),
    stripeCustomerId: v.optional(v.string()),
    checkoutSessionId: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const priorEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_externalRef", (q) => q.eq("externalRef", args.idempotencyKey))
      .unique();
    if (priorEvent) {
      return { ok: true as const, duplicate: true, subscriptionId: priorEvent.subscriptionId };
    }

    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    const settings = await loadFeeSettings(ctx);
    const split = calculatePlatformFee(args.amountCents, creator.createdAt, settings);
    const now = Date.now();

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId),
      )
      .collect();
    const prior = existing[0];
    let subscriptionId: Id<"subscriptions">;
    if (prior) {
      await ctx.db.patch(prior._id, {
        status: "active",
        productId: args.productId,
        amountCents: args.amountCents,
        platformFeeCents: split.platformFeeCents,
        creatorEarningsCents: split.creatorEarningsCents,
        feePercentage: split.feePercentage,
        stripeSubscriptionId: args.stripeSubscriptionId ?? prior.stripeSubscriptionId,
        updatedAt: now,
      });
      subscriptionId = prior._id;
    } else {
      subscriptionId = await ctx.db.insert("subscriptions", {
        userId: args.userId,
        creatorId: args.creatorId,
        productId: args.productId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        status: "active",
        amountCents: args.amountCents,
        platformFeeCents: split.platformFeeCents,
        creatorEarningsCents: split.creatorEarningsCents,
        feePercentage: split.feePercentage,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (args.stripeCustomerId) {
      await ctx.db.patch(args.userId, {
        stripeCustomerId: args.stripeCustomerId,
        updatedAt: now,
      });
    }

    await ctx.db.insert("paymentEvents", {
      creatorId: args.creatorId,
      userId: args.userId,
      subscriptionId,
      productId: args.productId,
      type: "subscription_charge",
      amountCents: args.amountCents,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      currency: "usd",
      status: "settled",
      externalRef: args.idempotencyKey,
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "subscription",
      title: `Subscribed to ${creator.displayName ?? creator.username}`,
      description: `Payment of $${(args.amountCents / 100).toFixed(2)} received.`,
      read: false,
      link: "/dashboard/subscriptions-billing",
      createdAt: now,
    });

    return { ok: true as const, duplicate: false, subscriptionId };
  },
});

export const markSubscriptionCancelled = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const priorEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_externalRef", (q) => q.eq("externalRef", args.idempotencyKey))
      .unique();
    if (priorEvent) return { ok: true as const, duplicate: true };

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
    if (!sub) return { ok: false as const, reason: "NOT_FOUND" };

    const now = Date.now();
    await ctx.db.patch(sub._id, { status: "cancelled", updatedAt: now });
    await ctx.db.insert("paymentEvents", {
      creatorId: sub.creatorId,
      userId: sub.userId,
      subscriptionId: sub._id,
      type: "subscription_cancel",
      amountCents: 0,
      platformFeeCents: 0,
      creatorEarningsCents: 0,
      currency: "usd",
      status: "settled",
      externalRef: args.idempotencyKey,
      createdAt: now,
    });
    return { ok: true as const, duplicate: false };
  },
});

export const getSubscriptionForCancel = internalQuery({
  args: {
    userId: v.id("users"),
    creatorId: v.id("creators"),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", args.userId).eq("creatorId", args.creatorId),
      )
      .collect();
    return rows.find((s) => s.status === "active") ?? rows[0] ?? null;
  },
});

/** Cancel by Convex subscription id (sandbox or after Stripe cancel). */
export const cancelBySubscriptionId = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    userId: v.id("users"),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const priorEvent = await ctx.db
      .query("paymentEvents")
      .withIndex("by_externalRef", (q) => q.eq("externalRef", args.idempotencyKey))
      .unique();
    if (priorEvent) return { ok: true as const, duplicate: true };

    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub || sub.userId !== args.userId) throw new ConvexError("FORBIDDEN");
    const now = Date.now();
    await ctx.db.patch(sub._id, { status: "cancelled", updatedAt: now });
    await ctx.db.insert("paymentEvents", {
      creatorId: sub.creatorId,
      userId: sub.userId,
      subscriptionId: sub._id,
      type: "subscription_cancel",
      amountCents: 0,
      platformFeeCents: 0,
      creatorEarningsCents: 0,
      currency: "usd",
      status: "settled",
      externalRef: args.idempotencyKey,
      createdAt: now,
    });
    return { ok: true as const, duplicate: false };
  },
});
