/**
 * Shared colorful icon-tile tones for dashboard KPI cards.
 * Match Creator Overview (violet / emerald / sky / amber) and rotate extras
 * for strips with more than four metrics.
 */

export const kpiIconTone = {
  violet:
    'bg-violet-500/15 text-violet-700 dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)]',
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  sky: 'bg-sky-500/15 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  amber: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  orange: 'bg-orange-500/15 text-orange-800 dark:bg-orange-500/10 dark:text-orange-400',
  cyan: 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-300',
  lime: 'bg-lime-500/15 text-lime-800 dark:bg-lime-500/10 dark:text-lime-400',
  primary: 'bg-primary/15 text-primary',
  teal: 'bg-teal-500/15 text-teal-800 dark:bg-teal-500/10 dark:text-teal-300',
} as const;

export type KpiIconTone = keyof typeof kpiIconTone;

/** Result / status pill classes — same language as overview pick rows. */
export const resultPillTone = {
  win: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400',
  won: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400',
  loss: 'bg-rose-500/15 text-rose-700 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400',
  lost: 'bg-rose-500/15 text-rose-700 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400',
  push: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-amber-500/15 text-amber-800 border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400',
  published:
    'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400',
  active:
    'bg-emerald-500/15 text-emerald-800 border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'bg-rose-500/15 text-rose-800 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400',
  canceled: 'bg-rose-500/15 text-rose-800 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400',
  trial: 'bg-amber-500/15 text-amber-800 border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-400',
  vip: 'bg-rose-500/15 text-rose-800 border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-400',
  premium: 'bg-sky-500/15 text-sky-800 border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-400',
  monthly:
    'bg-[var(--brand-100)] text-[var(--brand-700)] border-[var(--brand-200)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)] dark:border-transparent',
} as const;
