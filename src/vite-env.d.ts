/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Deployment identity — independent of Vite MODE. */
  readonly VITE_APP_ENV?: string;
  readonly VITE_CONVEX_URL: string;
  readonly VITE_CONVEX_SITE_URL?: string;
  /** Public app origin — must match Convex SITE_URL (local: http://127.0.0.1:8080). */
  readonly VITE_SITE_URL?: string;
  /** Stripe publishable key (pk_test_… / pk_live_…). Enables Stripe Checkout mode. */
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Explicitly allow sandbox checkout outside Vite DEV (non-prod only). */
  readonly VITE_ALLOW_SANDBOX_CHECKOUT?: string;
  /** Nonsecret build stamp (CI / release scripts). */
  readonly VITE_RELEASE_SHA?: string;
  readonly VITE_RELEASE_CHANNEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
