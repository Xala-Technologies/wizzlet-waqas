import { useState, useMemo } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Seo } from '@/components/Seo';
import { Footer } from '@/components/landing/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Search, Star, Zap, Flame, Clock, Filter } from 'lucide-react';
import { getTodaysEvents, getEventsBySport, SPORT_ICONS, formatEventTime, getTimeUntil, type SportEvent, type EventStatus } from '@/lib/events';

const statusConfig: Record<EventStatus, { label: string; class: string }> = {
  featured: { label: 'Featured', class: 'bg-primary/15 text-primary border-primary/20' },
  starting_soon: { label: 'Starting Soon', class: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  trending: { label: 'Trending', class: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  live: { label: 'Live', class: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  upcoming: { label: 'Upcoming', class: 'bg-muted text-muted-foreground border-border' },
};

const SPORTS_FILTER = ['All Sports', 'Basketball', 'Football', 'Baseball', 'Hockey', 'Tennis', 'MMA'];
const TIME_FILTER = ['All Times', 'Next 2 Hours', 'Afternoon', 'Evening', 'Late Night'];

function EventRow({ event }: { event: SportEvent }) {
  const cfg = statusConfig[event.status];
  const sportIcon = SPORT_ICONS[event.sport] || '🏆';
  const until = getTimeUntil(event.startTime);

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_-8px_hsl(var(--primary)/0.15)] hover:-translate-y-0.5">
      {/* Sport icon */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-lg shrink-0">{sportIcon}</div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{event.league}</span>
          <span className={`inline-flex items-center gap-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-full px-1.5 py-0.5 border ${cfg.class}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-sm font-semibold truncate">{event.homeTeam} <span className="text-muted-foreground font-normal mx-1">vs</span> {event.awayTeam}</p>
      </div>

      {/* Odds */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        {event.homeOdds && <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1">{event.homeOdds.toFixed(2)}</span>}
        {event.drawOdds && <span className="text-[10px] font-mono text-muted-foreground/50 bg-muted/30 rounded px-2 py-1">{event.drawOdds.toFixed(2)}</span>}
        {event.awayOdds && <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1">{event.awayOdds.toFixed(2)}</span>}
      </div>

      {/* Time */}
      <div className="text-right shrink-0 min-w-[70px]">
        <p className="text-xs font-medium">{formatEventTime(event.startTime)}</p>
        <p className="text-[10px] text-muted-foreground">{until}</p>
      </div>
    </div>
  );
}

const TodaysEvents = () => {
  const allEvents = useMemo(() => getTodaysEvents(), []);
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState('All Sports');
  const [timeFilter, setTimeFilter] = useState('All Times');

  const filtered = useMemo(() => {
    let events = allEvents;

    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e =>
        e.homeTeam.toLowerCase().includes(q) || e.awayTeam.toLowerCase().includes(q) ||
        e.league.toLowerCase().includes(q) || e.sport.toLowerCase().includes(q)
      );
    }

    if (sportFilter !== 'All Sports') {
      events = events.filter(e => e.sport === sportFilter);
    }

    if (timeFilter !== 'All Times') {
      const now = new Date();
      events = events.filter(e => {
        const h = new Date(e.startTime).getHours();
        switch (timeFilter) {
          case 'Next 2 Hours': return (new Date(e.startTime).getTime() - now.getTime()) < 2 * 60 * 60 * 1000 && new Date(e.startTime).getTime() > now.getTime();
          case 'Afternoon': return h >= 12 && h < 17;
          case 'Evening': return h >= 17 && h < 21;
          case 'Late Night': return h >= 21;
          default: return true;
        }
      });
    }

    return events;
  }, [allEvents, search, sportFilter, timeFilter]);

  const featured = filtered.filter(e => e.status === 'featured');
  const startingSoon = filtered.filter(e => e.status === 'starting_soon');
  const bySport = useMemo(() => getEventsBySport(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-noise">
      <Seo title="Today's Events — Live Matchups & Picks | Wizzlet" description="Every matchup happening today with live status, start times, and the Wizzlet creators posting picks on each game." />
      <Navbar />
      <main id="main-content" className="pt-24 pb-20">
        <div className="container">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest mb-3">
              <Zap className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Today's Events</h1>
            <p className="text-muted-foreground mt-2 max-w-lg">Every major matchup happening today — across all sports.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search teams, leagues..."
                className="pl-9 h-9 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SPORTS_FILTER.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIME_FILTER.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <span className="text-[10px] text-muted-foreground ml-auto">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Featured Events */}
          {featured.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Featured Events</h2>
              </div>
              <div className="space-y-2">
                {featured.map(e => <EventRow key={e.id} event={e} />)}
              </div>
            </div>
          )}

          {/* Starting Soon */}
          {startingSoon.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Starting Soon</h2>
              </div>
              <div className="space-y-2">
                {startingSoon.map(e => <EventRow key={e.id} event={e} />)}
              </div>
            </div>
          )}

          {/* By Sport */}
          {Object.entries(bySport).map(([sport, events]) => (
            <div key={sport} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">{SPORT_ICONS[sport] || '🏆'}</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider">{sport}</h2>
                <span className="text-[10px] text-muted-foreground">{events.length} event{events.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {events.map(e => <EventRow key={e.id} event={e} />)}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-16 text-center">
              <Filter className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-base font-semibold mb-1">No events match your filters</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TodaysEvents;
