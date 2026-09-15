/**
 * Sample Your Subscribers data for design review when the creator has no real subscribers.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export type DemoSubscriberRow = {
  id: string;
  name: string;
  email: string;
  plan: 'Premium' | 'Monthly' | 'VIP';
  status: 'active' | 'cancelled' | 'trial';
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
};

export const CREATOR_SUBSCRIBERS_DEMO_METRICS = {
  total: 892,
  totalDelta: 18,
  active: 856,
  activeDelta: 12,
  canceled: 36,
  canceledDelta: -4,
  mrrCents: 248_000,
  mrrDelta: 28,
} as const;

export const CREATOR_SUBSCRIBERS_DEMO_ROWS: DemoSubscriberRow[] = [
  {
    id: 'demo-sub-1',
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(45),
    renewalAtMs: daysAgo(-15),
    totalSpentCents: 8997,
  },
  {
    id: 'demo-sub-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(120),
    renewalAtMs: daysAgo(-5),
    totalSpentCents: 23700,
  },
  {
    id: 'demo-sub-3',
    name: 'Daniel Park',
    email: 'daniel.park@example.com',
    plan: 'Monthly',
    status: 'cancelled',
    joinedAtMs: daysAgo(90),
    renewalAtMs: null,
    totalSpentCents: 2900,
  },
  {
    id: 'demo-sub-4',
    name: 'Maya Ortiz',
    email: 'maya.o@example.com',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(12),
    renewalAtMs: daysAgo(-18),
    totalSpentCents: 2999,
  },
  {
    id: 'demo-sub-5',
    name: 'Alex Rivera',
    email: 'alex.r@example.com',
    plan: 'Monthly',
    status: 'trial',
    joinedAtMs: daysAgo(3),
    renewalAtMs: daysAgo(-4),
    totalSpentCents: 0,
  },
  {
    id: 'demo-sub-6',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(200),
    renewalAtMs: daysAgo(-2),
    totalSpentCents: 47400,
  },
  {
    id: 'demo-sub-7',
    name: 'Chris Bailey',
    email: 'c.bailey@example.com',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(28),
    renewalAtMs: daysAgo(-2),
    totalSpentCents: 2900,
  },
  {
    id: 'demo-sub-8',
    name: 'Jordan Blake',
    email: 'jordan.blake@example.com',
    plan: 'Premium',
    status: 'cancelled',
    joinedAtMs: daysAgo(60),
    renewalAtMs: null,
    totalSpentCents: 5998,
  },
  {
    id: 'demo-sub-9',
    name: 'Sam Torres',
    email: 'sam.t@example.com',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(8),
    renewalAtMs: daysAgo(-22),
    totalSpentCents: 2900,
  },
  {
    id: 'demo-sub-10',
    name: 'Elena Costa',
    email: 'elena.costa@example.com',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(33),
    renewalAtMs: daysAgo(-1),
    totalSpentCents: 8997,
  },
  {
    id: 'demo-sub-11',
    name: 'Noah Berg',
    email: 'noah.berg@example.com',
    plan: 'VIP',
    status: 'trial',
    joinedAtMs: daysAgo(1),
    renewalAtMs: daysAgo(-6),
    totalSpentCents: 0,
  },
  {
    id: 'demo-sub-12',
    name: 'Iris Fontaine',
    email: 'iris.f@example.com',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(15),
    renewalAtMs: daysAgo(-15),
    totalSpentCents: 2900,
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
