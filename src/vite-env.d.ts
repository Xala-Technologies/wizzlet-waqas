/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_SITE_URL?: string;
  /** Stripe publishable key (pk_test_… / pk_live_…). Enables Stripe Checkout mode. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Explicitly allow sandbox checkout outside Vite DEV (staging only). */
  readonly VITE_ALLOW_SANDBOX_CHECKOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
