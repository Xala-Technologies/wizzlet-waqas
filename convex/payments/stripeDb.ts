import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { calculatePlatformFee } from "../lib/money";
import {
  commercialRefForCheckout,
  commercialRefForInvoice,
  LAUNCH_BILLING_PERIOD,
  normalizeBillingPeriod,
} from "../lib/commerceIdentity";
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

async function countActiveForProduct(
  ctx: QueryCtx | MutationCtx,
  productId: Id<"products">,
): Promise<number> {
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_productId", (q) => q.eq("productId", productId))
    .collect();
  return subs.filter((s) => s.status === "active").length;
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
      if (!product || product.creatorId !== creator._id) {
        throw new ConvexError("PRODUCT_UNAVAILABLE");
      }
      if (!product.isActive || product.isClosed) {
        throw new ConvexError("PRODUCT_UNAVAILABLE");
      }
      try {
        normalizeBillingPeriod(product.billingPeriod);
      } catch {
        throw new ConvexError("UNSUPPORTED_BILLING_PERIOD");
      }
      if (product.isLimited && product.maxSpots != null) {
        const taken = await countActiveForProduct(ctx, product._id);
        if (taken >= product.maxSpots) {
          throw new ConvexError("PRODUCT_FULL");
        }
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
      billingPeriod: LAUNCH_BILLING_PERIOD,
      alreadySubscribed: !!active,
      activeSubscriptionId: active?._id,
      existingStripeSubscriptionId: active?.stripeSubscriptionId,
    };
  },
});

/**
 * Idempotent fulfill after Checkout completion (webhook or client confirm).
 * Ledger identity is checkoutSessionId / commercialRef — not webhook event id.
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
    /** Optional delivery receipt (Stripe event id); not used for ledger dedupe. */
    deliveryRef: v.optional(v.string()),
    paymentMode: v.optional(v.union(v.literal("test"), v.literal("live"), v.literal("sandbox"))),
  },
  handler: async (ctx, args) => {
    const commercialRef = commercialRefForCheckout(args.checkoutSessionId);

    const priorBySession = await ctx.db
      .query("paymentEvents")
      .withIndex("by_checkoutSessionId", (q) =>
        q.eq("checkoutSessionId", args.checkoutSessionId),
      )
      .unique();
    if (priorBySession) {
      return {
        ok: true as const,
        duplicate: true,
        subscriptionId: priorBySession.subscriptionId,
      };
    }

    const priorByCommercial = await ctx.db
      .query("paymentEvents")
      .withIndex("by_commercialRef", (q) => q.eq("commercialRef", commercialRef))
      .unique();
    if (priorByCommercial) {
      return {
        ok: true as const,
        duplicate: true,
        subscriptionId: priorByCommercial.subscriptionId,
      };
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
        billingStatus: "active",
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
        billingStatus: "active",
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
      externalRef: args.deliveryRef,
      commercialRef,
      checkoutSessionId: args.checkoutSessionId,
      paymentMode: args.paymentMode ?? "test",
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

export const recordWebhookReceipt = internalMutation({
  args: {
    provider: v.string(),
    eventId: v.string(),
    eventType: v.string(),
    processingState: v.union(
      v.literal("processed"),
      v.literal("failed"),
      v.literal("ignored"),
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookReceipts")
      .withIndex("by_provider_eventId", (q) =>
        q.eq("provider", args.provider).eq("eventId", args.eventId),
      )
      .unique();
    if (existing) {
      return { duplicate: true as const, id: existing._id };
    }
    const id = await ctx.db.insert("webhookReceipts", {
      provider: args.provider,
      eventId: args.eventId,
      eventType: args.eventType,
      processingState: args.processingState,
      error: args.error,
      createdAt: Date.now(),
    });
    return { duplicate: false as const, id };
  },
});

export const markSubscriptionCancelled = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    deliveryRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
    if (!sub) return { ok: false as const, reason: "NOT_FOUND" };

    if (sub.status === "cancelled") {
      return { ok: true as const, duplicate: true };
    }

    const now = Date.now();
    await ctx.db.patch(sub._id, {
      status: "cancelled",
      billingStatus: "canceled",
      updatedAt: now,
    });
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
      externalRef: args.deliveryRef,
      commercialRef: `cancel:${args.stripeSubscriptionId}`,
      createdAt: now,
    });
    return { ok: true as const, duplicate: false };
  },
});

