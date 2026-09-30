/**
 * Claymorphism helpers for Creator Overview — medium intensity.
 */

export const clayCard = 'clay-card';

export const clayCardInteractive = 'clay-card clay-card-interactive';

/** Soft KPI tints on white (medium clay — not loud pastels). */
export const clayKpiFill = {
  emerald: 'bg-[#f5faf7] dark:bg-emerald-500/10',
  violet: 'bg-[#f6f5fb] dark:bg-[var(--active-bg)]',
  sky: 'bg-[#f4f8fc] dark:bg-sky-500/10',
  amber: 'bg-[#fbf8f3] dark:bg-amber-500/10',
  rose: 'bg-[#fbf5f6] dark:bg-rose-500/10',
  primary: 'bg-card dark:bg-card',
} as const;

export type ClayKpiFillKey = keyof typeof clayKpiFill;

export function clayFillFromIconTone(iconClassName?: string): string {
  if (!iconClassName) return clayKpiFill.primary;
  if (iconClassName.includes('emerald')) return clayKpiFill.emerald;
  if (iconClassName.includes('violet') || iconClassName.includes('info-soft') || iconClassName.includes('logo-blue')) {
    return clayKpiFill.violet;
  }
  if (iconClassName.includes('sky')) return clayKpiFill.sky;
  if (iconClassName.includes('amber')) return clayKpiFill.amber;
  if (iconClassName.includes('rose')) return clayKpiFill.rose;
  return clayKpiFill.primary;
}
