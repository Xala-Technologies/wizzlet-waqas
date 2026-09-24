/**
 * Sample Products list data for design / PO review when the creator has no products.
 * Aligned to the Prizelet Products mockup.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export type ProductBillingType = 'subscription' | 'one-time' | 'bundle';

export type ProductUiStatus = 'active' | 'draft' | 'archived';

export type DemoPlanCard = {
  id: string;
  name: string;
  priceLabel: string;
  priceCents: number;
  billingPeriod: string;
  popular: boolean;
  features: string[];
};

export type DemoProductRow = {
  id: string;
  name: string;
  description: string;
  type: ProductBillingType;
  billingPeriod: string;
  priceCents: number;
  subscribers: number;
  /** Purchases label for one-time; otherwise subscriber count. */
  subscribersLabel?: string;
  revenueMrrCents: number;
  status: ProductUiStatus;
  createdAtMs: number;
  icon: 'crown' | 'star' | 'gem' | 'book' | 'video' | 'users' | 'package';
};

/** KPI strip aligned to the Products mockup. */
export const CREATOR_PRODUCTS_DEMO_METRICS = {
  totalProducts: 6,
  totalProductsDelta: 20,
  totalSubscribers: 1248,
  totalSubscribersDelta: 18,
  mrrCents: 432_000,
  mrrDelta: 27,
  totalRevenueCents: 5_268_000,
  totalRevenueDelta: 34,
} as const;

/** Kept for create-form / plan card callers that still import plans. */
export const CREATOR_PRODUCTS_DEMO_PLANS: DemoPlanCard[] = [
  {
    id: 'demo-plan-monthly',
    name: 'Monthly',
    priceLabel: '$9.99/mo',
    priceCents: 999,
    billingPeriod: 'monthly',
    popular: false,
    features: [
      'Access to all picks',
      'Daily write-ups',
      'Cancel anytime',
      'Mobile notifications',
      'Community chat',
    ],
  },
  {
    id: 'demo-plan-premium',
    name: 'Premium',
    priceLabel: '$29.99/mo',
    priceCents: 2999,
    billingPeriod: 'monthly',
    popular: true,
    features: [
      'Everything in Monthly',
      'Exclusive picks',
      'Early releases',
      'Priority support',
      'Weekly strategy calls',
    ],
  },
  {
    id: 'demo-plan-vip',
    name: 'VIP',
    priceLabel: '$49.99/mo',
    priceCents: 4999,
    billingPeriod: 'monthly',
    popular: false,
    features: [
      'Everything in Premium',
      '1-on-1 chat (limited)',
      'VIP community',
      'Custom unit sizes',
      'Private Discord role',
    ],
  },
];

export const CREATOR_PRODUCTS_DEMO_ROWS: DemoProductRow[] = [
  {
    id: 'demo-prod-1',
    name: 'Premium Picks',
    description: 'Daily premium picks with unit sizing and write-ups',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 2999,
    subscribers: 842,
    revenueMrrCents: 2_523_000,
    status: 'active',
    createdAtMs: daysAgo(200),
    icon: 'star',
  },
  {
    id: 'demo-prod-2',
    name: 'VIP Access',
    description: 'VIP chat, early locks, and private community',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 4999,
    subscribers: 286,
    revenueMrrCents: 1_429_000,
    status: 'active',
    createdAtMs: daysAgo(180),
    icon: 'gem',
  },
  {
    id: 'demo-prod-3',
    name: 'Daily Insights',
    description: 'Short-form daily insight posts for casual fans',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 999,
    subscribers: 120,
    revenueMrrCents: 119_880,
    status: 'active',
    createdAtMs: daysAgo(150),
    icon: 'crown',
  },
  {
    id: 'demo-prod-4',
    name: 'Private Community',
    description: 'Ongoing community membership',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 1499,
    subscribers: 221,
    revenueMrrCents: 331_279,
    status: 'active',
    createdAtMs: daysAgo(120),
    icon: 'users',
  },
  {
    id: 'demo-prod-5',
    name: 'Betting Guide (eBook)',
    description: 'One-time digital guide for beginners',
    type: 'one-time',
    billingPeriod: 'one-time',
    priceCents: 7900,
    subscribers: 120,
    subscribersLabel: '120 purchases',
    revenueMrrCents: 0,
    status: 'active',
    createdAtMs: daysAgo(90),
    icon: 'book',
  },
  {
    id: 'demo-prod-6',
    name: 'Video Course',
    description: 'Recorded handicapper course (self-paced)',
    type: 'one-time',
    billingPeriod: 'one-time',
    priceCents: 14900,
    subscribers: 56,
    subscribersLabel: '56 purchases',
    revenueMrrCents: 0,
    status: 'draft',
    createdAtMs: daysAgo(60),
    icon: 'video',
  },
  {
    id: 'demo-prod-7',
    name: 'Legacy Weekly Card',
    description: 'Archived weekly card product',
    type: 'subscription',
    billingPeriod: 'weekly',
    priceCents: 1999,
    subscribers: 0,
    revenueMrrCents: 0,
    status: 'archived',
    createdAtMs: daysAgo(300),
    icon: 'package',
  },
];

export function shouldUseCreatorProductsDemo(input: {
  count: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.count === 0;
}

export function isCreatorProductsDemoId(id: string): boolean {
  return id.startsWith('demo-prod-') || id.startsWith('demo-plan-');
}

export function formatProductPrice(priceCents: number, billingPeriod: string): string {
  const dollars = (priceCents / 100).toFixed(2);
  if (billingPeriod === 'one-time') return `$${dollars}`;
  if (billingPeriod === 'yearly') return `$${dollars} / year`;
  if (billingPeriod === 'weekly') return `$${dollars} / week`;
  if (billingPeriod === 'daily') return `$${dollars} / day`;
  return `$${dollars} / month`;
}

export function formatMoneyCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
