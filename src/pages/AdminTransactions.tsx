import { cn } from '@/lib/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardKpiStrip } from '@/components/dashboard/DashboardKpiStrip';
import { AdminPageHeader } from '@/components/dashboard/AdminPageHeader';
import { clayCard } from '@/lib/overviewClay';
import { kpiIconTone } from '@/lib/kpiIconTones';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Search, Download, DollarSign, Percent, TrendingUp, Activity } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { downloadCsv } from '@/lib/csv';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = ['all', 'active', 'canceled', 'past_due', 'failed', 'incomplete', 'trialing', 'unpaid'] as const;
type StatusFilter = (typeof STATUS_OPTIONS)[number];

interface Transaction {
  id: string;
  status: string;
  created_at: number;
  userName: string;
  creatorName: string;
  amount: number;
  creatorEarnings: number;
  platformFee: number;
  feePercentage: number;
}

function parseStatus(raw: string | null): StatusFilter {
  if (raw && (STATUS_OPTIONS as readonly string[]).includes(raw)) {
    return raw as StatusFilter;
  }
  return 'all';
}

const AdminTransactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatus(searchParams.get('status')),
  );

  useEffect(() => {
    setStatusFilter(parseStatus(searchParams.get('status')));
  }, [searchParams]);

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.paginatedLists.listTransactionsPage,
    { status: statusFilter },
    { initialNumItems: PAGE_SIZE },
  );

  const loading = status === 'LoadingFirstPage';

  const transactions = useMemo((): Transaction[] => {
    return (results ?? []).map((s) => ({
      id: s.id,
      status: s.status,
      created_at: s.createdAt,
      userName: s.userName,
      creatorName: s.creatorName,
      amount: s.amountCents / 100,
      creatorEarnings: s.creatorEarningsCents / 100,
      platformFee: s.platformFeeCents / 100,
      feePercentage: s.feePercentage,
    }));
  }, [results]);

  const pageVolume = transactions.reduce((a, b) => a + b.amount, 0);
  const pageFees = transactions.reduce((a, b) => a + b.platformFee, 0);
  const pageCreator = transactions.reduce((a, b) => a + b.creatorEarnings, 0);
  const activeOnPage = transactions.filter((t) => t.status === 'active').length;

  const kpiItems = useMemo(
    () => [
      {
        label: 'Volume (on this page)',
        value: `$${pageVolume.toFixed(2)}`,
        icon: DollarSign,
        iconClassName: kpiIconTone.emerald,
      },
      {
        label: 'Fees (on this page)',
        value: `$${pageFees.toFixed(2)}`,
        icon: Percent,
        iconClassName: kpiIconTone.violet,
      },
      {
        label: 'Creator (on this page)',
        value: `$${pageCreator.toFixed(2)}`,
        icon: TrendingUp,
        iconClassName: kpiIconTone.sky,
      },
      {
        label: 'Active (on this page)',
        value: String(activeOnPage),
        icon: Activity,
        iconClassName: kpiIconTone.amber,
      },
    ],
    [pageVolume, pageFees, pageCreator, activeOnPage],
  );

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.userName.toLowerCase().includes(q) || t.creatorName.toLowerCase().includes(q);
  });

  const onStatusChange = (value: string) => {
    const next = parseStatus(value);
    setStatusFilter(next);
    if (next === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: next }, { replace: true });
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    downloadCsv(
      `transactions-${new Date().toISOString().split('T')[0]}.csv`,
      ['Date', 'Customer', 'Creator', 'Amount', 'Platform Fee', 'Fee %', 'Creator Earnings', 'Status'],
      filtered.map((t) => [
        format(new Date(t.created_at), 'yyyy-MM-dd'),
        t.userName,
        t.creatorName,
        t.amount.toFixed(2),
        t.platformFee.toFixed(2),
        t.feePercentage,
        t.creatorEarnings.toFixed(2),
        t.status,
      ]),
    );
    toast.success(`Exported ${filtered.length} loaded transactions`);
  };

  const statusHint =
    statusFilter === 'failed'
      ? ' · failed + past due'
      : statusFilter !== 'all'
        ? ` · ${statusFilter}`
        : '';
  const loadHint =
    status === 'CanLoadMore' || status === 'LoadingMore' ? ' (more available)' : '';

  return (
    <DashboardLayout type="admin" mainClassName="bg-clay-page">
      <AdminPageHeader
        title="Transactions"
        description={`${transactions.length} loaded${statusHint}${loadHint}`}
        actions={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-48">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search loaded…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-h-11 pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="min-h-11 w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past due only</SelectItem>
                <SelectItem value="failed">Failed + past due</SelectItem>
                <SelectItem value="incomplete">Incomplete</SelectItem>
                <SelectItem value="trialing">Trialing</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 w-full text-caption sm:w-auto"
              onClick={handleExport}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export
            </Button>
          </div>
        }
      />

      {!loading && <DashboardKpiStrip items={kpiItems} variant="clay" className="mb-6" />}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className={cn(clayCard, 'p-12 text-center')}>
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'failed'
              ? 'No failed or past due subscriptions.'
              : statusFilter !== 'all'
                ? `No ${statusFilter.replace('_', ' ')} subscriptions.`
                : 'No transactions match this filter.'}
          </p>
        </div>
      ) : (
        <>
          <div className={cn(clayCard, 'overflow-hidden')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="p-4 text-left text-caption font-medium text-muted-foreground">Date</th>
                    <th className="p-4 text-left text-caption font-medium text-muted-foreground">Customer</th>
                    <th className="p-4 text-left text-caption font-medium text-muted-foreground">Creator</th>
                    <th className="p-4 text-left text-caption font-medium text-muted-foreground">Amount</th>
                    <th className="p-4 text-left text-caption font-medium text-muted-foreground">Fee</th>
                    <th className="p-4 text-left text-caption font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="p-4 text-caption text-muted-foreground">
                        {format(new Date(t.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="p-4">{t.userName}</td>
                      <td className="p-4">{t.creatorName}</td>
                      <td className="p-4 font-medium">${t.amount.toFixed(2)}</td>
                      <td className="p-4 text-emerald-400">
                        ${t.platformFee.toFixed(2)} ({t.feePercentage}%)
                      </td>
                      <td className="p-4">
                        <Badge
                          variant="outline"
                          className={`text-caption ${t.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}
                        >
                          {t.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {(status === 'CanLoadMore' || status === 'LoadingMore') && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                className="min-h-11"
                disabled={status === 'LoadingMore'}
                onClick={() => loadMore(PAGE_SIZE)}
              >
                {status === 'LoadingMore' ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminTransactions;
