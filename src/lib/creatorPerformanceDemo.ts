/**
 * Sample Performance (growth analytics) data aligned to the Prizelet mockup.
 */

export type ChartRange = '7D' | '30D' | '90D' | '1Y' | 'All';

export type DemoInsight = {
  id: string;
  tone: 'emerald' | 'violet' | 'sky' | 'amber' | 'rose';
  text: string;
};

export type DemoGrowthCard = {
  id: string;
  label: string;
  value: string;
  trendPct: number;
  /** When true, a negative trend is good (e.g. churn down). */
  invertTrend?: boolean;
  series: number[];
  stroke: string;
  fill: string;
};

export type DemoTopProduct = {
  id: string;
  rank: number;
  name: string;
  subscribers: number;
  revenueCents: number;
  conversionPct: number;
  iconTone: string;
};

export const CREATOR_PERFORMANCE_DEMO_METRICS = {
  totalRevenueCents: 5_268_000,
  totalRevenueDelta: 34,
  mrrCents: 432_000,
  mrrDelta: 27,
  totalSubscribers: 1_248,
  subscribersDelta: 18,
  postViews: 48_320,
  postViewsDelta: 41,
  dateRangeLabel: 'Jan 1, 2025 – Jan 31, 2025',
} as const;

/** Daily revenue points for the 30D overview chart (mockup Jan 2025). */
export const CREATOR_PERFORMANCE_DEMO_REVENUE_SERIES: Array<{
  label: string;
  fullLabel: string;
  revenue: number;
}> = [
  { label: 'Jan 1', fullLabel: 'Jan 1, 2025', revenue: 1_820 },
  { label: 'Jan 4', fullLabel: 'Jan 4, 2025', revenue: 2_140 },
  { label: 'Jan 7', fullLabel: 'Jan 7, 2025', revenue: 2_680 },
  { label: 'Jan 10', fullLabel: 'Jan 10, 2025', revenue: 3_120 },
  { label: 'Jan 13', fullLabel: 'Jan 13, 2025', revenue: 3_540 },
  { label: 'Jan 16', fullLabel: 'Jan 16, 2025', revenue: 4_180 },
  { label: 'Jan 19', fullLabel: 'Jan 19, 2025', revenue: 4_860 },
  { label: 'Jan 22', fullLabel: 'Jan 22, 2025', revenue: 5_420 },
  { label: 'Jan 24', fullLabel: 'Jan 24, 2025', revenue: 6_420 },
  { label: 'Jan 27', fullLabel: 'Jan 27, 2025', revenue: 5_780 },
  { label: 'Jan 29', fullLabel: 'Jan 29, 2025', revenue: 5_210 },
  { label: 'Jan 31', fullLabel: 'Jan 31, 2025', revenue: 4_960 },
];

export const CREATOR_PERFORMANCE_DEMO_INSIGHTS: DemoInsight[] = [
  {
    id: 'i1',
    tone: 'emerald',
    text: 'Your revenue increased by 34%. You made $13,420 more than last month.',
  },
  {
    id: 'i2',
    tone: 'violet',
    text: 'Subscriber growth is up 18%. You gained 189 new subscribers.',
  },
  {
    id: 'i3',
    tone: 'sky',
    text: 'Your posts got 41% more views. Total views increased from 34,280 to 48,320.',
  },
  {
    id: 'i4',
    tone: 'amber',
    text: 'Best performing product: Premium Picks generated $25,230 (48% of revenue).',
  },
  {
    id: 'i5',
    tone: 'emerald',
    text: 'Your conversion rate is 6.2%. Up from 4.3% last month.',
  },
];

export const CREATOR_PERFORMANCE_DEMO_GROWTH: DemoGrowthCard[] = [
  {
    id: 'subs',
    label: 'Subscribers Growth',
    value: '1,248',
    trendPct: 18,
    series: [820, 860, 910, 980, 1_040, 1_100, 1_160, 1_210, 1_248],
    stroke: 'hsl(239 84% 60%)',
    fill: 'hsl(239 84% 60% / 0.18)',
  },
  {
    id: 'conv',
    label: 'Conversion Rate',
    value: '6.2%',
    trendPct: 29,
    series: [0.8, 1.4, 2.2, 3.1, 3.8, 4.4, 5.1, 5.7, 6.2],
    stroke: 'hsl(160 84% 39%)',
    fill: 'hsl(160 84% 39% / 0.18)',
  },
  {
    id: 'churn',
    label: 'Churn Rate',
    value: '2.1%',
    trendPct: -12,
    invertTrend: true,
    series: [6.0, 5.4, 4.8, 4.2, 3.6, 3.1, 2.7, 2.4, 2.1],
    stroke: 'hsl(0 84% 60%)',
    fill: 'hsl(0 84% 60% / 0.16)',
  },
];

export const CREATOR_PERFORMANCE_DEMO_TOP_PRODUCTS: DemoTopProduct[] = [
  {
    id: 'demo-prod-1',
    rank: 1,
    name: 'Premium Picks',
    subscribers: 842,
    revenueCents: 2_523_000,
    conversionPct: 8.4,
    iconTone: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  },
  {
    id: 'demo-prod-2',
    rank: 2,
    name: 'VIP Access',
    subscribers: 408,
    revenueCents: 2_029_000,
    conversionPct: 6.7,
    iconTone: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  },
  {
    id: 'demo-prod-3',
    rank: 3,
    name: 'Betting Strategy Guide',
    subscribers: 120,
    revenueCents: 948_000,
    conversionPct: 4.2,
    iconTone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  },
  {
    id: 'demo-prod-4',
    rank: 4,
    name: 'Discord Access',
    subscribers: 330,
    revenueCents: 659_000,
    conversionPct: 5.1,
    iconTone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  {
    id: 'demo-prod-5',
    rank: 5,
    name: '1-on-1 Coaching',
    subscribers: 44,
    revenueCents: 875_600,
    conversionPct: 3.8,
    iconTone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
];

export function shouldUseCreatorPerformanceDemo(input: {
  hasMeaningfulActivity: boolean;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return !input.hasMeaningfulActivity;
}

export function isCreatorPerformanceDemoId(id: string): boolean {
  return id.startsWith('demo-');
}

export function formatCompactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}
