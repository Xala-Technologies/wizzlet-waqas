import { cleanup, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Doc } from '../../convex/_generated/dataModel';
import CreatorSettings from './CreatorSettings';

const fixture = vi.hoisted(() => ({
  creator: undefined as Partial<Doc<'creators'>> | null | undefined,
  me: undefined as Partial<Doc<'users'>> | null | undefined,
}));
vi.mock('convex/react', () => ({
  useConvex: () => ({}),
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name === 'creators/queries:myCreator') return fixture.creator;
    if (name === 'users/queries:me') return fixture.me;
    return undefined;
  },
}));
vi.mock('@/components/dashboard/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('@/components/account/EmailChangeOtpDialog', () => ({ EmailChangeOtpDialog: () => null }));
vi.mock('@/components/account/TotpManageCard', () => ({ TotpManageCard: () => null }));

beforeEach(() => {
  localStorage.clear();
  fixture.creator = { username: 'status-fixture', displayName: 'Status Fixture', isPublished: false };
  fixture.me = { email: 'status@example.invalid' };
});
afterEach(cleanup);

function view(query = 'demo=0') {
  return <MemoryRouter initialEntries={[`/creator/settings?tab=general&${query}`]}><CreatorSettings /></MemoryRouter>;
}
function card() {
  return screen.getByRole('region', { name: 'Account Status' });
}
function status(label: string) {
  const term = within(card()).getByText(label);
  return term.parentElement!.querySelector('dd')!;
}

it.each(['demo=0', '', 'demo=1'])('shows saved incomplete states even for a sparse profile (%s)', query => {
  fixture.creator = { username: 'status-fixture', isPublished: false };
  render(view(query));
  expect(status('Email verification')).toHaveTextContent('Not verified');
  expect(status('Creator verification')).toHaveTextContent('Not verified');
  expect(status('Payouts')).toHaveTextContent('Not connected');
  expect(status('Public profile')).toHaveTextContent('Unpublished');
  expect(card()).not.toHaveTextContent(/Identity verified|No active restrictions|good standing|Active/);
  expect(within(card()).getByRole('link', { name: 'Manage payouts' })).toHaveAttribute('href', '/creator/payouts');
});

it('shows confirmed verification and published profile independently of payouts', () => {
  fixture.me.emailVerificationTime = 1_700_000_000_000;
  fixture.creator.verificationStatus = 'verified';
  fixture.creator.isPublished = true;
  render(view());
  expect(status('Email verification')).toHaveTextContent(/^Verified$/);
  expect(status('Creator verification')).toHaveTextContent(/^Verified$/);
  expect(status('Public profile')).toHaveTextContent(/^Published$/);
  expect(status('Payouts')).toHaveTextContent('Not connected');
});

it.each([
  ['none', 'Not verified'],
  ['pending', 'Pending'],
  ['verified', 'Verified'],
] as const)('renders creator verification %s without implying identity verification', (value, expected) => {
  fixture.creator.verificationStatus = value;
  render(view());
  expect(status('Creator verification').textContent).toBe(expected);
  expect(card()).not.toHaveTextContent(/Identity verified/);
  expect(status('Email verification')).toHaveTextContent('Not verified');
});

it.each([
  [{}, 'Not connected'],
  [{ stripeConnectPayoutsEnabled: true, stripeConnectDetailsSubmitted: true }, 'Not connected'],
  [{ stripeAccountId: 'acct_fixture' }, 'Setup incomplete'],
  [{ stripeAccountId: 'acct_fixture', stripeConnectChargesEnabled: true }, 'Setup incomplete'],
  [{ stripeAccountId: 'acct_fixture', stripeConnectDetailsSubmitted: true }, 'Not enabled'],
  [{ stripeAccountId: 'acct_fixture', stripeConnectDetailsSubmitted: true, stripeConnectChargesEnabled: true, stripeConnectPayoutsEnabled: false }, 'Not enabled'],
  [{ stripeAccountId: 'acct_fixture', stripeConnectPayoutsEnabled: true, stripeConnectChargesEnabled: false }, 'Enabled'],
] satisfies Array<[Partial<Doc<'creators'>>, string]>)('uses payout permission rather than account or charge readiness (%j)', (fields, expected) => {
  Object.assign(fixture.creator, fields);
  render(view());
  expect(status('Payouts').textContent).toBe(expected);
});

it('updates displayed statuses when saved verification, payout permission, or publication is revoked', () => {
  fixture.me.emailVerificationTime = 1_700_000_000_000;
  Object.assign(fixture.creator, { verificationStatus: 'verified', stripeAccountId: 'acct_fixture', stripeConnectPayoutsEnabled: true, stripeConnectDetailsSubmitted: true, isPublished: true });
  const rendered = render(view());
  expect(status('Payouts')).toHaveTextContent(/^Enabled$/);
  fixture.me = { ...fixture.me, emailVerificationTime: undefined };
  fixture.creator = { ...fixture.creator, verificationStatus: 'pending', stripeConnectPayoutsEnabled: false, isPublished: false };
  rendered.rerender(view());
  expect(status('Email verification')).toHaveTextContent('Not verified');
  expect(status('Creator verification')).toHaveTextContent('Pending');
  expect(status('Payouts')).toHaveTextContent('Not enabled');
  expect(status('Public profile')).toHaveTextContent('Unpublished');
});

it('does not mark a missing email verified even with a stale timestamp', () => {
  fixture.me = { emailVerificationTime: 1_700_000_000_000 };
  render(view());
  expect(status('Email verification')).toHaveTextContent('Not verified');
});

it('shows unavailable email status if the user query returns no account', () => {
  fixture.me = null;
  render(view());
  expect(status('Email verification')).toHaveTextContent('Unavailable');
});

it.each(['creator', 'me'] as const)('does not show account status before the %s query loads', query => {
  fixture[query] = undefined;
  render(view());
  expect(screen.queryByRole('region', { name: 'Account Status' })).not.toBeInTheDocument();
  expect(screen.queryByText('Verified')).not.toBeInTheDocument();
});

it('does not show a fabricated status for a missing creator profile', () => {
  fixture.creator = null;
  render(view());
  expect(screen.getByText('No creator profile yet')).toBeInTheDocument();
  expect(screen.queryByRole('region', { name: 'Account Status' })).not.toBeInTheDocument();
});
