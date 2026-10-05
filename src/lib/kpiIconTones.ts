/**
 * Shared icon-tile tones for dashboard KPI cards.
 * Brand blues only (primary + soft) — legacy key names kept for call-site stability.
 * Semantic win/loss/pending colors stay on `resultPillTone`, not KPI tiles.
 */

const brandTile =
  'bg-[var(--brand-100)] text-[var(--brand-700)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)]';

const brandTileSoft =
  'bg-[var(--info-soft)] text-[var(--logo-blue)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)]';

export const kpiIconTone = {
  violet: brandTile,
  emerald: brandTileSoft,
  sky: brandTile,
  amber: brandTileSoft,
  rose: brandTile,
  orange: brandTileSoft,
  cyan: brandTile,
  lime: brandTileSoft,
  primary: brandTile,
  teal: brandTileSoft,
} as const;

export type KpiIconTone = keyof typeof kpiIconTone;

/** Result / status pill classes — semantic colors (not brand KPI tiles). */
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
  premium: 'bg-[var(--brand-100)] text-[var(--brand-700)] border-[var(--brand-200)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)]',
  monthly:
    'bg-[var(--brand-100)] text-[var(--brand-700)] border-[var(--brand-200)] dark:bg-[var(--active-bg)] dark:text-[var(--brand-primary)] dark:border-transparent',
} as const;
