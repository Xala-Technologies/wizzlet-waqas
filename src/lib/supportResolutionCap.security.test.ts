import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const support = readFileSync(
  resolve(__dirname, '../../convex/support/mutations.ts'),
  'utf8',
);
const resolution = readFileSync(
  resolve(__dirname, '../../convex/resolution/mutations.ts'),
  'utf8',
);
const notifications = readFileSync(
  resolve(__dirname, '../../convex/notifications/mutations.ts'),
  'utf8',
);
const messaging = readFileSync(
  resolve(__dirname, '../../convex/messaging/mutations.ts'),
  'utf8',
);
const subscriptions = readFileSync(
  resolve(__dirname, '../../convex/subscriptions/mutations.ts'),
  'utf8',
);

describe('support / resolution / inbox F-012', () => {
  it('caps support and resolution list/unread paths instead of collecting', () => {
    for (const name of [
      'listForMyCreator',
      'unreadCountCreatorGrowth',
      'listForMember',
    ] as const) {
      const start = support.indexOf(`export const ${name}`);
      const next = support.indexOf('\nexport const ', start + 1);
      const body = next === -1 ? support.slice(start) : support.slice(start, next);
      expect(body, name).toMatch(/\.take\(/);
      expect(body, name).not.toMatch(/\.collect\(\)/);
    }

    for (const name of [
      'listMine',
      'listMessages',
      'unreadCountCreator',
    ] as const) {
      const start = resolution.indexOf(`export const ${name}`);
      const next = resolution.indexOf('\nexport const ', start + 1);
      const body =
        next === -1 ? resolution.slice(start) : resolution.slice(start, next);
      expect(body, name).toMatch(/\.take\(/);
      expect(body, name).not.toMatch(/\.collect\(\)/);
    }
  });

  it('caps notifications unread, messaging threads, and mySubscriptions', () => {
    expect(notifications).toMatch(
      /export const unreadCount[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(notifications).toMatch(
      /export const markAllRead[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(messaging).toMatch(
      /export const listThread[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(subscriptions).toMatch(
      /export const mySubscriptions[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
    expect(subscriptions).toMatch(
      /export const mySubscriptionsDetailed[\s\S]*\.take\(ADMIN_SCAN_MAX_DOCS\)/,
    );
  });
});
