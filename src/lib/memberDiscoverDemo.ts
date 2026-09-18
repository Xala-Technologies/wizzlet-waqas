/**
 * Sample member Discover creators for design review when the directory is empty.
 * Aligned to the Prizelet Discover mockup grid.
 */

export type MemberDiscoverDemoCreator = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarInitials: string;
  bannerTone: string;
  bannerEmoji: string;
  sports: string[];
  winRate: number;
  profit30dUnits: number;
  followersLabel: string;
  monthlyPriceCents: number;
  verified: boolean;
};

export const MEMBER_DISCOVER_DEMO_CREATORS: MemberDiscoverDemoCreator[] = [
  {
    id: 'demo-disc-1',
    username: 'sharkpicks',
    displayName: 'Shark Picks',
    bio: 'NBA & NFL sides with disciplined unit sizing.',
    avatarInitials: 'SP',
    bannerTone: 'from-slate-800 via-sky-900 to-slate-950',
    bannerEmoji: '🦈',
    sports: ['NBA', 'NFL'],
    winRate: 68,
    profit30dUnits: 12.4,
    followersLabel: '2.4K',
    monthlyPriceCents: 999,
    verified: true,
  },
  {
    id: 'demo-disc-2',
    username: 'theprofitclub',
    displayName: 'The Profit Club',
    bio: 'Premium locks across major US sports.',
    avatarInitials: 'PC',
    bannerTone: 'from-amber-700 via-yellow-600 to-amber-900',
    bannerEmoji: '👑',
    sports: ['NBA', 'NFL', 'MLB'],
    winRate: 64,
    profit30dUnits: 8.6,
    followersLabel: '1.9K',
    monthlyPriceCents: 1499,
    verified: true,
  },
  {
    id: 'demo-disc-3',
    username: 'elitepicks',
    displayName: 'Elite Picks',
    bio: 'High-conviction NFL + NBA props only.',
    avatarInitials: 'EP',
    bannerTone: 'from-fuchsia-700 via-pink-600 to-violet-900',
    bannerEmoji: '⚡',
    sports: ['NFL', 'NBA'],
    winRate: 71,
    profit30dUnits: 15.2,
    followersLabel: '3.1K',
    monthlyPriceCents: 1999,
    verified: true,
  },
  {
    id: 'demo-disc-4',
    username: 'betking',
    displayName: 'BetKing',
    bio: 'Sharp money reads and early line moves.',
    avatarInitials: 'BK',
    bannerTone: 'from-indigo-800 via-blue-700 to-slate-900',
    bannerEmoji: '♔',
    sports: ['NBA', 'UFC'],
    winRate: 62,
    profit30dUnits: 7.1,
    followersLabel: '1.5K',
    monthlyPriceCents: 1299,
    verified: true,
  },
  {
    id: 'demo-disc-5',
    username: 'goalguru',
    displayName: 'GoalGuru',
    bio: 'Tennis + soccer models with live hedges.',
    avatarInitials: 'GG',
    bannerTone: 'from-lime-700 via-emerald-600 to-teal-900',
    bannerEmoji: '🎾',
    sports: ['Tennis', 'Soccer'],
    winRate: 66,
    profit30dUnits: 9.4,
    followersLabel: '2.0K',
    monthlyPriceCents: 999,
    verified: true,
  },
  {
    id: 'demo-disc-6',
    username: 'clutchbets',
    displayName: 'Clutch Bets',
    bio: 'Late-game NBA spots and live totals.',
    avatarInitials: 'CB',
    bannerTone: 'from-orange-700 via-rose-600 to-slate-900',
    bannerEmoji: '🔥',
    sports: ['NBA', 'NFL'],
    winRate: 63,
    profit30dUnits: 6.8,
    followersLabel: '1.2K',
    monthlyPriceCents: 899,
    verified: true,
  },
  {
    id: 'demo-disc-7',
    username: 'fivetouch',
    displayName: 'FiveTouch',
    bio: 'European football cards built for volume.',
    avatarInitials: 'FT',
    bannerTone: 'from-sky-700 via-blue-600 to-indigo-950',
    bannerEmoji: '⚽',
    sports: ['Soccer'],
    winRate: 65,
    profit30dUnits: 8.3,
    followersLabel: '2.7K',
    monthlyPriceCents: 1199,
    verified: true,
  },
  {
    id: 'demo-disc-8',
    username: 'alphapicks',
    displayName: 'Alpha Picks',
    bio: 'Cross-sport edge with bankroll rules.',
    avatarInitials: 'AP',
    bannerTone: 'from-stone-700 via-neutral-600 to-zinc-900',
    bannerEmoji: '⛰',
    sports: ['NBA', 'UFC', 'NFL'],
    winRate: 60,
    profit30dUnits: 5.5,
    followersLabel: '980',
    monthlyPriceCents: 799,
    verified: true,
  },
];

export const MEMBER_DISCOVER_SPORT_FILTERS = [
  'All Sports',
  'Soccer',
  'NBA',
  'NFL',
  'Tennis',
  'UFC',
] as const;

export type MemberDiscoverSportFilter = (typeof MEMBER_DISCOVER_SPORT_FILTERS)[number] | string;

export function shouldUseMemberDiscoverDemo(opts: {
  creatorCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.creatorCount === 0;
}

export function isMemberDiscoverDemoId(id: string): boolean {
  return id.startsWith('demo-disc-');
}
