/** Stripe Connect Express helpers — status mapping only (no transfers). */

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
