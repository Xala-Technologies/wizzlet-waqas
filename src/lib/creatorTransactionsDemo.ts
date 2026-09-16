/**
 * Sample Transactions data aligned to the Prizelet Transactions mockup.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export type TxnType =
  | 'Subscription'
  | 'One-time purchase'
  | 'Tip'
  | 'Refund'
  | 'Chargeback';

export type TxnStatus = 'succeeded' | 'refunded' | 'chargeback' | 'failed';

export type PaymentMethodKind = 'visa' | 'mastercard' | 'apple_pay' | 'google_pay';

export type DemoTransaction = {
  id: string;
  dateMs: number;
  type: TxnType;
  subscriberName: string;
  subscriberHandle: string;
  avatarTone: string;
  product: string;
  amountCents: number;
  status: TxnStatus;
  paymentMethod: PaymentMethodKind;
  paymentLast4: string;
};

export const CREATOR_TXN_DEMO_METRICS = {
  totalTransactions: 642,
  totalTransactionsDelta: 28,
  totalRevenueCents: 1_248_000,
  totalRevenueDelta: 41,
  totalRefundsCents: 32_000,
  totalRefundsDelta: 12,
  successfulPayments: 598,
  successfulPaymentsDelta: 35,
  dateRangeLabel: 'Jan 1, 2025 – Jan 31, 2025',
  summary: {
    successful: { count: 598, pct: 93.1 },
    refunds: { count: 28, pct: 4.4 },
    chargebacks: { count: 4, pct: 0.6 },
    failed: { count: 12, pct: 1.9 },
  },
} as const;

export const CREATOR_TXN_PRODUCTS = [
  'Premium Picks',
  'NBA Betting Guide',
  'VIP Access',
  'Betting Models',
  'Parlay Pack',
  'Monthly Plan',
] as const;

export const CREATOR_TXN_TIPS = [
  'Use a supported payment method.',
  'Keep product descriptions clear and accurate.',
  'Respond quickly to customer issues.',
  'Verify billing descriptors match your brand.',
  'Review failed payments and retry prompts.',
] as const;

const SUBSCRIBERS: Array<{ name: string; handle: string; tone: string }> = [
  { name: 'Daniel Garcia', handle: '@danielg', tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400' },
  { name: 'Maya Chen', handle: '@mayac', tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-400' },
  { name: 'Jordan Blake', handle: '@jordanb', tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  { name: 'Sam Ortiz', handle: '@samortiz', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  { name: 'Priya Nair', handle: '@priyan', tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-400' },
  { name: 'Chris Webb', handle: '@chrisw', tone: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400' },
  { name: 'Elena Rossi', handle: '@elenar', tone: 'bg-teal-500/15 text-teal-700 dark:text-teal-400' },
  { name: 'Marcus Lee', handle: '@marcusl', tone: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400' },
  { name: 'Ava Thompson', handle: '@avath', tone: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
  { name: 'Noah Patel', handle: '@noahp', tone: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400' },
];

const SEED: Array<{
  type: TxnType;
  product: string;
  amountCents: number;
  status: TxnStatus;
  paymentMethod: PaymentMethodKind;
  paymentLast4: string;
  dayOffset: number;
  subscriberIndex: number;
}> = [
  {
    type: 'Subscription',
    product: 'Premium Picks',
    amountCents: 2_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '4582',
    dayOffset: 1,
    subscriberIndex: 0,
  },
  {
    type: 'One-time purchase',
    product: 'NBA Betting Guide',
    amountCents: 4_999,
    status: 'succeeded',
    paymentMethod: 'mastercard',
    paymentLast4: '8821',
    dayOffset: 1,
    subscriberIndex: 1,
  },
  {
    type: 'Tip',
    product: 'VIP Access',
    amountCents: 2_000,
    status: 'succeeded',
    paymentMethod: 'apple_pay',
    paymentLast4: '0192',
    dayOffset: 2,
    subscriberIndex: 2,
  },
  {
    type: 'Refund',
    product: 'Betting Models',
    amountCents: -4_999,
    status: 'refunded',
    paymentMethod: 'visa',
    paymentLast4: '3310',
    dayOffset: 2,
    subscriberIndex: 3,
  },
  {
    type: 'Subscription',
    product: 'Monthly Plan',
    amountCents: 9_999,
    status: 'succeeded',
    paymentMethod: 'google_pay',
    paymentLast4: '7744',
    dayOffset: 3,
    subscriberIndex: 4,
  },
  {
    type: 'Chargeback',
    product: 'Parlay Pack',
    amountCents: -1_999,
    status: 'chargeback',
    paymentMethod: 'mastercard',
    paymentLast4: '1209',
    dayOffset: 3,
    subscriberIndex: 5,
  },
  {
    type: 'One-time purchase',
    product: 'NBA Betting Guide',
    amountCents: 4_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '6671',
    dayOffset: 4,
    subscriberIndex: 6,
  },
  {
    type: 'Subscription',
    product: 'VIP Access',
    amountCents: 4_999,
    status: 'succeeded',
    paymentMethod: 'apple_pay',
    paymentLast4: '4412',
    dayOffset: 4,
    subscriberIndex: 7,
  },
  {
    type: 'Tip',
    product: 'Premium Picks',
    amountCents: 1_500,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '9088',
    dayOffset: 5,
    subscriberIndex: 8,
  },
  {
    type: 'Subscription',
    product: 'Premium Picks',
    amountCents: 2_999,
    status: 'failed',
    paymentMethod: 'mastercard',
    paymentLast4: '2155',
    dayOffset: 5,
    subscriberIndex: 9,
  },
  {
    type: 'One-time purchase',
    product: 'Betting Models',
    amountCents: 7_999,
    status: 'succeeded',
    paymentMethod: 'google_pay',
    paymentLast4: '3340',
    dayOffset: 6,
    subscriberIndex: 0,
  },
  {
    type: 'Refund',
    product: 'VIP Access',
    amountCents: -2_999,
    status: 'refunded',
    paymentMethod: 'visa',
    paymentLast4: '4582',
    dayOffset: 7,
    subscriberIndex: 1,
  },
  {
    type: 'Subscription',
    product: 'Monthly Plan',
    amountCents: 9_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '7721',
    dayOffset: 8,
    subscriberIndex: 2,
  },
  {
    type: 'One-time purchase',
    product: 'Parlay Pack',
    amountCents: 1_999,
    status: 'succeeded',
    paymentMethod: 'apple_pay',
    paymentLast4: '1102',
    dayOffset: 9,
    subscriberIndex: 3,
  },
  {
    type: 'Tip',
    product: 'Premium Picks',
    amountCents: 2_500,
    status: 'succeeded',
    paymentMethod: 'mastercard',
    paymentLast4: '8890',
    dayOffset: 10,
    subscriberIndex: 4,
  },
  {
    type: 'Subscription',
    product: 'VIP Access',
    amountCents: 4_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '4410',
    dayOffset: 11,
    subscriberIndex: 5,
  },
  {
    type: 'Chargeback',
    product: 'NBA Betting Guide',
    amountCents: -4_999,
    status: 'chargeback',
    paymentMethod: 'visa',
    paymentLast4: '2291',
    dayOffset: 12,
    subscriberIndex: 6,
  },
  {
    type: 'One-time purchase',
    product: 'Betting Models',
    amountCents: 7_999,
    status: 'succeeded',
    paymentMethod: 'google_pay',
    paymentLast4: '5501',
    dayOffset: 13,
    subscriberIndex: 7,
  },
  {
    type: 'Subscription',
    product: 'Premium Picks',
    amountCents: 2_999,
    status: 'succeeded',
    paymentMethod: 'mastercard',
    paymentLast4: '3188',
    dayOffset: 14,
    subscriberIndex: 8,
  },
  {
    type: 'Tip',
    product: 'Monthly Plan',
    amountCents: 1_000,
    status: 'succeeded',
    paymentMethod: 'apple_pay',
    paymentLast4: '0044',
    dayOffset: 15,
    subscriberIndex: 9,
  },
  {
    type: 'Subscription',
    product: 'VIP Access',
    amountCents: 4_999,
    status: 'failed',
    paymentMethod: 'visa',
    paymentLast4: '9912',
    dayOffset: 16,
    subscriberIndex: 0,
  },
  {
    type: 'One-time purchase',
    product: 'Parlay Pack',
    amountCents: 1_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '6670',
    dayOffset: 17,
    subscriberIndex: 1,
  },
  {
    type: 'Refund',
    product: 'Premium Picks',
    amountCents: -2_999,
    status: 'refunded',
    paymentMethod: 'mastercard',
    paymentLast4: '4401',
    dayOffset: 18,
    subscriberIndex: 2,
  },
  {
    type: 'Subscription',
    product: 'Monthly Plan',
    amountCents: 9_999,
    status: 'succeeded',
    paymentMethod: 'google_pay',
    paymentLast4: '8822',
    dayOffset: 19,
    subscriberIndex: 3,
  },
  {
    type: 'One-time purchase',
    product: 'NBA Betting Guide',
    amountCents: 4_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '1357',
    dayOffset: 20,
    subscriberIndex: 4,
  },
  {
    type: 'Tip',
    product: 'VIP Access',
    amountCents: 3_000,
    status: 'succeeded',
    paymentMethod: 'apple_pay',
    paymentLast4: '2468',
    dayOffset: 21,
    subscriberIndex: 5,
  },
  {
    type: 'Subscription',
    product: 'Premium Picks',
    amountCents: 2_999,
    status: 'succeeded',
    paymentMethod: 'mastercard',
    paymentLast4: '3579',
    dayOffset: 22,
    subscriberIndex: 6,
  },
  {
    type: 'One-time purchase',
    product: 'Betting Models',
    amountCents: 7_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '4680',
    dayOffset: 23,
    subscriberIndex: 7,
  },
  {
    type: 'Subscription',
    product: 'VIP Access',
    amountCents: 4_999,
    status: 'succeeded',
    paymentMethod: 'visa',
    paymentLast4: '5791',
    dayOffset: 24,
    subscriberIndex: 8,
  },
  {
    type: 'Tip',
    product: 'Parlay Pack',
    amountCents: 500,
    status: 'succeeded',
    paymentMethod: 'google_pay',
    paymentLast4: '6802',
    dayOffset: 25,
    subscriberIndex: 9,
  },
];

export const CREATOR_TXN_DEMO_ROWS: DemoTransaction[] = SEED.map((row, i) => {
  const sub = SUBSCRIBERS[row.subscriberIndex]!;
  return {
    id: `demo-txn-${i + 1}`,
    dateMs: daysAgo(row.dayOffset),
    type: row.type,
    subscriberName: sub.name,
    subscriberHandle: sub.handle,
    avatarTone: sub.tone,
    product: row.product,
    amountCents: row.amountCents,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paymentLast4: row.paymentLast4,
  };
});

export function shouldUseCreatorTransactionsDemo(opts: {
  paymentCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.paymentCount === 0;
}

export function paymentMethodLabel(kind: PaymentMethodKind, last4: string): string {
  switch (kind) {
    case 'visa':
      return `Visa **** ${last4}`;
    case 'mastercard':
      return `Mastercard **** ${last4}`;
    case 'apple_pay':
      return 'Apple Pay';
    case 'google_pay':
      return 'Google Pay';
  }
}
