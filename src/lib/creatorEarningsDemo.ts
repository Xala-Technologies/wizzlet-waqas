/**
 * Sample Earnings overview data aligned to the Prizelet Earnings mockup.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export const CREATOR_EARNINGS_DEMO_METRICS = {
  totalRevenueCents: 1_248_000,
  totalRevenueDelta: 41,
  netEarningsCents: 986_000,
  netEarningsDelta: 38,
  totalPaidOutCents: 825_000,
  totalPaidOutDelta: 32,
  pendingPayoutCents: 161_000,
  pendingPayoutDelta: 12,
  dateRangeLabel: 'Jan 1, 2025 – Jan 31, 2025',
  upcomingPayoutCents: 161_000,
  upcomingPayoutDateLabel: 'Feb 7, 2025',
} as const;

/** Daily series for Revenue & Payouts chart (dollars). */
export const CREATOR_EARNINGS_DEMO_SERIES: Array<{
  label: string;
  revenue: number;
  net: number;
  payouts: number;
}> = [
  { label: 'Jan 1', revenue: 280, net: 220, payouts: 0 },
  { label: 'Jan 4', revenue: 320, net: 250, payouts: 180 },
  { label: 'Jan 7', revenue: 360, net: 285, payouts: 0 },
  { label: 'Jan 10', revenue: 410, net: 320, payouts: 220 },
  { label: 'Jan 13', revenue: 380, net: 300, payouts: 0 },
  { label: 'Jan 16', revenue: 450, net: 355, payouts: 260 },
  { label: 'Jan 19', revenue: 520, net: 410, payouts: 0 },
  { label: 'Jan 22', revenue: 480, net: 380, payouts: 300 },
  { label: 'Jan 25', revenue: 560, net: 440, payouts: 0 },
  { label: 'Jan 28', revenue: 610, net: 480, payouts: 340 },
  { label: 'Jan 31', revenue: 580, net: 460, payouts: 0 },
];

export const CREATOR_EARNINGS_DEMO_BY_TYPE = [
  { name: 'Subscriptions', value: 52, color: 'hsl(239 84% 55%)' },
  { name: 'One-time purchases', value: 28, color: 'hsl(217 91% 60%)' },
  { name: 'Tips', value: 12, color: 'hsl(160 84% 39%)' },
  { name: 'Other', value: 8, color: 'hsl(215 16% 55%)' },
];

export type DemoEarningTxn = {
  id: string;
  dateMs: number;
  type: 'Subscription' | 'One-time purchase' | 'Tip';
  source: string;
  amountCents: number;
  feeCents: number;
  netCents: number;
  status: 'completed' | 'pending';
};

export const CREATOR_EARNINGS_DEMO_TRANSACTIONS: DemoEarningTxn[] = [
  {
    id: 'demo-txn-1',
    dateMs: daysAgo(1),
    type: 'Subscription',
    source: 'Monthly Plan',
    amountCents: 2_999,
    feeCents: 450,
    netCents: 2_549,
    status: 'completed',
  },
  {
    id: 'demo-txn-2',
    dateMs: daysAgo(2),
    type: 'One-time purchase',
    source: 'NBA Betting Guide',
    amountCents: 4_900,
    feeCents: 735,
    netCents: 4_165,
    status: 'completed',
  },
  {
    id: 'demo-txn-3',
    dateMs: daysAgo(3),
    type: 'Subscription',
    source: 'VIP Access',
    amountCents: 9_999,
    feeCents: 1_500,
    netCents: 8_499,
    status: 'completed',
  },
  {
    id: 'demo-txn-4',
    dateMs: daysAgo(4),
    type: 'Tip',
    source: '@jordanb',
    amountCents: 2_000,
    feeCents: 200,
    netCents: 1_800,
    status: 'completed',
  },
  {
    id: 'demo-txn-5',
    dateMs: daysAgo(5),
    type: 'Subscription',
    source: 'Premium Picks',
    amountCents: 2_999,
    feeCents: 450,
    netCents: 2_549,
    status: 'completed',
  },
  {
    id: 'demo-txn-6',
    dateMs: daysAgo(6),
    type: 'One-time purchase',
    source: 'Parlay Pack',
    amountCents: 1_999,
    feeCents: 300,
    netCents: 1_699,
    status: 'completed',
  },
];

export const CREATOR_EARNINGS_TIPS = [
  'Post premium content regularly to keep renewals high.',
  'Offer limited-time promotions to convert free fans.',
  'Create bundled products for higher average order value.',
  'Ask engaged subscribers for tips after big wins.',
  'Share your profile link after every social post.',
] as const;

/** Backward-compatible aliases used by older imports */
export const CREATOR_EARNINGS_DEMO_MONTHLY = CREATOR_EARNINGS_DEMO_SERIES.map((d) => ({
  month: d.label,
  subscriptions: d.revenue,
  oneTime: d.payouts,
}));

export const CREATOR_EARNINGS_DEMO_BY_PLAN = CREATOR_EARNINGS_DEMO_BY_TYPE;

export const CREATOR_EARNINGS_DEMO_PAYOUTS = [
  {
    id: 'demo-po-1',
    dateMs: daysAgo(4),
    amountCents: 340_000,
    method: 'Stripe',
    status: 'completed' as const,
  },
  {
    id: 'demo-po-2',
    dateMs: daysAgo(11),
    amountCents: 300_000,
    method: 'Stripe',
    status: 'completed' as const,
  },
  {
    id: 'demo-po-3',
    dateMs: daysAgo(18),
    amountCents: 185_000,
    method: 'Stripe',
    status: 'completed' as const,
  },
];

export function shouldUseCreatorEarningsDemo(input: {
  netCents: number;
  paymentCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.netCents <= 0 && input.paymentCount === 0;
}
