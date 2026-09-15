/**
 * Sample Your Performance data for design review when the creator has no picks yet.
 * Aligned to the Prizelet Performance mockup (~67.2% WR, +86.4u).
 */

const day = 86_400_000;

function daysAgo(n: number): number {
  return Date.now() - n * day;
}

function isoDaysAgo(n: number): string {
  return new Date(daysAgo(n)).toISOString().slice(0, 10);
}

export type PerformanceResult = 'won' | 'lost' | 'push' | 'pending';

export type DemoRecentPick = {
  id: string;
  dateMs: number;
  match: string;
  pick: string;
  sport: string;
  result: PerformanceResult;
  profit: number;
};

export type DemoMonthlyRow = {
  month: string;
  picks: number;
  wins: number;
  winRate: number;
  risked: number;
  profit: number;
  roi: number;
};

/** KPI strip values aligned to the Performance mockup. */
export const CREATOR_PERFORMANCE_DEMO_METRICS = {
  winRate: 67.2,
  winRateDelta: 5.4,
  settledPicks: 98,
  settledDelta: 12,
  totalProfit: 86.4,
  profitDelta: 42,
  roi: 18.5,
  roiDelta: 3.2,
} as const;

/** Cumulative profit series (units) for the line/area chart. */
export const CREATOR_PERFORMANCE_DEMO_PROFIT_SERIES = [
  { label: 'Week 1', profit: 8.2 },
  { label: 'Week 2', profit: 14.6 },
  { label: 'Week 3', profit: 11.1 },
  { label: 'Week 4', profit: 22.4 },
  { label: 'Week 5', profit: 31.8 },
  { label: 'Week 6', profit: 28.5 },
  { label: 'Week 7', profit: 45.2 },
  { label: 'Week 8', profit: 52.9 },
  { label: 'Week 9', profit: 61.3 },
  { label: 'Week 10', profit: 74.8 },
  { label: 'Week 11', profit: 81.2 },
  { label: 'Week 12', profit: 86.4 },
];

export const CREATOR_PERFORMANCE_DEMO_RESULTS = [
  { name: 'Wins', value: 66, color: 'hsl(160 84% 39%)' },
  { name: 'Losses', value: 28, color: 'hsl(0 84% 60%)' },
  { name: 'Pushes', value: 4, color: 'hsl(215 16% 55%)' },
];

export const CREATOR_PERFORMANCE_DEMO_PROFIT_BY_SPORT = [
  { sport: 'NBA', profit: 32.4 },
  { sport: 'NFL', profit: 28.1 },
  { sport: 'Soccer', profit: 14.6 },
  { sport: 'MLB', profit: 6.8 },
  { sport: 'NHL', profit: 4.5 },
];

export const CREATOR_PERFORMANCE_DEMO_WINRATE_BY_SPORT = [
  { sport: 'NBA', winRate: 72 },
  { sport: 'NFL', winRate: 68 },
  { sport: 'Soccer', winRate: 64 },
  { sport: 'MLB', winRate: 58 },
  { sport: 'NHL', winRate: 61 },
];

export const CREATOR_PERFORMANCE_DEMO_RECENT: DemoRecentPick[] = [
  {
    id: 'demo-perf-1',
    dateMs: daysAgo(1),
    match: 'Lakers vs Nuggets',
    pick: 'Over 224.5',
    sport: 'NBA',
    result: 'won',
    profit: 1.82,
  },
  {
    id: 'demo-perf-2',
    dateMs: daysAgo(2),
    match: 'Chiefs vs Bills',
    pick: 'Chiefs +1.5',
    sport: 'NFL',
    result: 'won',
    profit: 0.95,
  },
  {
    id: 'demo-perf-3',
    dateMs: daysAgo(3),
    match: 'Real Madrid vs Sevilla',
    pick: 'Real Madrid ML',
    sport: 'Soccer',
    result: 'lost',
    profit: -1,
  },
  {
    id: 'demo-perf-4',
    dateMs: daysAgo(4),
    match: 'Celtics vs Heat',
    pick: 'Celtics -4.5',
    sport: 'NBA',
    result: 'won',
    profit: 1.82,
  },
  {
    id: 'demo-perf-5',
    dateMs: daysAgo(5),
    match: 'Yankees vs Dodgers',
    pick: 'Over 8.5',
    sport: 'MLB',
    result: 'lost',
    profit: -1,
  },
  {
    id: 'demo-perf-6',
    dateMs: daysAgo(6),
    match: 'Djokovic vs Alcaraz',
    pick: 'Djokovic ML',
    sport: 'Tennis',
    result: 'pending',
    profit: 0,
  },
  {
    id: 'demo-perf-7',
    dateMs: daysAgo(7),
    match: 'Arsenal vs Tottenham',
    pick: 'Arsenal -0.5',
    sport: 'Soccer',
    result: 'push',
    profit: 0,
  },
  {
    id: 'demo-perf-8',
    dateMs: daysAgo(8),
    match: 'Chiefs vs Raiders',
    pick: 'Mahomes Over 1.5 Pass TD',
    sport: 'NFL',
    result: 'won',
    profit: 1.74,
  },
];

export const CREATOR_PERFORMANCE_DEMO_MONTHLY: DemoMonthlyRow[] = [
  { month: 'Jan 2026', picks: 28, wins: 19, winRate: 70.4, risked: 42, profit: 18.6, roi: 44.3 },
  { month: 'Dec 2025', picks: 32, wins: 21, winRate: 67.7, risked: 48, profit: 22.4, roi: 46.7 },
  { month: 'Nov 2025', picks: 24, wins: 15, winRate: 65.2, risked: 36, profit: 14.1, roi: 39.2 },
  { month: 'Oct 2025', picks: 30, wins: 19, winRate: 65.5, risked: 45, profit: 16.8, roi: 37.3 },
  { month: 'Sep 2025', picks: 22, wins: 14, winRate: 66.7, risked: 33, profit: 9.2, roi: 27.9 },
  { month: 'Aug 2025', picks: 18, wins: 11, winRate: 64.7, risked: 27, profit: 5.3, roi: 19.6 },
];

/** Sample practice-ledger rows for the manage section when empty. */
export const CREATOR_PERFORMANCE_DEMO_PRACTICE = [
  {
    id: 'demo-practice-1',
    date: isoDaysAgo(1),
    pickEvent: 'Lakers -3.5',
    sport: 'NBA',
    usOdds: '-110',
    euOdds: 1.91,
    unitsRisked: 1,
    result: 'won' as const,
    unitsWonLost: 0.91,
  },
  {
    id: 'demo-practice-2',
    date: isoDaysAgo(3),
    pickEvent: 'Chiefs ML',
    sport: 'NFL',
    usOdds: '+120',
    euOdds: 2.2,
    unitsRisked: 1,
    result: 'lost' as const,
    unitsWonLost: -1,
  },
  {
    id: 'demo-practice-3',
    date: isoDaysAgo(5),
    pickEvent: 'Over 47.5',
    sport: 'NFL',
    usOdds: '-105',
    euOdds: 1.95,
    unitsRisked: 2,
    result: 'pending' as const,
    unitsWonLost: 0,
  },
];

export function shouldUseCreatorPerformanceDemo(input: {
  pickCount: number;
  postCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.pickCount === 0 && input.postCount === 0;
}

export function isCreatorPerformanceDemoId(id: string): boolean {
  return id.startsWith('demo-');
}
