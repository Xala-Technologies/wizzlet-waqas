/**
 * Sample Your Earnings data for design review when the creator has no revenue yet.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export const CREATOR_EARNINGS_DEMO_METRICS = {
  totalRevenueCents: 1_248_000,
  totalRevenueDelta: 28,
  totalPayoutsCents: 832_000,
  totalPayoutsDelta: 12,
  pendingBalanceCents: 416_000,
  pendingDelta: 8,
  activeSubscribers: 892,
  activeSubscribersDelta: 18,
} as const;

export const CREATOR_EARNINGS_DEMO_MONTHLY = [
  { month: 'Aug', subscriptions: 1480, oneTime: 220 },
  { month: 'Sep', subscriptions: 1620, oneTime: 310 },
  { month: 'Oct', subscriptions: 1710, oneTime: 280 },
  { month: 'Nov', subscriptions: 1890, oneTime: 420 },
  { month: 'Dec', subscriptions: 2050, oneTime: 390 },
  { month: 'Jan', subscriptions: 1980, oneTime: 500 },
];

export const CREATOR_EARNINGS_DEMO_BY_PLAN = [
  { name: 'Monthly Plan', value: 42, color: 'hsl(239 84% 67%)' },
  { name: 'Premium Plan', value: 36, color: 'hsl(262 83% 68%)' },
  { name: 'VIP Plan', value: 16, color: 'hsl(199 89% 48%)' },
  { name: 'One-time', value: 6, color: 'hsl(160 84% 39%)' },
];

export const CREATOR_EARNINGS_DEMO_TRANSACTIONS = [
  {
    id: 'demo-txn-1',
    dateMs: daysAgo(1),
    customer: 'John Doe',
    type: 'Premium (Monthly)',
    amountCents: 2999,
    status: 'completed' as const,
  },
  {
    id: 'demo-txn-2',
    dateMs: daysAgo(2),
    customer: 'Sarah Chen',
    type: 'VIP (Monthly)',
    amountCents: 7900,
    status: 'completed' as const,
  },
  {
    id: 'demo-txn-3',
    dateMs: daysAgo(3),
    customer: 'Maya Ortiz',
    type: 'Premium (Monthly)',
    amountCents: 2999,
    status: 'completed' as const,
  },
  {
    id: 'demo-txn-4',
    dateMs: daysAgo(5),
    customer: 'Chris Bailey',
    type: 'Monthly',
    amountCents: 2900,
    status: 'completed' as const,
  },
  {
    id: 'demo-txn-5',
    dateMs: daysAgo(7),
    customer: 'Priya Nair',
    type: 'VIP (Monthly)',
    amountCents: 7900,
    status: 'completed' as const,
  },
];

export const CREATOR_EARNINGS_DEMO_PAYOUTS = [
  {
    id: 'demo-po-1',
    dateMs: daysAgo(4),
    amountCents: 120_000,
    method: 'Stripe',
    status: 'completed' as const,
  },
  {
    id: 'demo-po-2',
    dateMs: daysAgo(18),
    amountCents: 95_000,
    method: 'Stripe',
    status: 'completed' as const,
  },
  {
    id: 'demo-po-3',
    dateMs: daysAgo(35),
    amountCents: 88_000,
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
  return input.netCents === 0 && input.paymentCount === 0;
}