export const applyInvoicePaid = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    invoiceId: v.string(),
    amountCents: v.number(),
    periodEnd: v.optional(v.number()),
    deliveryRef: v.optional(v.string()),
    paymentMode: v.optional(v.union(v.literal("test"), v.literal("live"), v.literal("sandbox"))),
  },
  handler: async (ctx, args) => {
    const commercialRef = commercialRefForInvoice(args.invoiceId);
    const prior = await ctx.db
      .query("paymentEvents")
      .withIndex("by_commercialRef", (q) => q.eq("commercialRef", commercialRef))
      .unique();
    if (prior) {
      return { ok: true as const, duplicate: true, subscriptionId: prior.subscriptionId };
    }

    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
    if (!sub) return { ok: false as const, reason: "NOT_FOUND" };

    const creator = await ctx.db.get(sub.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    const settings = await loadFeeSettings(ctx);
    const amount = args.amountCents > 0 ? args.amountCents : sub.amountCents;
    const split = calculatePlatformFee(amount, creator.createdAt, settings);
    const now = Date.now();

    await ctx.db.patch(sub._id, {
      status: "active",
      billingStatus: "active",
      currentPeriodEnd: args.periodEnd,
      amountCents: amount,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      feePercentage: split.feePercentage,
      updatedAt: now,
    });

    await ctx.db.insert("paymentEvents", {
      creatorId: sub.creatorId,
      userId: sub.userId,
      subscriptionId: sub._id,
      productId: sub.productId,
      type: "renewal",
      amountCents: amount,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      currency: "usd",
      status: "settled",
      externalRef: args.deliveryRef,
      commercialRef,
      paymentMode: args.paymentMode ?? "test",
      createdAt: now,
    });

    return { ok: true as const, duplicate: false, subscriptionId: sub._id };
  },
});

export const applyInvoicePaymentFailed = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    deliveryRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
    if (!sub) return { ok: false as const, reason: "NOT_FOUND" };
    const now = Date.now();
    // Access may remain until period end; billing status reflects failure.
    await ctx.db.patch(sub._id, {
      billingStatus: "past_due",
      status: "past_due",
      updatedAt: now,
    });
    return { ok: true as const };
  },
});

export const applySubscriptionUpdated = internalMutation({
  args: {
    stripeSubscriptionId: v.string(),
    billingStatus: v.string(),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    accessStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripeSubscriptionId", (q) =>
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId),
      )
      .first();
    if (!sub) return { ok: false as const, reason: "NOT_FOUND" };
    const patch: Record<string, string | number | boolean | undefined> = {
      billingStatus: args.billingStatus,
      updatedAt: Date.now(),
    };
    if (args.currentPeriodEnd !== undefined) patch.currentPeriodEnd = args.currentPeriodEnd;
    if (args.cancelAtPeriodEnd !== undefined) patch.cancelAtPeriodEnd = args.cancelAtPeriodEnd;
    if (args.accessStatus !== undefined) patch.status = args.accessStatus;
    await ctx.db.patch(sub._id, patch);
    return { ok: true as const };
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
    return rows.find((s) => s.status === "active" || s.status === "past_due") ?? rows[0] ?? null;
  },
});

/** Mark cancel pending before calling Stripe (truthful cancel workflow). */
export const markCancelPending = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub || sub.userId !== args.userId) throw new ConvexError("FORBIDDEN");
    await ctx.db.patch(sub._id, {
      billingStatus: "cancel_pending",
      updatedAt: Date.now(),
    });
    return { ok: true as const };
  },
});

/** Cancel by Convex subscription id — only after Stripe success (or no Stripe id). */
export const cancelBySubscriptionId = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    userId: v.id("users"),
    deliveryRef: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub || sub.userId !== args.userId) throw new ConvexError("FORBIDDEN");
    if (sub.status === "cancelled") {
      return { ok: true as const, duplicate: true };
    }
    const now = Date.now();
    await ctx.db.patch(sub._id, {
      status: "cancelled",
      billingStatus: "canceled",
      updatedAt: now,
    });
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
      externalRef: args.deliveryRef,
      commercialRef: `cancel_local:${sub._id}`,
      createdAt: now,
    });
    return { ok: true as const, duplicate: false };
  },
});

export const clearCancelPending = internalMutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub || sub.userId !== args.userId) throw new ConvexError("FORBIDDEN");
    if (sub.billingStatus === "cancel_pending") {
      await ctx.db.patch(sub._id, {
        billingStatus: sub.status === "active" ? "active" : sub.billingStatus,
        updatedAt: Date.now(),
      });
    }
    return { ok: true as const };
  },
});
