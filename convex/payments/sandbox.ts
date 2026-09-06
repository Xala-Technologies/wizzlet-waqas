/**
 * Sandbox subscribe/cancel — Convex-native checkout.
 * Gated by deployment env ALLOW_SANDBOX_CHECKOUT (never a client boolean).
 */

import { mutation } from "../_generated/server";
import { ConvexError, v } from "convex/values";
import { logMutation, requireAppUser } from "../lib/auth";
import { calculatePlatformFee } from "../lib/money";
import { assertSandboxEnabled } from "../lib/sandbox";

export const sandboxSubscribe = mutation({
  args: {
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
  },
  returns: v.union(
    v.object({
      alreadySubscribed: v.literal(true),
      subscriptionId: v.id("subscriptions"),
    }),
    v.object({
      ok: v.literal(true),
      subscriptionId: v.id("subscriptions"),
      amountCents: v.number(),
      sandbox: v.literal(true),
    }),
  ),
  handler: async (ctx, args) => {
    assertSandboxEnabled();
    const user = await requireAppUser(ctx);
    const creator = await ctx.db.get(args.creatorId);
    if (!creator) throw new ConvexError("NOT_FOUND");

    let amountCents = creator.monthlyPriceCents ?? 999;
    if (args.productId) {
      const product = await ctx.db.get(args.productId);
      if (
        !product ||
        product.creatorId !== creator._id ||
        !product.isActive ||
        product.isClosed
      ) {
        throw new ConvexError("PRODUCT_UNAVAILABLE");
      }
      amountCents = product.priceCents;
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      throw new ConvexError("PRICE_NOT_SET");
    }

    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", user._id).eq("creatorId", creator._id),
      )
      .collect();
    const active = existing.find((s) => s.status === "active");
    if (active) {
      return { alreadySubscribed: true as const, subscriptionId: active._id };
    }

    const settingsRow = await ctx.db
      .query("platformSettings")
      .withIndex("by_singletonKey", (q) => q.eq("singletonKey", "default"))
      .unique();
    const settings = {
      introFeePercent: settingsRow?.introFeePercent ?? 5,
      standardFeePercent: settingsRow?.standardFeePercent ?? 10,
      introFeeDays: settingsRow?.introFeeDays ?? 90,
    };
    const split = calculatePlatformFee(amountCents, creator.createdAt, settings);
    const now = Date.now();
    const sandboxRef = `sandbox_${now}`;

    const prior = existing[0];
    let subscriptionId;
    if (prior) {
      await ctx.db.patch(prior._id, {
        status: "active",
        productId: args.productId,
        amountCents,
        platformFeeCents: split.platformFeeCents,
        creatorEarningsCents: split.creatorEarningsCents,
        feePercentage: split.feePercentage,
        stripeSubscriptionId: sandboxRef,
        updatedAt: now,
      });
      subscriptionId = prior._id;
    } else {
      subscriptionId = await ctx.db.insert("subscriptions", {
        userId: user._id,
        creatorId: creator._id,
        productId: args.productId,
        stripeSubscriptionId: sandboxRef,
        status: "active",
        amountCents,
        platformFeeCents: split.platformFeeCents,
        creatorEarningsCents: split.creatorEarningsCents,
        feePercentage: split.feePercentage,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("paymentEvents", {
      creatorId: creator._id,
      userId: user._id,
      subscriptionId,
      productId: args.productId,
      type: "subscription_charge",
      amountCents,
      platformFeeCents: split.platformFeeCents,
      creatorEarningsCents: split.creatorEarningsCents,
      currency: "usd",
      status: "settled",
      externalRef: sandboxRef,
      commercialRef: `sandbox:${sandboxRef}`,
      checkoutSessionId: sandboxRef,
      paymentMode: "sandbox",
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "subscription",
      title: `Subscribed to ${creator.displayName ?? creator.username}`,
      description: `Sandbox payment of $${(amountCents / 100).toFixed(2)} — no real charge.`,
      read: false,
      link: "/dashboard/subscriptions-billing",
      createdAt: now,
    });

    await logMutation(ctx, {
      table: "subscriptions",
      documentId: subscriptionId,
      action: "sandboxSubscribe",
      actorExternalAuthId: user.externalAuthId,
    });

    return { ok: true as const, subscriptionId, amountCents, sandbox: true as const };
  },
});

export const sandboxCancel = mutation({
  args: {
    creatorId: v.id("creators"),
  },
  returns: v.object({
    ok: v.literal(true),
    status: v.literal("cancelled"),
    sandbox: v.literal(true),
  }),
  handler: async (ctx, args) => {
    assertSandboxEnabled();
    const user = await requireAppUser(ctx);
    const subs = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId_creatorId", (q) =>
        q.eq("userId", user._id).eq("creatorId", args.creatorId),
      )
      .collect();
    const sub = subs[0];
    if (!sub) throw new ConvexError("NOT_FOUND");
    await ctx.db.patch(sub._id, { status: "cancelled", updatedAt: Date.now() });
    return { ok: true as const, status: "cancelled" as const, sandbox: true as const };
  },
});
