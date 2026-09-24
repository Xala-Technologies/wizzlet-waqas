/**
 * Sample My Creators list aligned to the Prizelet My Creators mock.
 */

export type MemberMyCreatorDemoSub = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials: string;
  avatarTone: string;
  /** Plan tier shown under the name (e.g. Premium, VIP) */
  planLabel: string;
  tags: string[];
  lastActiveMs: number;
  verified: boolean;
};

export type MemberMyCreatorDemoPurchase = {
  id: string;
  title: string;
  creatorName: string;
  amountCents: number;
  purchasedLabel: string;
};

export type MemberMyCreatorDemoCharge = {
  id: string;
  creatorName: string;
  typeLabel: string;
  amountCents: number;
  dateLabel: string;
  status: string;
};

export const MEMBER_MY_CREATORS_DEMO_SUBS: MemberMyCreatorDemoSub[] = [
  {
    id: 'demo-my-1',
    username: 'alexpicks',
    displayName: 'AlexPicks',
    bio: 'Daily NBA, NFL & MLB picks with detailed analysis and exclusive Discord access for members.',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
    avatarInitials: 'AP',
    avatarTone: 'bg-slate-800',
    planLabel: 'Premium',
    tags: ['NBA', 'NFL', 'MLB', 'Exclusive Discord'],
    lastActiveMs: Date.now() - 2 * 3_600_000,
    verified: true,
  },
  {
    id: 'demo-my-2',
    username: 'sharkpicks',
    displayName: 'Shark Picks',
    bio: 'Data-driven NBA & NCAAB models plus a private community for serious bettors.',
    avatarUrl: null,
    avatarInitials: 'SP',
    avatarTone: 'bg-slate-900',
    planLabel: 'Premium',
    tags: ['NBA', 'NCAAB', 'Betting Models', 'Private Community'],
    lastActiveMs: Date.now() - 5 * 3_600_000,
    verified: true,
  },
  {
    id: 'demo-my-3',
    username: 'theprofitclub',
    displayName: 'The Profit Club',
    bio: 'Combat sports specialists covering UFC, boxing and MMA with study-hub breakdowns.',
    avatarUrl: null,
    avatarInitials: '👑',
    avatarTone: 'bg-amber-100 text-amber-900',
    planLabel: 'VIP',
    tags: ['UFC', 'Boxing', 'MMA', 'Study Hub'],
    lastActiveMs: Date.now() - 8 * 3_600_000,
    verified: true,
  },
  {
    id: 'demo-my-4',
    username: 'tennisedge',
    displayName: 'Tennis Edge',
    bio: 'ATP, WTA and Challenger angles with tools built for tennis bettors.',
    avatarUrl: null,
    avatarInitials: '🎾',
    avatarTone: 'bg-lime-100 text-lime-900',
    planLabel: 'Premium',
    tags: ['ATP', 'WTA', 'Challengers', 'Betting Tools'],
    lastActiveMs: Date.now() - 12 * 3_600_000,
    verified: true,
  },
];

export const MEMBER_MY_CREATORS_DEMO_PURCHASES: MemberMyCreatorDemoPurchase[] = [
  {
    id: 'demo-purchase-1',
    title: 'NBA Playoff Parlay Pack',
    creatorName: 'AlexPicks',
    amountCents: 2499,
    purchasedLabel: 'Purchased Jan 18, 2025',
  },
  {
    id: 'demo-purchase-2',
    title: 'UFC Fight Night Card',
    creatorName: 'The Profit Club',
    amountCents: 1499,
    purchasedLabel: 'Purchased Feb 2, 2025',
  },
];

export const MEMBER_MY_CREATORS_DEMO_CHARGES: MemberMyCreatorDemoCharge[] = [
  {
    id: 'demo-charge-1',
    creatorName: 'AlexPicks',
    typeLabel: 'Subscription renewal',
    amountCents: 999,
    dateLabel: 'Feb 1, 2025',
    status: 'Settled',
  },
  {
    id: 'demo-charge-2',
    creatorName: 'Shark Picks',
    typeLabel: 'Subscription charge',
    amountCents: 999,
    dateLabel: 'Feb 4, 2025',
    status: 'Settled',
  },
  {
    id: 'demo-charge-3',
    creatorName: 'The Profit Club',
    typeLabel: 'Subscription charge',
    amountCents: 1999,
    dateLabel: 'Feb 12, 2025',
    status: 'Settled',
  },
  {
    id: 'demo-charge-4',
    creatorName: 'Tennis Edge',
    typeLabel: 'Subscription charge',
    amountCents: 999,
    dateLabel: 'Feb 2, 2025',
    status: 'Settled',
  },
];

export function shouldUseMemberMyCreatorsDemo(opts: {
  subscriptionCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.subscriptionCount === 0;
}

export function isMemberMyCreatorsDemoId(id: string): boolean {
  return (
    id.startsWith('demo-my-') ||
    id.startsWith('demo-purchase-') ||
    id.startsWith('demo-charge-')
  );
}

export type MemberManageFeature = {
  title: string;
  description: string;
};

export type MemberManageBillingRow = {
  id: string;
  dateLabel: string;
  amountCents: number;
  status: 'Paid' | 'Pending' | 'Failed';
};

export type MemberManageSubscriptionDetail = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials: string;
  avatarTone: string;
  planLabel: string;
  tags: string[];
  verified: boolean;
  statusLabel: 'Active' | 'Past due' | 'Canceled';
  priceCents: number;
  pricePeriod: string;
  paymentBrand: string;
  paymentLast4: string;
  features: MemberManageFeature[];
  billingHistory: MemberManageBillingRow[];
};

