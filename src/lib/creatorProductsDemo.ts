/**
 * Sample Your Products data for design review when the creator has no products yet.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export type ProductBillingType = 'subscription' | 'one-time';

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
  status: 'active' | 'inactive';
  createdAtMs: number;
  icon: 'crown' | 'star' | 'gem' | 'book' | 'video' | 'users';
};

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
    name: 'Monthly Plan',
    description: 'Core access to all daily picks',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 999,
    subscribers: 342,
    status: 'active',
    createdAtMs: daysAgo(200),
    icon: 'crown',
  },
  {
    id: 'demo-prod-2',
    name: 'Premium Plan',
    description: 'Exclusive picks and early releases',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 2999,
    subscribers: 412,
    status: 'active',
    createdAtMs: daysAgo(180),
    icon: 'star',
  },
  {
    id: 'demo-prod-3',
    name: 'VIP Plan',
    description: '1-on-1 chat and VIP community',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 4999,
    subscribers: 138,
    status: 'active',
    createdAtMs: daysAgo(150),
    icon: 'gem',
  },
  {
    id: 'demo-prod-4',
    name: 'Betting Guide (eBook)',
    description: 'One-time digital guide',
    type: 'one-time',
    billingPeriod: 'one-time',
    priceCents: 1999,
    subscribers: 87,
    status: 'active',
    createdAtMs: daysAgo(90),
    icon: 'book',
  },
  {
    id: 'demo-prod-5',
    name: 'Video Course',
    description: 'Recorded handicapper course',
    type: 'one-time',
    billingPeriod: 'one-time',
    priceCents: 4999,
    subscribers: 56,
    status: 'active',
    createdAtMs: daysAgo(60),
    icon: 'video',
  },
  {
    id: 'demo-prod-6',
    name: 'Private Community',
    description: 'Ongoing community membership',
    type: 'subscription',
    billingPeriod: 'monthly',
    priceCents: 1499,
    subscribers: 221,
    status: 'active',
    createdAtMs: daysAgo(40),
    icon: 'users',
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
  if (billingPeriod === 'yearly') return `$${dollars}/yr`;
  if (billingPeriod === 'weekly') return `$${dollars}/wk`;
  if (billingPeriod === 'daily') return `$${dollars}/day`;
  return `$${dollars}/month`;
}
