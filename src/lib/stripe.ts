/**
 * Payments — Stripe Checkout (test/live) with sandbox fallback.
 */

import { toast } from 'sonner';
import { convex } from '@/integrations/convex/client';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { publicEnv } from '@/config/publicEnv';
import {
  clearStoredCreatorLinkId,
  readStoredCreatorLinkId,
} from '@/lib/creatorLinkHandoff';

export const PAYMENTS_MODE = publicEnv.stripeMode;

export const SANDBOX_CHECKOUT_ALLOWED = publicEnv.sandboxCheckoutAllowed;

function assertSandboxAllowed(): boolean {
  if (SANDBOX_CHECKOUT_ALLOWED) return true;
  toast.error('Checkout is not available in this environment.');
  return false;
}

export async function createCheckoutSession(
  creatorId: string,
  creatorUsername: string,
  productId?: string,
  promoCode?: string,
): Promise<void> {
  const toastId = toast.loading(
    PAYMENTS_MODE === 'stripe' ? 'Redirecting to Stripe…' : 'Processing sandbox payment…',
  );
  try {
    const creatorLinkId = readStoredCreatorLinkId();
    if (PAYMENTS_MODE === 'stripe') {
      const result = await convex.action(api.payments.stripeNode.createCheckoutSession, {
        creatorId: creatorId as Id<'creators'>,
        productId: productId ? (productId as Id<'products'>) : undefined,
        creatorUsername,
        promoCode: promoCode?.trim() || undefined,
        creatorLinkId: creatorLinkId
          ? (creatorLinkId as Id<'creatorLinks'>)
          : undefined,
      });
      if (result.alreadySubscribed) {
        clearStoredCreatorLinkId();
        toast.success('You are already subscribed to this creator.', { id: toastId });
        window.location.href = `/subscription/success?creator=${encodeURIComponent(creatorUsername)}`;
        return;
      }
      clearStoredCreatorLinkId();
      toast.dismiss(toastId);
      window.location.href = result.url;
      return;
    }

    if (!assertSandboxAllowed()) {
      toast.dismiss(toastId);
      return;
    }
    const result = await convex.mutation(api.payments.sandbox.sandboxSubscribe, {
      creatorId: creatorId as Id<'creators'>,
      productId: productId ? (productId as Id<'products'>) : undefined,
      creatorLinkId: creatorLinkId
        ? (creatorLinkId as Id<'creatorLinks'>)
        : undefined,
    });
    clearStoredCreatorLinkId();
    if ((result as { alreadySubscribed?: boolean })?.alreadySubscribed) {
      toast.success('You are already subscribed to this creator.', { id: toastId });
      return;
    }
    toast.success('Sandbox payment complete — no real charge was made.', { id: toastId });
    window.location.href = `/subscription/success?creator=${encodeURIComponent(creatorUsername)}&sandbox=1`;
  } catch (err) {
    console.error('[Payments] createCheckoutSession error:', err);
    const message = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
    if (message.includes('UNAUTHENTICATED') || message.includes('Not authenticated')) {
      toast.error('Please sign in to subscribe.', { id: toastId });
      window.location.href = `/login?redirect=/${creatorUsername}`;
      return;
    }
    toast.error(message, { id: toastId });
  }
}

export async function confirmStripeCheckoutSession(sessionId: string): Promise<boolean> {
  try {
    await convex.action(api.payments.stripeNode.confirmCheckoutSession, { sessionId });
    return true;
  } catch (err) {
    console.error('[Payments] confirmCheckoutSession error:', err);
    return false;
  }
}

export async function cancelSubscription(creatorId: string): Promise<boolean> {
  try {
    if (PAYMENTS_MODE === 'stripe') {
      await convex.action(api.payments.stripeNode.cancelCreatorSubscription, {
        creatorId: creatorId as Id<'creators'>,
      });
      toast.success('Subscription cancelled.');
      return true;
    }
    if (!assertSandboxAllowed()) return false;
    await convex.mutation(api.payments.sandbox.sandboxCancel, {
      creatorId: creatorId as Id<'creators'>,
    });
    toast.success('Subscription cancelled.');
    return true;
  } catch (err) {
    console.error('[Payments] cancelSubscription error:', err);
    toast.error(err instanceof Error ? err.message : 'Could not cancel subscription.');
    return false;
  }
}

export async function openCustomerPortal(): Promise<void> {
  const toastId = toast.loading('Opening billing portal…');
  try {
    if (PAYMENTS_MODE !== 'stripe') {
      toast.info('Billing portal requires Stripe. Manage subscriptions on this page.', {
        id: toastId,
      });
      window.location.href = '/dashboard/subscriptions-billing';
      return;
    }
    const result = await convex.action(api.payments.stripeNode.createBillingPortalSession, {});
    toast.dismiss(toastId);
    window.location.href = result.url;
  } catch (err) {
    console.error('[Payments] openCustomerPortal error:', err);
    const message =
      err instanceof Error && err.message.includes('NO_BILLING_CUSTOMER')
        ? 'No Stripe customer found yet. Subscribe once, then open the portal to manage cards.'
        : err instanceof Error
          ? err.message
          : 'Could not open billing portal.';
    toast.error(message, { id: toastId });
  }
}

export async function createConnectOnboardingLink(_creatorId?: string): Promise<void> {
  const toastId = toast.loading('Opening Stripe Connect…');
  try {
    const result = await convex.action(api.payments.stripeNode.createConnectOnboardingSession, {});
    toast.dismiss(toastId);
    if (!result.url) {
      toast.error('Stripe Connect did not return an onboarding URL.');
      return;
    }
    window.location.assign(result.url);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not start Stripe Connect onboarding.';
    toast.dismiss(toastId);
    if (message.includes('STRIPE_NOT_CONFIGURED')) {
      toast.error('Stripe is not configured. Payouts stay on the Prizelet ledger.');
      return;
    }
    if (message.includes('STRIPE_CONNECT_NOT_ENABLED')) {
      toast.error(
        'Stripe Connect is not enabled on this Stripe account. Payouts stay ledger/manual.',
      );
      return;
    }
    if (message.includes('STRIPE_CONNECT_ACCOUNTS_V1_DISABLED')) {
      toast.error(
        'Stripe blocked Express account creation (Accounts v1 policy). Enable it in Dashboard API policies, or wait for Accounts v2. Payouts stay ledger/manual.',
      );
      return;
    }
    if (message.includes('UNAUTHENTICATED') || message.includes('NOT_FOUND')) {
      toast.error('Sign in as a creator to connect Stripe.');
      return;
    }
    toast.error(message);
  }
}
