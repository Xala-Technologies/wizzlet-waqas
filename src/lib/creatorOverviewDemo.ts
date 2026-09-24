/**
 * Sample overview data for design / PO review when the creator account is empty.
 * Numbers and lists aligned to the Prizelet Overview mockup.
 */

function demoAvatar(seed: string): string {
  return `https://api.dicebear.com/9.x/avataaars/png?seed=${encodeURIComponent(seed)}&size=80&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}

export const CREATOR_OVERVIEW_DEMO = {
  postCount: 24,
  mrrNet: 4320,
  postViews: 12_540,
  activeSubscribers: 1248,
  revenueTrend: { label: '↑ 18% vs. last month', positive: true as const },
  subscribersTrend: { label: '↑ 12% vs. last month', positive: true as const },
  postsTrend: { label: '↑ 33% vs. last month', positive: true as const },
  viewsTrend: { label: '↑ 27% vs. last month', positive: true as const },
  earningsBars: [
    { label: 'Aug', valueCents: 210_000 },
    { label: 'Sep', valueCents: 245_000 },
    { label: 'Oct', valueCents: 268_000 },
    { label: 'Nov', valueCents: 310_000 },
    { label: 'Dec', valueCents: 355_000 },
    { label: 'Jan', valueCents: 432_000 },
  ],
  recentSubscribers: [
    {
      id: 'demo-sub-1',
      name: 'Jordan Blake',
      whenLabel: '2 hours ago',
      tierLabel: 'VIP',
      tierTone: 'vip' as const,
      avatarUrl: demoAvatar('jordan-blake'),
    },
    {
      id: 'demo-sub-2',
      name: 'Sam Rivera',
      whenLabel: '5 hours ago',
      tierLabel: 'Premium',
      tierTone: 'monthly' as const,
      avatarUrl: demoAvatar('sam-rivera'),
    },
    {
      id: 'demo-sub-3',
      name: 'Alex Chen',
      whenLabel: '1 day ago',
      tierLabel: 'Active',
      tierTone: 'free' as const,
      avatarUrl: demoAvatar('alex-chen'),
    },
    {
      id: 'demo-sub-4',
      name: 'Casey Morgan',
      whenLabel: '2 days ago',
      tierLabel: 'VIP',
      tierTone: 'vip' as const,
      avatarUrl: demoAvatar('casey-morgan'),
    },
    {
      id: 'demo-sub-5',
      name: 'Riley Quinn',
      whenLabel: '3 days ago',
      tierLabel: 'Premium',
      tierTone: 'monthly' as const,
      avatarUrl: demoAvatar('riley-quinn'),
    },
  ],
  recentActivity: [
    {
      id: 'demo-act-1',
      title: 'New subscriber joined',
      whenLabel: '2 hours ago',
      amountLabel: '$29.99/mo',
      tone: 'subscriber' as const,
    },
    {
      id: 'demo-act-2',
      title: 'Payment received',
      whenLabel: '5 hours ago',
      amountLabel: '$29.99',
      tone: 'payment' as const,
    },
    {
      id: 'demo-act-3',
      title: 'New message from subscriber',
      whenLabel: '1 day ago',
      unread: true,
      tone: 'message' as const,
    },
    {
      id: 'demo-act-4',
      title: 'Your post reached 1,000 views',
      whenLabel: '2 days ago',
      tone: 'milestone' as const,
    },
  ],
  topProducts: [
    {
      id: 'demo-prod-1',
      name: 'Premium Picks',
      subscribersLabel: '842 subscribers',
      revenueLabel: '$2,180',
      growthLabel: '+12%',
      growthPositive: true,
      icon: 'crown' as const,
    },
    {
      id: 'demo-prod-2',
      name: 'VIP Access',
      subscribersLabel: '286 subscribers',
      revenueLabel: '$1,420',
      growthLabel: '+8%',
      growthPositive: true,
      icon: 'gem' as const,
    },
    {
      id: 'demo-prod-3',
      name: 'Daily Insights',
      subscribersLabel: '120 subscribers',
      revenueLabel: '$720',
      growthLabel: '+24%',
      growthPositive: true,
      icon: 'star' as const,
    },
  ],
} as const;

/** True when the logged-in creator has nothing meaningful to show on overview. */
export function shouldUseCreatorOverviewDemo(input: {
  postCount: number;
  settledPicks: number;
  activeSubscribers: number;
  netCents: number;
  pickCount: number;
}): boolean {
  return (
    input.postCount === 0 &&
    input.settledPicks === 0 &&
    input.activeSubscribers === 0 &&
    input.netCents === 0 &&
    input.pickCount === 0
  );
}
