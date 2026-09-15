/**
 * Sample Messages inbox for design review when the creator has no real conversations.
 */

const hour = 3_600_000;
const day = 86_400_000;
const hoursAgo = (n: number) => Date.now() - n * hour;
const daysAgo = (n: number) => Date.now() - n * day;

export type DemoChatMessage = {
  id: string;
  sender_role: 'creator' | 'subscriber';
  body: string;
  read: boolean;
  createdAtMs: number;
};

export type DemoMessageThread = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'cancelled' | 'trial';
  plan: 'Premium' | 'Monthly' | 'VIP';
  memberSinceMs: number;
  totalSpentCents: number;
  online: boolean;
  starred: boolean;
  archived: boolean;
  unread: number;
  messages: DemoChatMessage[];
};

export const CREATOR_MESSAGES_DEMO_THREADS: DemoMessageThread[] = [
  {
    id: 'demo-msg-1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active',
    plan: 'Premium',
    memberSinceMs: daysAgo(45),
    totalSpentCents: 8997,
    online: true,
    starred: true,
    archived: false,
    unread: 2,
    messages: [
      {
        id: 'demo-msg-1-a',
        sender_role: 'subscriber',
        body: 'Hey! Loved yesterday’s NBA card. Any lean on the Lakers tonight?',
        read: true,
        createdAtMs: hoursAgo(26),
      },
      {
        id: 'demo-msg-1-b',
        sender_role: 'creator',
        body: 'Thanks John — I’m leaning Under 224.5 if the pace stays slow. Will post in Premium before tip.',
        read: true,
        createdAtMs: hoursAgo(25),
      },
      {
        id: 'demo-msg-1-c',
        sender_role: 'subscriber',
        body: 'Perfect. Also curious if you’re still high on that Chiefs +1.5?',
        read: false,
        createdAtMs: hoursAgo(2),
      },
      {
        id: 'demo-msg-1-d',
        sender_role: 'subscriber',
        body: 'Just saw the injury report — still good?',
        read: false,
        createdAtMs: hoursAgo(1),
      },
    ],
  },
  {
    id: 'demo-msg-2',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    status: 'active',
    plan: 'VIP',
    memberSinceMs: daysAgo(120),
    totalSpentCents: 23700,
    online: true,
    starred: false,
    archived: false,
    unread: 0,
    messages: [
      {
        id: 'demo-msg-2-a',
        sender_role: 'subscriber',
        body: 'VIP question — can you walk me through unit sizing for parlays?',
        read: true,
        createdAtMs: daysAgo(2),
      },
      {
        id: 'demo-msg-2-b',
        sender_role: 'creator',
        body: 'Keep parlays to 0.25–0.5u max. Correlation kills bankrolls faster than bad picks.',
        read: true,
        createdAtMs: daysAgo(2) + hour,
      },
      {
        id: 'demo-msg-2-c',
        sender_role: 'subscriber',
        body: 'Got it — thanks for the clear answer.',
        read: true,
        createdAtMs: hoursAgo(18),
      },
    ],
  },
  {
    id: 'demo-msg-3',
    name: 'Maya Ortiz',
    email: 'maya.o@example.com',
    status: 'active',
    plan: 'Premium',
    memberSinceMs: daysAgo(12),
    totalSpentCents: 2999,
    online: false,
    starred: false,
    archived: false,
    unread: 1,
    messages: [
      {
        id: 'demo-msg-3-a',
        sender_role: 'creator',
        body: 'Welcome to Premium! Drop any questions here anytime.',
        read: true,
        createdAtMs: daysAgo(10),
      },
      {
        id: 'demo-msg-3-b',
        sender_role: 'subscriber',
        body: 'Hi! Where do I find your track record for MLB?',
        read: false,
        createdAtMs: hoursAgo(5),
      },
    ],
  },
  {
    id: 'demo-msg-4',
    name: 'Daniel Park',
    email: 'daniel.park@example.com',
    status: 'cancelled',
    plan: 'Monthly',
    memberSinceMs: daysAgo(90),
    totalSpentCents: 2900,
    online: false,
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
