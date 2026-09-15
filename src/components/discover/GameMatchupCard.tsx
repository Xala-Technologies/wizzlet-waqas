import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  SPORT_ICONS,
  formatEventTime,
  getTimeUntil,
  type SportEvent,
  type EventStatus,
} from '@/lib/events';
import { cn } from '@/lib/utils';

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  featured: { label: 'Featured', className: 'bg-primary/10 text-primary border-primary/20' },
  starting_soon: {
    label: 'Starting soon',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  },
  trending: {
    label: 'Trending',
    className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25',
  },
  live: {
    label: 'Live',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  },
  upcoming: { label: 'Upcoming', className: 'bg-muted text-secondary-foreground border-border' },
};

export type GameMatchupCardProps = {
  event: SportEvent;
  /** Creator-owned picks matched to this matchup (honest count only). */
  yourPickCount?: number;
  /** Primary action under the card (e.g. track pick / browse). */
  actionHref?: string;
  actionLabel?: string;
  className?: string;
  /** Compact row for Discover lists vs grid card for Overview. */
  variant?: 'card' | 'row';
};

/**
 * Professional matchup shell — league, teams, time.
 * No invented Spread/ML/Total/Props bars (Prizelet has no market tags).
 */
export function GameMatchupCard({
  event,
  yourPickCount,
  actionHref,
  actionLabel,
  className,
  variant = 'card',
}: GameMatchupCardProps) {
  const cfg = statusConfig[event.status];
  const sportIcon = SPORT_ICONS[event.sport] || '🏆';
  const until = getTimeUntil(event.startTime);
  const timeLabel = formatEventTime(event.startTime);

  if (variant === 'row') {
    return (
      <div
        className={cn(
          'flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4',
          'transition-colors hover:border-foreground/25',
          className,
        )}
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-lg"
          aria-hidden
        >
          {sportIcon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
              {event.league}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                cfg.className,
              )}
            >
              {cfg.label}
            </span>
          </div>
          <p className="truncate text-base font-semibold text-foreground">
            {event.homeTeam}{' '}
            <span className="font-medium text-secondary-foreground">vs</span> {event.awayTeam}
          </p>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {event.homeOdds != null && (
            <span className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs tabular-nums text-foreground">
              {event.homeOdds.toFixed(2)}
            </span>
          )}
          {event.awayOdds != null && (
            <span className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs tabular-nums text-foreground">
              {event.awayOdds.toFixed(2)}
            </span>
          )}
        </div>
        <div className="min-w-[4.5rem] shrink-0 text-right">
          <p className="text-sm font-semibold text-foreground">{timeLabel}</p>
          <p className="text-xs font-medium text-secondary-foreground">{until}</p>
        </div>
      </div>
    );
  }

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border border-border bg-card p-4',
        'transition-colors hover:border-foreground/25',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-base" aria-hidden>
            {sportIcon}
          </span>
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            {event.league}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-semibold text-foreground">{timeLabel}</p>
          <p className="text-xs text-secondary-foreground">{until}</p>
        </div>
      </div>

      <div className="mb-4 space-y-2">
        <p className="text-sm font-bold uppercase tracking-tight text-foreground">{event.homeTeam}</p>
        <p className="text-xs font-medium uppercase tracking-widest text-secondary-foreground">vs</p>
        <p className="text-sm font-bold uppercase tracking-tight text-foreground">{event.awayTeam}</p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
        <div>
          <span
            className={cn(
              'inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold',
              cfg.className,
            )}
          >
            {cfg.label}
          </span>
          {yourPickCount != null && (
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-foreground">
              {yourPickCount === 0
                ? 'No picks yet'
                : `${yourPickCount} of your pick${yourPickCount === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
        {actionHref && actionLabel ? (
          <Link
            to={actionHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-foreground hover:text-primary"
          >
            {actionLabel}
            <ArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/** Match creator picks to a matchup via event text / team names (honest heuristic). */
export function countPicksForMatchup(
  picks: Array<{ pickEvent?: string | null; sport?: string | null }>,
  event: SportEvent,
): number {
  const home = event.homeTeam.toLowerCase();
  const away = event.awayTeam.toLowerCase();
  const homeToken = home.split(/\s+/).pop() ?? home;
  const awayToken = away.split(/\s+/).pop() ?? away;

  return picks.filter((p) => {
    const ev = (p.pickEvent ?? '').toLowerCase();
    if (!ev) return false;
    if (ev.includes(home) || ev.includes(away)) return true;
    if (homeToken.length > 3 && ev.includes(homeToken)) return true;
    if (awayToken.length > 3 && ev.includes(awayToken)) return true;
    return false;
  }).length;
}
