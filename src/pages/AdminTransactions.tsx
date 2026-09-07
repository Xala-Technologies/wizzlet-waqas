import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { downloadCsv } from '@/lib/csv';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = ['all', 'active', 'canceled', 'past_due', 'failed', 'incomplete', 'trialing'] as const;

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

const AdminTransactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFromUrl = searchParams.get('status') ?? 'all';
  const initialStatus = STATUS_OPTIONS.includes(statusFromUrl as (typeof STATUS_OPTIONS)[number])
    ? statusFromUrl
    : 'all';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.paginatedLists.listTransactionsPage,
    {},
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

  const active = transactions.filter((t) => t.status === 'active');
  const totalAmount = active.reduce((a, b) => a + b.amount, 0);
  const totalFees = active.reduce((a, b) => a + b.platformFee, 0);
  const totalCreatorEarnings = active.reduce((a, b) => a + b.creatorEarnings, 0);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.userName.toLowerCase().includes(q) || t.creatorName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const onStatusChange = (value: string) => {
    setStatusFilter(value);
    if (value === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams, { replace: true });
    } else {
      setSearchParams({ status: value }, { replace: true });
    }
  };

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('Nothing to export'); return; }
    downloadCsv(
      `transactions-${new Date().toISOString().split('T')[0]}.csv`,
      ['Date', 'Customer', 'Creator', 'Amount', 'Platform Fee', 'Fee %', 'Creator Earnings', 'Status'],
      filtered.map((t) => [
        format(new Date(t.created_at), 'yyyy-MM-dd'), t.userName, t.creatorName,
        t.amount.toFixed(2), t.platformFee.toFixed(2), t.feePercentage, t.creatorEarnings.toFixed(2), t.status,
      ]),
    );
    toast.success(`Exported ${filtered.length} loaded transactions`);
  };

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {transactions.length} loaded
            {status === 'CanLoadMore' || status === 'LoadingMore' ? ' (more available)' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search loaded…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={onStatusChange}>
            <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="past_due">Past due</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="trialing">Trialing</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 min-h-9 text-xs w-full sm:w-auto" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume (loaded)</p>
          <p className="text-xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fees (loaded)</p>
          <p className="text-xl font-bold text-emerald-400">${totalFees.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Creator (loaded)</p>
          <p className="text-xl font-bold">${totalCreatorEarnings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active (loaded)</p>
          <p className="text-xl font-bold">{active.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'failed' || statusFilter === 'past_due'
              ? `No ${statusFilter.replace('_', ' ')} subscriptions in the loaded set. Load more or clear the filter.`
              : 'No transactions match this filter.'}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Customer</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Fee</th>
                    <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="p-4 text-xs text-muted-foreground">{format(new Date(t.created_at), 'MMM d, yyyy')}</td>
                      <td className="p-4">{t.userName}</td>
                      <td className="p-4">{t.creatorName}</td>
                      <td className="p-4 font-medium">${t.amount.toFixed(2)}</td>
                      <td className="p-4 text-emerald-400">${t.platformFee.toFixed(2)} ({t.feePercentage}%)</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] ${t.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
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
            <div className="flex justify-center mt-4">
              <Button variant="outline" size="sm" disabled={status === 'LoadingMore'} onClick={() => loadMore(PAGE_SIZE)}>
                {status === 'LoadingMore' ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
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
