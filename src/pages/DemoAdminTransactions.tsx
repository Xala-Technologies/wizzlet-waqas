import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Download, Undo2, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, DollarSign, Percent, Wallet, AlertTriangle } from 'lucide-react';
import { useDemoAdminStore, downloadCsv } from '@/components/demo/demoAdminStore';

const PAGE = 15;

type Row = ReturnType<typeof useDemoAdminStore>['rows'][number];
type SortKey = 'date' | 'customer' | 'creator' | 'amount' | 'fee';
type StatusFilter = 'all' | 'active' | 'cancelled' | 'refunded';

const statusCls: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-500',
  cancelled: 'bg-muted text-muted-foreground',
  refunded: 'bg-destructive/10 text-destructive',
};

const DemoAdminTransactions = () => {
  const store = useDemoAdminStore();
  const { rows, metrics, state } = store;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [creatorId, setCreatorId] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Row | null>(null);
  const [refundTarget, setRefundTarget] = useState<Row | null>(null);

  const counts = useMemo(() => ({
    all: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    cancelled: rows.filter(r => r.status === 'cancelled').length,
    refunded: rows.filter(r => r.status === 'refunded').length,
  }), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = rows.filter(t => {
      const matches = !q || t.customer.toLowerCase().includes(q) || t.creatorName.toLowerCase().includes(q);
      return matches && (status === 'all' || t.status === status) && (creatorId === 'all' || t.creatorId === creatorId);
    });
    const dir = sortAsc ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'date': return dir * (a.daysAgo - b.daysAgo);
        case 'customer': return dir * a.customer.localeCompare(b.customer);
        case 'creator': return dir * a.creatorName.localeCompare(b.creatorName);
        case 'amount': return dir * (a.amount - b.amount);
        case 'fee': return dir * (a.fee - b.fee);
      }
    });
  }, [rows, search, status, creatorId, sortKey, sortAsc]);

  const filteredTotals = useMemo(() => {
    const counted = filtered.filter(t => t.status !== 'refunded');
    return {
      volume: +counted.reduce((s, t) => s + t.amount, 0).toFixed(2),
      fees: +counted.reduce((s, t) => s + t.fee, 0).toFixed(2),
    };
  }, [filtered]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE, current * PAGE + PAGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'date' || key === 'customer' || key === 'creator'); }
  };

  const exportCsv = () => {
    downloadCsv('wizzlet-transactions.csv', [
      ['Date', 'Customer', 'Creator', 'Amount', 'Creator earnings', 'Platform fee', 'Fee %', 'Status'],
      ...filtered.map(t => [format(t.date, 'yyyy-MM-dd'), t.customer, t.creatorName, t.amount.toFixed(2), t.earnings.toFixed(2), t.fee.toFixed(2), `${t.feePercent}%`, t.status]),
    ]);
    toast.success(`Exported ${filtered.length} transaction${filtered.length === 1 ? '' : 's'}`);
  };

  const refund = () => {
    if (!refundTarget) return;
    store.setTransactionStatus(refundTarget.id, 'refunded');
    toast.success(`Refunded $${refundTarget.amount.toFixed(2)} to ${refundTarget.customer}`);
    if (selected?.id === refundTarget.id) setSelected(null);
    setRefundTarget(null);
  };

  const undoRefund = (t: Row) => {
    store.setTransactionStatus(t.id, 'active');
    toast.success('Refund reversed — transaction is active again');
    if (selected?.id === t.id) setSelected(null);
  };

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th className="text-left text-xs font-medium text-muted-foreground p-4">
      <button type="button" className="inline-flex items-center gap-1 py-1.5 -my-1.5 hover:text-foreground transition-colors" onClick={() => toggleSort(k)}>
        {label}
        {sortKey === k
          ? (sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{metrics.totalTransactions} total · {filtered.length} shown · ${filteredTotals.volume.toFixed(2)} volume in view</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search transactions…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={exportCsv}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: DollarSign, label: 'Gross volume', value: `$${metrics.volume.toFixed(2)}`, cls: '' },
          { icon: Percent, label: 'Platform fees', value: `$${metrics.fees.toFixed(2)}`, cls: 'text-primary' },
          { icon: Wallet, label: 'Creator payouts', value: `$${metrics.payouts.toFixed(2)}`, cls: '' },
          { icon: AlertTriangle, label: 'Refunded', value: `$${metrics.refunded.toFixed(2)}`, cls: 'text-destructive' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><s.icon className="h-3.5 w-3.5" />{s.label}</div>
            <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {(['all', 'active', 'cancelled', 'refunded'] as const).map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(0); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors inline-flex items-center gap-1.5 ${
              status === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {s}
            <span className="text-[10px] opacity-60">{counts[s]}</span>
          </button>
        ))}
        <select
          value={creatorId}
          onChange={e => { setCreatorId(e.target.value); setPage(0); }}
          className="ml-auto h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
          aria-label="Filter by creator"
        >
          <option value="all">All creators</option>
          {state.creators.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <SortHeader label="Date" k="date" />
                <SortHeader label="Customer" k="customer" />
                <SortHeader label="Creator" k="creator" />
                <SortHeader label="Amount" k="amount" />
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator Earnings</th>
                <SortHeader label="Platform Fee" k="fee" />
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Fee %</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">No transactions match this filter.</td></tr>
              )}
              {visible.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer"
                >
                  <td className="p-4 text-xs text-muted-foreground">{format(t.date, 'MMM d, yyyy')}</td>
                  <td className="p-4 font-medium">{t.customer}</td>
                  <td className="p-4 text-muted-foreground">{t.creatorName}</td>
                  <td className="p-4 font-medium">${t.amount.toFixed(2)}</td>
                  <td className="p-4">${t.earnings.toFixed(2)}</td>
                  <td className="p-4 text-primary">${t.fee.toFixed(2)}</td>
                  <td className="p-4"><Badge variant="outline" className="text-[10px]">{t.feePercent}%</Badge></td>
                  <td className="p-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCls[t.status]}`}>{t.status}</span>
                  </td>
                  <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                    {t.status === 'refunded' ? (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="Undo refund" onClick={() => undoRefund(t)}>
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" title="Refund" onClick={() => setRefundTarget(t)}>
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-muted-foreground">Page {current + 1} of {pages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs" disabled={current === 0} onClick={() => setPage(current - 1)}>Previous</Button>
            <Button variant="outline" size="sm" className="text-xs" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Transaction detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  ${selected.amount.toFixed(2)}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${statusCls[selected.status]}`}>{selected.status}</span>
                </DialogTitle>
                <DialogDescription>{selected.customer} → {selected.creatorName} · {format(selected.date, 'MMMM d, yyyy')}</DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border border-border divide-y divide-border text-sm">
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Gross amount</span><span className="font-medium">${selected.amount.toFixed(2)}</span></div>
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Platform fee ({selected.feePercent}%)</span><span className="font-medium text-primary">−${selected.fee.toFixed(2)}</span></div>
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Creator earnings</span><span className="font-medium">${selected.earnings.toFixed(2)}</span></div>
                <div className="flex justify-between px-4 py-2.5"><span className="text-muted-foreground">Transaction ID</span><span className="font-mono text-xs">{selected.id}</span></div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Fee tier is locked at billing time — a {selected.feePercent}% {selected.feePercent === store.state.settings.introFeePercent ? 'intro' : 'standard'} rate applied to this charge.
              </p>

              <div className="flex justify-end mt-2">
                {selected.status === 'refunded' ? (
                  <Button variant="outline" size="sm" className="text-xs" onClick={() => undoRefund(selected)}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Undo refund
                  </Button>
                ) : (
                  <Button variant="destructive" size="sm" className="text-xs" onClick={() => setRefundTarget(selected)}>
                    <Undo2 className="mr-1.5 h-3.5 w-3.5" /> Refund customer
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm refund */}
      <AlertDialog open={!!refundTarget} onOpenChange={open => !open && setRefundTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund ${refundTarget?.amount.toFixed(2)} to {refundTarget?.customer}?</AlertDialogTitle>
            <AlertDialogDescription>
              The full amount is returned to the customer. The platform fee and creator earnings for this charge are clawed back, and it will no longer count toward volume, fees, or payout metrics. You can reverse the refund afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={refund} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DemoAdminTransactions;
