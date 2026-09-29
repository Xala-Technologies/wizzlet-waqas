import { Zap, Flame, Star, Loader2 } from 'lucide-react';
import { mapConvexSportEvent, SPORT_ICONS, formatEventTime, todayBoundsMs, type SportEvent, type EventStatus } from '@/lib/events';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { LandingSection } from '@/components/landing/LandingSection';
import {
  LandingSectionHeader,
  landingCardClass,
} from '@/components/landing/LandingSectionHeader';
import { cn } from '@/lib/utils';

const statusConfig: Record<EventStatus, { label: string; class: string; icon: typeof Zap }> = {
  featured: { label: 'Featured', class: 'bg-[#E1F2FF] text-[#256DC1] border-[#429FF0]/20', icon: Star },
  starting_soon: { label: 'Starting Soon', class: 'bg-amber-500/10 text-amber-700 border-amber-500/20', icon: Zap },
  trending: { label: 'Trending', class: 'bg-rose-500/10 text-rose-700 border-rose-500/20', icon: Flame },
  live: { label: 'Live', class: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20', icon: Zap },
  upcoming: { label: 'Upcoming', class: 'bg-muted text-muted-foreground border-border', icon: Zap },
};

function EventCard({ event }: { event: SportEvent }) {
  const cfg = statusConfig[event.status];
  const sportIcon = SPORT_ICONS[event.sport] || '🏆';

  return (
    <div className={cn(landingCardClass, 'group relative min-w-[280px] max-w-[320px] p-5')}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E1F2FF] text-sm">
            {sportIcon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {event.league}
          </span>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider',
            cfg.class,
          )}
        >
          {event.status === 'featured' && <Star className="h-2.5 w-2.5" />}
          {event.status === 'starting_soon' && <Zap className="h-2.5 w-2.5" />}
          {event.status === 'trending' && <Flame className="h-2.5 w-2.5" />}
          {cfg.label}
        </span>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="flex-1 truncate text-sm font-bold text-foreground">{event.homeTeam}</span>
          {event.homeOdds ? (
            <span className="rounded-full bg-[#E1F2FF] px-2 py-0.5 font-mono text-xs font-semibold text-[#256DC1]">
              {event.homeOdds.toFixed(2)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/50">
            vs
          </span>
          {event.drawOdds ? (
            <span className="text-xs text-muted-foreground/50">Draw {event.drawOdds.toFixed(2)}</span>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="flex-1 truncate text-sm font-bold text-foreground">{event.awayTeam}</span>
          {event.awayOdds ? (
            <span className="rounded-full bg-[#E1F2FF] px-2 py-0.5 font-mono text-xs font-semibold text-[#256DC1]">
              {event.awayOdds.toFixed(2)}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/60 pt-3">
        <span className="text-xs text-muted-foreground">Today</span>
        <span className="text-xs font-semibold text-foreground">{formatEventTime(event.startTime)}</span>
      </div>
    </div>
  );
}

export function TodaysEventsSection() {
  const dayBounds = useMemo(() => todayBoundsMs(), []);
  const rows = useQuery(api.events.queries.listPublishedToday, dayBounds);
  const events = useMemo(
    () => (rows ?? []).map(mapConvexSportEvent).slice(0, 6),
    [rows],
  );

  return (
    <LandingSection className="overflow-hidden bg-white dark:bg-background">
      <div className="container relative">
        <LandingSectionHeader
          eyebrow="Live today"
          title={
            <>
              Today’s biggest <span className="text-[#429FF0]">events.</span>
            </>
          }
          description="See what’s happening today across the biggest sports."
        />

        {rows === undefined ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[#429FF0]" />
          </div>
        ) : events.length === 0 ? (
          <div className={cn(landingCardClass, 'mx-auto max-w-lg px-6 py-10 text-center hover:translate-y-0 hover:border-border hover:shadow-[0_8px_28px_rgba(8,24,47,0.06)]')}>
            <p className="text-base font-semibold text-foreground">No events published for today yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back later, or browse creators while the slate fills in.
            </p>
          </div>
        ) : (
          <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {events.map((event) => (
              <div key={event.id} className="snap-start shrink-0 lg:shrink">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}
      </div>
    </LandingSection>
  );
}
