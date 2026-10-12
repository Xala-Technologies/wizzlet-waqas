import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import type { ReactNode } from 'react';
import CreatorSubscribers from './CreatorSubscribers';
import CreatorTransactions from './CreatorTransactions';
import CreatorReferrals from './CreatorReferrals';
import AdminReports from './AdminReports';
import { parseCsv, readFileAsText } from '@/lib/csv';

const data = vi.hoisted(() => ({
  creator: { _id: 'creator1', username: 'audit', isPublished: false },
  profile: { username: 'audit', display_name: '=1+1', referral_code: 'audit' },
  referrals: [{ _id: 'ref1', converted: true, referredEmail: 'qa@example.invalid', commissionEarnedCents: 123, createdAt: 1760000000000 }],
  reportSource: { creators: [{ _id: 'creator1', displayName: '=1+1', username: 'audit', createdAt: 1760000000000 }],
    users: [], subscriptions: [], payouts: [], truncated: false, listLimit: 5000 },
  mutate: vi.fn(),
  subscribers: [{ _id: 'sub1', userId: 'member1', status: 'active', amountCents: 1234,
    createdAt: 1760000000000, user: { fullName: 'Doe, "Jane"\nQA', email: 'qa@example.invalid' } }],
  earnings: { grossCents: 1234, recentPayments: [
    { id: 'payment1', type: 'subscription_charge', label: 'Subscription — Doe, "Jane"', createdAt: 1760000000000,
      productName: 'Monthly, VIP', amountCents: 1234, platformFeeCents: 123,
      creatorEarningsCents: 1111, feePercentage: 10, status: 'succeeded',
      customerEmail: 'qa@example.invalid', paymentRef: 'pi_test_export' },
    { id: 'payment2', type: 'tip', label: 'Tip — Other Member', createdAt: 1760000000000,
      productName: 'Tip', amountCents: 100, platformFeeCents: 10,
      creatorEarningsCents: 90, feePercentage: 10, status: 'succeeded',
      customerEmail: 'other@example.invalid', paymentRef: 'pi_test_other' },
  ] },
}));
vi.mock('convex/react', () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    const name = getFunctionName(ref);
    if (name.endsWith(':myEarnings')) return data.earnings;
    if (name.endsWith(':listMyReferrals')) return data.referrals;
    if (name === 'platform/mutations:get') return {};
    return data.creator;
  },
  useMutation: () => data.mutate,
  useConvex: () => ({ action: async () => data.reportSource }),
  usePaginatedQuery: () => ({ results: data.subscribers, status: 'Exhausted', loadMore: vi.fn() }),
}));
vi.mock('@/hooks/useCreatorProfile', () => ({ useCreatorProfile: () => ({ creator: data.profile, loading: false }), buildReferralCode: () => 'audit' }));
vi.mock('@/components/dashboard/DashboardLayout', () => ({ DashboardLayout: ({ children }: { children: ReactNode }) => children }));
vi.mock('@/components/creator/PaymentFeeDetailSheet', () => ({ PaymentFeeDetailSheet: () => null }));

let downloaded: Blob | undefined;
let filename: string | undefined;
beforeEach(() => {
  Object.assign(data.earnings.recentPayments[0], { type: 'subscription_charge', label: 'Subscription — Doe, "Jane"', amountCents: 1234, status: 'succeeded' });
  downloaded = undefined;
  filename = undefined;
  vi.stubGlobal('URL', Object.assign(URL, {
    createObjectURL: vi.fn((blob: Blob) => { downloaded = blob; return 'blob:test-export'; }),
    revokeObjectURL: vi.fn(),
  }));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () { filename = this.download; });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function exportedRows() {
  expect(downloaded, 'Export must download a CSV file').toBeDefined();
  return parseCsv(await readFileAsText(new File([downloaded!], 'test.csv')));
}

describe('creator CSV exports', () => {
  it('neutralizes formula-like names and handles in referral downloads', async () => {
    render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorReferrals /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Export' }));
    const rows = await exportedRows();
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveLength(9);
    expect(rows[1].slice(0, 2)).toEqual(["'=1+1", "'@audit"]);
  });

  it('uses safe CSV for admin reports and preserves it in saved downloads', async () => {
    render(<MemoryRouter><AdminReports /></MemoryRouter>);
    fireEvent.click(screen.getAllByRole('button', { name: 'CSV' })[0]);
    await waitFor(() => expect(downloaded).toBeDefined());
    const original = await exportedRows();
    expect(original[1][0]).toBe("'=1+1");
    const savedName = filename!;
    downloaded = undefined;
    fireEvent.click(screen.getByRole('button', { name: `Download ${savedName}` }));
    expect(await exportedRows()).toEqual(original);
  });

  it('keeps a subscriber name with commas, quotes and line breaks in one cell', async () => {
    render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorSubscribers /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const rows = await exportedRows();
    expect(filename).toBe('subscribers.csv');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toHaveLength(7);
    expect(rows[1][0]).toBe(data.subscribers[0].user.fullName);
    expect(rows[1][6]).toBe('12.34');
  });

  it('downloads only filtered live transactions with exact amounts and references', async () => {
    render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorTransactions /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search transactions' }), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const rows = await exportedRows();
    expect(filename).toMatch(/^transactions.*\.csv$/);
    expect(rows).toHaveLength(2);
    const row = Object.fromEntries(rows[0].map((header, i) => [header, rows[1][i]]));
    expect(row).toMatchObject({ Subscriber: 'Doe, "Jane"', Product: 'Monthly, VIP',
      'Amount (USD)': '12.34', 'Platform fee (USD)': '1.23', 'Creator earnings (USD)': '11.11',
      'Payment reference': 'pi_test_export' });
  });

  it('does not invent Visa details when the provider has not supplied them', () => {
    render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorTransactions /></MemoryRouter>);
    expect(screen.queryAllByText(/Visa/)).toHaveLength(0);
  });

  it('does not download demo transactions', () => {
    render(<MemoryRouter initialEntries={['/?demo=1']}><CreatorTransactions /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(downloaded).toBeUndefined();
  });

  it.each([
    ['refund', -1234, 'Refund', 'Refunded'],
    ['dispute', -1234, 'Chargeback', 'Chargeback'],
    ['tip', 1234, 'Tip', 'Succeeded'],
    ['one_time_purchase', 1234, 'One-time purchase', 'Succeeded'],
  ])('uses the ledger type for %s instead of the generic subscription label', async (type, amount, expectedType, expectedStatus) => {
    Object.assign(data.earnings.recentPayments[0], { type, amountCents: amount, status: 'settled', label: 'Subscription — Jane — QA' });
    render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorTransactions /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search transactions' }), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    const rows = await exportedRows();
    const row = Object.fromEntries(rows[0].map((header, i) => [header, rows[1][i]]));
    expect(row).toMatchObject({ Type: expectedType, Status: expectedStatus, Subscriber: 'Jane — QA' });
  });

  it('does not download when no transaction matches the filters', () => {
    render(<MemoryRouter initialEntries={['/?demo=0']}><CreatorTransactions /></MemoryRouter>);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search transactions' }), { target: { value: 'no matching transaction' } });
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(downloaded).toBeUndefined();
  });
});
