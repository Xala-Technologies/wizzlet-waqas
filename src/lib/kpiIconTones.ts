/**
 * Shared colorful icon-tile tones for dashboard KPI cards.
 * Match Creator Overview (violet / emerald / sky / amber) and rotate extras
 * for strips with more than four metrics.
 */

export const kpiIconTone = {
  violet: 'bg-[var(--info-soft)] text-[var(--logo-blue)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)]',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  cyan: 'bg-[var(--brand-50)] text-[var(--brand-700)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)]',
  lime: 'bg-lime-500/10 text-lime-700 dark:text-lime-400',
  primary: 'bg-primary/10 text-primary',
  teal: 'bg-[var(--brand-100)] text-[var(--brand-700)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-300)]',
} as const;

export type KpiIconTone = keyof typeof kpiIconTone;

/** Result / status pill classes — same language as overview pick rows. */
export const resultPillTone = {
  win: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
  won: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
  loss: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
  lost: 'bg-rose-500/10 text-rose-600 border-rose-500/25 dark:text-rose-400',
  push: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400',
  published: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 dark:text-emerald-400',
  active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
  cancelled: 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400',
  canceled: 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400',
  trial: 'bg-amber-500/10 text-amber-700 border-amber-500/25 dark:text-amber-400',
  vip: 'bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400',
  premium: 'bg-sky-500/10 text-sky-700 border-sky-500/25 dark:text-sky-400',
  monthly: 'bg-[var(--brand-100)] text-[var(--brand-700)] border-[var(--brand-200)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)] dark:border-transparent',
} as const;
