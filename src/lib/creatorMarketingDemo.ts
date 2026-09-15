/**
 * Sample Grow Your Audience / Marketing data for design review when analytics are empty.
 */

export const CREATOR_MARKETING_DEMO_METRICS = {
  newSubscribers: 48,
  newSubscribersDelta: 18,
  profileViews: 2840,
  profileViewsDelta: 12,
  linkClicks: 1256,
  linkClicksDelta: 15,
  conversionRate: 4.2,
  conversionRateDelta: 0.8,
} as const;

export const CREATOR_MARKETING_DEMO_GROWTH = [
  { label: 'Week 1', subscribers: 820 },
  { label: 'Week 2', subscribers: 845 },
  { label: 'Week 3', subscribers: 868 },
  { label: 'Week 4', subscribers: 892 },
];

export const CREATOR_MARKETING_DEMO_TRAFFIC = [
  { name: 'Instagram', value: 38, color: 'hsl(316 70% 55%)' },
  { name: 'X / Twitter', value: 24, color: 'hsl(199 89% 48%)' },
  { name: 'Direct', value: 18, color: 'hsl(239 84% 67%)' },
  { name: 'Referrals', value: 12, color: 'hsl(160 84% 39%)' },
  { name: 'Other', value: 8, color: 'hsl(38 92% 50%)' },
];

export type DemoCampaignRow = {
  id: string;
  name: string;
  channel: string;
  status: 'active' | 'paused' | 'ended';
  reach: number;
  conversions: number;
};

export const CREATOR_MARKETING_DEMO_CAMPAIGNS: DemoCampaignRow[] = [
  {
    id: 'demo-camp-1',
    name: 'SUMMER20 launch',
    channel: 'Promo code',
    status: 'active',
    reach: 1240,
    conversions: 86,
  },
  {
    id: 'demo-camp-2',
    name: 'Instagram bio link',
    channel: 'Tracking link',
    status: 'active',
    reach: 980,
    conversions: 42,
  },
  {
    id: 'demo-camp-3',
    name: 'VIP forever offer',
    channel: 'Promo code',
    status: 'paused',
    reach: 410,
    conversions: 19,
  },
  {
    id: 'demo-camp-4',
    name: 'Referral push',
    channel: 'Referral',
    status: 'ended',
    reach: 620,
    conversions: 31,
  },
];

export function shouldUseCreatorMarketingDemo(input: {
  linkClicks: number;
  profileViews: number;
  promoCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.linkClicks === 0 && input.profileViews === 0 && input.promoCount === 0;
}
