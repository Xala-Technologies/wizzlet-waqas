/**
 * Payments facade — same implementation as lib/stripe (Convex sandbox).
 */
export {
  createCheckoutSession,
  cancelSubscription,
  openCustomerPortal,
  createConnectOnboardingLink,
  PAYMENTS_MODE,
  SANDBOX_CHECKOUT_ALLOWED,
} from '@/lib/stripe';
