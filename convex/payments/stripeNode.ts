"use node";

import Stripe from "stripe";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { isStripeAlreadyCanceledError } from "../lib/commerceIdentity";

function requireStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  return new Stripe(key);
}

function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, "");
}

function extractStripeSubscriptionId(obj: {
  subscription?: string | { id: string } | null;
}): string | undefined {
  const sub = obj.subscription;
  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) return sub.id;
  return undefined;
}

function stripeMode(livemode: boolean | null | undefined): "test" | "live" {
  return livemode ? "live" : "test";
}

export const createCheckoutSession = action({
  args: {
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    creatorUsername: v.string(),
  },
  returns: v.object({
    url: v.string(),
    sessionId: v.string(),
    alreadySubscribed: v.optional(v.boolean()),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");

    const prep = await ctx.runQuery(internal.payments.stripeDb.getCheckoutContext, {
      userId,
      creatorId: args.creatorId,
      productId: args.productId,
    });
    if (prep.alreadySubscribed) {
      return {
        url: `${siteUrl()}/subscription/success?creator=${encodeURIComponent(args.creatorUsername)}`,
        sessionId: "",
        alreadySubscribed: true,
      };
    }

    const stripe = requireStripe();
    const productLabel =
      prep.productName ??
      `Subscription — ${prep.displayName ?? `@${prep.username}`}`;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: prep.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: prep.amountCents,
            recurring: { interval: "month" },
            product_data: {
              name: productLabel,
              description: `Monthly access to @${prep.username}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl()}/subscription/success?creator=${encodeURIComponent(args.creatorUsername)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/subscription/cancel?creator=${encodeURIComponent(args.creatorUsername)}`,
      client_reference_id: userId,
      metadata: {
        userId,
        creatorId: args.creatorId,
        productId: args.productId ?? "",
        amountCents: String(prep.amountCents),
      },
      subscription_data: {
        metadata: {
          userId,
          creatorId: args.creatorId,
          productId: args.productId ?? "",
        },
      },
    });

    if (!session.url) throw new Error("CHECKOUT_URL_MISSING");
    return { url: session.url, sessionId: session.id };
  },
});

/** Confirm after redirect when webhook is delayed or not yet configured. */
export const confirmCheckoutSession = action({
  args: { sessionId: v.string() },
  returns: v.object({ ok: v.boolean(), duplicate: v.optional(v.boolean()) }),
  handler: async (ctx, args): Promise<{ ok: boolean; duplicate?: boolean }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const stripe = requireStripe();
    const session = await stripe.checkout.sessions.retrieve(args.sessionId, {
      expand: ["subscription"],
    });
    if (session.metadata?.userId !== userId) {
      throw new Error("FORBIDDEN");
    }
    if (session.status !== "complete") {
      throw new Error("SESSION_INCOMPLETE");
    }

    const creatorId = session.metadata?.creatorId as Id<"creators"> | undefined;
    if (!creatorId) throw new Error("MISSING_METADATA");
    const productIdRaw = session.metadata?.productId;
    const productId =
      productIdRaw && productIdRaw.length > 0
        ? (productIdRaw as Id<"products">)
        : undefined;
    const amountCents = Number(session.metadata?.amountCents ?? session.amount_total ?? 0);
    const stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;
    const stripeCustomerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;

    const result: { ok: true; duplicate: boolean; subscriptionId?: Id<"subscriptions"> } =
      await ctx.runMutation(internal.payments.stripeDb.fulfillCheckout, {
        userId,
        creatorId,
        productId,
        amountCents,
        stripeSubscriptionId,
        stripeCustomerId,
        checkoutSessionId: session.id,
        paymentMode: stripeMode(session.livemode),
      });
    return { ok: true, duplicate: result.duplicate };
  },
});

