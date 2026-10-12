import { describe, expect, it } from 'vitest';
import { myEarnings } from '../../convex/creators/earnings';
import { financeOverview, feesOverview, customersOverview, reportSourceData } from '../../convex/admin/snapshots';
import { listSubscribersDetailedPage } from '../../convex/subscriptions/mutations';
import { dashboardStats } from '../../convex/admin/queries';
import { listUsersPage, listCreatorsPage, listPaymentTransactionsPage, listCustomersPage } from '../../convex/admin/paginatedLists';

import { fixture, invoke, type Row } from '../test/commerceFixture';

describe('financial reports reconcile to settled payments', () => {
  it('creator totals and monthly series include renewals/refunds after cancellation, excluding failed/sandbox rows', async () => {
    const f = fixture(); const result = await invoke(myEarnings, f.ctx);
    expect(result).toMatchObject({ grossCents: 1500, feeCents: 150, netCents: 1350, monthlyRecurringNetCents: 0, activeCount: 0 });
    expect(result.monthly).toEqual([{ month: '2026-10', revenueCents: 1350, grossCents: 1500 }]);
  });
  it('makes transactions beyond the 40-row preview available to search and export', async () => {
    const f = fixture(); for (let i = 0; i < 45; i++) f.event(`extra${i}`, 100, { createdAt: f.now + i });
    const result = await invoke(myEarnings, f.ctx);
    expect((result.recentPayments as Row[]).length).toBe(49);
    expect((result.recentPayments as Row[]).some(p => p.id === 'initial')).toBe(true);
  });
  it('admin finance, fees, customer revenue and dashboard agree to the cent', async () => {
    const f = fixture();
    expect(await invoke(financeOverview, f.ctx, { nowMs: f.now })).toMatchObject({ grossRevenue: 15, feeRevenue: 1.5, creatorEarnings: 13.5, mrr: 0 });
    expect(await invoke(feesOverview, f.ctx, { nowMs: f.now })).toMatchObject({ totalRevenue: 15, totalFees: 1.5, totalCreatorEarnings: 13.5 });
    expect(await invoke(customersOverview, f.ctx)).toMatchObject({ revenue: 15 });
    expect(await invoke(dashboardStats, f.ctx)).toMatchObject({ totalRevenueCents: 1500, platformFeesCents: 150, mrrCents: 0 });
  });
  it('subscriber spend is net paid over the subscription lifetime, not the plan price', async () => {
    const f = fixture(); const result = await invoke(listSubscribersDetailedPage, f.ctx, { paginationOpts: { numItems: 25, cursor: null } });
    expect((result.page as Row[])[0]).toMatchObject({ totalSpentCents: 1500 });
  });
  it('admin people tables reconcile with the reports', async () => {
    const f = fixture();
    const users = await invoke(listUsersPage, f.ctx, { paginationOpts: { numItems: 25, cursor: null } });
    const creators = await invoke(listCreatorsPage, f.ctx, { paginationOpts: { numItems: 25, cursor: null } });
    expect((users.page as Row[])[0]).toMatchObject({ totalSpend: 15, creatorEarnings: 13.5 });
    expect((creators.page as Row[])[0]).toMatchObject({ revenue: 15 });
  });
  it('admin report bundle includes payment records, not just subscription snapshots', async () => {
    const f = fixture(); const result = await invoke(reportSourceData, f.ctx);
    expect(result.payments).toBeDefined();
    expect((result.payments as Row[]).map(p => p._id)).toContain('renewal');
    expect((result.payments as Row[]).map(p => p._id)).not.toContain('sandbox');
  });
  it('admin transaction pagination reads payment rows and keeps renewals and failures', async () => {
    const f = fixture();
    const result = await invoke(listPaymentTransactionsPage, f.ctx, { paginationOpts: { numItems: 25, cursor: null } });
    const ids = (result.page as Row[]).map(p => p.id);
    expect(ids).toContain('renewal'); expect(ids).toContain('failed');
    expect(ids).not.toContain('sub'); expect(ids).not.toContain('sandbox'); expect(ids).not.toContain('cancel');
    const customers = await invoke(listCustomersPage, f.ctx, { paginationOpts: { numItems: 25, cursor: null } });
    expect((customers.page as Row[])[0]).toMatchObject({ totalSpent: 15 });
  });
  it('marks a capped ledger and returns unknown subscriber spend instead of a fabricated total', async () => {
    const f = fixture(); for (let i = 0; i < 5000; i++) f.event(`extra${i}`, 100);
    expect(await invoke(reportSourceData, f.ctx)).toMatchObject({ truncated: true });
    expect(await invoke(myEarnings, f.ctx)).toMatchObject({ truncated: true });
    const result = await invoke(listSubscribersDetailedPage, f.ctx, { paginationOpts: { numItems: 25, cursor: null } });
    expect((result.page as Row[])[0].totalSpentCents).toBeNull();
  });

  it('keeps creator liabilities separate and reserves approved payouts', async () => {
    const f = fixture();
    f.add('creators', 'second', { userId: 'owner', displayName: 'Second', isPublished: true, createdAt: f.now });
    f.event('second-debt', -1000, { creatorId: 'second', type: 'refund' });
    f.add('payouts', 'approved', { creatorId: 'creator', amountCents: 350, status: 'approved', createdAt: f.now });
    expect(await invoke(financeOverview, f.ctx, { nowMs: f.now })).toMatchObject({ liability: 10, inFlight: 3.5 });
  });

});
