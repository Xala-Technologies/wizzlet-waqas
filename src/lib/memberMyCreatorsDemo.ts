/**
 * Sample My Creators subscriptions for design review when the member has none.
 * Aligned to the Prizelet My Creators mockup.
 */

export type MemberMyCreatorDemoSub = {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarInitials: string;
  avatarTone: string;
  sports: string[];
  winRate: number;
  profit30dUnits: number;
  followersLabel: string;
  monthlyPriceCents: number;
  renewsLabel: string;
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
    username: 'sharkpicks',
    displayName: 'Shark Picks',
    bio: 'NBA & NFL sides with disciplined unit sizing.',
    avatarInitials: 'SP',
    avatarTone: 'bg-slate-900',
    sports: ['NBA', 'NFL', 'UFC'],
    winRate: 68,
    profit30dUnits: 12.4,
    followersLabel: '2.4K',
    monthlyPriceCents: 999,
    renewsLabel: 'Renews Feb 28, 2025',
    lastActiveMs: Date.now() - 2 * 3_600_000,
    verified: true,
  },
  {
    id: 'demo-my-2',
    username: 'theprofitclub',
    displayName: 'The Profit Club',
    bio: 'Premium locks across major US sports.',
    avatarInitials: 'PC',
    avatarTone: 'bg-amber-700',
    sports: ['NBA', 'NFL', 'NHL'],
    winRate: 64,
    profit30dUnits: 8.6,
    followersLabel: '1.8K',
    monthlyPriceCents: 1999,
    renewsLabel: 'Renews Mar 4, 2025',
    lastActiveMs: Date.now() - 5 * 3_600_000,
    verified: true,
  },
  {
    id: 'demo-my-3',
    username: 'elitepicks',
    displayName: 'Elite Picks',
    bio: 'High-conviction soccer and NBA props.',
    avatarInitials: 'EP',
    avatarTone: 'bg-fuchsia-700',
    sports: ['Soccer', 'NBA', 'Tennis'],
    winRate: 63,
    profit30dUnits: 7.8,
    followersLabel: '1.5K',
    monthlyPriceCents: 999,
    renewsLabel: 'Renews Mar 12, 2025',
    lastActiveMs: Date.now() - 12 * 3_600_000,
    verified: true,
  },
  {
    id: 'demo-my-4',
    username: 'betking',
    displayName: 'BetKing',
    bio: 'Sharp money reads and early line moves.',
    avatarInitials: 'BK',
    avatarTone: 'bg-indigo-800',
    sports: ['NBA', 'UFC', 'Tennis'],
    winRate: 66,
    profit30dUnits: 10.2,
    followersLabel: '1.9K',
    monthlyPriceCents: 1499,
    renewsLabel: 'Renews Feb 20, 2025',
    lastActiveMs: Date.now() - 26 * 3_600_000,
    verified: true,
  },
];

export const MEMBER_MY_CREATORS_DEMO_PURCHASES: MemberMyCreatorDemoPurchase[] = [
  {
    id: 'demo-purchase-1',
    title: 'NBA Playoff Parlay Pack',
    creatorName: 'Shark Picks',
    amountCents: 2499,
    purchasedLabel: 'Purchased Jan 18, 2025',
  },
  {
    id: 'demo-purchase-2',
    title: 'UFC Fight Night Card',
    creatorName: 'BetKing',
    amountCents: 1499,
    purchasedLabel: 'Purchased Feb 2, 2025',
  },
];

export const MEMBER_MY_CREATORS_DEMO_CHARGES: MemberMyCreatorDemoCharge[] = [
  {
    id: 'demo-charge-1',
    creatorName: 'Shark Picks',
    typeLabel: 'Subscription renewal',
    amountCents: 999,
    dateLabel: 'Feb 1, 2025',
    status: 'Settled',
  },
  {
    id: 'demo-charge-2',
    creatorName: 'The Profit Club',
    typeLabel: 'Subscription charge',
    amountCents: 1999,
    dateLabel: 'Feb 4, 2025',
    status: 'Settled',
  },
  {
    id: 'demo-charge-3',
    creatorName: 'Elite Picks',
    typeLabel: 'Subscription charge',
    amountCents: 999,
    dateLabel: 'Feb 12, 2025',
    status: 'Settled',
  },
  {
    id: 'demo-charge-4',
    creatorName: 'BetKing',
    typeLabel: 'One-time purchase',
    amountCents: 1499,
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
  return id.startsWith('demo-my-') || id.startsWith('demo-purchase-') || id.startsWith('demo-charge-');
}
