/**
 * Sample Marketing overview data aligned to the Prizelet Marketing mockup.
 */

export const CREATOR_MARKETING_DEMO_METRICS = {
  totalClicks: 4_320,
  totalClicksDelta: 28,
  signUps: 642,
  signUpsDelta: 34,
  paidConversions: 312,
  paidConversionsDelta: 27,
  revenueCents: 1_248_000,
  revenueDelta: 41,
  dateRangeLabel: 'Jan 1, 2025 – Jan 31, 2025',
} as const;

export type MarketingChartMetric = 'revenue' | 'clicks' | 'signUps' | 'conversions';

/** Daily series for Marketing Revenue chart (tabs switch the plotted metric). */
export const CREATOR_MARKETING_DEMO_SERIES: Array<{
  label: string;
  revenue: number;
  clicks: number;
  signUps: number;
  conversions: number;
}> = [
  { label: 'Jan 1', revenue: 280, clicks: 98, signUps: 14, conversions: 6 },
  { label: 'Jan 4', revenue: 340, clicks: 112, signUps: 18, conversions: 8 },
  { label: 'Jan 7', revenue: 420, clicks: 128, signUps: 22, conversions: 9 },
  { label: 'Jan 10', revenue: 510, clicks: 146, signUps: 24, conversions: 11 },
  { label: 'Jan 13', revenue: 580, clicks: 162, signUps: 28, conversions: 12 },
  { label: 'Jan 16', revenue: 690, clicks: 178, signUps: 31, conversions: 14 },
  { label: 'Jan 19', revenue: 780, clicks: 195, signUps: 34, conversions: 15 },
  { label: 'Jan 22', revenue: 920, clicks: 210, signUps: 38, conversions: 17 },
  { label: 'Jan 25', revenue: 1_080, clicks: 228, signUps: 42, conversions: 19 },
  { label: 'Jan 28', revenue: 1_240, clicks: 246, signUps: 46, conversions: 21 },
  { label: 'Jan 31', revenue: 1_420, clicks: 258, signUps: 48, conversions: 22 },
];

export const CREATOR_MARKETING_DEMO_TRAFFIC = [
  { name: 'Direct', value: 32, color: 'hsl(239 84% 60%)' },
  { name: 'Instagram', value: 24, color: 'hsl(280 70% 55%)' },
  { name: 'Twitter / X', value: 18, color: 'hsl(199 89% 48%)' },
  { name: 'YouTube', value: 14, color: 'hsl(160 84% 39%)' },
  { name: 'TikTok', value: 8, color: 'hsl(45 93% 47%)' },
  { name: 'Other', value: 4, color: 'hsl(215 16% 55%)' },
];

export type DemoManageCard = {
  id: 'promo' | 'links' | 'referrals';
  title: string;
  href: string;
  manageLabel: string;
  manageTone: 'primary' | 'emerald';
  stats: Array<{ label: string; value: string }>;
};

export const CREATOR_MARKETING_DEMO_MANAGE: DemoManageCard[] = [
  {
    id: 'promo',
    title: 'Promo Codes',
    href: '/creator/promo/codes',
    manageLabel: 'Manage Promo Codes',
    manageTone: 'primary',
    stats: [
      { label: 'Active codes', value: '12' },
      { label: 'Revenue generated', value: '$4,320' },
      { label: 'Total uses', value: '642' },
    ],
  },
  {
    id: 'links',
    title: 'Links',
    href: '/creator/links',
    manageLabel: 'Manage Links',
    manageTone: 'primary',
    stats: [
      { label: 'Active links', value: '8' },
      { label: 'Total clicks', value: '4,320' },
      { label: 'Conversion rate', value: '18.4%' },
    ],
  },
  {
    id: 'referrals',
    title: 'Referrals',
    href: '/creator/referrals',
    manageLabel: 'Manage Referrals',
    manageTone: 'emerald',
    stats: [
      { label: 'Active referrers', value: '24' },
      { label: 'Revenue generated', value: '$3,120' },
      { label: 'New customers', value: '156' },
    ],
  },
];

export type DemoActivityRow = {
  id: string;
  dateLabel: string;
  type: 'Promo Code' | 'Link' | 'Referral';
  name: string;
  details: string;
  clicks: number;
  conversions: number;
  revenueCents: number;
};

export const CREATOR_MARKETING_DEMO_ACTIVITY: DemoActivityRow[] = [
  {
    id: 'demo-act-1',
    dateLabel: 'Jan 30, 2025',
    type: 'Promo Code',
    name: 'LAKERS25',
    details: '25% off — used by 12 customers',
    clicks: 120,
    conversions: 12,
    revenueCents: 59_988,
  },
  {
    id: 'demo-act-2',
    dateLabel: 'Jan 29, 2025',
    type: 'Link',
    name: 'twitter-bio',
    details: 'Link from Twitter bio',
    clicks: 542,
    conversions: 38,
    revenueCents: 152_062,
  },
  {
    id: 'demo-act-3',
    dateLabel: 'Jan 28, 2025',
    type: 'Referral',
    name: '@sportsfanatic',
    details: 'Referred 5 new customers',
    clicks: 87,
    conversions: 5,
    revenueCents: 24_995,
  },
  {
    id: 'demo-act-4',
    dateLabel: 'Jan 27, 2025',
    type: 'Promo Code',
    name: 'NBA50',
    details: '50% off — used by 8 customers',
    clicks: 64,
    conversions: 8,
    revenueCents: 31_992,
  },
  {
    id: 'demo-act-5',
    dateLabel: 'Jan 26, 2025',
    type: 'Link',
    name: 'youtube-description',
    details: 'Link from YouTube description',
    clicks: 312,
    conversions: 24,
    revenueCents: 124_076,
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
