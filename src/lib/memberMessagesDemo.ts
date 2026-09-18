/**
 * Sample member Messages inbox for design review when there are no real threads.
 * Aligned to the Prizelet member Messages mockup.
 */

const hour = 3_600_000;
const day = 86_400_000;
const hoursAgo = (n: number) => Date.now() - n * hour;
const daysAgo = (n: number) => Date.now() - n * day;

export type MemberMessagesDemoMessage = {
  id: string;
  senderRole: 'creator' | 'subscriber' | 'support';
  body: string;
  read: boolean;
  createdAtMs: number;
};

export type MemberMessagesDemoThread = {
  id: string;
  kind: 'creator' | 'support';
  username: string | null;
  displayName: string;
  bio: string;
  avatarInitials: string;
  avatarTone: string;
  verified: boolean;
  online: boolean;
  unread: number;
  preview: string;
  listTimeLabel: string;
  lastAtMs: number;
  messages: MemberMessagesDemoMessage[];
};

/** Fixed support thread id used in demo + live empty-state filters. */
export const MEMBER_MESSAGES_SUPPORT_ID = 'demo-member-support';

export const MEMBER_MESSAGES_DEMO_THREADS: MemberMessagesDemoThread[] = [
  {
    id: 'demo-member-msg-shark',
    kind: 'creator',
    username: 'sharkpicks',
    displayName: 'Shark Picks',
    bio: 'Posts picks, analysis and updates.',
    avatarInitials: 'SP',
    avatarTone: 'bg-slate-900',
    verified: true,
    online: true,
    unread: 1,
    preview: 'Yes, will include it in tomorrow’s picks. Looks like good value…',
    listTimeLabel: '10:24',
    lastAtMs: hoursAgo(0.1),
    messages: [
      {
        id: 'dmm-shark-1',
        senderRole: 'creator',
        body: 'Hey James! 👋',
        read: true,
        createdAtMs: hoursAgo(3),
      },
      {
        id: 'dmm-shark-2',
        senderRole: 'creator',
        body: 'Big slate tomorrow! Will post my full analysis later today. Any specific games you want me to look at?',
        read: true,
        createdAtMs: hoursAgo(2.9),
      },
      {
        id: 'dmm-shark-3',
        senderRole: 'subscriber',
        body: 'Can you take a look at the Lakers game? Curious on your thoughts.',
        read: true,
        createdAtMs: hoursAgo(2.5),
      },
      {
        id: 'dmm-shark-4',
        senderRole: 'creator',
        body: 'Yes, will include it in tomorrow’s picks. Looks like good value on Lakers +4.5 💯',
        read: false,
        createdAtMs: hoursAgo(0.15),
      },
      {
        id: 'dmm-shark-5',
        senderRole: 'subscriber',
        body: 'Perfect, thanks! 🙏',
        read: true,
        createdAtMs: hoursAgo(0.1),
      },
    ],
  },
  {
    id: 'demo-member-msg-profit',
    kind: 'creator',
    username: 'theprofitclub',
    displayName: 'The Profit Club',
    bio: 'Premium locks across major US sports.',
    avatarInitials: 'PC',
    avatarTone: 'bg-amber-700',
    verified: true,
    online: false,
    unread: 0,
    preview: 'Posted the NFL card — let me know if you want unit sizes.',
    listTimeLabel: '09:17',
    lastAtMs: hoursAgo(1.2),
    messages: [
      {
        id: 'dmm-profit-1',
        senderRole: 'creator',
        body: 'Posted the NFL card — let me know if you want unit sizes.',
        read: true,
        createdAtMs: hoursAgo(1.2),
      },
      {
        id: 'dmm-profit-2',
        senderRole: 'subscriber',
        body: 'Will check it out after work. Thanks!',
        read: true,
        createdAtMs: hoursAgo(1.1),
      },
    ],
  },
  {
    id: 'demo-member-msg-elite',
    kind: 'creator',
    username: 'elitepicks',
    displayName: 'Elite Picks',
    bio: 'High-conviction props only.',
    avatarInitials: 'EP',
    avatarTone: 'bg-fuchsia-700',
    verified: true,
    online: true,
    unread: 1,
    preview: 'Quick update on the soccer card before kickoff.',
    listTimeLabel: 'Yesterday',
    lastAtMs: daysAgo(1),
    messages: [
      {
        id: 'dmm-elite-1',
        senderRole: 'creator',
        body: 'Quick update on the soccer card before kickoff.',
        read: false,
        createdAtMs: daysAgo(1),
      },
    ],
  },
  {
    id: MEMBER_MESSAGES_SUPPORT_ID,
    kind: 'support',
    username: null,
    displayName: 'Prizelet Support',
    bio: 'Billing, access, and account help.',
    avatarInitials: 'PS',
    avatarTone: 'bg-sky-700',
    verified: true,
    online: true,
    unread: 0,
    preview: 'Glad we could sort your billing question. Reach out anytime.',
    listTimeLabel: 'Aug 30',
    lastAtMs: daysAgo(18),
    messages: [
      {
        id: 'dmm-support-1',
        senderRole: 'subscriber',
        body: 'Hi — my card failed on renew. Can you help?',
        read: true,
        createdAtMs: daysAgo(19),
      },
      {
        id: 'dmm-support-2',
        senderRole: 'support',
        body: 'Of course. We’ve sent a secure link to update your payment method.',
        read: true,
        createdAtMs: daysAgo(18.5),
      },
      {
        id: 'dmm-support-3',
        senderRole: 'support',
        body: 'Glad we could sort your billing question. Reach out anytime.',
        read: true,
        createdAtMs: daysAgo(18),
      },
    ],
  },
  {
    id: 'demo-member-msg-betking',
    kind: 'creator',
    username: 'betking',
    displayName: 'BetKing',
    bio: 'Sharp money reads and early line moves.',
    avatarInitials: 'BK',
    avatarTone: 'bg-indigo-800',
    verified: true,
    online: false,
    unread: 0,
    preview: 'UFC card is live — early looks on the main event.',
    listTimeLabel: 'Aug 29',
    lastAtMs: daysAgo(19),
    messages: [
      {
        id: 'dmm-bk-1',
        senderRole: 'creator',
        body: 'UFC card is live — early looks on the main event.',
        read: true,
        createdAtMs: daysAgo(19),
      },
    ],
  },
  {
    id: 'demo-member-msg-goalguru',
    kind: 'creator',
    username: 'goalguru',
    displayName: 'GoalGuru',
    bio: 'Tennis + soccer models with live hedges.',
    avatarInitials: 'GG',
    avatarTone: 'bg-emerald-700',
    verified: true,
    online: false,
    unread: 0,
    preview: 'Thanks for the tip on that tennis under!',
    listTimeLabel: 'Aug 28',
    lastAtMs: daysAgo(20),
    messages: [
      {
        id: 'dmm-gg-1',
        senderRole: 'subscriber',
        body: 'Thanks for the tip on that tennis under!',
        read: true,
        createdAtMs: daysAgo(20),
      },
      {
        id: 'dmm-gg-2',
        senderRole: 'creator',
        body: 'Anytime — more clay-court spots this week.',
        read: true,
        createdAtMs: daysAgo(20) + hour,
      },
    ],
  },
];

export function shouldUseMemberMessagesDemo(opts: {
  threadCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (opts.disableDemo) return false;
  if (opts.forceDemo) return true;
  return opts.threadCount === 0;
}

export function isMemberMessagesDemoId(id: string): boolean {
  return id.startsWith('demo-member-');
}
