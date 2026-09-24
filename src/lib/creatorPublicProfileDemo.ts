/**
 * Sample public creator profile (AlexPicks mock) for design review
 * when the live profile has little to show, or ?demo=1.
 */

export type CreatorProfileDemoProduct = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  billingPeriod: 'monthly';
  isFeatured: boolean;
  ctaLabel: string;
  features: string[];
  icon: 'chart' | 'gem' | 'users';
};

export type CreatorProfileDemo = {
  username: string;
  displayName: string;
  bio: string;
  about: string;
  avatarUrl: string;
  bannerUrl: string;
  tags: string[];
  followersLabel: string;
  memberSinceLabel: string;
  online: boolean;
  subscribePriceCents: number;
  winRate: number;
  totalProfitUnits: number;
  roiPct: number;
  subscribersLabel: string;
  products: CreatorProfileDemoProduct[];
  pillars: { title: string; icon: 'chart' | 'users' | 'shield' | 'heart' }[];
};

export const CREATOR_PUBLIC_PROFILE_DEMO: CreatorProfileDemo = {
  username: 'alexpicks',
  displayName: 'AlexPicks',
  bio: 'Sports betting analysis, data-driven picks, and a community built for long-term profit. Join thousands of members and start winning together.',
  about:
    "I'm a full-time sports betting analyst focused on transparent, data-driven picks — not gambling hype. Every play comes with clear reasoning so you can learn the process, not just chase results. Long-term profit and a supportive community are the goal.",
  avatarUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  bannerUrl:
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&h=600&fit=crop',
  tags: ['NBA', 'NFL', 'UFC', 'Tennis'],
  followersLabel: '12.4K followers',
  memberSinceLabel: 'Member since Jan 2024',
  online: true,
  subscribePriceCents: 2999,
  winRate: 68,
  totalProfitUnits: 124,
  roiPct: 12.8,
  subscribersLabel: '1.2K',
  products: [
    {
      id: 'demo-prod-premium',
      name: 'Premium Picks',
      description: 'Daily picks with full analysis for serious members.',
      priceCents: 2999,
      billingPeriod: 'monthly',
      isFeatured: true,
      ctaLabel: 'Get Started',
      icon: 'chart',
      features: [
        'Daily picks with analysis',
        'Access to private community',
        'Early access to plays',
        'Win more together',
      ],
    },
    {
      id: 'demo-prod-vip',
      name: 'VIP Access',
      description: 'Everything in Premium plus exclusive strategies and live chats.',
      priceCents: 4999,
      billingPeriod: 'monthly',
      isFeatured: false,
      ctaLabel: 'Get Started',
      icon: 'gem',
      features: [
        'All Premium features',
        'Exclusive strategies',
        'Live chats with Alex',
        'Priority support',
      ],
    },
    {
      id: 'demo-prod-free',
      name: 'Free Community',
      description: 'Get started with weekly insights and community discussions.',
      priceCents: 0,
      billingPeriod: 'monthly',
      isFeatured: false,
      ctaLabel: 'Join Free',
      icon: 'users',
      features: [
        'Weekly insights',
        'Community discussions',
        'Free picks (limited)',
        'Be part of the community',
      ],
    },
  ],
  pillars: [
    { title: 'Data-driven approach', icon: 'chart' },
    { title: 'Transparent and honest', icon: 'users' },
    { title: 'Long-term profit focus', icon: 'shield' },
    { title: 'A supportive community', icon: 'heart' },
  ],
};

export function shouldUseCreatorPublicProfileDemo(opts: {
  forceDemo: boolean;
  disableDemo: boolean;
  /** True when live profile has products or settled performance to show */
  hasMeaningfulContent: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return !opts.hasMeaningfulContent;
}

export function isCreatorProfileDemoProductId(id: string): boolean {
  return id.startsWith('demo-prod-');
}
