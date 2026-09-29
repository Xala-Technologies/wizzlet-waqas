import { sportVisual } from '@/lib/sportVisual';
import {
  DISCOVER_SPORT_FILTERS,
  type DiscoverSportFilter,
} from '@/lib/discoverDemo';
import { cn } from '@/lib/utils';

type DiscoverSportFilterBarProps = {
  value: DiscoverSportFilter;
  onChange: (sport: DiscoverSportFilter) => void;
  className?: string;
};

/**
 * Horizontal sport category pills for public Discover (PO mock).
 */
export function DiscoverSportFilterBar({
  value,
  onChange,
  className,
}: DiscoverSportFilterBarProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2.5 sm:gap-3',
        className,
      )}
      role="group"
      aria-label="Filter by sport"
    >
      {DISCOVER_SPORT_FILTERS.map((sport) => {
        const active = value === sport;
        const emoji =
          sport === 'All'
            ? null
            : sport === 'Football'
              ? '⚽'
              : sportVisual(sport).emoji;
        return (
          <button
            key={sport}
            type="button"
            onClick={() => onChange(sport)}
            aria-pressed={active}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors sm:px-5',
              active
                ? 'border-[#429FF0] bg-[#429FF0] text-white shadow-[0_8px_20px_rgba(66,159,240,0.35)] dark:border-primary dark:bg-primary dark:text-primary-foreground'
                : 'border-border bg-card text-foreground hover:border-[#429FF0]/40 hover:bg-[#E1F2FF]/60 dark:hover:bg-primary/10',
            )}
          >
            {emoji ? (
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                  active ? 'bg-white/20' : 'bg-[#E1F2FF] dark:bg-primary/15',
                )}
                aria-hidden
              >
                {emoji}
              </span>
            ) : null}
            {sport}
          </button>
        );
      })}
    </div>
  );
}
