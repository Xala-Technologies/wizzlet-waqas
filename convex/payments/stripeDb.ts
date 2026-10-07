import { internalMutation, internalQuery, type MutationCtx, type QueryCtx } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { calculatePlatformFee } from "../lib/money";
import {
  commercialRefForCheckout,
  commercialRefForInvoice,
  isDuplicateWebhookReceipt,
  LAUNCH_BILLING_PERIOD,
  normalizeBillingPeriod,
} from "../lib/commerceIdentity";
import { applySubscribeGrowthAttribution } from "../lib/growthAttribution";
import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import { userHasRole } from "../lib/auth";
import { ADMIN_SCAN_MAX_DOCS } from "../lib/adminLists";
import { PRIZELET_LEDGER_CURRENCY } from "../lib/stripeConnect";
import {
  computeAvailableAtMs,
  parsePayoutDefaults,
} from "../lib/payoutDefaults";
import { getCreatorAvailableBalanceCents } from "../lib/payoutBalance";
import { notifyAdmins, previewBody } from "../lib/notify";

/** Action auth helper: confirm Convex Auth userId holds the admin role. */
export const assertAdminUserId = internalQuery({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!(await userHasRole(ctx, args.userId, "admin"))) {
      throw new ConvexError("FORBIDDEN");
    }
    return null;
  },
});

async function loadFeeSettings(ctx: MutationCtx) {
  const row = await ctx.db
    .query("platformSettings")
    .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
    .unique();
  return {
    introFeePercent: row?.introFeePercent ?? 5,
    standardFeePercent: row?.standardFeePercent ?? 10,
    introFeeDays: row?.introFeeDays ?? 30,
  };
}

async function loadEarningsHoldDays(ctx: MutationCtx | QueryCtx): Promise<number> {
  const row = await ctx.db
    .query("platformSettings")
    .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
    .unique();
  const defaults = parsePayoutDefaults(
    (row?.payoutDefaults ?? undefined) as Record<string, unknown> | undefined,
  );
  return defaults.earningsHoldDays;
}

