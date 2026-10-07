import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  connectOnboardingUrls,
  connectPayoutUserMessage,
  connectStatusFromStripeAccount,
  expressConnectCapabilities,
  isConnectTransferReference,
  isStripeAccountsV1DisabledError,
  isStripeConnectNotEnabledError,
  resolveConnectTransferCurrency,
  resolveConnectTransferPlan,
} from '../../convex/lib/stripeConnect';

const stripeNode = readFileSync(
  resolve(__dirname, '../../convex/payments/stripeNode.ts'),
  'utf8',
);
const stripeClient = readFileSync(resolve(__dirname, './stripe.ts'), 'utf8');
const stripeDb = readFileSync(
  resolve(__dirname, '../../convex/payments/stripeDb.ts'),
  'utf8',
);

describe('stripe Connect Express helpers', () => {
  it('maps Stripe account flags without implying transfers', () => {
    expect(
      connectStatusFromStripeAccount({
        id: 'acct_test',
        details_submitted: true,
        charges_enabled: true,
        payouts_enabled: false,
      }),
    ).toEqual({
      stripeAccountId: 'acct_test',
      detailsSubmitted: true,
      chargesEnabled: true,
      payoutsEnabled: false,
    });
  });

  it('builds return and refresh URLs on creator payouts', () => {
    expect(connectOnboardingUrls('https://www.sweeph.com/')).toEqual({
      returnUrl: 'https://www.sweeph.com/creator/payouts?connect=return',
      refreshUrl: 'https://www.sweeph.com/creator/payouts?connect=refresh',
    });
  });

  it('detects Connect-not-enabled Stripe errors', () => {
    expect(
      isStripeConnectNotEnabledError(
        'You can only create new accounts if you have signed up for Connect',
      ),
    ).toBe(true);
    expect(isStripeConnectNotEnabledError('card declined')).toBe(false);
  });

  it('requests card_payments with transfers for Express', () => {
    expect(expressConnectCapabilities()).toEqual({
      card_payments: { requested: true },
      transfers: { requested: true },
    });
  });

  it('detects Accounts v1 policy errors', () => {
    expect(
      isStripeAccountsV1DisabledError(
        'Create connected accounts with POST /v2/core/accounts instead',
      ),
    ).toBe(true);
    expect(isStripeAccountsV1DisabledError('card declined')).toBe(false);
  });

  it('prefers matched USD available, else Stripe-native FX from settlement', () => {
    expect(
      resolveConnectTransferPlan({
        ledgerCurrency: 'usd',
        destinationCurrency: 'usd',
        platformSettlementCurrency: 'nok',
        amountCents: 100,
        available: [{ amount: 500, currency: 'usd' }],
      }),
    ).toEqual({
      funding: 'matched',
      transferCurrency: 'usd',
      transferAmount: 100,
      ledgerCurrency: 'usd',
      ledgerAmountCents: 100,
    });

    expect(
      resolveConnectTransferPlan({
        ledgerCurrency: 'usd',
        destinationCurrency: 'usd',
        platformSettlementCurrency: 'nok',
        amountCents: 100,
        available: [{ amount: 25532, currency: 'nok' }],
        exchangeRate: 9.59358,
      }),
    ).toEqual({
      funding: 'stripe_fx',
      transferCurrency: 'nok',
      transferAmount: 960,
      ledgerCurrency: 'usd',
      ledgerAmountCents: 100,
      exchangeRate: 9.59358,
    });

    expect(() =>
      resolveConnectTransferPlan({
        ledgerCurrency: 'usd',
        destinationCurrency: 'nok',
        platformSettlementCurrency: 'nok',
        amountCents: 100,
        available: [{ amount: 25532, currency: 'nok' }],
        exchangeRate: 9.5,
      }),
    ).toThrow('STRIPE_CURRENCY_MISMATCH');

    expect(() =>
      resolveConnectTransferPlan({
        ledgerCurrency: 'usd',
        destinationCurrency: 'usd',
        platformSettlementCurrency: 'nok',
        amountCents: 100,
        available: [{ amount: 25532, currency: 'nok' }],
      }),
    ).toThrow('STRIPE_FX_RATE_UNAVAILABLE');

    expect(() =>
      resolveConnectTransferPlan({
        ledgerCurrency: 'usd',
        destinationCurrency: 'usd',
        platformSettlementCurrency: 'nok',
        amountCents: 600,
        available: [{ amount: 500, currency: 'usd' }],
        exchangeRate: 9.5,
      }),
    ).toThrow('STRIPE_CURRENCY_MISMATCH');

    expect(
      resolveConnectTransferPlan({
        ledgerCurrency: 'usd',
        destinationCurrency: 'usd',
        platformSettlementCurrency: 'nok',
        amountCents: 600,
        available: [
          { amount: 500, currency: 'usd' },
          { amount: 100_000, currency: 'nok' },
        ],
        exchangeRate: 9.5,
      }),
    ).toMatchObject({
      funding: 'stripe_fx',
      transferCurrency: 'nok',
      transferAmount: 5700,
      ledgerAmountCents: 600,
    });

    expect(() =>
      resolveConnectTransferCurrency({
        ledgerCurrency: 'usd',
        destinationCurrency: 'usd',
        amountCents: 600,
        available: [{ amount: 500, currency: 'usd' }],
      }),
    ).toThrow('STRIPE_INSUFFICIENT_BALANCE');
  });

  it('treats Stripe transfer ids as Connect settlement refs', () => {
    expect(isConnectTransferReference('tr_123')).toBe(true);
    expect(isConnectTransferReference('Payout – October')).toBe(false);
  });

  it('does not claim the ledger was paid when Connect transfer is blocked', () => {
    expect(connectPayoutUserMessage('CONNECT_PAYOUTS_NOT_ENABLED')).toMatch(
      /not marked paid/i,
    );
    expect(connectPayoutUserMessage('STRIPE_CURRENCY_MISMATCH')).toMatch(
      /not marked paid/i,
    );
    expect(connectPayoutUserMessage('STRIPE_FX_RATE_UNAVAILABLE')).toMatch(
      /not marked paid/i,
    );
  });
});

