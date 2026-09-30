/**
 * Sample Products list data for design / PO review when the creator has no products.
 * Aligned to the Sweeph / Prizelet Products mockup (Displayed Products + table).
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export const PROFILE_DISPLAY_SLOT_LIMIT = 4;

export type ProductBillingType = 'subscription' | 'one-time' | 'free' | 'bundle';

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
  icon: 'crown' | 'star' | 'gem' | 'book' | 'video' | 'users' | 'package' | 'chart';
  showOnProfile: boolean;
  isFeatured: boolean;
  features: string[];
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
    description: 'Daily premium picks with detailed analysis',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 2999,
    subscribers: 842,
    revenueMrrCents: 2_523_000,
    status: 'active',
    createdAtMs: daysAgo(200),
    icon: 'chart',
    showOnProfile: true,
    isFeatured: true,
    features: [
      'Daily premium picks',
      'Unit sizing guidance',
      'Detailed write-ups',
      'Early lock alerts',
    ],
  },
  {
    id: 'demo-prod-2',
    name: 'VIP Access',
    description: 'Exclusive VIP community and personal support',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 4999,
    subscribers: 286,
    revenueMrrCents: 1_429_000,
    status: 'active',
    createdAtMs: daysAgo(180),
    icon: 'gem',
    showOnProfile: true,
    isFeatured: false,
    features: [
      'Everything in Premium',
      'VIP Discord access',
      '1-on-1 chat support',
      'Custom unit sizes',
    ],
  },
  {
    id: 'demo-prod-3',
    name: 'Free Community',
    description: 'Free picks and community access',
    type: 'free',
    billingPeriod: 'monthly',
    priceCents: 0,
    subscribers: 1248,
    revenueMrrCents: 0,
    status: 'active',
    createdAtMs: daysAgo(220),
    icon: 'users',
    showOnProfile: true,
    isFeatured: false,
    features: [
      'Weekly free picks',
      'Community chat access',
      'Basic stats tracking',
    ],
  },
  {
    id: 'demo-prod-4',
    name: 'Match Analysis',
    description: 'In-depth single-match breakdowns',
    type: 'one-time',
    billingPeriod: 'one-time',
    priceCents: 1999,
    subscribers: 84,
    subscribersLabel: '84 purchases',
    revenueMrrCents: 0,
    status: 'active',
    createdAtMs: daysAgo(90),
    icon: 'chart',
    showOnProfile: false,
    isFeatured: false,
    features: [
      'In-depth match analysis',
      'Key player insights',
      'Predicted scoreline',
      'Value bet highlights',
    ],
  },
  {
    id: 'demo-prod-5',
    name: 'Betting Course',
    description: 'Self-paced course for beginners',
    type: 'one-time',
    billingPeriod: 'one-time',
    priceCents: 14900,
    subscribers: 56,
    subscribersLabel: '56 purchases',
    revenueMrrCents: 0,
    status: 'draft',
    createdAtMs: daysAgo(60),
    icon: 'video',
    showOnProfile: false,
    isFeatured: false,
    features: [
      '12 video modules',
      'Bankroll templates',
      'Lifetime access',
    ],
  },
  {
    id: 'demo-prod-6',
    name: 'Daily Insights',
    description: 'Short-form daily insight posts',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 999,
    subscribers: 120,
    revenueMrrCents: 119_880,
    status: 'active',
    createdAtMs: daysAgo(150),
    icon: 'star',
    showOnProfile: false,
    isFeatured: false,
    features: [
      'Daily short insights',
      'Mobile notifications',
      'Cancel anytime',
    ],
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
    showOnProfile: false,
    isFeatured: false,
    features: ['Weekly card archive'],
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
  if (priceCents === 0) return 'Free';
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

export function defaultProductFeatures(name: string, type: ProductBillingType): string[] {
  const n = name.toLowerCase();
  if (n.includes('vip')) {
    return [
      'Everything in Premium',
      'VIP Discord access',
      '1-on-1 chat support',
      'Custom unit sizes',
    ];
  }
  if (n.includes('premium') || n.includes('picks')) {
    return [
      'Daily premium picks',
      'Unit sizing guidance',
      'Detailed write-ups',
      'Early lock alerts',
    ];
  }
  if (type === 'free' || n.includes('community') || n.includes('free')) {
    return ['Weekly free picks', 'Community chat access', 'Basic stats tracking'];
  }
  if (type === 'one-time') {
    return ['One-time purchase', 'Lifetime access', 'Downloadable materials'];
  }
  return ['Full product access', 'Cancel anytime', 'Mobile notifications'];
}
