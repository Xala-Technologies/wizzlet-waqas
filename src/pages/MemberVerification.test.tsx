import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import type { ReactNode } from 'react';
import Dashboard from './Dashboard';
import CustomerMessages from './CustomerMessages';
import CustomerSubscriptionsBilling from './CustomerSubscriptionsBilling';
import CustomerManageSubscription from './CustomerManageSubscription';

const data = vi.hoisted(() => {
  const creator = { _id: 'creator1', username: 'audit', displayName: 'Audit Creator',
    messagingEnabled: true, monthlyPriceCents: 500, verificationStatus: undefined as string | undefined };
  const message = { _id: 'message1', creatorId: 'creator1', subscriberId: 'member', senderRole: 'creator',
    body: 'Audit message', read: true, createdAt: 1700000000000 };
  return { creator, empty: [], messages: [message],
    feed: [{ _id: 'post1', title: 'Audit post', content: 'Audit content', isPremium: true, createdAt: 1700000000000, creator }],
    subs: [{ _id: 'sub1', status: 'active', amountCents: 500, createdAt: 1700000000000, creator }],
    member: { _id: 'member', fullName: 'Audit Member' } };
});
vi.mock('convex/react', () => ({
  useMutation: () => async () => null,
  usePaginatedQuery: () => ({ results: data.messages, status: 'Exhausted', loadMore: vi.fn() }),
  useQuery: (ref: Parameters<typeof getFunctionName>[0], args: unknown) => {
    if (args === 'skip') return undefined;
    const name = getFunctionName(ref);
    if (name.endsWith(':me')) return data.member;
    if (name.endsWith(':memberFeed')) return data.feed;
    if (name.endsWith(':mySubscriptionsDetailed')) return data.subs;
    if (name.endsWith(':listThread')) return data.messages;
    return data.empty;
  },
}));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'member' } }) }));
vi.mock('@/hooks/useAppUser', () => ({ useAppUser: () => ({ appUserId: 'member', loading: false }) }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/Seo', () => ({ Seo: () => null }));
vi.mock('@/lib/stripe', () => ({ cancelSubscription: vi.fn(), openCustomerPortal: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackPostView: vi.fn() }));
beforeEach(() => {
  data.creator.verificationStatus = undefined;
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe.each([
  ['member feed', '/', '/', Dashboard],
  ['subscription list', '/', '/', CustomerSubscriptionsBilling],
  ['subscription details', '/manage/audit?demo=0', '/manage/:username', CustomerManageSubscription],
  ['messages', '/?creatorId=creator1&demo=0', '/', CustomerMessages],
] as const)('%s verification claims', (_name, entry, path, Page) => {
  it.each([undefined, 'none', 'pending', 'verified'])('reflects server status %s', (status) => {
    data.creator.verificationStatus = status;
    render(<MemoryRouter initialEntries={[entry]}><Routes><Route path={path} element={<Page />} /></Routes></MemoryRouter>);
    expect(screen.queryAllByLabelText('Verified').length > 0).toBe(status === 'verified');
  });
});
