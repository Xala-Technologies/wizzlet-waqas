/**
 * Payments — Client-Side Helpers
 *
 * The platform currently runs in SANDBOX mode: no live payment provider is
 * connected, so checkout is simulated by the `sandbox-checkout` edge function.
 * It writes a real `subscriptions` row (fees/earnings are calculated by the
 * database trigger) without moving any money.
 *
 * When a live provider is enabled, swap `sandbox-checkout` for the provider's
 * checkout session function — the rest of the app needs no changes.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PAYMENTS_MODE = 'sandbox' as const;

/**
 * Simulated checkout. Creates an active subscription for the signed-in user.
 */
export async function createCheckoutSession(
  creatorId: string,
  creatorUsername: string,
  productId?: string
): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) {
    toast.error('Please sign in to subscribe.');
    window.location.href = `/login?redirect=/${creatorUsername}`;
    return;
  }

  const toastId = toast.loading('Processing sandbox payment…');

  try {
    const { data, error } = await supabase.functions.invoke('sandbox-checkout', {
      body: { action: 'subscribe', creatorId, productId },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    if (data?.alreadySubscribed) {
      toast.success('You are already subscribed to this creator.', { id: toastId });
      return;
    }

    toast.success('Sandbox payment complete — no real charge was made.', { id: toastId });
    window.location.href = `/subscription/success?creator=${encodeURIComponent(creatorUsername)}&sandbox=1`;
  } catch (err) {
    console.error('[Payments] createCheckoutSession error:', err);
    toast.error(err instanceof Error ? err.message : 'Checkout failed. Please try again.', {
      id: toastId,
    });
  }
}

/**
 * Cancels a sandbox subscription.
 */
export async function cancelSubscription(creatorId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('sandbox-checkout', {
      body: { action: 'cancel', creatorId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    toast.success('Subscription cancelled.');
    return true;
  } catch (err) {
    console.error('[Payments] cancelSubscription error:', err);
    toast.error(err instanceof Error ? err.message : 'Could not cancel subscription.');
    return false;
  }
}

/**
 * Billing management. In sandbox mode there is no hosted provider portal,
 * so we send the user to the in-app billing page.
 */
export async function openCustomerPortal(): Promise<void> {
  toast.info('Sandbox mode — manage your subscriptions here.');
  window.location.href = '/dashboard/subscriptions-billing';
}

/**
 * Payout onboarding. Requires a live payment provider; unavailable in sandbox.
 */
export async function createConnectOnboardingLink(
  _creatorId?: string
): Promise<void> {
  toast.info(
    'Payout onboarding is unavailable in sandbox mode. Earnings are tracked and paid out manually by the platform.'
  );
}
