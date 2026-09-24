/**
 * Sample Messages inbox aligned to the Prizelet Messages mockup
 * (Jordan Blake thread + Inbox / CRM panel).
 */

/** Fixed mock “now” so list timestamps stay stable for design review. */
export const CREATOR_MESSAGES_DEMO_NOW_MS = Date.parse('2025-01-31T16:00:00.000Z');

const hour = 3_600_000;
const day = 86_400_000;
const hoursAgo = (n: number) => CREATOR_MESSAGES_DEMO_NOW_MS - n * hour;
const daysAgo = (n: number) => CREATOR_MESSAGES_DEMO_NOW_MS - n * day;

export type DemoChatMessage = {
  id: string;
  sender_role: 'creator' | 'subscriber';
  body: string;
  read: boolean;
  createdAtMs: number;
};

export type DemoNote = {
  id: string;
  body: string;
  createdAtMs: number;
};

export type DemoMessageThread = {
  id: string;
  name: string;
  email: string;
  location: string;
  status: 'active' | 'cancelled' | 'trial';
  plan: 'Premium' | 'Monthly' | 'VIP' | 'Premium Picks';
  planPriceCents: number;
  memberSinceMs: number;
  totalSpentCents: number;
  online: boolean;
  lastActiveLabel: string;
  starred: boolean;
  archived: boolean;
  unread: number;
  messages: DemoChatMessage[];
  notes: DemoNote[];
};

export const CREATOR_MESSAGES_DEMO_THREADS: DemoMessageThread[] = [
  {
    id: 'demo-msg-1',
    name: 'Jordan Blake',
    email: 'jordan.blake@email.com',
    location: 'United States',
    status: 'active',
    plan: 'Premium Picks',
    planPriceCents: 2999,
    memberSinceMs: Date.parse('2025-01-30T12:00:00.000Z'),
    totalSpentCents: 8997,
    online: true,
    lastActiveLabel: '2 hours ago',
    starred: true,
    archived: false,
    unread: 1,
    messages: [
      {
        id: 'demo-msg-1-a',
        sender_role: 'subscriber',
        body: 'Hey Alex! Loving the picks so far. Do you release NBA cards every night?',
        read: true,
        createdAtMs: Date.parse('2025-01-31T15:12:00.000Z'),
      },
      {
        id: 'demo-msg-1-b',
        sender_role: 'creator',
        body: 'Hey Jordan! Yes, I do — Premium gets the full card about 90 minutes before tip. Glad you’re enjoying them!',
        read: true,
        createdAtMs: Date.parse('2025-01-31T15:18:00.000Z'),
      },
      {
        id: 'demo-msg-1-c',
        sender_role: 'subscriber',
        body: 'Perfect. Also curious if you’re still high on that Chiefs +1.5 this weekend?',
        read: true,
        createdAtMs: Date.parse('2025-01-31T15:22:00.000Z'),
      },
      {
        id: 'demo-msg-1-d',
        sender_role: 'creator',
        body: 'Still like Chiefs +1.5. I’ll lock both in Premium about an hour before kickoff.',
        read: true,
        createdAtMs: Date.parse('2025-01-31T15:24:00.000Z'),
      },
    ],
    notes: [
      {
        id: 'n1',
        body: 'Very engaged subscriber. Asks thoughtful questions and follows every card.',
        createdAtMs: Date.parse('2025-01-30T18:00:00.000Z'),
      },
      {
        id: 'n2',
        body: 'Potential for upsell to VIP — already spending on Premium Picks monthly.',
        createdAtMs: Date.parse('2025-01-30T18:05:00.000Z'),
      },
    ],
  },
  {
    id: 'demo-msg-2',
    name: 'Sam Rivera',
    email: 'sam.rivera@email.com',
    location: 'United States',
    status: 'active',
    plan: 'VIP',
    planPriceCents: 9999,
    memberSinceMs: daysAgo(64),
    totalSpentCents: 29997,
    online: false,
    lastActiveLabel: 'Yesterday',
    starred: false,
    archived: false,
    unread: 1,
    messages: [
      {
        id: 'demo-msg-2-a',
        sender_role: 'subscriber',
        body: 'Can you share your unit sizing rules for parlays in VIP?',
        read: false,
        createdAtMs: Date.parse('2025-01-31T10:24:00.000Z'),
      },
    ],
    notes: [],
  },
  {
    id: 'demo-msg-3',
    name: 'Taylor Kim',
    email: 'taylor.kim@email.com',
    location: 'Canada',
    status: 'active',
    plan: 'Premium Picks',
    planPriceCents: 2999,
    memberSinceMs: daysAgo(28),
    totalSpentCents: 5998,
    online: false,
    lastActiveLabel: '3 hours ago',
    starred: false,
    archived: false,
    unread: 1,
    messages: [
      {
        id: 'demo-msg-3-a',
        sender_role: 'subscriber',
        body: 'Quick one — is the Discord invite still in the welcome email?',
        read: false,
        createdAtMs: Date.parse('2025-01-28T16:40:00.000Z'),
      },
    ],
    notes: [],
  },
  {
    id: 'demo-msg-4',
    name: 'Daniel Park',
    email: 'daniel.park@example.com',
    location: 'South Korea',
    status: 'cancelled',
    plan: 'Monthly',
    planPriceCents: 1999,
    memberSinceMs: daysAgo(90),
    totalSpentCents: 2900,
    online: false,
    lastActiveLabel: '2 weeks ago',
    starred: false,
    archived: true,
    unread: 0,
    messages: [
      {
        id: 'demo-msg-4-a',
        sender_role: 'subscriber',
        body: 'Canceling for now — great content though. May be back next season.',
        read: true,
        createdAtMs: daysAgo(14),
      },
      {
        id: 'demo-msg-4-b',
        sender_role: 'creator',
        body: 'Appreciate the support Daniel. Door’s always open.',
        read: true,
        createdAtMs: daysAgo(13),
      },
    ],
    notes: [
      {
        id: 'n1',
        body: 'Churned after 3 months. Soft win-back candidate.',
        createdAtMs: daysAgo(13),
      },
    ],
  },
];

export function shouldUseCreatorMessagesDemo(input: {
  realThreadCount: number;
  forceDemo: boolean;
  disableDemo: boolean;
}): boolean {
  if (input.disableDemo) return false;
  if (input.forceDemo) return true;
  return input.realThreadCount === 0;
}

export function isCreatorMessagesDemoId(id: string): boolean {
  return id.startsWith('demo-msg-');
}
