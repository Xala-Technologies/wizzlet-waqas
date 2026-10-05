import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  connectOnboardingUrls,
  connectStatusFromStripeAccount,
  isStripeConnectNotEnabledError,
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
    expect(connectOnboardingUrls('https://www.prizelet.com/')).toEqual({
      returnUrl: 'https://www.prizelet.com/creator/payouts?connect=return',
      refreshUrl: 'https://www.prizelet.com/creator/payouts?connect=refresh',
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
});

describe('stripe Connect Express wiring', () => {
  it('creates Express accounts and Account Links from an authenticated action', () => {
    expect(stripeNode).toMatch(/export const createConnectOnboardingSession/);
    expect(stripeNode).toMatch(/getAuthUserId/);
    expect(stripeNode).toMatch(/type: "express"/);
    expect(stripeNode).toMatch(/accountLinks\.create/);
    expect(stripeNode).toMatch(/type: "account_onboarding"/);
    expect(stripeNode).toMatch(/Does not move money/);
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
  });
});
