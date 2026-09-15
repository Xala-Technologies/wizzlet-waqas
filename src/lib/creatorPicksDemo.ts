/**
 * Sample Your Picks data for design review when the creator has no real posts.
 * Mirrors the Prizelet picks mockup (metrics + table rows). Not live account data.
 */

const day = 86_400_000;

function daysAgo(n: number): number {
  return Date.now() - n * day;
}

function content(fields: {
  sport: string;
  event: string;
  pick: string;
  usOdds: string;
  euOdds: string;
  units: number;
  notes?: string;
}): string {
  return [
    `Sport: ${fields.sport}`,
    `Event: ${fields.event}`,
    `Pick: ${fields.pick}`,
    `Odds: ${fields.usOdds} (US) ${fields.euOdds} (EU)`,
    `Units: ${fields.units}u`,
    '',
    fields.notes ?? 'Sample write-up for design preview.',
  ].join('\n');
}

export type CreatorPicksDemoRow = {
  id: string;
  title: string;
  content: string;
  is_premium: boolean;
  createdAtMs: number;
  result: 'pending' | 'won' | 'lost' | 'push';
  tracking_mode: string;
};

/** KPI strip values aligned to the Your Picks mockup. */
export const CREATOR_PICKS_DEMO_METRICS = {
  totalPicks: 124,
  totalPicksDelta: 28,
  winRate: 67.2,
  winRateDelta: 5.4,
  profit: 86.4,
  profitDelta: 42,
  subscribers: 892,
  subscribersDelta: 18,
} as const;

/** Representative table rows (first page of the mockup). */
export const CREATOR_PICKS_DEMO_ROWS: CreatorPicksDemoRow[] = [
  {
    id: 'demo-pick-1',
    title: 'Lakers vs Nuggets — Over 224.5',
    content: content({
      sport: 'NBA',
      event: 'Lakers vs Nuggets',
      pick: 'Over 224.5',
      usOdds: '-110',
      euOdds: '1.91',
      units: 2,
    }),
    is_premium: true,
    createdAtMs: daysAgo(1),
    result: 'won',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-2',
    title: 'Chiefs +1.5 vs Bills',
    content: content({
      sport: 'NFL',
      event: 'Chiefs vs Bills',
      pick: 'Chiefs +1.5',
      usOdds: '-105',
      euOdds: '1.95',
      units: 1,
    }),
    is_premium: true,
    createdAtMs: daysAgo(2),
    result: 'won',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-3',
    title: 'Real Madrid ML',
    content: content({
      sport: 'Soccer',
      event: 'Real Madrid vs Sevilla',
      pick: 'Real Madrid ML',
      usOdds: '-150',
      euOdds: '1.67',
      units: 1,
    }),
    is_premium: true,
    createdAtMs: daysAgo(3),
    result: 'lost',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-4',
    title: 'Celtics -4.5',
    content: content({
      sport: 'NBA',
      event: 'Celtics vs Heat',
      pick: 'Celtics -4.5',
      usOdds: '-110',
      euOdds: '1.91',
      units: 2,
    }),
    is_premium: true,
    createdAtMs: daysAgo(4),
    result: 'won',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-5',
    title: 'Yankees / Dodgers Over 8.5',
    content: content({
      sport: 'MLB',
      event: 'Yankees vs Dodgers',
      pick: 'Over 8.5',
      usOdds: '+100',
      euOdds: '2.00',
      units: 1,
    }),
    is_premium: false,
    createdAtMs: daysAgo(5),
    result: 'lost',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-6',
    title: 'Djokovic ML — AO',
    content: content({
      sport: 'Tennis',
      event: 'Djokovic vs Alcaraz',
      pick: 'Djokovic ML',
      usOdds: '-130',
      euOdds: '1.77',
      units: 1.5,
    }),
    is_premium: true,
    createdAtMs: daysAgo(6),
    result: 'pending',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-7',
    title: 'Arsenal -0.5 AH',
    content: content({
      sport: 'Soccer',
      event: 'Arsenal vs Tottenham',
      pick: 'Arsenal -0.5',
      usOdds: '-120',
      euOdds: '1.83',
      units: 1,
    }),
    is_premium: true,
    createdAtMs: daysAgo(7),
    result: 'push',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-8',
    title: 'Mahomes over 1.5 pass TDs',
    content: content({
      sport: 'NFL',
      event: 'Chiefs vs Raiders',
      pick: 'Mahomes Over 1.5 Pass TD',
      usOdds: '-115',
      euOdds: '1.87',
      units: 2,
    }),
    is_premium: true,
    createdAtMs: daysAgo(8),
    result: 'won',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-9',
    title: 'Warriors ML',
    content: content({
      sport: 'NBA',
      event: 'Warriors vs Suns',
      pick: 'Warriors ML',
      usOdds: '+110',
      euOdds: '2.10',
      units: 1,
    }),
    is_premium: true,
    createdAtMs: daysAgo(9),
    result: 'lost',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-10',
    title: 'Rangers ML',
    content: content({
      sport: 'NHL',
      event: 'Rangers vs Bruins',
      pick: 'Rangers ML',
      usOdds: '-125',
      euOdds: '1.80',
      units: 1,
    }),
    is_premium: true,
    createdAtMs: daysAgo(10),
    result: 'won',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-11',
    title: 'Under 47.5 — Sunday night',
    content: content({
      sport: 'NFL',
      event: 'Eagles vs Cowboys',
      pick: 'Under 47.5',
      usOdds: '-110',
      euOdds: '1.91',
      units: 1.5,
    }),
    is_premium: true,
    createdAtMs: daysAgo(12),
    result: 'pending',
    tracking_mode: '',
  },
  {
    id: 'demo-pick-12',
    title: 'Inter Milan ML',
    content: content({
      sport: 'Soccer',
      event: 'Inter vs Napoli',
      pick: 'Inter ML',
      usOdds: '-140',
      euOdds: '1.71',
      units: 1,
    }),
    is_premium: false,
    createdAtMs: daysAgo(14),
    result: 'won',
    tracking_mode: '',
  },
];

export function shouldUseCreatorPicksDemo(input: {
  postCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.postCount === 0;
}

export function isCreatorPicksDemoId(id: string): boolean {
  return id.startsWith('demo-pick-');
}
