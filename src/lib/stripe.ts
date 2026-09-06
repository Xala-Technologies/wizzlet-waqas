/**
 * Payments — Stripe Checkout (test/live) with sandbox fallback.
 */

import { toast } from 'sonner';
import { convex } from '@/integrations/convex/client';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';

export const PAYMENTS_MODE =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ? ('stripe' as const) : ('sandbox' as const);

export const SANDBOX_CHECKOUT_ALLOWED =
  import.meta.env.DEV || import.meta.env.VITE_ALLOW_SANDBOX_CHECKOUT === 'true';

function assertSandboxAllowed(): boolean {
  if (SANDBOX_CHECKOUT_ALLOWED) return true;
  toast.error('Checkout is not available in this environment.');
  return false;
}

export async function createCheckoutSession(
  creatorId: string,
  creatorUsername: string,
  productId?: string,
): Promise<void> {
  const toastId = toast.loading(
    PAYMENTS_MODE === 'stripe' ? 'Redirecting to Stripe…' : 'Processing sandbox payment…',
  );
  try {
    if (PAYMENTS_MODE === 'stripe') {
      const result = await convex.action(api.payments.stripeNode.createCheckoutSession, {
        creatorId: creatorId as Id<'creators'>,
        productId: productId ? (productId as Id<'products'>) : undefined,
        creatorUsername,
      });
      if (result.alreadySubscribed) {
        toast.success('You are already subscribed to this creator.', { id: toastId });
        window.location.href = `/subscription/success?creator=${encodeURIComponent(creatorUsername)}`;
        return;
      }
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
    });
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
  toast.info(
    'Payout onboarding via Stripe Connect is not enabled yet. Earnings are tracked and paid out manually by the platform.',
  );
}
