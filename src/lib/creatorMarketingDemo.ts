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

/** Daily multi-series chart for clicks / signups / conversions. */
export const CREATOR_MARKETING_DEMO_SERIES: Array<{
  label: string;
  clicks: number;
  signUps: number;
  conversions: number;
}> = [
  { label: 'Jan 1', clicks: 98, signUps: 14, conversions: 6 },
  { label: 'Jan 4', clicks: 112, signUps: 18, conversions: 8 },
  { label: 'Jan 7', clicks: 128, signUps: 22, conversions: 9 },
  { label: 'Jan 10', clicks: 146, signUps: 24, conversions: 11 },
  { label: 'Jan 13', clicks: 162, signUps: 28, conversions: 12 },
  { label: 'Jan 16', clicks: 178, signUps: 31, conversions: 14 },
  { label: 'Jan 19', clicks: 195, signUps: 34, conversions: 15 },
  { label: 'Jan 22', clicks: 210, signUps: 38, conversions: 17 },
  { label: 'Jan 25', clicks: 228, signUps: 42, conversions: 19 },
  { label: 'Jan 28', clicks: 246, signUps: 46, conversions: 21 },
  { label: 'Jan 31', clicks: 258, signUps: 48, conversions: 22 },
];

export const CREATOR_MARKETING_DEMO_TRAFFIC = [
  { name: 'Direct', value: 32, color: 'hsl(217 91% 60%)' },
  { name: 'Instagram', value: 24, color: 'hsl(280 70% 55%)' },
  { name: 'Twitter / X', value: 18, color: 'hsl(199 89% 48%)' },
  { name: 'YouTube', value: 14, color: 'hsl(160 84% 39%)' },
  { name: 'TikTok', value: 8, color: 'hsl(45 93% 47%)' },
  { name: 'Other', value: 4, color: 'hsl(215 16% 55%)' },
];

export type DemoPlatformCard = {
  id: string;
  name: string;
  clicks: number;
  delta: number;
  tone: string;
  href: string;
};

export const CREATOR_MARKETING_DEMO_PLATFORMS: DemoPlatformCard[] = [
  {
    id: 'ig',
    name: 'Instagram',
    clicks: 1_037,
    delta: 22,
    tone: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-400',
    href: '/creator/links',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    clicks: 778,
    delta: 18,
    tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
    href: '/creator/links',
  },
  {
    id: 'yt',
    name: 'YouTube',
    clicks: 605,
    delta: 31,
    tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
    href: '/creator/links',
  },
  {
    id: 'tt',
    name: 'TikTok',
    clicks: 346,
    delta: 14,
    tone: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
    href: '/creator/links',
  },
];

export type DemoCampaignRow = {
  id: string;
  dateLabel: string;
  type: 'Promo Code' | 'Link' | 'Social Post' | 'Referral';
  name: string;
  clicks: number;
  signUps: number;
  conversions: number;
  revenueCents: number;
  status: 'active' | 'completed' | 'paused';
};

export const CREATOR_MARKETING_DEMO_CAMPAIGNS: DemoCampaignRow[] = [
  {
    id: 'demo-camp-1',
    dateLabel: 'Jan 30, 2025',
    type: 'Promo Code',
    name: 'LAKERS25',
    clicks: 120,
    signUps: 24,
    conversions: 12,
    revenueCents: 59_988,
    status: 'active',
  },
  {
    id: 'demo-camp-2',
    dateLabel: 'Jan 25, 2025',
    type: 'Social Post',
    name: 'Instagram Reel',
    clicks: 320,
    signUps: 64,
    conversions: 28,
    revenueCents: 98_440,
    status: 'completed',
  },
  {
    id: 'demo-camp-3',
    dateLabel: 'Jan 18, 2025',
    type: 'Link',
    name: 'Bio → Premium',
    clicks: 486,
    signUps: 72,
    conversions: 38,
    revenueCents: 142_200,
    status: 'active',
  },
  {
    id: 'demo-camp-4',
    dateLabel: 'Jan 12, 2025',
    type: 'Referral',
    name: 'Friend invite push',
    clicks: 210,
    signUps: 41,
    conversions: 19,
    revenueCents: 71_100,
    status: 'completed',
  },
  {
    id: 'demo-camp-5',
    dateLabel: 'Jan 5, 2025',
    type: 'Promo Code',
    name: 'VIPFOREVER',
    clicks: 98,
    signUps: 18,
    conversions: 9,
    revenueCents: 89_910,
    status: 'paused',
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