/** Stripe Customer Portal for payment methods / invoices. */
export const createBillingPortalSession = action({
  args: {},
  returns: v.object({ url: v.string() }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");

    const prep = await ctx.runQuery(internal.payments.stripeDb.getBillingPortalContext, {
      userId,
    });
    const stripe = requireStripe();

    let customerId = prep.stripeCustomerId ?? undefined;
    if (!customerId && prep.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(prep.stripeSubscriptionId);
      customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;
      await ctx.runMutation(internal.payments.stripeDb.setStripeCustomerId, {
        userId,
        stripeCustomerId: customerId,
      });
    }

    if (!customerId && prep.email) {
      const found = await stripe.customers.list({ email: prep.email, limit: 1 });
      const existing = found.data[0];
      if (existing) {
        customerId = existing.id;
        await ctx.runMutation(internal.payments.stripeDb.setStripeCustomerId, {
          userId,
          stripeCustomerId: customerId,
        });
      }
    }

    if (!customerId) {
      throw new Error("NO_BILLING_CUSTOMER");
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl()}/dashboard/subscriptions-billing`,
    });
    if (!session.url) throw new Error("PORTAL_URL_MISSING");
    return { url: session.url };
  },
});

export const cancelCreatorSubscription = action({
  args: { creatorId: v.id("creators") },
  returns: v.object({ ok: v.boolean(), status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const sub = await ctx.runQuery(internal.payments.stripeDb.getSubscriptionForCancel, {
      userId,
      creatorId: args.creatorId,
    });
    if (!sub) throw new Error("NOT_FOUND");

    await ctx.runMutation(internal.payments.stripeDb.markCancelPending, {
      subscriptionId: sub._id,
      userId,
    });

    const stripeId = sub.stripeSubscriptionId;
    if (stripeId && stripeId.startsWith("sub_")) {
      const stripe = requireStripe();
      try {
        await stripe.subscriptions.cancel(stripeId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (!isStripeAlreadyCanceledError(message)) {
          await ctx.runMutation(internal.payments.stripeDb.clearCancelPending, {
            subscriptionId: sub._id,
            userId,
          });
          throw new Error("STRIPE_CANCEL_FAILED");
        }
      }
    }

    await ctx.runMutation(internal.payments.stripeDb.cancelBySubscriptionId, {
      subscriptionId: sub._id,
      userId,
      deliveryRef: `user_cancel_${sub._id}`,
    });

    return { ok: true, status: "cancelled" };
  },
});

export const fulfillWebhook = internalAction({
  args: {
    signature: v.string(),
    payload: v.string(),
  },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { success: false, error: "WEBHOOK_SECRET_MISSING" };
    }
    const stripe = requireStripe();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(args.payload, args.signature, webhookSecret);
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "SIGNATURE_INVALID",
      };
    }

    const receipt = await ctx.runMutation(internal.payments.stripeDb.recordWebhookReceipt, {
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      processingState: "processed",
    });
    if (receipt.duplicate) {
      return { success: true };
    }

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId as Id<"users"> | undefined;
        const creatorId = session.metadata?.creatorId as Id<"creators"> | undefined;
        if (!userId || !creatorId) {
          return { success: false, error: "MISSING_METADATA" };
        }
        const productIdRaw = session.metadata?.productId;
        const productId =
          productIdRaw && productIdRaw.length > 0
            ? (productIdRaw as Id<"products">)
            : undefined;
        const amountCents = Number(session.metadata?.amountCents ?? session.amount_total ?? 0);
        const stripeSubscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : undefined;
        const stripeCustomerId =
          typeof session.customer === "string" ? session.customer : undefined;

        await ctx.runMutation(internal.payments.stripeDb.fulfillCheckout, {
          userId,
          creatorId,
          productId,
          amountCents,
          stripeSubscriptionId,
          stripeCustomerId,
          checkoutSessionId: session.id,
          deliveryRef: event.id,
          paymentMode: stripeMode(event.livemode),
        });
      } else if (event.type === "invoice.paid") {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null;
          billing_reason?: string | null;
        };
        const stripeSubscriptionId = extractStripeSubscriptionId(invoice);
        if (stripeSubscriptionId && invoice.billing_reason !== "subscription_create") {
          // Initial checkout is fulfilled via checkout.session.completed
          const line = invoice.lines?.data?.[0] as
            | { period?: { end?: number } }
            | undefined;
          await ctx.runMutation(internal.payments.stripeDb.applyInvoicePaid, {
            stripeSubscriptionId,
            invoiceId: invoice.id,
            amountCents: invoice.amount_paid ?? 0,
            periodEnd: line?.period?.end ? line.period.end * 1000 : undefined,
            deliveryRef: event.id,
            paymentMode: stripeMode(event.livemode),
          });
        }
      } else if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null;
        };
        const stripeSubscriptionId = extractStripeSubscriptionId(invoice);
        if (stripeSubscriptionId) {
          await ctx.runMutation(internal.payments.stripeDb.applyInvoicePaymentFailed, {
            stripeSubscriptionId,
            deliveryRef: event.id,
          });
        }
      } else if (event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription & {
          current_period_end?: number;
          cancel_at_period_end?: boolean;
        };
        const accessStatus =
          subscription.status === "canceled" || subscription.status === "unpaid"
            ? "cancelled"
            : subscription.status === "past_due"
              ? "past_due"
              : subscription.status === "active" || subscription.status === "trialing"
                ? "active"
                : undefined;
        await ctx.runMutation(internal.payments.stripeDb.applySubscriptionUpdated, {
          stripeSubscriptionId: subscription.id,
          billingStatus: subscription.status,
          currentPeriodEnd: subscription.current_period_end
            ? subscription.current_period_end * 1000
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          accessStatus,
        });
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        await ctx.runMutation(internal.payments.stripeDb.markSubscriptionCancelled, {
          stripeSubscriptionId: subscription.id,
          deliveryRef: event.id,
        });
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "FULFILL_FAILED",
      };
    }
  },
});
