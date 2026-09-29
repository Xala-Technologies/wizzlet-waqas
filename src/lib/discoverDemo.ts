/**
 * Public Discover page demo creators — used when the roster is empty so the
 * PO mock layout can be reviewed without live data.
 */

export type DiscoverDemoCreator = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  sport: string;
  avatarInitials: string;
  bannerTone: string;
  verified: boolean;
  monthlyPriceCents: number;
  postCount: number;
  createdAt: number;
};

export const DISCOVER_SPORT_FILTERS = [
  'All',
  'Football',
  'Basketball',
  'Tennis',
  'Hockey',
  'Baseball',
  'MMA',
] as const;

export type DiscoverSportFilter = (typeof DISCOVER_SPORT_FILTERS)[number];

export const DISCOVER_DEMO_CREATORS: DiscoverDemoCreator[] = [
  {
    id: 'demo-disc-1',
    username: 'alexpicks',
    displayName: 'AlexPicks',
    bio: 'Daily picks, analysis and betting strategies for top leagues.',
    sport: 'Football',
    avatarInitials: 'AP',
    bannerTone: 'from-emerald-800 via-emerald-600 to-lime-500',
    verified: true,
    monthlyPriceCents: 4900,
    postCount: 128,
    createdAt: Date.now() - 86_400_000 * 120,
  },
  {
    id: 'demo-disc-2',
    username: 'hoopshq',
    displayName: 'HoopsHQ',
    bio: 'NBA props, player trends, and nightly slate breakdowns.',
    sport: 'Basketball',
    avatarInitials: 'HH',
    bannerTone: 'from-orange-800 via-orange-600 to-amber-400',
    verified: true,
    monthlyPriceCents: 3900,
    postCount: 96,
    createdAt: Date.now() - 86_400_000 * 90,
  },
  {
    id: 'demo-disc-3',
    username: 'tennispro',
    displayName: 'TennisPro',
    bio: 'ATP & WTA models, live in-play angles, and match previews.',
    sport: 'Tennis',
    avatarInitials: 'T',
    bannerTone: 'from-lime-700 via-green-500 to-emerald-400',
    verified: true,
    monthlyPriceCents: 2900,
    postCount: 74,
    createdAt: Date.now() - 86_400_000 * 80,
  },
  {
    id: 'demo-disc-4',
    username: 'iceinsights',
    displayName: 'IceInsights',
    bio: 'NHL lines, goalie starts, and playoff series edges.',
    sport: 'Hockey',
    avatarInitials: 'IC',
    bannerTone: 'from-sky-900 via-sky-600 to-cyan-400',
    verified: true,
    monthlyPriceCents: 3500,
    postCount: 61,
    createdAt: Date.now() - 86_400_000 * 70,
  },
  {
    id: 'demo-disc-5',
    username: 'baseballbarn',
    displayName: 'BaseballBarn',
    bio: 'MLB run lines, pitcher splits, and park-factor plays.',
    sport: 'Baseball',
    avatarInitials: 'BB',
    bannerTone: 'from-red-900 via-red-600 to-rose-400',
    verified: true,
    monthlyPriceCents: 3200,
    postCount: 55,
    createdAt: Date.now() - 86_400_000 * 60,
  },
  {
    id: 'demo-disc-6',
    username: 'fightclub',
    displayName: 'FightClub',
    bio: 'UFC card breakdowns, finish props, and live fight notes.',
    sport: 'MMA',
    avatarInitials: 'FC',
    bannerTone: 'from-stone-900 via-stone-700 to-zinc-500',
    verified: true,
    monthlyPriceCents: 4500,
    postCount: 88,
    createdAt: Date.now() - 86_400_000 * 50,
  },
  {
    id: 'demo-disc-7',
    username: 'thefootballclub',
    displayName: 'The Football Club',
    bio: 'Premier League & Champions League value spotting each weekend.',
    sport: 'Football',
    avatarInitials: 'TF',
    bannerTone: 'from-blue-900 via-blue-600 to-indigo-400',
    verified: true,
    monthlyPriceCents: 2700,
    postCount: 112,
    createdAt: Date.now() - 86_400_000 * 40,
  },
  {
    id: 'demo-disc-8',
    username: 'tacticalmind',
    displayName: 'TacticalMind',
    bio: 'Formation deep-dives and in-game coaching for serious fans.',
    sport: 'Football',
    avatarInitials: 'TM',
    bannerTone: 'from-indigo-950 via-violet-700 to-purple-400',
    verified: true,
    monthlyPriceCents: 4100,
    postCount: 43,
    createdAt: Date.now() - 86_400_000 * 30,
  },
];

export function isDiscoverDemoId(id: string): boolean {
  return id.startsWith('demo-disc-');
}

/** Map free-text bio/username into a Discover sport bucket. */
export function inferDiscoverSport(bio: string | null | undefined, username: string): string {
  const hay = `${bio ?? ''} ${username}`.toLowerCase();
  if (/\b(nba|basketball|hoops)\b/.test(hay)) return 'Basketball';
  if (/\b(nfl|soccer|football|premier|epl|mls)\b/.test(hay)) return 'Football';
  if (/\b(tennis|atp|wta)\b/.test(hay)) return 'Tennis';
  if (/\b(nhl|hockey)\b/.test(hay)) return 'Hockey';
  if (/\b(mlb|baseball)\b/.test(hay)) return 'Baseball';
  if (/\b(ufc|mma|fight)\b/.test(hay)) return 'MMA';
  return 'Football';
}