async function countActiveForProduct(
  ctx: QueryCtx | MutationCtx,
  productId: Id<"products">,
): Promise<number> {
  const subs = await ctx.db
    .query("subscriptions")
    .withIndex("by_productId", (q) => q.eq("productId", productId))
    .take(ADMIN_SCAN_MAX_DOCS);
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
      .take(ADMIN_SCAN_MAX_DOCS);
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
    promoId: v.optional(v.id("promoCodes")),
    creatorLinkId: v.optional(v.id("creatorLinks")),
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
      .take(ADMIN_SCAN_MAX_DOCS);
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

    const holdDays = await loadEarningsHoldDays(ctx);
    const availableAt = computeAvailableAtMs(now, holdDays);
    await ctx.db.insert("paymentEvents", {
      creatorId: args.creatorId,
      userId: args.userId,
      subscriptionId,
      productId: args.productId,
      type: "subscription_charge",
      amountCents: args.amountCents,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      currency: PRIZELET_LEDGER_CURRENCY,
      status: "settled",
      externalRef: args.deliveryRef,
      commercialRef,
      checkoutSessionId: args.checkoutSessionId,
      paymentMode: args.paymentMode ?? "test",
      availableAt,
      balanceState: holdDays > 0 ? "pending" : "available",
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

    await applySubscribeGrowthAttribution(ctx, {
      userId: args.userId,
      creatorId: args.creatorId,
      promoId: args.promoId,
      creatorLinkId: args.creatorLinkId,
      amountCents: args.amountCents,
      nowMs: now,
    });

    await ctx.scheduler.runAfter(0, internal.discord.roles.syncSubscriberRole, {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: args.productId,
      assign: true,
    });
    await ctx.scheduler.runAfter(120_000, internal.discord.roles.syncSubscriberRole, {
      userId: args.userId,
      creatorId: args.creatorId,
      productId: args.productId,
      assign: true,
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
    if (
      isDuplicateWebhookReceipt(existing, {
        provider: args.provider,
        eventId: args.eventId,
      })
    ) {
      return { duplicate: true as const, id: existing!._id };
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
      currency: PRIZELET_LEDGER_CURRENCY,
      status: "settled",
      externalRef: args.deliveryRef,
      commercialRef: `cancel:${args.stripeSubscriptionId}`,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.discord.roles.syncSubscriberRole, {
      userId: sub.userId,
      creatorId: sub.creatorId,
      productId: sub.productId,
      assign: false,
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

    const holdDays = await loadEarningsHoldDays(ctx);
    const availableAt = computeAvailableAtMs(now, holdDays);
    await ctx.db.insert("paymentEvents", {
      creatorId: sub.creatorId,
      userId: sub.userId,
      subscriptionId: sub._id,
      productId: sub.productId,
      type: "renewal",
      amountCents: amount,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      currency: PRIZELET_LEDGER_CURRENCY,
      status: "settled",
      externalRef: args.deliveryRef,
      commercialRef,
      paymentMode: args.paymentMode ?? "test",
      availableAt,
      balanceState: holdDays > 0 ? "pending" : "available",
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
    const ended =
      args.accessStatus === "cancelled" ||
      args.billingStatus === "canceled" ||
      args.billingStatus === "unpaid";
    if (ended) {
      await ctx.scheduler.runAfter(0, internal.discord.roles.syncSubscriberRole, {
        userId: sub.userId,
        creatorId: sub.creatorId,
        productId: sub.productId,
        assign: false,
      });
    }
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
      .take(ADMIN_SCAN_MAX_DOCS);
    return rows.find((s) => s.status === "active" || s.status === "past_due") ?? rows[0] ?? null;
  },
});

/** Resolve Stripe customer for Billing Portal (stored id or any subscription with Stripe id). */
export const getBillingPortalContext = internalQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    stripeCustomerId: v.union(v.string(), v.null()),
    stripeSubscriptionId: v.union(v.string(), v.null()),
    email: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("USER_NOT_FOUND");
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .take(ADMIN_SCAN_MAX_DOCS);
    const withStripe = subs.find((s) => !!s.stripeSubscriptionId);
    return {
      stripeCustomerId: user.stripeCustomerId ?? null,
      stripeSubscriptionId: withStripe?.stripeSubscriptionId ?? null,
      email: user.email ?? undefined,
    };
  },
});

export const setStripeCustomerId = internalMutation({
  args: {
    userId: v.id("users"),
    stripeCustomerId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      stripeCustomerId: args.stripeCustomerId,
      updatedAt: Date.now(),
    });
    return null;
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
      currency: PRIZELET_LEDGER_CURRENCY,
      status: "settled",
      externalRef: args.deliveryRef,
      commercialRef: `cancel_local:${sub._id}`,
      createdAt: now,
    });
    await ctx.scheduler.runAfter(0, internal.discord.roles.syncSubscriberRole, {
      userId: sub.userId,
      creatorId: sub.creatorId,
      productId: sub.productId,
      assign: false,
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

export const getConnectOnboardingContext = internalQuery({
  args: { userId: v.id("users") },
  returns: v.object({
    creatorId: v.id("creators"),
    username: v.string(),
    email: v.optional(v.string()),
    stripeAccountId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("USER_NOT_FOUND");
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    if (!creator) throw new ConvexError("NOT_FOUND");
    return {
      creatorId: creator._id,
      username: creator.username,
      email: user.email ?? undefined,
      stripeAccountId: creator.stripeAccountId,
    };
  },
});

export const persistConnectAccount = internalMutation({
  args: {
    creatorId: v.id("creators"),
    userId: v.id("users"),
    stripeAccountId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator || creator.userId !== args.userId) {
      throw new ConvexError("FORBIDDEN");
    }
    if (creator.stripeAccountId && creator.stripeAccountId !== args.stripeAccountId) {
      throw new ConvexError("CONNECT_ACCOUNT_LOCKED");
    }
    await ctx.db.patch(creator._id, {
      stripeAccountId: args.stripeAccountId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const persistConnectStatus = internalMutation({
  args: {
    creatorId: v.id("creators"),
    userId: v.id("users"),
    stripeAccountId: v.string(),
    detailsSubmitted: v.boolean(),
    chargesEnabled: v.boolean(),
    payoutsEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator || creator.userId !== args.userId) {
      throw new ConvexError("FORBIDDEN");
    }
    if (creator.stripeAccountId && creator.stripeAccountId !== args.stripeAccountId) {
      throw new ConvexError("CONNECT_ACCOUNT_LOCKED");
    }
    await ctx.db.patch(creator._id, {
      stripeAccountId: args.stripeAccountId,
      stripeConnectDetailsSubmitted: args.detailsSubmitted,
      stripeConnectChargesEnabled: args.chargesEnabled,
      stripeConnectPayoutsEnabled: args.payoutsEnabled,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getConnectTransferContext = internalQuery({
  args: { payoutId: v.id("payouts") },
  returns: v.object({
    payoutId: v.id("payouts"),
    creatorId: v.id("creators"),
    amountCents: v.number(),
    status: v.string(),
    reference: v.optional(v.string()),
    stripeAccountId: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new ConvexError("NOT_FOUND");
    const creator = await ctx.db.get(payout.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    return {
      payoutId: payout._id,
      creatorId: creator._id,
      amountCents: payout.amountCents,
      status: payout.status,
      reference: payout.reference,
      stripeAccountId: creator.stripeAccountId,
    };
  },
});

export const persistConnectStatusByCreatorId = internalMutation({
  args: {
    creatorId: v.id("creators"),
    stripeAccountId: v.string(),
    detailsSubmitted: v.boolean(),
    chargesEnabled: v.boolean(),
    payoutsEnabled: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");
    if (creator.stripeAccountId && creator.stripeAccountId !== args.stripeAccountId) {
      throw new ConvexError("CONNECT_ACCOUNT_LOCKED");
    }
    await ctx.db.patch(creator._id, {
      stripeAccountId: args.stripeAccountId,
      stripeConnectDetailsSubmitted: args.detailsSubmitted,
      stripeConnectChargesEnabled: args.chargesEnabled,
      stripeConnectPayoutsEnabled: args.payoutsEnabled,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const recordConnectTransfer = internalMutation({
  args: {
    payoutId: v.id("payouts"),
    transferId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const payout = await ctx.db.get(args.payoutId);
    if (!payout) throw new ConvexError("NOT_FOUND");
    if (payout.status === "completed" && payout.reference === args.transferId) {
      return null;
    }
    if (payout.status === "completed" || payout.status === "paid") {
      throw new ConvexError("PAYOUT_ALREADY_SETTLED");
    }
    const now = Date.now();
    await ctx.db.patch(payout._id, {
      status: "completed",
      method: "stripe_connect",
      reference: args.transferId,
      errorMessage: undefined,
      processedAt: now,
      updatedAt: now,
    });
    return null;
  },
});

export const persistConnectStatusByStripeAccountId = internalMutation({
  args: {
    stripeAccountId: v.string(),
    detailsSubmitted: v.boolean(),
    chargesEnabled: v.boolean(),
    payoutsEnabled: v.boolean(),
  },
  returns: v.object({
    ok: v.boolean(),
    creatorId: v.union(v.id("creators"), v.null()),
  }),
  handler: async (ctx, args) => {
    const creator = await ctx.db
      .query("creators")
      .withIndex("by_stripeAccountId", (q) =>
        q.eq("stripeAccountId", args.stripeAccountId),
      )
      .unique();
    if (!creator) {
      return { ok: false, creatorId: null };
    }
    await ctx.db.patch(creator._id, {
      stripeConnectDetailsSubmitted: args.detailsSubmitted,
      stripeConnectChargesEnabled: args.chargesEnabled,
      stripeConnectPayoutsEnabled: args.payoutsEnabled,
      updatedAt: Date.now(),
    });
    return { ok: true, creatorId: creator._id };
  },
});

/**
 * Ledger clawback for Stripe refunds / disputes.
 * Inserts a negative paymentEvent; marks original fully reversed when refund covers creator share.
 */
export const applyChargeRefund = internalMutation({
  args: {
    chargeId: v.string(),
    refundId: v.optional(v.string()),
    amountCents: v.number(),
    invoiceId: v.optional(v.string()),
    paymentIntentId: v.optional(v.string()),
    checkoutSessionId: v.optional(v.string()),
    deliveryRef: v.optional(v.string()),
    paymentMode: v.optional(
      v.union(v.literal("test"), v.literal("live"), v.literal("sandbox")),
    ),
    kind: v.optional(v.union(v.literal("refund"), v.literal("dispute"))),
  },
  returns: v.object({
    ok: v.boolean(),
    duplicate: v.boolean(),
    creatorId: v.union(v.id("creators"), v.null()),
    debtLikely: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const kind = args.kind ?? "refund";
    const commercialRef = args.refundId
      ? `${kind}:${args.refundId}`
      : `${kind}:charge:${args.chargeId}:${args.amountCents}`;

    const prior = await ctx.db
      .query("paymentEvents")
      .withIndex("by_commercialRef", (q) => q.eq("commercialRef", commercialRef))
      .unique();
    if (prior) {
      return {
        ok: true,
        duplicate: true,
        creatorId: prior.creatorId,
        debtLikely: false,
      };
    }

    let original = null as
      | {
          _id: Id<"paymentEvents">;
          creatorId: Id<"creators">;
          userId?: Id<"users">;
          subscriptionId?: Id<"subscriptions">;
          productId?: Id<"products">;
          amountCents: number;
          platformFeeCents: number;
          creatorEarningsCents: number;
          commercialRef?: string;
          balanceState?: string;
        }
      | null;

    if (args.checkoutSessionId) {
      original = await ctx.db
        .query("paymentEvents")
        .withIndex("by_checkoutSessionId", (q) =>
          q.eq("checkoutSessionId", args.checkoutSessionId!),
        )
        .unique();
    }
    if (!original && args.invoiceId) {
      const invoiceRef = commercialRefForInvoice(args.invoiceId);
      original = await ctx.db
        .query("paymentEvents")
        .withIndex("by_commercialRef", (q) => q.eq("commercialRef", invoiceRef))
        .unique();
    }
    if (!original && args.paymentIntentId) {
      const events = await ctx.db
        .query("paymentEvents")
        .withIndex("by_externalRef", (q) => q.eq("externalRef", args.paymentIntentId!))
        .take(5);
      original = events.find((e) => e.creatorEarningsCents > 0) ?? events[0] ?? null;
    }

    if (!original) {
      // Best-effort: cannot attribute — ignore quietly (ops can adjust manually).
      return { ok: false, duplicate: false, creatorId: null, debtLikely: false };
    }

    const gross = original.amountCents > 0 ? original.amountCents : 1;
    const refundGross = Math.min(Math.max(0, args.amountCents), gross);
    const ratio = refundGross / gross;
    const creatorClawback = Math.round(original.creatorEarningsCents * ratio);
    const platformClawback = Math.round(original.platformFeeCents * ratio);
    const now = Date.now();

    await ctx.db.insert("paymentEvents", {
      creatorId: original.creatorId,
      userId: original.userId,
      subscriptionId: original.subscriptionId,
      productId: original.productId,
      type: kind,
      amountCents: -refundGross,
      platformFeeCents: -platformClawback,
      creatorEarningsCents: -creatorClawback,
      currency: PRIZELET_LEDGER_CURRENCY,
      status: "settled",
      externalRef: args.deliveryRef ?? args.chargeId,
      commercialRef,
      relatedCommercialRef: original.commercialRef,
      paymentMode: args.paymentMode ?? "test",
      balanceState: "available",
      createdAt: now,
    });

    if (
      refundGross >= original.amountCents &&
      original.balanceState !== "reversed"
    ) {
      await ctx.db.patch(original._id, { balanceState: "reversed" });
    }

    const balance = await getCreatorAvailableBalanceCents(ctx, original.creatorId, now);
    if (balance.debtCents > 0 || balance.payoutBlocked) {
      const creator = await ctx.db.get(original.creatorId);
      await notifyAdmins(ctx, {
        type: "payout_debt",
        title: `Creator balance debt after ${kind}`,
        description: previewBody(
          `${creator?.displayName ?? creator?.username ?? "Creator"}: debt $${(balance.debtCents / 100).toFixed(2)} (charge ${args.chargeId})`,
        ),
        link: "/admin/payouts",
      });
    }

    return {
      ok: true,
      duplicate: false,
      creatorId: original.creatorId,
      debtLikely: balance.debtCents > 0,
    };
  },
});
