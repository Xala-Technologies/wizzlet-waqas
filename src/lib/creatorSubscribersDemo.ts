/**
 * Sample Subscribers data for design / PO review when the creator has no real subscribers.
 * Aligned to the Prizelet Subscribers mockup (KPIs, table, detail panel).
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;
const daysFromNow = (n: number) => Date.now() + n * day;

function demoAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}&size=80&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export type DemoSubscriberStatus = 'active' | 'cancelled' | 'trial';

export type DemoSubscriberActivity = {
  id: string;
  title: string;
  whenLabel: string;
  tone: 'subscribe' | 'payment' | 'community' | 'view' | 'like';
};

export type DemoSubscriberRow = {
  id: string;
  name: string;
  email: string;
  /** Product / plan display name */
  product: string;
  priceLabel: string;
  status: DemoSubscriberStatus;
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
  avatarUrl: string;
  country: string;
  countryFlag: string;
  paymentLast4: string | null;
  activity: DemoSubscriberActivity[];
  /** @deprecated use product — kept for older callers */
  plan?: 'Premium' | 'Monthly' | 'VIP';
};

export const CREATOR_SUBSCRIBERS_DEMO_METRICS = {
  total: 1_248,
  totalDelta: 18,
  active: 892,
  activeDelta: 16,
  trial: 214,
  trialDelta: 32,
  canceled: 142,
  canceledDelta: 8,
  // legacy aliases
  mrrCents: 432_000,
  mrrDelta: 18,
} as const;

const jordanActivity: DemoSubscriberActivity[] = [
  { id: 'a1', title: 'Subscribed to Premium Picks', whenLabel: '2 hours ago', tone: 'subscribe' },
  { id: 'a2', title: 'Payment successful ($29.99)', whenLabel: '2 hours ago', tone: 'payment' },
  { id: 'a3', title: 'Joined your community', whenLabel: '1 day ago', tone: 'community' },
  { id: 'a4', title: 'Viewed post: NBA Picks Tonight', whenLabel: '2 days ago', tone: 'view' },
  { id: 'a5', title: 'Liked your post', whenLabel: '3 days ago', tone: 'like' },
];

