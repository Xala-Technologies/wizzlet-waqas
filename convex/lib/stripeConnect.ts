/** Stripe Connect Express helpers. Transfers run only when payouts are enabled. */

export const CONNECT_ONBOARDING_PATH = "/creator/payouts";

/**
 * Prizelet commercial currency (product decision 2026-10-05): USD minor units.
 * Checkout, paymentEvents, sandbox settle, and Connect ledger amounts use this.
 * Never treat NOK øre as USD cents 1:1. When the Stripe entity settles NOK,
 * Connect Transfers may use Stripe-native FX (transfer in settlement currency
 * sized with Stripe's balance_transaction.exchange_rate).
 */
export const PRIZELET_LEDGER_CURRENCY = "usd";

export function connectOnboardingUrls(siteUrl: string): {
  returnUrl: string;
  refreshUrl: string;
} {
  const base = siteUrl.replace(/\/$/, "");
  return {
    returnUrl: `${base}${CONNECT_ONBOARDING_PATH}?connect=return`,
    refreshUrl: `${base}${CONNECT_ONBOARDING_PATH}?connect=refresh`,
  };
}

export function connectStatusFromStripeAccount(account: {
  id: string;
  details_submitted?: boolean | null;
  charges_enabled?: boolean | null;
  payouts_enabled?: boolean | null;
}): {
  stripeAccountId: string;
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
} {
  return {
    stripeAccountId: account.id,
    detailsSubmitted: account.details_submitted === true,
    chargesEnabled: account.charges_enabled === true,
    payoutsEnabled: account.payouts_enabled === true,
  };
}

export function isStripeConnectNotEnabledError(message: string): boolean {
  return /signed up for Connect|Connect is not enabled|not been enabled for Connect/i.test(
    message,
  );
}

export function isStripeAccountsV1DisabledError(message: string): boolean {
  return /Accounts v1|feat_accounts_v1_support|\/v2\/core\/accounts/i.test(message);
}

/** US Express requires card_payments when requesting transfers. */
export function expressConnectCapabilities(): {
  card_payments: { requested: true };
  transfers: { requested: true };
} {
  return {
    card_payments: { requested: true },
    transfers: { requested: true },
  };
}

export function isConnectTransferReference(reference: string | undefined | null): boolean {
  return typeof reference === "string" && /^tr_/.test(reference);
}

export type ConnectTransferPlan = {
  funding: "matched" | "stripe_fx";
  transferCurrency: string;
  transferAmount: number;
  ledgerCurrency: string;
  ledgerAmountCents: number;
  /** Stripe BT exchange_rate: settlement minor units per ledger minor unit. */
  exchangeRate?: number;
};

function normalizeCurrency(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Prefer a same-currency Transfer (ledger === destination === available).
 * If the platform only holds settlement currency (e.g. NOK) while ledger and
 * Express destination are USD, size a Stripe-native FX Transfer in settlement
 * currency using Stripe's exchange_rate — never 1 øre = 1 cent.
 */
export function resolveConnectTransferPlan(args: {
  ledgerCurrency?: string;
  destinationCurrency: string;
  platformSettlementCurrency: string;
  amountCents: number;
  available: Array<{ amount: number; currency: string }>;
  exchangeRate?: number;
}): ConnectTransferPlan {
  const ledger = normalizeCurrency(args.ledgerCurrency ?? PRIZELET_LEDGER_CURRENCY);
  const dest = normalizeCurrency(args.destinationCurrency);
  const settlement = normalizeCurrency(args.platformSettlementCurrency);
  if (![ledger, dest, settlement].every((c) => /^[a-z]{3}$/.test(c))) {
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  if (ledger !== dest) {
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error("INVALID_AMOUNT");
  }

  const available = args.available.map((row) => ({
    amount: row.amount,
    currency: normalizeCurrency(row.currency),
  }));

  const matched = available.find((row) => row.currency === ledger);
  if (matched && matched.amount >= args.amountCents) {
    return {
      funding: "matched",
      transferCurrency: ledger,
      transferAmount: args.amountCents,
      ledgerCurrency: ledger,
      ledgerAmountCents: args.amountCents,
    };
  }

  if (settlement === ledger) {
    if (matched) throw new Error("STRIPE_INSUFFICIENT_BALANCE");
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  const rate = args.exchangeRate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("STRIPE_FX_RATE_UNAVAILABLE");
  }
  const transferAmount = Math.ceil(args.amountCents * rate);
  if (!Number.isInteger(transferAmount) || transferAmount <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  const settlementBucket = available.find((row) => row.currency === settlement);
  if (!settlementBucket) {
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  if (settlementBucket.amount < transferAmount) {
    throw new Error("STRIPE_INSUFFICIENT_BALANCE");
  }
  return {
    funding: "stripe_fx",
    transferCurrency: settlement,
    transferAmount,
    ledgerCurrency: ledger,
    ledgerAmountCents: args.amountCents,
    exchangeRate: rate,
  };
}

/** @deprecated Prefer resolveConnectTransferPlan — matched-currency only. */
export function resolveConnectTransferCurrency(args: {
  ledgerCurrency?: string;
  destinationCurrency: string;
  amountCents: number;
  available: Array<{ amount: number; currency: string }>;
}): { currency: string } {
  const plan = resolveConnectTransferPlan({
    ...args,
    platformSettlementCurrency: args.destinationCurrency,
  });
  return { currency: plan.transferCurrency };
}

export function connectPayoutUserMessage(message: string): string {
  if (message.includes("CONNECT_PAYOUTS_NOT_ENABLED")) {
    return "Creator Stripe Express cannot receive payouts yet. Finish onboarding. Ledger was not marked paid.";
  }
  if (message.includes("CONNECT_ACCOUNT_MISSING")) {
    return "This creator has no Stripe Connect account. Ledger was not marked paid.";
  }
  if (message.includes("STRIPE_FX_RATE_UNAVAILABLE")) {
    return "Could not read a Stripe exchange rate for USD→settlement FX. Ledger was not marked paid.";
  }
  if (message.includes("STRIPE_CURRENCY_MISMATCH")) {
    return "Ledger and Express destination must both be USD. Platform must hold USD or a Stripe-settlement currency (e.g. NOK) for native FX. Ledger was not marked paid.";
  }
  if (message.includes("STRIPE_INSUFFICIENT_BALANCE")) {
    return "Platform Stripe balance is too low for this transfer. Ledger was not marked paid.";
  }
  if (message.includes("PAYOUT_ALREADY_SETTLED")) {
    return "This payout is already marked paid.";
  }
  if (message.includes("UNAUTHENTICATED") || message.includes("FORBIDDEN")) {
    return "Sign in as an admin to send a Stripe Connect payout.";
  }
  return message;
}
