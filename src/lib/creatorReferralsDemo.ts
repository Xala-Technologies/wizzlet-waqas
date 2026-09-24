/**
 * Sample Referrals management data aligned to the Prizelet Referrals mockup.
 */

const MOCK_NOW = Date.parse('2025-01-31T12:00:00.000Z');
const day = 86_400_000;
const daysAgo = (n: number) => MOCK_NOW - n * day;

export type DemoReferralStatus = 'paid' | 'approved' | 'pending' | 'fraud';

export type DemoReferralRow = {
  id: string;
  referrerName: string;
  referrerHandle: string;
  referredName: string;
  referredHandle: string;
  referredEmail: string | null;
  plan: string;
  revenueCents: number;
  commissionCents: number;
  status: DemoReferralStatus;
  createdAtMs: number;
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
    referrerHandle: '@jordanblake',
    referredName: 'Sam Lee',
    referredHandle: '@samlee',
    referredEmail: 'sam.lee@example.com',
    plan: 'Premium Picks',
    revenueCents: 2_999,
    commissionCents: 500,
    status: 'paid',
    createdAtMs: Date.parse('2025-01-30T15:00:00.000Z'),
  },
  {
    id: 'demo-ref-2',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanblake',
    referredName: 'Maya Ortiz',
    referredHandle: '@mayao',
    referredEmail: 'maya.o@example.com',
    plan: 'VIP Access',
    revenueCents: 9_999,
    commissionCents: 2_000,
    status: 'approved',
    createdAtMs: Date.parse('2025-01-29T14:00:00.000Z'),
  },
  {
    id: 'demo-ref-3',
    referrerName: 'Sarah Chen',
    referrerHandle: '@sarahchen',
    referredName: 'Daniel Park',
    referredHandle: '@danielp',
    referredEmail: 'daniel.park@example.com',
    plan: 'Monthly Pass',
    revenueCents: 1_999,
    commissionCents: 400,
    status: 'pending',
    createdAtMs: Date.parse('2025-01-28T12:00:00.000Z'),
  },
  {
    id: 'demo-ref-4',
    referrerName: 'Alex Rivera',
    referrerHandle: '@alexrivera',
    referredName: 'Chris Ng',
    referredHandle: '@chrisng',
    referredEmail: 'chris.ng@example.com',
    plan: 'Premium Picks',
    revenueCents: 2_999,
    commissionCents: 500,
    status: 'paid',
    createdAtMs: Date.parse('2025-01-27T11:00:00.000Z'),
  },
  {
    id: 'demo-ref-5',
    referrerName: 'Sarah Chen',
    referrerHandle: '@sarahchen',
    referredName: 'Priya Shah',
    referredHandle: '@priyas',
    referredEmail: 'priya@example.com',
    plan: 'VIP Access',
    revenueCents: 9_999,
    commissionCents: 2_000,
    status: 'approved',
    createdAtMs: Date.parse('2025-01-26T10:00:00.000Z'),
  },
  {
    id: 'demo-ref-6',
    referrerName: 'Mike Torres',
    referrerHandle: '@miketorres',
    referredName: 'Guest user',
    referredHandle: '@guest',
    referredEmail: null,
    plan: '—',
    revenueCents: 0,
    commissionCents: 0,
    status: 'pending',
    createdAtMs: Date.parse('2025-01-25T09:00:00.000Z'),
  },
  {
    id: 'demo-ref-7',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanblake',
    referredName: 'Taylor Kim',
    referredHandle: '@taylork',
    referredEmail: 'taylor.k@example.com',
    plan: 'Premium Picks',
    revenueCents: 2_999,
    commissionCents: 500,
    status: 'paid',
    createdAtMs: Date.parse('2025-01-24T16:00:00.000Z'),
  },
  {
    id: 'demo-ref-8',
    referrerName: 'Lana Brooks',
    referrerHandle: '@lanabrooks',
    referredName: 'Omar Hassan',
    referredHandle: '@omarh',
    referredEmail: 'omar.h@example.com',
    plan: 'Monthly Pass',
    revenueCents: 1_999,
    commissionCents: 400,
    status: 'fraud',
    createdAtMs: Date.parse('2025-01-23T13:00:00.000Z'),
  },
  {
    id: 'demo-ref-9',
    referrerName: 'Mike Torres',
    referrerHandle: '@miketorres',
    referredName: 'Elena Voss',
    referredHandle: '@elenav',
    referredEmail: 'elena.v@example.com',
    plan: 'Premium Picks',
    revenueCents: 2_999,
    commissionCents: 500,
    status: 'approved',
    createdAtMs: Date.parse('2025-01-22T12:00:00.000Z'),
  },
  {
    id: 'demo-ref-10',
    referrerName: 'Alex Rivera',
    referrerHandle: '@alexrivera',
    referredName: 'Noah Patel',
    referredHandle: '@noahp',
    referredEmail: 'noah.p@example.com',
    plan: 'VIP Access',
    revenueCents: 9_999,
    commissionCents: 2_000,
    status: 'paid',
    createdAtMs: Date.parse('2025-01-21T11:00:00.000Z'),
  },
  {
    id: 'demo-ref-11',
    referrerName: 'Lana Brooks',
    referrerHandle: '@lanabrooks',
    referredName: 'Riley Quinn',
    referredHandle: '@rileyq',
    referredEmail: 'riley.q@example.com',
    plan: 'Monthly Pass',
    revenueCents: 1_999,
    commissionCents: 400,
    status: 'pending',
    createdAtMs: Date.parse('2025-01-20T10:00:00.000Z'),
  },
  {
    id: 'demo-ref-12',
    referrerName: 'Jordan Blake',
    referrerHandle: '@jordanblake',
    referredName: 'Casey Wu',
    referredHandle: '@caseyw',
    referredEmail: 'casey.w@example.com',
    plan: 'Premium Picks',
    revenueCents: 2_999,
    commissionCents: 500,
    status: 'paid',
    createdAtMs: daysAgo(24),
  },
];

export const CREATOR_REFERRALS_DEMO_TOP = [
  { rank: 1, name: 'Jordan Blake', handle: '@jordanblake', referrals: 48, revenueCents: 240_000 },
  { rank: 2, name: 'Sarah Chen', handle: '@sarahchen', referrals: 36, revenueCents: 186_000 },
  { rank: 3, name: 'Alex Rivera', handle: '@alexrivera', referrals: 28, revenueCents: 142_000 },
  { rank: 4, name: 'Mike Torres', handle: '@miketorres', referrals: 22, revenueCents: 98_000 },
  { rank: 5, name: 'Lana Brooks', handle: '@lanabrooks', referrals: 18, revenueCents: 76_000 },
] as const;

export const CREATOR_REFERRALS_TIPS = [
  'Offer competitive rewards so fans want to share.',
  'Promote your referral link in posts, bios, and emails.',
  'Highlight top referrers in your community.',
  'Make it easy to share with a short link and QR code.',
  'Track and optimize which channels drive the best referrals.',
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
