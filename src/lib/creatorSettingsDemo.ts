/**
 * Sample Settings values for design review when the profile is empty.
 */

export const CREATOR_SETTINGS_DEMO = {
  displayName: 'AlexPicks',
  email: 'alex@prizelet.com',
  bio: 'Sports analyst | Daily picks | Helping you win more.',
  language: 'en-US',
  timezone: 'Europe/Tallinn',
  dateFormat: 'MMM d, yyyy',
  draftByDefault: false,
  commentsEnabled: true,
  accountStatus: 'Active' as const,
  statusChecks: [
    'Email verified',
    'Identity verified',
    'Payout method added',
    'No active restrictions',
  ],
} as const;

export const CREATOR_SETTINGS_STATUS_COPY =
  'Your account is in good standing. Keep creating and growing!';

export const CREATOR_BRANDING_DEMO = {
  brandName: 'AlexPicks',
  primaryColor: '#6366F1',
  secondaryColor: '#0F172A',
  accentColor: '#10B981',
  font: 'inter',
  previewBio: 'Sports analyst | Daily picks | Helping you win more.',
} as const;

export const CREATOR_BRANDING_TIPS = [
  'Use a high-quality logo',
  'Keep your brand name short and memorable',
  'Choose colors that match your content',
  'Test contrast so text stays readable',
  'Stay consistent across emails and share links',
] as const;

export const CREATOR_BRANDING_INFO =
  'These branding settings appear on your public page, emails, and share links.';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TeamMemberStatus = 'active' | 'invited' | 'disabled';

export type DemoTeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  status: TeamMemberStatus;
  joinedLabel: string;
  isYou?: boolean;
  avatarTone: string;
};

export const CREATOR_TEAM_DEMO_MEMBERS: DemoTeamMember[] = [
  {
    id: 'demo-team-1',
    name: 'AlexPicks',
    email: 'alex@prizelet.com',
    role: 'owner',
    status: 'active',
    joinedLabel: 'Jan 15, 2025',
    isYou: true,
    avatarTone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  },
  {
    id: 'demo-team-2',
    name: 'Waqas',
    email: 'waqas@prizelet.com',
    role: 'admin',
    status: 'active',
    joinedLabel: 'Jan 16, 2025',
    avatarTone: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  },
];

export const CREATOR_TEAM_ROLE_PERMISSIONS: Array<{
  role: TeamRole;
  title: string;
  description: string;
}> = [
  {
    role: 'owner',
    title: 'Owner',
    description: 'Full access to all settings and features.',
  },
  {
    role: 'admin',
    title: 'Admin',
    description: 'Can manage content, products, and most settings.',
  },
  {
    role: 'member',
    title: 'Member',
    description: 'Can create and manage content.',
  },
  {
    role: 'viewer',
    title: 'Viewer',
    description: 'Can view analytics and basic information.',
  },
];

export const CREATOR_BILLING_DEMO = {
  planName: 'Pro Plan',
  planDescription: 'Everything you need to grow your business.',
  planPriceLabel: '$49/month',
  planAmount: '$49.00',
  nextBillingDate: 'Feb 15, 2025',
  features: [
    'Unlimited products',
    'Unlimited subscribers',
    'Advanced analytics',
    'Custom domain',
    'Priority support',
  ],
  paymentBrand: 'Visa',
  paymentLast4: '4242',
  paymentExpiry: '04/2027',
  billingName: 'AlexPicks',
  billingEmail: 'alex@prizelet.com',
  billingAddress: '123 Creator St',
  billingCity: 'Tallinn',
  billingCountry: 'Estonia',
  billingZip: '10115',
} as const;

export const CREATOR_BILLING_HISTORY: Array<{
  id: string;
  dateLabel: string;
  amount: string;
  status: 'paid';
}> = [
  { id: 'inv-1', dateLabel: 'Jan 15, 2025', amount: '$49.00', status: 'paid' },
  { id: 'inv-2', dateLabel: 'Dec 15, 2024', amount: '$49.00', status: 'paid' },
  { id: 'inv-3', dateLabel: 'Nov 15, 2024', amount: '$49.00', status: 'paid' },
  { id: 'inv-4', dateLabel: 'Oct 15, 2024', amount: '$49.00', status: 'paid' },
  { id: 'inv-5', dateLabel: 'Sep 15, 2024', amount: '$49.00', status: 'paid' },
];

export const CREATOR_INTEGRATIONS_CATALOG: Array<{
  id: string;
  name: string;
  description: string;
  tone: string;
}> = [
  {
    id: 'discord',
    name: 'Discord',
    description: 'Automate access for your community.',
    tone: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Automate access for your channel.',
    tone: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payments, subscriptions and payouts.',
    tone: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  },
  {
    id: 'paypal',
    name: 'PayPal',
    description: 'Receive payments globally.',
    tone: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  },
  {
    id: 'ga',
    name: 'Google Analytics',
    description: 'Track your website traffic and performance.',
    tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  },
  {
    id: 'meta',
    name: 'Meta Pixel',
    description: 'Track conversions from ads.',
    tone: 'bg-blue-600/15 text-blue-800 dark:text-blue-300',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows between apps.',
    tone: 'bg-orange-500/15 text-orange-700 dark:text-orange-400',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Sync your content and grow faster.',
    tone: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Connect your TikTok account.',
    tone: 'bg-foreground/10 text-foreground',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    description: 'Connect your X account.',
    tone: 'bg-foreground/10 text-foreground',
  },
  {
    id: 'email',
    name: 'Email Provider',
    description: 'Connect with your email marketing tool.',
    tone: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Send data to your own applications.',
    tone: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
  },
];

export const CREATOR_INTEGRATIONS_GROWTH = [
  'Easily connect your existing tools',
  'Automate your workflow',
  'Unlock more growth opportunities',
] as const;

export const CREATOR_INTEGRATIONS_TIPS = [
  'Connect Discord to auto-assign subscriber roles.',
  'Keep guild and role IDs private — only paste from Discord developer tools.',
  'X / Twitter sign-in is managed from your login provider.',
  'Reconnect after changing bots or permissions.',
] as const;

export const CREATOR_NOTIFICATIONS_TIPS = [
  'Stay updated on new subscribers and sales',
  'Never miss a payout status update',
  'Get message alerts so fans get a reply faster',
  'Critical security alerts will always be sent',
  'You can change these anytime',
] as const;

export const CREATOR_SECURITY_TIPS = [
  'Use a strong, unique password',
  'Enable two-factor authentication',
  'Review active sessions regularly',
  'Turn on login alerts for new devices',
  'Never share recovery codes',
] as const;

export const CREATOR_ADVANCED_TIPS = [
  'Use a custom domain',
  'Control your public visibility',
  'Set legal policies',
  'Customize email templates',
  'Export your data anytime',
] as const;

export function shouldUseCreatorSettingsDemo(opts: {
  profileSparse: boolean;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.profileSparse;
}
