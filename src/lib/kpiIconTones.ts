/**
 * Shared colorful icon-tile tones for dashboard KPI cards.
 * Match Creator Overview (violet / emerald / sky / amber) and rotate extras
 * for strips with more than four metrics.
 */

export const kpiIconTone = {
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  orange: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  cyan: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  lime: 'bg-lime-500/10 text-lime-700 dark:text-lime-400',
  primary: 'bg-primary/10 text-primary',
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
  monthly: 'bg-violet-500/10 text-violet-700 border-violet-500/25 dark:text-violet-400',
} as const;