export const CREATOR_SUBSCRIBERS_DEMO_ROWS: DemoSubscriberRow[] = [
  {
    id: 'demo-sub-1',
    name: 'Jordan Blake',
    email: 'jordan.blake@example.com',
    product: 'Premium Picks',
    priceLabel: '$29.99 / month',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(28),
    renewalAtMs: daysFromNow(34),
    totalSpentCents: 8_997,
    avatarUrl: demoAvatar('jordan-blake'),
    country: 'United States',
    countryFlag: '🇺🇸',
    paymentLast4: '4242',
    activity: jordanActivity,
  },
  {
    id: 'demo-sub-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    product: 'VIP Access',
    priceLabel: '$49.99 / month',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(5),
    renewalAtMs: daysFromNow(25),
    totalSpentCents: 14_997,
    avatarUrl: demoAvatar('sarah-chen'),
    country: 'Canada',
    countryFlag: '🇨🇦',
    paymentLast4: '1881',
    activity: [
      { id: 'b1', title: 'Subscribed to VIP Access', whenLabel: '5 days ago', tone: 'subscribe' },
      { id: 'b2', title: 'Payment successful ($49.99)', whenLabel: '5 days ago', tone: 'payment' },
    ],
  },
  {
    id: 'demo-sub-3',
    name: 'Maya Ortiz',
    email: 'maya.o@example.com',
    product: 'Daily Insights',
    priceLabel: '$9.99 / month',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(8),
    renewalAtMs: daysFromNow(22),
    totalSpentCents: 2_997,
    avatarUrl: demoAvatar('maya-ortiz'),
    country: 'Mexico',
    countryFlag: '🇲🇽',
    paymentLast4: '5555',
    activity: [],
  },
  {
    id: 'demo-sub-4',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    product: 'VIP Access',
    priceLabel: '$49.99 / month',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(14),
    renewalAtMs: daysFromNow(16),
    totalSpentCents: 14_997,
    avatarUrl: demoAvatar('priya-nair'),
    country: 'India',
    countryFlag: '🇮🇳',
    paymentLast4: '9012',
    activity: [],
  },
  {
    id: 'demo-sub-5',
    name: 'Alex Rivera',
    email: 'alex.r@example.com',
    product: 'Premium Picks',
    priceLabel: '$29.99 / month',
    plan: 'Premium',
    status: 'trial',
    joinedAtMs: daysAgo(1),
    renewalAtMs: daysFromNow(6),
    totalSpentCents: 0,
    avatarUrl: demoAvatar('alex-rivera'),
    country: 'United States',
    countryFlag: '🇺🇸',
    paymentLast4: null,
    activity: [
      { id: 'c1', title: 'Started free trial — Premium Picks', whenLabel: '1 day ago', tone: 'subscribe' },
    ],
  },
  {
    id: 'demo-sub-6',
    name: 'Daniel Park',
    email: 'daniel.park@example.com',
    product: 'Daily Insights',
    priceLabel: '$9.99 / month',
    plan: 'Monthly',
    status: 'cancelled',
    joinedAtMs: daysAgo(90),
    renewalAtMs: null,
    totalSpentCents: 2_997,
    avatarUrl: demoAvatar('daniel-park'),
    country: 'South Korea',
    countryFlag: '🇰🇷',
    paymentLast4: '0012',
    activity: [],
  },
  {
    id: 'demo-sub-7',
    name: 'Chris Bailey',
    email: 'c.bailey@example.com',
    product: 'Premium Picks',
    priceLabel: '$29.99 / month',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(28),
    renewalAtMs: daysFromNow(2),
    totalSpentCents: 8_997,
    avatarUrl: demoAvatar('chris-bailey'),
    country: 'United Kingdom',
    countryFlag: '🇬🇧',
    paymentLast4: '4444',
    activity: [],
  },
  {
    id: 'demo-sub-8',
    name: 'Elena Costa',
    email: 'elena.costa@example.com',
    product: 'VIP Access',
    priceLabel: '$49.99 / month',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(33),
    renewalAtMs: daysFromNow(1),
    totalSpentCents: 14_997,
    avatarUrl: demoAvatar('elena-costa'),
    country: 'Italy',
    countryFlag: '🇮🇹',
    paymentLast4: '7777',
    activity: [],
  },
  {
    id: 'demo-sub-9',
    name: 'Sam Torres',
    email: 'sam.t@example.com',
    product: 'Daily Insights',
    priceLabel: '$9.99 / month',
    plan: 'Monthly',
    status: 'trial',
    joinedAtMs: daysAgo(3),
    renewalAtMs: daysFromNow(4),
    totalSpentCents: 0,
    avatarUrl: demoAvatar('sam-torres'),
    country: 'Spain',
    countryFlag: '🇪🇸',
    paymentLast4: null,
    activity: [],
  },
  {
    id: 'demo-sub-10',
    name: 'Noah Berg',
    email: 'noah.berg@example.com',
    product: 'Premium Picks',
    priceLabel: '$29.99 / month',
    plan: 'Premium',
    status: 'cancelled',
    joinedAtMs: daysAgo(60),
    renewalAtMs: null,
    totalSpentCents: 5_998,
    avatarUrl: demoAvatar('noah-berg'),
    country: 'Germany',
    countryFlag: '🇩🇪',
    paymentLast4: '3141',
    activity: [],
  },
];

export function shouldUseCreatorSubscribersDemo(input: {
  count: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.count === 0;
}

export function isCreatorSubscribersDemoId(id: string): boolean {
  return id.startsWith('demo-sub-');
}

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function productFromAmount(amountCents: number | undefined): {
  product: string;
  priceLabel: string;
  plan: 'Premium' | 'Monthly' | 'VIP' | '—';
} {
  if (amountCents == null) return { product: '—', priceLabel: '—', plan: '—' };
  if (amountCents >= 5000) {
    return {
      product: 'VIP Access',
      priceLabel: `$${(amountCents / 100).toFixed(2)} / month`,
      plan: 'VIP',
    };
  }
  if (amountCents >= 2500) {
    return {
      product: 'Premium Picks',
      priceLabel: `$${(amountCents / 100).toFixed(2)} / month`,
      plan: 'Premium',
    };
  }
  return {
    product: 'Daily Insights',
    priceLabel: `$${(amountCents / 100).toFixed(2)} / month`,
    plan: 'Monthly',
  };
}
