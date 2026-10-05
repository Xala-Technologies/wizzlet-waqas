/** Stripe Connect Express helpers. Transfers run only when payouts are enabled and currency matches. */

export const CONNECT_ONBOARDING_PATH = "/creator/payouts";

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

export function resolveConnectTransferCurrency(args: {
  destinationCurrency: string;
  amountCents: number;
  available: Array<{ amount: number; currency: string }>;
}): { currency: string } {
  const dest = args.destinationCurrency.trim().toLowerCase();
  if (!/^[a-z]{3}$/.test(dest)) {
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  if (!Number.isInteger(args.amountCents) || args.amountCents <= 0) {
    throw new Error("INVALID_AMOUNT");
  }
  const bucket = args.available.find((row) => row.currency.toLowerCase() === dest);
  if (!bucket) {
    throw new Error("STRIPE_CURRENCY_MISMATCH");
  }
  if (bucket.amount < args.amountCents) {
    throw new Error("STRIPE_INSUFFICIENT_BALANCE");
  }
  return { currency: dest };
}

export function connectPayoutUserMessage(message: string): string {
  if (message.includes("CONNECT_PAYOUTS_NOT_ENABLED")) {
    return "Creator Stripe Express cannot receive payouts yet. Finish onboarding. Ledger was not marked paid.";
  }
  if (message.includes("CONNECT_ACCOUNT_MISSING")) {
    return "This creator has no Stripe Connect account. Ledger was not marked paid.";
  }
  if (message.includes("STRIPE_CURRENCY_MISMATCH")) {
    return "Platform Stripe balance currency does not match the connected account. Ledger was not marked paid.";
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