const DEFAULT_FEATURES_FOR = (name: string): MemberManageFeature[] => [
  {
    title: 'Daily picks',
    description: `Get ${name.split(' ')[0]}'s top picks every day.`,
  },
  {
    title: 'Detailed analysis',
    description: 'In-depth breakdowns and reasoning.',
  },
  {
    title: 'Live streams',
    description: 'Access to member-only live streams.',
  },
  {
    title: 'Private community',
    description: `Join discussions with ${name.split(' ')[0]} and other members.`,
  },
  {
    title: 'Betting guides & resources',
    description: 'Access to exclusive tools and guides.',
  },
];

function demoBillingRows(amountCents: number): MemberManageBillingRow[] {
  return [
    { id: 'bill-1', dateLabel: 'Mar 12, 2025', amountCents, status: 'Paid' },
    { id: 'bill-2', dateLabel: 'Feb 12, 2025', amountCents, status: 'Paid' },
    { id: 'bill-3', dateLabel: 'Jan 12, 2025', amountCents, status: 'Paid' },
    { id: 'bill-4', dateLabel: 'Dec 12, 2024', amountCents, status: 'Paid' },
  ];
}

/** Manage Subscription screen payload for demo creators (keyed by username). */
export const MEMBER_MANAGE_SUBSCRIPTION_DEMO: Record<
  string,
  MemberManageSubscriptionDetail
> = {
  alexpicks: {
    username: 'alexpicks',
    displayName: 'AlexPicks',
    bio: 'Daily picks, in-depth analysis and exclusive insights.',
    avatarUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face',
    avatarInitials: 'AP',
    avatarTone: 'bg-slate-800',
    planLabel: 'Premium',
    tags: ['NBA', 'NFL', 'MLB', 'Exclusive Discord'],
    verified: true,
    statusLabel: 'Active',
    priceCents: 4999,
    pricePeriod: 'month',
    paymentBrand: 'Visa',
    paymentLast4: '4242',
    features: [
      {
        title: 'Daily picks',
        description: "Get Alex's top picks every day.",
      },
      {
        title: 'Detailed analysis',
        description: 'In-depth breakdowns and reasoning.',
      },
      {
        title: 'Live streams',
        description: 'Access to member-only live streams.',
      },
      {
        title: 'Private community',
        description: 'Join discussions with Alex and other members.',
      },
      {
        title: 'Betting guides & resources',
        description: 'Access to exclusive tools and guides.',
      },
    ],
    billingHistory: demoBillingRows(4999),
  },
  sharkpicks: {
    username: 'sharkpicks',
    displayName: 'Shark Picks',
    bio: 'Data-driven models and a private community for serious bettors.',
    avatarUrl: null,
    avatarInitials: 'SP',
    avatarTone: 'bg-slate-900',
    planLabel: 'Premium',
    tags: ['NBA', 'NCAAB', 'Betting Models', 'Private Community'],
    verified: true,
    statusLabel: 'Active',
    priceCents: 3999,
    pricePeriod: 'month',
    paymentBrand: 'Visa',
    paymentLast4: '4242',
    features: DEFAULT_FEATURES_FOR('Shark'),
    billingHistory: demoBillingRows(3999),
  },
  theprofitclub: {
    username: 'theprofitclub',
    displayName: 'The Profit Club',
    bio: 'Combat sports coverage with study-hub breakdowns.',
    avatarUrl: null,
    avatarInitials: '👑',
    avatarTone: 'bg-amber-100 text-amber-900',
    planLabel: 'VIP',
    tags: ['UFC', 'Boxing', 'MMA', 'Study Hub'],
    verified: true,
    statusLabel: 'Active',
    priceCents: 7999,
    pricePeriod: 'month',
    paymentBrand: 'Visa',
    paymentLast4: '4242',
    features: DEFAULT_FEATURES_FOR('The Profit Club'),
    billingHistory: demoBillingRows(7999),
  },
  tennisedge: {
    username: 'tennisedge',
    displayName: 'Tennis Edge',
    bio: 'ATP, WTA and Challenger angles with tennis betting tools.',
    avatarUrl: null,
    avatarInitials: '🎾',
    avatarTone: 'bg-lime-100 text-lime-900',
    planLabel: 'Premium',
    tags: ['ATP', 'WTA', 'Challengers', 'Betting Tools'],
    verified: true,
    statusLabel: 'Active',
    priceCents: 2999,
    pricePeriod: 'month',
    paymentBrand: 'Visa',
    paymentLast4: '4242',
    features: DEFAULT_FEATURES_FOR('Tennis Edge'),
    billingHistory: demoBillingRows(2999),
  },
};

export function getMemberManageSubscriptionDemo(
  username: string,
): MemberManageSubscriptionDetail | null {
  return MEMBER_MANAGE_SUBSCRIPTION_DEMO[username.toLowerCase()] ?? null;
}

