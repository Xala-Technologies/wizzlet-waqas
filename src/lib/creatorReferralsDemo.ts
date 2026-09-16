/**
 * Sample Referrals management data for design review when the creator has no attributed signups.
 * Aligned to the Prizelet Referrals mockup.
 */

const day = 86_400_000;
const daysAgo = (n: number) => Date.now() - n * day;

export type DemoReferralStatus = 'paid' | 'approved' | 'pending' | 'fraud';

export type DemoReferralRow = {
  id: string;
  referrerName: string;
  referrerHandle: string;
  referredName: string;
  referredEmail: string | null;
  plan: string;
  revenueCents: number;
  commissionCents: number;
  status: DemoReferralStatus;
  createdAtMs: number;
  /** Legacy fields used by older mappings */
  referred_email?: string | null;
  converted?: boolean;
  created_at?: string;
};

export const CREATOR_REFERRALS_DEMO_METRICS = {
  totalReferrals: 248,
  totalReferralsDelta: 32,
  newSubscribers: 186,
  newSubscribersDelta: 28,
  revenueCents: 932_000,
  revenueDelta: 41,
  rewardsPaidCents: 186_000,
  rewardsPaidDelta: 27,
  dateRangeLabel: 'Jan 1, 2025 – Jan 31, 2025',
  commissionRatePct: 20,
  cookieDays: 30,
  minPayoutCents: 1_000,
} as const;

export const CREATOR_REFERRALS_DEMO_ROWS: DemoReferralRow[] = [
  {
    id: 'demo-ref-1',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanb',
    referredName: 'Sam Lee',
    referredEmail: 'sam.lee@example.com',
    plan: 'Premium Picks',
    revenueCents: 29_990,
    commissionCents: 5_998,
    status: 'paid',
    createdAtMs: daysAgo(2),
  },
  {
    id: 'demo-ref-2',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanb',
    referredName: 'Maya Ortiz',
    referredEmail: 'maya.o@example.com',
    plan: 'VIP Access',
    revenueCents: 99_990,
    commissionCents: 19_998,
    status: 'approved',
    createdAtMs: daysAgo(4),
  },
  {
    id: 'demo-ref-3',
    referrerName: 'Sarah Chen',
    referrerHandle: '@sarahc',
    referredName: 'Daniel Park',
    referredEmail: 'daniel.park@example.com',
    plan: 'Monthly Pass',
    revenueCents: 19_990,
    commissionCents: 3_998,
    status: 'pending',
    createdAtMs: daysAgo(5),
  },
  {
    id: 'demo-ref-4',
    referrerName: 'Alex Rivera',
    referrerHandle: '@alexr',
    referredName: 'Chris Ng',
    referredEmail: 'chris.ng@example.com',
    plan: 'Premium Picks',
    revenueCents: 29_990,
    commissionCents: 5_998,
    status: 'paid',
    createdAtMs: daysAgo(7),
  },
  {
    id: 'demo-ref-5',
    referrerName: 'Sarah Chen',
    referrerHandle: '@sarahc',
    referredName: 'Priya Shah',
    referredEmail: 'priya@example.com',
    plan: 'VIP Access',
    revenueCents: 99_990,
    commissionCents: 19_998,
    status: 'approved',
    createdAtMs: daysAgo(9),
  },
  {
    id: 'demo-ref-6',
    referrerName: 'Mike Torres',
    referrerHandle: '@miket',
    referredName: 'Guest user',
    referredEmail: null,
    plan: '—',
    revenueCents: 0,
    commissionCents: 0,
    status: 'pending',
    createdAtMs: daysAgo(11),
  },
  {
    id: 'demo-ref-7',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanb',
    referredName: 'Taylor Kim',
    referredEmail: 'taylor.k@example.com',
    plan: 'Premium Picks',
    revenueCents: 29_990,
    commissionCents: 5_998,
    status: 'paid',
    createdAtMs: daysAgo(12),
  },
  {
    id: 'demo-ref-8',
    referrerName: 'Lana Brooks',
    referrerHandle: '@lanab',
    referredName: 'Omar Hassan',
    referredEmail: 'omar.h@example.com',
    plan: 'Monthly Pass',
    revenueCents: 19_990,
    commissionCents: 3_998,
    status: 'fraud',
    createdAtMs: daysAgo(14),
  },
  {
    id: 'demo-ref-9',
    referrerName: 'Mike Torres',
    referrerHandle: '@miket',
    referredName: 'Elena Voss',
    referredEmail: 'elena.v@example.com',
    plan: 'Premium Picks',
    revenueCents: 29_990,
    commissionCents: 5_998,
    status: 'approved',
    createdAtMs: daysAgo(16),
  },
  {
    id: 'demo-ref-10',
    referrerName: 'Alex Rivera',
    referrerHandle: '@alexr',
    referredName: 'Noah Patel',
    referredEmail: 'noah.p@example.com',
    plan: 'VIP Access',
    revenueCents: 99_990,
    commissionCents: 19_998,
    status: 'paid',
    createdAtMs: daysAgo(18),
  },
  {
    id: 'demo-ref-11',
    referrerName: 'Lana Brooks',
    referrerHandle: '@lanab',
    referredName: 'Riley Quinn',
    referredEmail: 'riley.q@example.com',
    plan: 'Monthly Pass',
    revenueCents: 19_990,
    commissionCents: 3_998,
    status: 'pending',
    createdAtMs: daysAgo(21),
  },
  {
    id: 'demo-ref-12',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanb',
    referredName: 'Casey Wu',
    referredEmail: 'casey.w@example.com',
    plan: 'Premium Picks',
    revenueCents: 29_990,
    commissionCents: 5_998,
    status: 'paid',
    createdAtMs: daysAgo(24),
  },
];

export const CREATOR_REFERRALS_DEMO_TOP = [
  { rank: 1, name: 'Jordan Blake', handle: '@jordanb', referrals: 48, revenueCents: 240_000 },
  { rank: 2, name: 'Sarah Chen', handle: '@sarahc', referrals: 36, revenueCents: 186_000 },
  { rank: 3, name: 'Alex Rivera', handle: '@alexr', referrals: 28, revenueCents: 142_000 },
  { rank: 4, name: 'Mike Torres', handle: '@miket', referrals: 22, revenueCents: 98_000 },
  { rank: 5, name: 'Lana Brooks', handle: '@lanab', referrals: 18, revenueCents: 76_000 },
] as const;

export const CREATOR_REFERRALS_TIPS = [
  'Offer competitive rewards so fans want to share.',
  'Promote your referral link in posts and emails.',
  'Highlight top referrers in your community.',
  'Keep cookie windows long enough for delayed signups.',
  'Pay out on time — trust drives more referrals.',
] as const;

export function shouldUseCreatorReferralsDemo(opts: {
  count: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.count === 0;
}

export function isCreatorReferralsDemoId(id: string): boolean {
  return id.startsWith('demo-ref-');
}
