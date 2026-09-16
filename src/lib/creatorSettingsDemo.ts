/**
 * Sample Settings (General) values for design review when the profile is empty.
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

export function shouldUseCreatorSettingsDemo(opts: {
  profileSparse: boolean;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.profileSparse;
}
