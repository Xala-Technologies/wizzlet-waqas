export type SupportCategoryId =
  | 'getting-started'
  | 'payments'
  | 'subscribers'
  | 'discord'
  | 'telegram'
  | 'account';

export type SupportCategory = {
  id: SupportCategoryId;
  title: string;
  description: string;
  icon: 'book' | 'wallet' | 'users' | 'discord' | 'send' | 'settings';
};

export type SupportArticle = {
  id: string;
  categoryId: SupportCategoryId;
  title: string;
  body: string;
};

export const CREATOR_SUPPORT_CATEGORIES: SupportCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your page, create products and make your first post.',
    icon: 'book',
  },
  {
    id: 'payments',
    title: 'Payments & Payouts',
    description: 'Information about payments, payout schedules and taxes.',
    icon: 'wallet',
  },
  {
    id: 'subscribers',
    title: 'Subscribers & Access',
    description: 'Manage subscribers, content access and subscription settings.',
    icon: 'users',
  },
  {
    id: 'discord',
    title: 'Discord Integration',
    description: 'Connect your Discord server and manage VIP roles.',
    icon: 'discord',
  },
  {
    id: 'telegram',
    title: 'Telegram Integration',
    description: 'Set up Telegram groups and manage member access.',
    icon: 'send',
  },
  {
    id: 'account',
    title: 'Account & Settings',
    description: 'Update your profile, billing details and platform settings.',
    icon: 'settings',
  },
];

export const CREATOR_SUPPORT_ARTICLES: SupportArticle[] = [
  {
    id: 'create-product',
    categoryId: 'getting-started',
    title: 'How to create a product',
    body: 'Go to Products and add a paid plan, one-time drop, or VIP access. Set the price, write what subscribers get, then publish. Fans check out with Stripe. Prizelet takes a percent of each payment — you keep the rest.',
  },
  {
    id: 'payouts',
    categoryId: 'payments',
    title: 'How payouts work',
    body: 'Net earnings after the Prizelet fee are requested from Payouts and paid manually by the platform until Stripe Connect is enabled. Prizelet does not charge your card.',
  },
  {
    id: 'connect-discord',
    categoryId: 'discord',
    title: 'How to connect Discord',
    body: 'Open Settings → Integrations and install the Prizelet bot on your Discord server. Map each product to a role so paying members get access automatically when their payment succeeds.',
  },
  {
    id: 'telegram-access',
    categoryId: 'telegram',
    title: 'How to set up Telegram access',
    body: 'Telegram group invites are managed from Integrations. Link a group, then map it to a product so subscribers receive an invite after they pay. Remove access if their subscription ends.',
  },
  {
    id: 'subscriber-cancels',
    categoryId: 'subscribers',
    title: 'What happens when a subscriber cancels?',
    body: 'They keep access until the paid period ends. After that, Discord roles and gated posts are removed. Past payments stay in Transactions. You can still message them from Subscribers if they remain on the platform.',
  },
];

export const CREATOR_SUPPORT_POPULAR_IDS = [
  'create-product',
  'payouts',
  'connect-discord',
  'telegram-access',
  'subscriber-cancels',
] as const;
