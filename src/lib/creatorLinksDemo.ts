/**
 * Sample Links management data for design review when the creator has no tracking links.
 * Aligned to the Prizelet Links mockup.
 */

export type DemoLinkStatus = 'active' | 'paused';

export type DemoCreatorLink = {
  id: string;
  name: string;
  shortSlug: string;
  url: string;
  clicks: number;
  signUps: number;
  conversions: number;
  revenueCents: number;
  status: DemoLinkStatus;
};

export const CREATOR_LINKS_DEMO_METRICS = {
  totalClicks: 1_248,
  totalClicksDelta: 28,
  signUps: 642,
  signUpsDelta: 34,
  paidConversions: 312,
  paidConversionsDelta: 27,
  revenueCents: 1_248_000,
  revenueDelta: 41,
  dateRangeLabel: 'Jan 1, 2025 – Jan 31, 2025',
} as const;

export const CREATOR_LINKS_DEMO_ROWS: DemoCreatorLink[] = [
  {
    id: 'demo-link-1',
    name: 'Main Link',
    shortSlug: 'main',
    url: 'https://prizelet.com/c/alexpicks',
    clicks: 486,
    signUps: 124,
    conversions: 68,
    revenueCents: 412_000,
    status: 'active',
  },
  {
    id: 'demo-link-2',
    name: 'VIP Access',
    shortSlug: 'vip',
    url: 'https://prizelet.com/c/alexpicks?plan=vip',
    clicks: 312,
    signUps: 86,
    conversions: 54,
    revenueCents: 328_500,
    status: 'active',
  },
  {
    id: 'demo-link-3',
    name: 'Free Picks',
    shortSlug: 'free',
    url: 'https://prizelet.com/c/alexpicks?utm=free',
    clicks: 198,
    signUps: 92,
    conversions: 28,
    revenueCents: 84_200,
    status: 'active',
  },
  {
    id: 'demo-link-4',
    name: 'Instagram Bio',
    shortSlug: 'ig',
    url: 'https://prizelet.com/c/alexpicks?utm=ig',
    clicks: 164,
    signUps: 71,
    conversions: 42,
    revenueCents: 156_800,
    status: 'active',
  },
  {
    id: 'demo-link-5',
    name: 'X / Twitter pin',
    shortSlug: 'x',
    url: 'https://prizelet.com/c/alexpicks?utm=x',
    clicks: 98,
    signUps: 38,
    conversions: 21,
    revenueCents: 72_400,
    status: 'paused',
  },
  {
    id: 'demo-link-6',
    name: 'YouTube description',
    shortSlug: 'yt',
    url: 'https://prizelet.com/c/alexpicks?utm=yt',
    clicks: 86,
    signUps: 44,
    conversions: 19,
    revenueCents: 61_200,
    status: 'active',
  },
  {
    id: 'demo-link-7',
    name: 'Discord welcome',
    shortSlug: 'discord',
    url: 'https://prizelet.com/c/alexpicks?utm=discord',
    clicks: 74,
    signUps: 52,
    conversions: 31,
    revenueCents: 98_100,
    status: 'active',
  },
  {
    id: 'demo-link-8',
    name: 'TikTok bio',
    shortSlug: 'tt',
    url: 'https://prizelet.com/c/alexpicks?utm=tt',
    clicks: 52,
    signUps: 29,
    conversions: 14,
    revenueCents: 41_600,
    status: 'paused',
  },
  {
    id: 'demo-link-9',
    name: 'Email footer',
    shortSlug: 'email',
    url: 'https://prizelet.com/c/alexpicks?utm=email',
    clicks: 41,
    signUps: 22,
    conversions: 12,
    revenueCents: 38_400,
    status: 'active',
  },
  {
    id: 'demo-link-10',
    name: 'Podcast shoutout',
    shortSlug: 'pod',
    url: 'https://prizelet.com/c/alexpicks?utm=pod',
    clicks: 37,
    signUps: 18,
    conversions: 9,
    revenueCents: 28_800,
    status: 'active',
  },
];

export const CREATOR_LINKS_DEMO_TOP = [
  { rank: 1, name: 'Main Link', shortSlug: 'main', clicks: 486, revenueCents: 412_000 },
  { rank: 2, name: 'VIP Access', shortSlug: 'vip', clicks: 312, revenueCents: 328_500 },
  { rank: 3, name: 'Instagram Bio', shortSlug: 'ig', clicks: 164, revenueCents: 156_800 },
  { rank: 4, name: 'Discord welcome', shortSlug: 'discord', clicks: 74, revenueCents: 98_100 },
  { rank: 5, name: 'Free Picks', shortSlug: 'free', clicks: 198, revenueCents: 84_200 },
] as const;

export const CREATOR_LINKS_TIPS = [
  'Use short, memorable link names so fans recognize them.',
  'Put your main link in every social bio and pin it.',
  'Create one link per channel so you can see what converts.',
  'Pair each link with a matching promo code when running a campaign.',
  'Pause underperforming links and double down on winners.',
] as const;

export function shouldUseCreatorLinksDemo(opts: {
  count: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.count === 0;
}

export function isCreatorLinksDemoId(id: string): boolean {
  return id.startsWith('demo-link-');
}
