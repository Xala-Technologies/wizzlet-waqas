import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Clock, Calendar, CircleDot, Dribbble, Flame, Trophy, type LucideIcon } from 'lucide-react';
import {
  mapConvexSportEvent,
  getEventsBySport,
  SPORT_ICONS,
  todayBoundsMs,
} from '@/lib/events';
import { DiscoveryFilterBar } from '@/components/discover/DiscoveryFilterBar';
import { GameMatchupCard } from '@/components/discover/GameMatchupCard';

const SPORT_FILTERS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'All', label: 'All sports', icon: Trophy },
  { key: 'Basketball', label: 'Basketball', icon: CircleDot },
  { key: 'Football', label: 'Football', icon: Flame },
  { key: 'Baseball', label: 'Baseball', icon: Calendar },
  { key: 'Hockey', label: 'Hockey', icon: Dribbble },
  { key: 'Tennis', label: 'Tennis', icon: Trophy },
  { key: 'MMA', label: 'MMA', icon: Flame },
];

/**
 * Today's games panel — embedded in Discover hub (not a separate top-nav page).
 */
export function DiscoverGamesPanel({ search }: { search: string }) {
  const dayBounds = useMemo(() => todayBoundsMs(), []);
  const rows = useQuery(api.events.queries.listPublishedToday, dayBounds);
  const allEvents = useMemo(() => (rows ?? []).map(mapConvexSportEvent), [rows]);
  const [sport, setSport] = useState('All');

  const filtered = useMemo(() => {
    let events = allEvents;
    const q = search.trim().toLowerCase();
    if (q) {
      events = events.filter(
        (e) =>
          e.homeTeam.toLowerCase().includes(q) ||
          e.awayTeam.toLowerCase().includes(q) ||
          e.league.toLowerCase().includes(q) ||
          e.sport.toLowerCase().includes(q),
      );
    }
    if (sport !== 'All') {
      events = events.filter((e) => e.sport === sport);
    }
    return events;
  }, [allEvents, search, sport]);

  const featured = filtered.filter((e) => e.status === 'featured');
  const startingSoon = filtered.filter((e) => e.status === 'starting_soon');
  const bySport = useMemo(() => getEventsBySport(filtered), [filtered]);

  return (
    <div>
      <DiscoveryFilterBar
        options={SPORT_FILTERS}
        value={sport}
        onChange={setSport}
        aria-label="Filter by sport"
      />

      <p className="mt-4 text-sm font-medium text-secondary-foreground">
        {rows === undefined
          ? 'Loading today’s slate…'
          : `${filtered.length} game${filtered.length === 1 ? '' : 's'} today`}
      </p>

      {rows === undefined ? (
        <div className="flex justify-center py-20" aria-busy="true">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="text-lg font-semibold text-foreground">
            {allEvents.length === 0 ? 'No games published today' : 'No games match your filters'}
          </p>
          <p className="mt-2 text-base text-secondary-foreground">
            {allEvents.length === 0
              ? 'Check back later, or browse creators while the slate fills in.'
              : 'Try another sport or clear the search.'}
          </p>
          {sport !== 'All' ? (
            <Button type="button" variant="outline" className="mt-6" onClick={() => setSport('All')}>
              Show all sports
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 space-y-10">
          {featured.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  Featured
                </h2>
              </div>
              <ul className="space-y-3">
                {featured.map((e) => (
                  <li key={e.id} className="list-none">
                    <GameMatchupCard event={e} variant="row" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {startingSoon.length > 0 && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  Starting soon
                </h2>
              </div>
              <ul className="space-y-3">
                {startingSoon.map((e) => (
                  <li key={e.id} className="list-none">
                    <GameMatchupCard event={e} variant="row" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {Object.entries(bySport).map(([sportName, events]) => (
            <section key={sportName}>
              <div className="mb-4 flex items-center gap-2">
                <span className="text-base" aria-hidden>
                  {SPORT_ICONS[sportName] || '🏆'}
                </span>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                  {sportName}
                </h2>
                <span className="text-sm font-medium text-secondary-foreground">
                  {events.length}
                </span>
              </div>
              <ul className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="list-none">
                    <GameMatchupCard event={e} variant="row" />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
