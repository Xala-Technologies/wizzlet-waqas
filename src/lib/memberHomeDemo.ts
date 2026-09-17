/**
 * Sample member Home feed aligned to the Prizelet member dashboard mockup.
 */

const hour = 3_600_000;

export type MemberHomeDemoPick = {
  id: string;
  createdAtMs: number;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    verified: boolean;
  };
  sport: string;
  event: string;
  pick: string;
  oddsDecimal: string;
  analysis: string;
  startsPrefix: string;
  startsValue: string;
  likes: number;
  comments: number;
};

export const MEMBER_HOME_DEMO_PICKS: MemberHomeDemoPick[] = [
  {
    id: 'demo-member-pick-1',
    createdAtMs: Date.now() - 2 * hour,
    creator: {
      id: 'demo-creator-shark',
      username: 'sharkpicks',
      displayName: 'Shark Picks',
      avatarUrl: null,
      verified: true,
    },
    sport: 'NBA',
    event: 'Lakers vs Nuggets',
    pick: 'Lakers +4.5',
    oddsDecimal: '1.93',
    analysis:
      'Denver sitting two rotation pieces. Lakers cover this home spot more often than the number implies.',
    startsPrefix: 'Starts in',
    startsValue: '2h 24m',
    likes: 128,
    comments: 24,
  },
  {
    id: 'demo-member-pick-2',
    createdAtMs: Date.now() - 3 * hour,
    creator: {
      id: 'demo-creator-profit',
      username: 'theprofitclub',
      displayName: 'The Profit Club',
      avatarUrl: null,
      verified: true,
    },
    sport: 'NFL',
    event: 'Chiefs vs Bills',
    pick: 'Chiefs ML',
    oddsDecimal: '2.10',
    analysis:
      'Kansas City getting plus money at home with a healthier O-line — sharp tickets on the chalk.',
    startsPrefix: 'Starts',
    startsValue: 'Tomorrow, 14:00',
    likes: 96,
    comments: 18,
  },
  {
    id: 'demo-member-pick-3',
    createdAtMs: Date.now() - 5 * hour,
    creator: {
      id: 'demo-creator-clay',
      username: 'claycourt',
      displayName: 'Clay Court Edge',
      avatarUrl: null,
      verified: true,
    },
    sport: 'Tennis',
    event: 'Alcaraz vs Sinner',
    pick: 'Alcaraz -1.5 sets',
    oddsDecimal: '1.85',
    analysis:
      'Clay form favors Alcaraz in longer exchanges; market still prices this closer than recent H2H.',
    startsPrefix: 'Starts in',
    startsValue: '5h 10m',
    likes: 64,
    comments: 11,
  },
  {
    id: 'demo-member-pick-4',
    createdAtMs: Date.now() - 8 * hour,
    creator: {
      id: 'demo-creator-liga',
      username: 'ligalocks',
      displayName: 'Liga Locks',
      avatarUrl: null,
      verified: true,
    },
    sport: 'Soccer',
    event: 'Real Madrid vs Sevilla',
    pick: 'Real Madrid ML',
    oddsDecimal: '1.55',
    analysis:
      'Madrid at home as favorites with Sevilla missing key midfielders — low-variance play for the card.',
    startsPrefix: 'Starts',
    startsValue: 'Tonight, 21:00',
    likes: 210,
    comments: 41,
  },
  {
    id: 'demo-member-pick-5',
    createdAtMs: Date.now() - 12 * hour,
    creator: {
      id: 'demo-creator-octagon',
      username: 'octagonedge',
      displayName: 'Octagon Edge',
      avatarUrl: null,
      verified: true,
    },
    sport: 'UFC',
    event: 'Jones vs Aspinall',
    pick: 'Jones by Decision',
    oddsDecimal: '2.40',
    analysis:
      'Expect a control-heavy game plan; live betting may open better if early volume turns chaotic.',
    startsPrefix: 'Starts',
    startsValue: 'Sat, 02:00',
    likes: 77,
    comments: 29,
  },
];

export const MEMBER_HOME_SPORT_FILTERS = [
  'All',
  'Soccer',
  'NBA',
  'NFL',
  'Tennis',
  'UFC',
] as const;

export type MemberHomeSportFilter = (typeof MEMBER_HOME_SPORT_FILTERS)[number] | string;

export function shouldUseMemberHomeDemo(opts: {
  feedCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.feedCount === 0;
}

export function isMemberHomeDemoId(id: string): boolean {
  return id.startsWith('demo-member-pick-');
}