describe('stripe Connect Express wiring', () => {
  it('creates Express accounts and Account Links from an authenticated action', () => {
    expect(stripeNode).toMatch(/export const createConnectOnboardingSession/);
    expect(stripeNode).toMatch(/getAuthUserId/);
    expect(stripeNode).toMatch(/type: "express"/);
    expect(stripeNode).toMatch(/expressConnectCapabilities/);
    expect(stripeNode).toMatch(/accountLinks\.create/);
    expect(stripeNode).toMatch(/type: "account_onboarding"/);
    expect(stripeNode).toMatch(/Does not move money/);
    expect(stripeNode).toMatch(/PRIZELET_LEDGER_CURRENCY/);
    expect(stripeNode).toMatch(/export const getConnectPlatformBalance/);
    expect(stripeNode).toMatch(/platformDefaultCurrency/);
    expect(stripeNode).toMatch(/stripeFxFundingAvailable/);
    expect(stripeDb).toMatch(/PRIZELET_LEDGER_CURRENCY/);
  });

  it('persists account id and capability flags on the creator', () => {
    expect(stripeDb).toMatch(/export const persistConnectAccount/);
    expect(stripeDb).toMatch(/CONNECT_ACCOUNT_LOCKED/);
    expect(stripeDb).toMatch(/stripeConnectPayoutsEnabled/);
    expect(stripeNode).toMatch(/export const refreshConnectAccountStatus/);
  });

  it('replaces the toast stub with a live Connect action', () => {
    expect(stripeClient).toMatch(/createConnectOnboardingSession/);
    expect(stripeClient).not.toMatch(/Payout onboarding via Stripe Connect is not enabled yet/);
    expect(stripeClient).toMatch(/STRIPE_CONNECT_NOT_ENABLED/);
    expect(stripeClient).toMatch(/STRIPE_CONNECT_ACCOUNTS_V1_DISABLED/);
  });

  it('sends Connect transfers from an admin action without marking paid on failure', () => {
    expect(stripeNode).toMatch(/export const sendConnectPayout/);
    expect(stripeNode).toMatch(/assertAdminUserId/);
    expect(stripeNode).toMatch(/transfers\.create/);
    expect(stripeNode).toMatch(/CONNECT_PAYOUTS_NOT_ENABLED/);
    expect(stripeNode).toMatch(/resolveConnectTransferPlan/);
    expect(stripeNode).toMatch(/stripeExchangeRateForLedger/);
    expect(stripeNode).toMatch(/Does not mark the/);
    expect(stripeDb).toMatch(/export const recordConnectTransfer/);
    expect(stripeDb).toMatch(/PAYOUT_ALREADY_SETTLED/);
  });

  it('pays referral commissions through the same Connect Transfer helper', () => {
    expect(stripeNode).toMatch(/export const sendReferralCommissionConnect/);
    expect(stripeNode).toMatch(/kind: "referral_commission"/);
    expect(stripeNode).toMatch(/executeLedgerConnectTransfer/);
    expect(stripeNode).toMatch(/recordReferralConnectTransfer/);
  });
});
