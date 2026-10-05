"use node";

import Stripe from "stripe";
import { action, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { isStripeAlreadyCanceledError } from "../lib/commerceIdentity";
import { stripeCouponDuration } from "../lib/promoCodes";
import { resolveSiteUrl } from "../lib/envGuards";
import {
  connectOnboardingUrls,
  connectStatusFromStripeAccount,
  expressConnectCapabilities,
  isConnectTransferReference,
  isStripeAccountsV1DisabledError,
  isStripeConnectNotEnabledError,
  PRIZELET_LEDGER_CURRENCY,
  resolveConnectTransferPlan,
} from "../lib/stripeConnect";

function requireStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  return new Stripe(key);
}

function siteUrl(): string {
  return resolveSiteUrl();
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

function optionalMetaId<T extends string>(raw: string | undefined | null): T | undefined {
  if (!raw || raw.length === 0) return undefined;
  return raw as T;
}

function checkoutAmountCents(session: {
  amount_total?: number | null;
  metadata?: Record<string, string> | null;
}): number {
  if (session.amount_total != null && session.amount_total > 0) {
    return session.amount_total;
  }
  return Number(session.metadata?.amountCents ?? 0);
}

export const createCheckoutSession = action({
  args: {
    creatorId: v.id("creators"),
    productId: v.optional(v.id("products")),
    creatorUsername: v.string(),
    promoCode: v.optional(v.string()),
    /** Optional `/go/:linkId` attribution from client session handoff. */
    creatorLinkId: v.optional(v.id("creatorLinks")),
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

    let promo: {
      promoId: Id<"promoCodes">;
      code: string;
      discountPercent: number;
      discountDuration: "once" | "forever";
    } | null = null;
    if (args.promoCode?.trim()) {
      promo = await ctx.runQuery(internal.creators.growth.resolvePromoForCheckout, {
        creatorId: args.creatorId,
        code: args.promoCode,
        nowMs: Date.now(),
      });
      if (!promo) throw new Error("PROMO_INVALID");
    }

    const stripe = requireStripe();
    const productLabel =
      prep.productName ??
      `Subscription — ${prep.displayName ?? `@${prep.username}`}`;

    let discountCouponId: string | undefined;
    if (promo) {
      const duration = stripeCouponDuration(promo.discountDuration);
      const coupon = await stripe.coupons.create({
        percent_off: promo.discountPercent,
        duration: duration.duration,
        name: `Prizelet ${promo.code}`,
        max_redemptions: 1,
      });
      discountCouponId = coupon.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: prep.email,
      line_items: [
        {
          price_data: {
            currency: PRIZELET_LEDGER_CURRENCY,
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
      ...(discountCouponId
        ? { discounts: [{ coupon: discountCouponId }] }
        : {}),
      success_url: `${siteUrl()}/subscription/success?creator=${encodeURIComponent(args.creatorUsername)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/subscription/cancel?creator=${encodeURIComponent(args.creatorUsername)}`,
      client_reference_id: userId,
      metadata: {
        userId,
        creatorId: args.creatorId,
        productId: args.productId ?? "",
        amountCents: String(prep.amountCents),
        promoId: promo?.promoId ?? "",
        promoCode: promo?.code ?? "",
        creatorLinkId: args.creatorLinkId ?? "",
      },
      subscription_data: {
        metadata: {
          userId,
          creatorId: args.creatorId,
          productId: args.productId ?? "",
          promoId: promo?.promoId ?? "",
          creatorLinkId: args.creatorLinkId ?? "",
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
    const amountCents = checkoutAmountCents(session);
    const promoId = optionalMetaId<Id<"promoCodes">>(session.metadata?.promoId);
    const creatorLinkId = optionalMetaId<Id<"creatorLinks">>(
      session.metadata?.creatorLinkId,
    );
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
        promoId,
        creatorLinkId,
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
        const amountCents = checkoutAmountCents(session);
        const promoId = optionalMetaId<Id<"promoCodes">>(session.metadata?.promoId);
        const creatorLinkId = optionalMetaId<Id<"creatorLinks">>(
          session.metadata?.creatorLinkId,
        );
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
          promoId,
          creatorLinkId,
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

async function cancelStripeSubscriptionsImpl(args: {
  stripeSubscriptionIds: string[];
  reason: string;
}): Promise<{
  attempted: number;
  canceled: number;
  alreadyCanceled: number;
  failed: number;
}> {
  const ids = [
    ...new Set(
      args.stripeSubscriptionIds.filter((id) => typeof id === "string" && id.startsWith("sub_")),
    ),
  ];
  if (ids.length === 0) {
    return { attempted: 0, canceled: 0, alreadyCanceled: 0, failed: 0 };
  }

  const stripe = requireStripe();
  let canceled = 0;
  let alreadyCanceled = 0;
  let failed = 0;
  for (const stripeId of ids) {
    try {
      await stripe.subscriptions.cancel(stripeId);
      canceled += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (isStripeAlreadyCanceledError(message)) {
        alreadyCanceled += 1;
      } else {
        console.error(
          `[stripe] deletion cancel failed ${stripeId} (${args.reason})`,
          message.slice(0, 200),
        );
        failed += 1;
      }
    }
  }
  return { attempted: ids.length, canceled, alreadyCanceled, failed };
}

const cancelStripeResultValidator = v.object({
  attempted: v.number(),
  canceled: v.number(),
  alreadyCanceled: v.number(),
  failed: v.number(),
});

/**
 * Best-effort Stripe cancels after admin account-deletion fulfill.
 * Local subscription rows are already cancelled; this stops remote billing.
 */
export const cancelStripeSubscriptionsBestEffort = internalAction({
  args: {
    stripeSubscriptionIds: v.array(v.string()),
    reason: v.string(),
  },
  returns: cancelStripeResultValidator,
  handler: async (_ctx, args) => cancelStripeSubscriptionsImpl(args),
});

/**
 * Admin-facing cancel after deletion fulfill (client calls this with returned `sub_*` ids).
 */
export const cancelStripeSubscriptionsAdmin = action({
  args: {
    stripeSubscriptionIds: v.array(v.string()),
    reason: v.string(),
  },
  returns: cancelStripeResultValidator,
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    await ctx.runQuery(internal.payments.stripeDb.assertAdminUserId, { userId });
    return cancelStripeSubscriptionsImpl({
      stripeSubscriptionIds: args.stripeSubscriptionIds,
      reason: args.reason.slice(0, 200),
    });
  },
});

const connectStatusReturnValidator = v.object({
  stripeAccountId: v.string(),
  detailsSubmitted: v.boolean(),
  chargesEnabled: v.boolean(),
  payoutsEnabled: v.boolean(),
});

/**
 * Express country for new connected accounts. Must match ledger/charge currency
 * (USD → US by default). Do not default to the platform legal country (NO) while
 * Checkout still prices in USD — that would invite NOK transfers of USD cents.
 */
function connectCountry(): string {
  const raw = process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase();
  return raw && /^[A-Z]{2}$/.test(raw) ? raw : "US";
}

async function stripeExchangeRateForLedger(
  stripe: Stripe,
  ledgerCurrency: string,
  settlementCurrency: string,
): Promise<number> {
  const ledger = ledgerCurrency.toLowerCase();
  const settlement = settlementCurrency.toLowerCase();
  if (ledger === settlement) return 1;
  const page = await stripe.balanceTransactions.list({
    limit: 30,
    type: "charge",
  });
  for (const tx of page.data) {
    if (tx.currency.toLowerCase() !== settlement) continue;
    if (typeof tx.exchange_rate !== "number" || !(tx.exchange_rate > 0)) continue;
    const sourceId = typeof tx.source === "string" ? tx.source : tx.source?.id;
    if (!sourceId || !sourceId.startsWith("ch_")) continue;
    const charge = await stripe.charges.retrieve(sourceId);
    if (charge.currency.toLowerCase() === ledger) {
      return tx.exchange_rate;
    }
  }
  throw new Error("STRIPE_FX_RATE_UNAVAILABLE");
}

function mapStripeConnectError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message === "STRIPE_CURRENCY_MISMATCH" ||
    message === "STRIPE_INSUFFICIENT_BALANCE" ||
    message === "STRIPE_FX_RATE_UNAVAILABLE" ||
    message === "INVALID_AMOUNT" ||
    message === "CONNECT_PAYOUTS_NOT_ENABLED" ||
    message === "CONNECT_ACCOUNT_MISSING"
  ) {
    throw new Error(message);
  }
  if (isStripeConnectNotEnabledError(message)) {
    throw new Error("STRIPE_CONNECT_NOT_ENABLED");
  }
  if (isStripeAccountsV1DisabledError(message)) {
    throw new Error("STRIPE_CONNECT_ACCOUNTS_V1_DISABLED");
  }
  if (/insufficient funds|available funds/i.test(message)) {
    throw new Error("STRIPE_INSUFFICIENT_BALANCE");
  }
  if (/currency/i.test(message) && /transfer/i.test(message)) {
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  throw err instanceof Error ? err : new Error(message);
}

/**
 * Create (or reuse) a Stripe Express connected account and return an Account Link.
 * Does not move money. Admin Send via Stripe creates Transfers only after KYC
 * (`payouts_enabled`) with matched USD available or Stripe-native FX from settlement.
 */
export const createConnectOnboardingSession = action({
  args: {},
  returns: v.object({ url: v.string(), stripeAccountId: v.string() }),
  handler: async (ctx): Promise<{ url: string; stripeAccountId: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const stripe = requireStripe();
    const prep: {
      creatorId: Id<"creators">;
      username: string;
      email?: string;
      stripeAccountId?: string;
    } = await ctx.runQuery(internal.payments.stripeDb.getConnectOnboardingContext, {
      userId,
    });

    let stripeAccountId = prep.stripeAccountId;
    if (!stripeAccountId) {
      try {
        const account = await stripe.accounts.create({
          type: "express",
          country: connectCountry(),
          email: prep.email,
          capabilities: expressConnectCapabilities(),
          metadata: {
            creatorId: prep.creatorId,
            userId,
            username: prep.username,
          },
        });
        stripeAccountId = account.id;
      } catch (err) {
        mapStripeConnectError(err);
      }
      if (!stripeAccountId) throw new Error("CONNECT_ACCOUNT_MISSING");
      await ctx.runMutation(internal.payments.stripeDb.persistConnectAccount, {
        creatorId: prep.creatorId,
        userId,
        stripeAccountId,
      });
    }

    if (!stripeAccountId) throw new Error("CONNECT_ACCOUNT_MISSING");
    const urls = connectOnboardingUrls(siteUrl());
    try {
      const link = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: urls.refreshUrl,
        return_url: urls.returnUrl,
        type: "account_onboarding",
      });
      if (!link.url) throw new Error("CONNECT_LINK_MISSING");
      return { url: link.url, stripeAccountId };
    } catch (err) {
      mapStripeConnectError(err);
    }
  },
});

/** Admin-only: live platform Stripe balance buckets (honest treasury view). */
export const getConnectPlatformBalance = action({
  args: {},
  returns: v.object({
    ledgerCurrency: v.string(),
    platformCountry: v.string(),
    platformDefaultCurrency: v.string(),
    available: v.array(
      v.object({
        amount: v.number(),
        currency: v.string(),
      }),
    ),
    pending: v.array(
      v.object({
        amount: v.number(),
        currency: v.string(),
      }),
    ),
    ledgerCurrencyAvailable: v.boolean(),
    stripeFxFundingAvailable: v.boolean(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    await ctx.runQuery(internal.payments.stripeDb.assertAdminUserId, { userId });
    const stripe = requireStripe();
    const [balance, account] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.accounts.retrieve(null),
    ]);
    const available = (balance.available ?? []).map((row) => ({
      amount: row.amount,
      currency: row.currency.toLowerCase(),
    }));
    const pending = (balance.pending ?? []).map((row) => ({
      amount: row.amount,
      currency: row.currency.toLowerCase(),
    }));
    const settlement = (account.default_currency ?? "").toLowerCase();
    const ledgerCurrencyAvailable = available.some(
      (row) => row.currency === PRIZELET_LEDGER_CURRENCY && row.amount > 0,
    );
    const stripeFxFundingAvailable =
      !ledgerCurrencyAvailable &&
      !!settlement &&
      settlement !== PRIZELET_LEDGER_CURRENCY &&
      available.some((row) => row.currency === settlement && row.amount > 0);
    return {
      ledgerCurrency: PRIZELET_LEDGER_CURRENCY,
      platformCountry: (account.country ?? "").toUpperCase(),
      platformDefaultCurrency: settlement,
      available,
      pending,
      ledgerCurrencyAvailable,
      stripeFxFundingAvailable,
    };
  },
});

export const refreshConnectAccountStatus = action({
  args: {},
  returns: connectStatusReturnValidator,
  handler: async (
    ctx,
  ): Promise<{
    stripeAccountId: string;
    detailsSubmitted: boolean;
    chargesEnabled: boolean;
    payoutsEnabled: boolean;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    const stripe = requireStripe();
    const prep = await ctx.runQuery(internal.payments.stripeDb.getConnectOnboardingContext, {
      userId,
    });
    if (!prep.stripeAccountId) {
      throw new Error("CONNECT_ACCOUNT_MISSING");
    }
    let account: Stripe.Account;
    try {
      account = await stripe.accounts.retrieve(prep.stripeAccountId);
    } catch (err) {
      mapStripeConnectError(err);
    }
    const status = connectStatusFromStripeAccount(account);
    await ctx.runMutation(internal.payments.stripeDb.persistConnectStatus, {
      creatorId: prep.creatorId,
      userId,
      ...status,
    });
    return status;
  },
});

/**
 * Move ledger payout funds via Stripe Connect Transfer when Express payouts are enabled.
 * Uses matched USD available when present; otherwise Stripe-native FX from platform
 * settlement currency (e.g. NOK) sized with Stripe's exchange_rate. Does not mark the
 * ledger paid unless Stripe accepts the transfer.
 */
export const sendConnectPayout = action({
  args: { payoutId: v.id("payouts") },
  returns: v.object({
    transferId: v.string(),
    alreadySent: v.boolean(),
    amountCents: v.number(),
    currency: v.string(),
    transferCurrency: v.string(),
    transferAmount: v.number(),
    funding: v.union(v.literal("matched"), v.literal("stripe_fx")),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    transferId: string;
    alreadySent: boolean;
    amountCents: number;
    currency: string;
    transferCurrency: string;
    transferAmount: number;
    funding: "matched" | "stripe_fx";
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("UNAUTHENTICATED");
    await ctx.runQuery(internal.payments.stripeDb.assertAdminUserId, { userId });
    const stripe = requireStripe();
    const prep = await ctx.runQuery(internal.payments.stripeDb.getConnectTransferContext, {
      payoutId: args.payoutId,
    });
    if (isConnectTransferReference(prep.reference)) {
      return {
        transferId: prep.reference as string,
        alreadySent: true,
        amountCents: prep.amountCents,
        currency: PRIZELET_LEDGER_CURRENCY,
        transferCurrency: PRIZELET_LEDGER_CURRENCY,
        transferAmount: prep.amountCents,
        funding: "matched",
      };
    }
    if (prep.status === "completed" || prep.status === "paid") {
      throw new Error("PAYOUT_ALREADY_SETTLED");
    }
    if (!prep.stripeAccountId) {
      throw new Error("CONNECT_ACCOUNT_MISSING");
    }

    let account: Stripe.Account;
    try {
      account = await stripe.accounts.retrieve(prep.stripeAccountId);
    } catch (err) {
      mapStripeConnectError(err);
    }
    const status = connectStatusFromStripeAccount(account);
    await ctx.runMutation(internal.payments.stripeDb.persistConnectStatusByCreatorId, {
      creatorId: prep.creatorId,
      ...status,
    });
    if (!status.payoutsEnabled) {
      throw new Error("CONNECT_PAYOUTS_NOT_ENABLED");
    }

    let plan: ReturnType<typeof resolveConnectTransferPlan>;
    try {
      const [balance, platform] = await Promise.all([
        stripe.balance.retrieve(),
        stripe.accounts.retrieve(null),
      ]);
      const settlement = (platform.default_currency ?? "nok").toLowerCase();
      const available = (balance.available ?? []).map((row) => ({
        amount: row.amount,
        currency: row.currency,
      }));
      const matchedBucket = available.find(
        (row) => row.currency.toLowerCase() === PRIZELET_LEDGER_CURRENCY,
      );
      const matchedCovers =
        !!matchedBucket && matchedBucket.amount >= prep.amountCents;
      const exchangeRate = matchedCovers
        ? undefined
        : await stripeExchangeRateForLedger(stripe, PRIZELET_LEDGER_CURRENCY, settlement);
      plan = resolveConnectTransferPlan({
        ledgerCurrency: PRIZELET_LEDGER_CURRENCY,
        destinationCurrency: account.default_currency ?? PRIZELET_LEDGER_CURRENCY,
        platformSettlementCurrency: settlement,
        amountCents: prep.amountCents,
        available,
        exchangeRate,
      });
    } catch (err) {
      mapStripeConnectError(err);
    }

    let transfer: Stripe.Transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: plan.transferAmount,
        currency: plan.transferCurrency,
        destination: prep.stripeAccountId,
        metadata: {
          payoutId: prep.payoutId,
          creatorId: prep.creatorId,
          ledgerCurrency: plan.ledgerCurrency,
          ledgerAmountCents: String(plan.ledgerAmountCents),
          funding: plan.funding,
          ...(plan.exchangeRate != null
            ? { exchangeRate: String(plan.exchangeRate) }
            : {}),
        },
      });
    } catch (err) {
      mapStripeConnectError(err);
    }
    if (!transfer.id) throw new Error("CONNECT_TRANSFER_MISSING");
    await ctx.runMutation(internal.payments.stripeDb.recordConnectTransfer, {
      payoutId: prep.payoutId,
      transferId: transfer.id,
    });
    return {
      transferId: transfer.id,
      alreadySent: false,
      amountCents: plan.ledgerAmountCents,
      currency: plan.ledgerCurrency,
      transferCurrency: plan.transferCurrency,
      transferAmount: plan.transferAmount,
      funding: plan.funding,
    };
  },
});
