import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFunctionName } from 'convex/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import CreatorSettings from './CreatorSettings';

const f = vi.hoisted(() => ({
  creator: { _id: 'creator1', username: 'qa-creator', displayName: '', bio: '', avatarUrl: '', isPublished: false },
  me: { _id: 'user1', email: 'qa@example.invalid', fullName: 'QA Owner' },
  earnings: undefined as Record<string, unknown> | undefined,
  mutation: vi.fn(), message: vi.fn(),
}));
vi.mock('convex/react', () => ({
  useConvex: () => ({}), useMutation: () => f.mutation, useAction: () => vi.fn(),
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name === 'creators/queries:myCreator') return f.creator;
    if (name === 'users/queries:me') return f.me;
    if (name === 'creators/earnings:myEarnings') return f.earnings;
    return undefined;
  },
}));
vi.mock('sonner', () => ({ toast: { message: f.message, error: vi.fn(), success: vi.fn() } }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('@/components/account/EmailChangeOtpDialog', () => ({ EmailChangeOtpDialog: () => null }));
vi.mock('@/components/account/TotpManageCard', () => ({ TotpManageCard: () => null }));
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  f.creator = { _id: 'creator1', username: 'qa-creator', displayName: '', bio: '', avatarUrl: '', isPublished: false };
  f.earnings = { feePolicy: { introFeePercent: 3, standardFeePercent: 7, introFeeDays: 14, currentFeePercent: 3, introDaysLeft: 10 }, recentPayments: [] };
});
afterEach(cleanup);
function view(query: string) {
  return <MemoryRouter initialEntries={[`/creator/settings?${query}`]}><CreatorSettings /></MemoryRouter>;
}

it('keeps a sparse live profile empty instead of automatically populating demo values', () => {
  render(view('tab=general'));
  expect(screen.getByLabelText('Display name')).toHaveValue('');
  expect(screen.getByLabelText('Bio')).toHaveValue('');
  expect(screen.queryByText(/Sample preview data/)).not.toBeInTheDocument();
});
it.each(['', '&demo=0'])('does not invent payments for a sparse live creator (%s)', query => {
  render(view(`tab=billing${query}`));
  expect(screen.getByText('No customer payments yet. Fees only appear after a fan pays.')).toBeInTheDocument();
  expect(screen.queryByText('Elvis Alvarenga')).not.toBeInTheDocument();
  expect(screen.getByText('3% now')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/creator/support');
});
it('shows loading instead of guessed fees or an empty ledger while earnings load', () => {
  f.earnings = undefined;
  const rendered = render(view('tab=billing&demo=0'));
  expect(screen.getByRole('status', { name: 'Loading billing' })).toBeInTheDocument();
  expect(screen.queryByText(/% now/)).not.toBeInTheDocument();
  expect(screen.queryByText(/No customer payments yet/)).not.toBeInTheDocument();
  f.earnings = { feePolicy: { introFeePercent: 3, standardFeePercent: 7, introFeeDays: 14, currentFeePercent: 7, introDaysLeft: 0 }, recentPayments: [] };
  rendered.rerender(view('tab=billing&demo=0'));
  expect(screen.getByText('7% now')).toBeInTheDocument();
  expect(screen.queryByRole('status', { name: 'Loading billing' })).not.toBeInTheDocument();
});
it('renders saved customer payments and fee policy rather than sample payment rows', () => {
  f.earnings.recentPayments = [{ id: 'payment1', label: 'Subscription — Fixture Customer', customerEmail: 'customer@example.invalid', status: 'succeeded', createdAt: 1700000000000, paymentRef: 'fixture-ref', productName: 'Fixture subscription', type: 'subscription', amountCents: 10000, platformFeeCents: 300, creatorEarningsCents: 9700, feePercentage: 3 }];
  render(view('tab=billing'));
  expect(screen.getByRole('button', { name: /Fixture Customer/ })).toHaveTextContent('$97.00');
  expect(screen.queryByText('Elvis Alvarenga')).not.toBeInTheDocument();
});
it.each(['', '&demo=0'])('shows only the real owner and explains unavailable team access (%s)', query => {
  render(view(`tab=team${query}`));
  expect(screen.getByText('qa@example.invalid')).toBeInTheDocument();
  expect(screen.queryByText('waqas@sweeph.com')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Role Permissions' })).not.toBeInTheDocument();
  expect(screen.getByText('Team invitations and shared access are not available yet.')).toBeInTheDocument();
  expect(screen.getByLabelText('Email address')).toBeDisabled();
  expect(screen.getByRole('combobox', { name: 'Invitation role' })).toBeDisabled();
  const send = screen.getByRole('button', { name: 'Send Invite' });
  expect(send).toBeDisabled(); fireEvent.click(send);
  expect(f.message).not.toHaveBeenCalled(); expect(f.mutation).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Contact support' })).toHaveAttribute('href', '/creator/support');
});
it('keeps billing sample data behind an explicit demo request', () => {
  f.earnings = undefined;
  render(view('tab=billing&demo=1'));
  expect(screen.getByText(/Sample preview data/)).toBeInTheDocument();
  expect(screen.getByText('Elvis Alvarenga')).toBeInTheDocument();
});
it('keeps team interaction confined to an explicitly labeled local preview', async () => {
  render(view('tab=team&demo=1'));
  expect(screen.getByText(/Sample preview data/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'preview@example.invalid' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));
  await waitFor(() => expect(screen.getByText('preview@example.invalid')).toBeInTheDocument());
  expect(f.message).toHaveBeenCalledWith('Sample preview — invite added locally', expect.anything());
  expect(f.mutation).not.toHaveBeenCalled();
});
