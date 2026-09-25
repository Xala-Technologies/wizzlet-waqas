/**
 * Sample Posts list data for design / PO review when the creator has no real posts.
 * Aligned to the Prizelet Posts mockup (status tabs, KPIs, table rows).
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
  type?: 'Text' | 'Video';
}): string {
  return [
    `Sport: ${fields.sport}`,
    `Event: ${fields.event}`,
    `Pick: ${fields.pick}`,
    `Odds: ${fields.usOdds} (US) ${fields.euOdds} (EU)`,
    `Units: ${fields.units}u`,
    `Type: ${fields.type ?? 'Text'}`,
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
  /** published | scheduled | draft | archived */
  tracking_mode: string;
};

/** KPI + tab counts aligned to the Posts mockup. */
export const CREATOR_PICKS_DEMO_METRICS = {
  totalPosts: 32,
  published: 24,
  publishedDelta: 33,
  scheduled: 4,
  scheduledDelta: 100,
  drafts: 3,
  draftsDelta: 0,
  archived: 1,
  subscribers: 892,
  subscribersDelta: 18,
  // legacy fields kept so older references don't break mid-refactor
  totalPicks: 32,
  totalPicksDelta: 33,
  winRate: 67.2,
  winRateDelta: 5.4,
  profit: 86.4,
  profitDelta: 42,
} as const;

