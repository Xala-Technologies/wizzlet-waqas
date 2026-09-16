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
  'Use a high-quality logo (at least 512×512).',
  'Keep your brand name short and memorable.',
  'Choose a primary color that matches your content.',
  'Test contrast so text stays readable on your page.',
  'Stay consistent across emails and share links.',
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
    description: 'Manage content, products, and most settings.',
  },
  {
    role: 'member',
    title: 'Member',
    description: 'Create and manage content.',
  },
  {
    role: 'viewer',
    title: 'Viewer',
    description: 'View analytics and basic information.',
  },
];

export function shouldUseCreatorSettingsDemo(opts: {
  profileSparse: boolean;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.profileSparse;
}
