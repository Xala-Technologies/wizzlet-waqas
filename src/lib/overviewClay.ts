/**
 * Claymorphism helpers for Creator Overview — medium intensity.
 */

export const clayCard = 'clay-card';

export const clayCardInteractive = 'clay-card clay-card-interactive';

/**
 * Soft KPI card washes (`.clay-fill-*` in index.css — cascade after `.clay-card`).
 * Light mode uses readable pastel cards that match dark’s tinted language.
 */
export const clayKpiFill = {
  emerald: 'clay-fill-emerald',
  violet: 'clay-fill-violet',
  sky: 'clay-fill-sky',
  amber: 'clay-fill-amber',
  rose: 'clay-fill-rose',
  orange: 'clay-fill-orange',
  cyan: 'clay-fill-cyan',
  teal: 'clay-fill-teal',
  lime: 'clay-fill-lime',
  primary: 'clay-fill-primary',
} as const;

export type ClayKpiFillKey = keyof typeof clayKpiFill;

export function clayFillFromIconTone(iconClassName?: string): string {
  if (!iconClassName) return clayKpiFill.primary;
  if (iconClassName.includes('emerald')) return clayKpiFill.emerald;
  if (
    iconClassName.includes('violet') ||
    iconClassName.includes('info-soft') ||
    iconClassName.includes('logo-blue')
  ) {
    return clayKpiFill.violet;
  }
  if (iconClassName.includes('sky')) return clayKpiFill.sky;
  if (iconClassName.includes('amber')) return clayKpiFill.amber;
  if (iconClassName.includes('rose')) return clayKpiFill.rose;
  if (iconClassName.includes('orange')) return clayKpiFill.orange;
  if (iconClassName.includes('lime')) return clayKpiFill.lime;
  if (iconClassName.includes('cyan') || iconClassName.includes('brand-50')) {
    return clayKpiFill.cyan;
  }
  if (
    iconClassName.includes('teal') ||
    iconClassName.includes('brand-100') ||
    iconClassName.includes('brand-300')
  ) {
    return clayKpiFill.teal;
  }
  if (iconClassName.includes('primary') || iconClassName.includes('brand-')) {
    return clayKpiFill.primary;
  }
  return clayKpiFill.primary;
}
