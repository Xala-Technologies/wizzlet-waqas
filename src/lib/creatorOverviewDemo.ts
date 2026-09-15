/**
 * Sample overview data for design / PO review when the creator account is empty.
 * Not billed as real metrics — UI shows a clear preview banner.
 */

export const CREATOR_OVERVIEW_DEMO = {
  postCount: 24,
  mrrNet: 1840,
  winRatePct: 68,
  settledPicks: 42,
  activeSubscribers: 128,
  revenueTrend: { label: '↑ 12%', positive: true as const },
  verificationPercent: 84,
  verificationTitle: 'Profile setup',
  verificationDetail: '42/50 settled picks toward verification readiness.',
  earningsBars: [
    { label: '04', valueCents: 92000 },
    { label: '05', valueCents: 110000 },
    { label: '06', valueCents: 98000 },
    { label: '07', valueCents: 145000 },
    { label: '08', valueCents: 162000 },
    { label: '09', valueCents: 184000 },
  ],
  recentPicks: [
    {
      id: 'demo-pick-1',
      dateLabel: '2026-09-14',
      event: 'Lakers vs Celtics — Lakers -3.5',
      sport: 'NBA',
      result: 'win' as const,
      profitLabel: '+1.91u',
      profitPositive: true,
    },
    {
      id: 'demo-pick-2',
      dateLabel: '2026-09-13',
      event: 'Chiefs ML',
      sport: 'NFL',
      result: 'win' as const,
      profitLabel: '+0.91u',
      profitPositive: true,
    },
    {
      id: 'demo-pick-3',
      dateLabel: '2026-09-12',
      event: 'Yankees / Dodgers Over 8.5',
      sport: 'MLB',
      result: 'loss' as const,
      profitLabel: '-1.00u',
      profitPositive: false,
    },
    {
      id: 'demo-pick-4',
      dateLabel: '2026-09-11',
      event: 'Arsenal -0.5 AH',
      sport: 'Soccer',
      result: 'push' as const,
      profitLabel: '0.00u',
    },
    {
      id: 'demo-pick-5',
      dateLabel: '2026-09-10',
      event: 'Djokovic ML',
      sport: 'Tennis',
      result: 'pending' as const,
      profitLabel: '—',
    },
  ],
  recentSubscribers: [
    {
      id: 'demo-sub-1',
      name: 'Jordan Blake',
      whenLabel: '2 hours ago',
      tierLabel: 'VIP',
      tierTone: 'vip' as const,
    },
    {
      id: 'demo-sub-2',
      name: 'Sam Rivera',
      whenLabel: '1 day ago',
      tierLabel: 'Monthly',
      tierTone: 'monthly' as const,
    },
    {
      id: 'demo-sub-3',
      name: 'Alex Chen',
      whenLabel: '2 days ago',
      tierLabel: 'Monthly',
      tierTone: 'monthly' as const,
    },
    {
      id: 'demo-sub-4',
      name: 'Casey Morgan',
      whenLabel: '3 days ago',
      tierLabel: 'VIP',
      tierTone: 'vip' as const,
    },
  ],
  messages: [
    {
      id: 'demo-msg-1',
      name: 'Jordan Blake',
      preview: 'Loved the Lakers write-up — any lean on the rematch?',
      whenLabel: '35 minutes ago',
      unread: 2,
    },
    {
      id: 'demo-msg-2',
      name: 'Sam Rivera',
      preview: 'Can I upgrade to VIP mid-cycle?',
      whenLabel: '3 hours ago',
      unread: 0,
    },
    {
      id: 'demo-msg-3',
      name: 'Alex Chen',
      preview: 'Thanks for the NFL card this week.',
      whenLabel: 'Yesterday',
      unread: 0,
    },
  ],
  topPicks: [
    {
      id: 'demo-top-1',
      label: 'NBA spreads',
      winRateLabel: '72% win · 18 settled',
      profitLabel: '+14.2u',
    },
    {
      id: 'demo-top-2',
      label: 'NFL moneylines',
      winRateLabel: '65% win · 12 settled',
      profitLabel: '+8.4u',
    },
    {
      id: 'demo-top-3',
      label: 'Soccer AH',
      winRateLabel: '58% win · 8 settled',
      profitLabel: '+3.1u',
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
