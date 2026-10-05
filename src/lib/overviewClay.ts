/**
 * Claymorphism helpers for Creator Overview — medium intensity.
 */

export const clayCard = 'clay-card';

export const clayCardInteractive = 'clay-card clay-card-interactive';

/**
 * Brand-only KPI card washes (blue family).
 * Keys keep legacy names so call sites stay stable; values are one of two blues.
 */
export const clayKpiFill = {
  /** brand-50 */
  primary: 'clay-fill-primary',
  /** soft blue band — slight alternate to primary */
  soft: 'clay-fill-soft',
  emerald: 'clay-fill-primary',
  violet: 'clay-fill-soft',
  sky: 'clay-fill-primary',
  amber: 'clay-fill-soft',
  rose: 'clay-fill-primary',
  orange: 'clay-fill-soft',
  cyan: 'clay-fill-primary',
  teal: 'clay-fill-soft',
  lime: 'clay-fill-primary',
} as const;

export type ClayKpiFillKey = keyof typeof clayKpiFill;

export function clayFillFromIconTone(iconClassName?: string): string {
  if (!iconClassName) return clayKpiFill.primary;
  // Alternate soft vs primary so strips have gentle rhythm without rainbow.
  if (
    iconClassName.includes('violet') ||
    iconClassName.includes('amber') ||
    iconClassName.includes('orange') ||
    iconClassName.includes('teal') ||
    iconClassName.includes('brand-100') ||
    iconClassName.includes('info-soft') ||
    iconClassName.includes('logo-blue')
  ) {
    return clayKpiFill.soft;
  }
  return clayKpiFill.primary;
}
