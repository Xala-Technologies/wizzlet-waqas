/**
 * Today's Events data layer.
 * Structured for easy replacement with a real sports API (e.g., TheOddsAPI, SportRadar).
 * Replace `getTodaysEvents()` with an API call when ready.
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
  priority: number; // higher = more important
}

const LEAGUE_PRIORITY: Record<string, number> = {
  'NFL': 100, 'NBA': 95, 'Premier League': 90, 'La Liga': 88, 'Champions League': 92,
  'MLB': 85, 'NHL': 80, 'UFC': 78, 'ATP Tour': 70, 'Serie A': 75, 'Bundesliga': 74,
  'MLS': 60, 'Ligue 1': 72, 'WTA Tour': 65, 'Eredivisie': 55,
};

function getPriority(league: string, status: EventStatus, startTime: string): number {
  const base = LEAGUE_PRIORITY[league] || 50;
  const statusBonus = status === 'featured' ? 20 : status === 'live' ? 15 : status === 'starting_soon' ? 10 : status === 'trending' ? 8 : 0;
  const now = new Date();
  const start = new Date(startTime);
  const hoursAway = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
  const timeBonus = hoursAway > 0 && hoursAway < 3 ? 12 : hoursAway < 6 ? 6 : 0;
  return base + statusBonus + timeBonus;
}

function todayAt(hour: number, min = 0): string {
  const d = new Date();
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

/** Placeholder data — replace with API call */
export function getTodaysEvents(): SportEvent[] {
  const raw: Omit<SportEvent, 'id' | 'priority'>[] = [
    // NBA
    { sport: 'Basketball', league: 'NBA', homeTeam: 'Boston Celtics', awayTeam: 'Milwaukee Bucks', startTime: todayAt(19, 30), status: 'featured', homeOdds: 1.65, awayOdds: 2.30 },
    { sport: 'Basketball', league: 'NBA', homeTeam: 'LA Lakers', awayTeam: 'Golden State Warriors', startTime: todayAt(22, 0), status: 'trending', homeOdds: 1.90, awayOdds: 1.95 },
    { sport: 'Basketball', league: 'NBA', homeTeam: 'Dallas Mavericks', awayTeam: 'Denver Nuggets', startTime: todayAt(20, 0), status: 'upcoming', homeOdds: 2.10, awayOdds: 1.75 },
    // Premier League
    { sport: 'Football', league: 'Premier League', homeTeam: 'Arsenal', awayTeam: 'Manchester City', startTime: todayAt(15, 0), status: 'featured', homeOdds: 2.50, awayOdds: 2.80, drawOdds: 3.40 },
    { sport: 'Football', league: 'Premier League', homeTeam: 'Liverpool', awayTeam: 'Chelsea', startTime: todayAt(17, 30), status: 'starting_soon', homeOdds: 1.85, awayOdds: 4.00, drawOdds: 3.60 },
    // Champions League
    { sport: 'Football', league: 'Champions League', homeTeam: 'Real Madrid', awayTeam: 'Bayern Munich', startTime: todayAt(21, 0), status: 'featured', homeOdds: 2.15, awayOdds: 3.20, drawOdds: 3.50 },
    // NFL
    { sport: 'Football', league: 'NFL', homeTeam: 'Kansas City Chiefs', awayTeam: 'Buffalo Bills', startTime: todayAt(20, 15), status: 'featured', homeOdds: 1.72, awayOdds: 2.20 },
    // NHL
    { sport: 'Hockey', league: 'NHL', homeTeam: 'Edmonton Oilers', awayTeam: 'Colorado Avalanche', startTime: todayAt(21, 0), status: 'trending', homeOdds: 2.05, awayOdds: 1.80 },
    { sport: 'Hockey', league: 'NHL', homeTeam: 'NY Rangers', awayTeam: 'Tampa Bay Lightning', startTime: todayAt(19, 0), status: 'starting_soon', homeOdds: 1.90, awayOdds: 1.95 },
    // MLB
    { sport: 'Baseball', league: 'MLB', homeTeam: 'NY Yankees', awayTeam: 'LA Dodgers', startTime: todayAt(19, 5), status: 'trending', homeOdds: 1.95, awayOdds: 1.88 },
    { sport: 'Baseball', league: 'MLB', homeTeam: 'Houston Astros', awayTeam: 'Atlanta Braves', startTime: todayAt(20, 10), status: 'upcoming', homeOdds: 1.80, awayOdds: 2.05 },
    // Tennis
    { sport: 'Tennis', league: 'ATP Tour', homeTeam: 'C. Alcaraz', awayTeam: 'J. Sinner', startTime: todayAt(14, 0), status: 'featured', homeOdds: 1.75, awayOdds: 2.10 },
    { sport: 'Tennis', league: 'WTA Tour', homeTeam: 'I. Swiatek', awayTeam: 'A. Sabalenka', startTime: todayAt(16, 0), status: 'starting_soon', homeOdds: 1.60, awayOdds: 2.40 },
    // UFC / MMA
    { sport: 'MMA', league: 'UFC', homeTeam: 'I. Adesanya', awayTeam: 'S. Strickland', startTime: todayAt(22, 0), status: 'trending', homeOdds: 1.55, awayOdds: 2.55 },
    // La Liga
    { sport: 'Football', league: 'La Liga', homeTeam: 'Barcelona', awayTeam: 'Atletico Madrid', startTime: todayAt(21, 0), status: 'upcoming', homeOdds: 1.70, awayOdds: 4.50, drawOdds: 3.80 },
  ];

  return raw.map((e, i) => ({
    ...e,
    id: `evt-${i}`,
    priority: getPriority(e.league, e.status, e.startTime),
  })).sort((a, b) => b.priority - a.priority);
}

export function getEventsBySport(events: SportEvent[]): Record<string, SportEvent[]> {
  const map: Record<string, SportEvent[]> = {};
  events.forEach(e => {
    if (!map[e.sport]) map[e.sport] = [];
    map[e.sport].push(e);
  });
  return map;
}

export const SPORT_ICONS: Record<string, string> = {
  'Basketball': '🏀', 'Football': '⚽', 'Baseball': '⚾',
  'Hockey': '🏒', 'Tennis': '🎾', 'MMA': '🥊',
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
