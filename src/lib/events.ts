/**
 * Today's Events helpers.
 * Event rows are loaded from Convex `sportEvents` (see events.queries.listPublishedToday).
 * This module only maps/filters — no hardcoded production slate.
 */

export type EventStatus = 'featured' | 'starting_soon' | 'trending' | 'live' | 'upcoming';

export interface SportEvent {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string; // ISO 8601
  status: EventStatus;
  homeOdds?: number;
  awayOdds?: number;
  drawOdds?: number;
  priority: number;
}

const VALID_STATUS = new Set<EventStatus>([
  'featured',
  'starting_soon',
  'trending',
  'live',
  'upcoming',
]);

export function mapConvexSportEvent(row: {
  _id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startsAt: number;
  status: string;
  homeOdds?: number;
  awayOdds?: number;
  drawOdds?: number;
  priority: number;
}): SportEvent {
  const status = (VALID_STATUS.has(row.status as EventStatus) ? row.status : 'upcoming') as EventStatus;
  return {
    id: row._id,
    sport: row.sport,
    league: row.league,
    homeTeam: row.homeTeam,
    awayTeam: row.awayTeam,
    startTime: new Date(row.startsAt).toISOString(),
    status,
    homeOdds: row.homeOdds,
    awayOdds: row.awayOdds,
    drawOdds: row.drawOdds,
    priority: row.priority,
  };
}

/** Local calendar-day bounds for `listPublishedToday` (pass from client — never Date.now in queries). */
export function todayBoundsMs(nowMs: number = Date.now()): { fromMs: number; toMs: number } {
  const d = new Date(nowMs);
  d.setHours(0, 0, 0, 0);
  const fromMs = d.getTime();
  return { fromMs, toMs: fromMs + 24 * 60 * 60 * 1000 };
}

/** @deprecated Prefer Convex query — kept empty so callers never show fake games. */
export function getTodaysEvents(): SportEvent[] {
  return [];
}

export function getEventsBySport(events: SportEvent[]): Record<string, SportEvent[]> {
  const map: Record<string, SportEvent[]> = {};
  events.forEach((e) => {
    if (!map[e.sport]) map[e.sport] = [];
    map[e.sport].push(e);
  });
  return map;
}

export const SPORT_ICONS: Record<string, string> = {
  Basketball: '🏀',
  Football: '⚽',
  Baseball: '⚾',
  Hockey: '🏒',
  Tennis: '🎾',
  MMA: '🥊',
};

export function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getTimeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Started';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}
