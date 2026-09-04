/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
  /** Explicitly allow sandbox checkout outside Vite DEV (staging only). */
  readonly VITE_ALLOW_SANDBOX_CHECKOUT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