/** Representative table rows matching the Posts mockup. */
export const CREATOR_PICKS_DEMO_ROWS: CreatorPicksDemoRow[] = [
  {
    id: 'demo-pick-1',
    title: 'NBA Picks Tonight 🔥',
    content: content({
      sport: 'NBA',
      event: 'NBA slate',
      pick: 'Top 3 picks',
      usOdds: '-110',
      euOdds: '1.91',
      units: 2,
      notes: [
        "Here are my top 3 picks for tonight's games. Let's make it a green night! 💚",
        '',
        '1. Lakers ML (-120) - 1 unit',
        '2. Celtics -5.5 (-110) - 1 unit',
        '3. Nuggets vs Suns Over 224.5 (-115) - 1 unit',
        '',
        "Good luck everyone! Let's cash! 🚀",
      ].join('\n'),
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: Date.now() - 2 * 3600_000,
    result: 'pending',
    tracking_mode: 'published',
  },
  {
    id: 'demo-pick-2',
    title: 'NFL Sunday Card',
    content: content({
      sport: 'NFL',
      event: 'Sunday slate',
      pick: 'Full card',
      usOdds: '-110',
      euOdds: '1.91',
      units: 3,
      notes: 'Full Sunday card with early notes and locks.',
      type: 'Video',
    }),
    is_premium: true,
    createdAtMs: daysAgo(1),
    result: 'won',
    tracking_mode: 'published',
  },
  {
    id: 'demo-pick-3',
    title: 'Tennis Picks',
    content: content({
      sport: 'Tennis',
      event: 'ATP / WTA',
      pick: 'Top matches',
      usOdds: '-120',
      euOdds: '1.83',
      units: 1,
      notes: 'My top picks for this week’s tennis slate.',
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: daysAgo(6),
    result: 'pending',
    tracking_mode: 'scheduled',
  },
  {
    id: 'demo-pick-4',
    title: 'Soccer Midweek Specials',
    content: content({
      sport: 'Soccer',
      event: 'UCL midweek',
      pick: 'Specials',
      usOdds: '-105',
      euOdds: '1.95',
      units: 1.5,
      notes: 'Champions League midweek angles.',
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: daysAgo(2),
    result: 'pending',
    tracking_mode: 'published',
  },
  {
    id: 'demo-pick-5',
    title: 'Discord Community Update',
    content: content({
      sport: 'Other',
      event: 'Community',
      pick: 'Update',
      usOdds: '-110',
      euOdds: '1.91',
      units: 1,
      notes: 'New features landing in Discord this week.',
      type: 'Text',
    }),
    is_premium: false,
    createdAtMs: daysAgo(7),
    result: 'pending',
    tracking_mode: 'draft',
  },
  {
    id: 'demo-pick-6',
    title: 'January Recap',
    content: content({
      sport: 'Other',
      event: 'Monthly recap',
      pick: 'Recap',
      usOdds: '-110',
      euOdds: '1.91',
      units: 1,
      notes: 'Breaking down January results and lessons.',
      type: 'Video',
    }),
    is_premium: false,
    createdAtMs: daysAgo(8),
    result: 'push',
    tracking_mode: 'archived',
  },
  {
    id: 'demo-pick-7',
    title: 'MLB Early Looks',
    content: content({
      sport: 'MLB',
      event: 'Opening week',
      pick: 'Early looks',
      usOdds: '+100',
      euOdds: '2.00',
      units: 1,
      notes: 'Early season baseball leaners.',
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: daysAgo(3),
    result: 'pending',
    tracking_mode: 'scheduled',
  },
  {
    id: 'demo-pick-8',
    title: 'NHL Moneyline Bundle',
    content: content({
      sport: 'NHL',
      event: 'Nightly slate',
      pick: 'Moneylines',
      usOdds: '-125',
      euOdds: '1.80',
      units: 1,
      notes: 'Three-team NHL moneyline package.',
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: daysAgo(4),
    result: 'won',
    tracking_mode: 'published',
  },
  {
    id: 'demo-pick-9',
    title: 'Premier League Weekend',
    content: content({
      sport: 'Soccer',
      event: 'EPL weekend',
      pick: 'Weekend card',
      usOdds: '-140',
      euOdds: '1.71',
      units: 2,
      notes: 'Weekend EPL card with units.',
      type: 'Video',
    }),
    is_premium: true,
    createdAtMs: daysAgo(5),
    result: 'lost',
    tracking_mode: 'published',
  },
  {
    id: 'demo-pick-10',
    title: 'VIP Lock of the Night',
    content: content({
      sport: 'NBA',
      event: 'Featured lock',
      pick: 'Lock',
      usOdds: '-110',
      euOdds: '1.91',
      units: 3,
      notes: 'Highest-conviction lock for VIP subscribers.',
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: daysAgo(1) - 5 * 3600_000,
    result: 'pending',
    tracking_mode: 'published',
  },
  {
    id: 'demo-pick-11',
    title: 'Draft — Prop Ideas',
    content: content({
      sport: 'NFL',
      event: 'Props board',
      pick: 'Props',
      usOdds: '-115',
      euOdds: '1.87',
      units: 1,
      notes: 'Rough notes for upcoming prop board.',
      type: 'Text',
    }),
    is_premium: true,
    createdAtMs: daysAgo(9),
    result: 'pending',
    tracking_mode: 'draft',
  },
  {
    id: 'demo-pick-12',
    title: 'College Hoops Roundup',
    content: content({
      sport: 'Basketball',
      event: 'NCAAB',
      pick: 'Roundup',
      usOdds: '-110',
      euOdds: '1.91',
      units: 1.5,
      notes: 'Conference matchup roundup.',
      type: 'Text',
    }),
    is_premium: false,
    createdAtMs: daysAgo(10),
    result: 'pending',
    tracking_mode: 'draft',
  },
  {
    id: 'demo-pick-13',
    title: 'UFC Fight Night Notes',
    content: content({
      sport: 'MMA',
      event: 'Fight Night',
      pick: 'Notes',
      usOdds: '+110',
      euOdds: '2.10',
      units: 1,
      notes: 'Scheduled write-up for fight night.',
      type: 'Video',
    }),
    is_premium: true,
    createdAtMs: daysAgo(11),
    result: 'pending',
    tracking_mode: 'scheduled',
  },
  {
    id: 'demo-pick-14',
    title: 'Subscriber AMA Recap',
    content: content({
      sport: 'Other',
      event: 'AMA',
      pick: 'Recap',
      usOdds: '-110',
      euOdds: '1.91',
      units: 1,
      notes: 'Published recap of the subscriber AMA.',
      type: 'Text',
    }),
    is_premium: false,
    createdAtMs: daysAgo(12),
    result: 'pending',
    tracking_mode: 'published',
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
