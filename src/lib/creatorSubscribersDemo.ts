/**
 * Sample Your Subscribers data for design review when the creator has no real subscribers.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

function demoAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}&size=80&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export type DemoSubscriberRow = {
  id: string;
  name: string;
  email: string;
  plan: 'Premium' | 'Monthly' | 'VIP';
  status: 'active' | 'cancelled' | 'trial';
  joinedAtMs: number;
  renewalAtMs: number | null;
  totalSpentCents: number;
  avatarUrl: string;
};

export const CREATOR_SUBSCRIBERS_DEMO_METRICS = {
  total: 1_248,
  totalDelta: 12,
  active: 1_186,
  activeDelta: 9,
  canceled: 48,
  canceledDelta: -6,
  mrrCents: 432_000,
  mrrDelta: 18,
} as const;

export const CREATOR_SUBSCRIBERS_DEMO_ROWS: DemoSubscriberRow[] = [
  {
    id: 'demo-sub-1',
    name: 'Jordan Blake',
    email: 'jordan.blake@example.com',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(2),
    renewalAtMs: daysAgo(-28),
    totalSpentCents: 49_990,
    avatarUrl: demoAvatar('jordan-blake'),
  },
  {
    id: 'demo-sub-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(5),
    renewalAtMs: daysAgo(-25),
    totalSpentCents: 29_970,
    avatarUrl: demoAvatar('sarah-chen'),
  },
  {
    id: 'demo-sub-3',
    name: 'Maya Ortiz',
    email: 'maya.o@example.com',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(8),
    renewalAtMs: daysAgo(-22),
    totalSpentCents: 9_990,
    avatarUrl: demoAvatar('maya-ortiz'),
  },
  {
    id: 'demo-sub-4',
    name: 'Priya Nair',
    email: 'priya.nair@example.com',
    plan: 'VIP',
    status: 'active',
    joinedAtMs: daysAgo(14),
    renewalAtMs: daysAgo(-16),
    totalSpentCents: 74_985,
    avatarUrl: demoAvatar('priya-nair'),
  },
  {
    id: 'demo-sub-5',
    name: 'Alex Rivera',
    email: 'alex.r@example.com',
    plan: 'Premium',
    status: 'trial',
    joinedAtMs: daysAgo(1),
    renewalAtMs: daysAgo(-6),
    totalSpentCents: 0,
    avatarUrl: demoAvatar('alex-rivera'),
  },
  {
    id: 'demo-sub-6',
    name: 'Daniel Park',
    email: 'daniel.park@example.com',
    plan: 'Monthly',
    status: 'cancelled',
    joinedAtMs: daysAgo(90),
    renewalAtMs: null,
    totalSpentCents: 29_970,
    avatarUrl: demoAvatar('daniel-park'),
  },
  {
    id: 'demo-sub-7',
    name: 'Chris Bailey',
    email: 'c.bailey@example.com',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(28),
    renewalAtMs: daysAgo(-2),
    totalSpentCents: 19_980,
    avatarUrl: demoAvatar('chris-bailey'),
  },
  {
    id: 'demo-sub-8',
    name: 'Elena Costa',
    email: 'elena.costa@example.com',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(33),
    renewalAtMs: daysAgo(-1),
    totalSpentCents: 59_940,
    avatarUrl: demoAvatar('elena-costa'),
  },
  {
    id: 'demo-sub-9',
    name: 'Sam Torres',
    email: 'sam.t@example.com',
    plan: 'Monthly',
    status: 'active',
    joinedAtMs: daysAgo(11),
    renewalAtMs: daysAgo(-19),
    totalSpentCents: 9_990,
    avatarUrl: demoAvatar('sam-torres'),
  },
  {
    id: 'demo-sub-10',
    name: 'Noah Berg',
    email: 'noah.berg@example.com',
    plan: 'VIP',
    status: 'trial',
    joinedAtMs: daysAgo(0),
    renewalAtMs: daysAgo(-7),
    totalSpentCents: 0,
    avatarUrl: demoAvatar('noah-berg'),
  },
  {
    id: 'demo-sub-11',
    name: 'Iris Fontaine',
    email: 'iris.f@example.com',
    plan: 'Premium',
    status: 'cancelled',
    joinedAtMs: daysAgo(60),
    renewalAtMs: null,
    totalSpentCents: 44_955,
    avatarUrl: demoAvatar('iris-fontaine'),
  },
  {
    id: 'demo-sub-12',
    name: 'John Doe',
    email: 'john@example.com',
    plan: 'Premium',
    status: 'active',
    joinedAtMs: daysAgo(45),
    renewalAtMs: daysAgo(-15),
    totalSpentCents: 89_970,
    avatarUrl: demoAvatar('john-doe'),
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
