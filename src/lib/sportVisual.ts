/**
 * Sport → visual tokens for creator overview lists (picks, top performers).
 * Kept emoji-based to match Discover / events without new assets.
 */

export type SportVisual = {
  emoji: string;
  /** Tailwind-friendly chip classes */
  chipClass: string;
};

const DEFAULT: SportVisual = {
  emoji: '🏆',
  chipClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

const BY_KEY: Record<string, SportVisual> = {
  nba: { emoji: '🏀', chipClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  basketball: { emoji: '🏀', chipClass: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  nfl: { emoji: '🏈', chipClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  football: { emoji: '🏈', chipClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  mlb: { emoji: '⚾', chipClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  baseball: { emoji: '⚾', chipClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-400' },
  nhl: { emoji: '🏒', chipClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  hockey: { emoji: '🏒', chipClass: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  soccer: { emoji: '⚽', chipClass: 'bg-lime-500/10 text-lime-700 dark:text-lime-400' },
  mls: { emoji: '⚽', chipClass: 'bg-lime-500/10 text-lime-700 dark:text-lime-400' },
  tennis: { emoji: '🎾', chipClass: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-400' },
  mma: { emoji: '🥊', chipClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  ufc: { emoji: '🥊', chipClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  boxing: { emoji: '🥊', chipClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400' },
  golf: { emoji: '⛳', chipClass: 'bg-teal-500/10 text-teal-700 dark:text-teal-400' },
};

/** Resolve sport string or free-text label (e.g. "NBA spreads") to visual tokens. */
export function sportVisual(sportOrLabel: string | undefined | null): SportVisual {
  if (!sportOrLabel?.trim()) return DEFAULT;
  const raw = sportOrLabel.trim().toLowerCase();
  if (BY_KEY[raw]) return BY_KEY[raw]!;
  for (const key of Object.keys(BY_KEY)) {
    if (raw.includes(key)) return BY_KEY[key]!;
  }
  return DEFAULT;
}

/** Format earnings month keys like "2026-09" or "09" → short label. */
export function earningsMonthLabel(raw: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (/^\d{4}-\d{2}/.test(raw)) {
    const m = Number(raw.slice(5, 7));
    if (m >= 1 && m <= 12) return months[m - 1]!;
  }
  if (/^\d{2}$/.test(raw)) {
    const m = Number(raw);
    if (m >= 1 && m <= 12) return months[m - 1]!;
  }
  return raw;
}
