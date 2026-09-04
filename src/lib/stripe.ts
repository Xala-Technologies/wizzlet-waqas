/**
 * Payments — Client-Side Helpers
 *
 * Default mode is SANDBOX for local development: checkout is simulated by the
 * `sandbox-checkout` edge function (requires ALLOW_SANDBOX_CHECKOUT=true on
 * the function). Production builds refuse sandbox checkout unless
 * VITE_ALLOW_SANDBOX_CHECKOUT=true is explicitly set.
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const PAYMENTS_MODE = 'sandbox' as const;

/** Sandbox minting is allowed in Vite DEV, or when explicitly opted in. */
export const SANDBOX_CHECKOUT_ALLOWED =
  import.meta.env.DEV || import.meta.env.VITE_ALLOW_SANDBOX_CHECKOUT === 'true';

function assertSandboxAllowed(): boolean {
  if (SANDBOX_CHECKOUT_ALLOWED) return true;
  toast.error('Checkout is not available in this environment.');
  return false;
}

/**
 * Simulated checkout. Creates an active subscription for the signed-in user.
 */
export async function createCheckoutSession(
  creatorId: string,
  creatorUsername: string,
  productId?: string
): Promise<void> {
  if (!assertSandboxAllowed()) return;

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
  if (!assertSandboxAllowed()) return false;

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
