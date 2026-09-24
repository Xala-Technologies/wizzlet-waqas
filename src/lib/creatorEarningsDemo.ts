/**
 * Sample Earnings overview data aligned to the Prizelet Earnings mockup.
 */

const MOCK_NOW = Date.parse('2025-01-31T12:00:00.000Z');
const day = 86_400_000;
const daysAgo = (n: number) => MOCK_NOW - n * day;

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
  { name: 'Other', value: 8, color: 'hsl(270 50% 70%)' },
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
    dateMs: Date.parse('2025-01-30T18:00:00.000Z'),
    type: 'Subscription',
    source: 'Monthly Plan',
    amountCents: 2_999,
    feeCents: 240,
    netCents: 2_759,
    status: 'completed',
  },
  {
    id: 'demo-txn-2',
    dateMs: Date.parse('2025-01-29T16:00:00.000Z'),
    type: 'One-time purchase',
    source: 'NBA Betting Guide',
    amountCents: 4_999,
    feeCents: 400,
    netCents: 4_599,
    status: 'completed',
  },
  {
    id: 'demo-txn-3',
    dateMs: Date.parse('2025-01-28T14:00:00.000Z'),
    type: 'Subscription',
    source: 'VIP Access',
    amountCents: 9_999,
    feeCents: 800,
    netCents: 9_199,
    status: 'completed',
  },
  {
    id: 'demo-txn-4',
    dateMs: Date.parse('2025-01-27T12:00:00.000Z'),
    type: 'Tip',
    source: 'From @jordanb',
    amountCents: 2_000,
    feeCents: 160,
    netCents: 1_840,
    status: 'completed',
  },
  {
    id: 'demo-txn-5',
    dateMs: Date.parse('2025-01-26T11:00:00.000Z'),
    type: 'Subscription',
    source: 'Premium Picks',
    amountCents: 2_999,
    feeCents: 240,
    netCents: 2_759,
    status: 'completed',
  },
  {
    id: 'demo-txn-6',
    dateMs: Date.parse('2025-01-25T10:00:00.000Z'),
    type: 'One-time purchase',
    source: 'Parlay Pack',
    amountCents: 1_999,
    feeCents: 160,
    netCents: 1_839,
    status: 'completed',
  },
];

export const CREATOR_EARNINGS_TIPS = [
  'Post premium content regularly',
  'Engage with your top subscribers',
  'Offer limited-time promotions',
  'Create bundled products',
  'Share your profile link after every post',
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
