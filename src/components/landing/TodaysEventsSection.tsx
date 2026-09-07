import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Flame, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mapConvexSportEvent, SPORT_ICONS, formatEventTime, todayBoundsMs, type SportEvent, type EventStatus } from '@/lib/events';
import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const statusConfig: Record<EventStatus, { label: string; class: string; icon: typeof Zap }> = {
  featured: { label: 'Featured', class: 'bg-primary/15 text-primary border-primary/20', icon: Star },
  starting_soon: { label: 'Starting Soon', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: Zap },
  trending: { label: 'Trending', class: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: Flame },
  live: { label: 'Live', class: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: Zap },
  upcoming: { label: 'Upcoming', class: 'bg-muted text-muted-foreground border-border', icon: Zap },
};

function EventCard({ event }: { event: SportEvent }) {
  const cfg = statusConfig[event.status];
  const sportIcon = SPORT_ICONS[event.sport] || '🏆';

  return (
    <div className="group relative min-w-[280px] max-w-[320px] rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)] hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{sportIcon}</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{event.league}</span>
        </div>
        <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border ${cfg.class}`}>
          {event.status === 'featured' && <Star className="h-2.5 w-2.5" />}
          {event.status === 'starting_soon' && <Zap className="h-2.5 w-2.5" />}
          {event.status === 'trending' && <Flame className="h-2.5 w-2.5" />}
          {cfg.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate flex-1">{event.homeTeam}</span>
          {event.homeOdds && <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 ml-2">{event.homeOdds.toFixed(2)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest">vs</span>
          {event.drawOdds && <span className="text-[9px] font-mono text-muted-foreground/40">Draw {event.drawOdds.toFixed(2)}</span>}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold truncate flex-1">{event.awayTeam}</span>
          {event.awayOdds && <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5 ml-2">{event.awayOdds.toFixed(2)}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">Today</span>
        <span className="text-xs font-medium">{formatEventTime(event.startTime)}</span>
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
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container relative">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
              <Zap className="h-3.5 w-3.5" />
              Live Today
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Today's Biggest Events</h2>
            <p className="text-muted-foreground mt-2 max-w-md">See what's happening today across the biggest sports.</p>
          </div>
          <Link to="/todays-events" className="hidden sm:flex">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              View All <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {rows === undefined ? (
          <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No events published for today yet.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {events.map(event => (
              <div key={event.id} className="snap-start shrink-0 lg:shrink">
                <EventCard event={event} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link to="/todays-events">
            <Button variant="outline" size="sm" className="gap-1.5">
              View All Events <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
