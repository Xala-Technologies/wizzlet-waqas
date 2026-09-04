import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Ban, Star, CheckCircle2, XCircle, Search, Download, UserPlus,
  Users, DollarSign, Percent, ArrowUpDown, ArrowUp, ArrowDown, Eye,
} from 'lucide-react';
import { useDemoAdminStore, downloadCsv, type DemoAdminCreator } from '@/components/demo/demoAdminStore';

type SortKey = 'name' | 'subs' | 'volume' | 'fees';

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const DemoAdminCreators = () => {
  const store = useDemoAdminStore();
  const { state, metrics } = store;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'disabled'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('fees');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmCreator, setConfirmCreator] = useState<DemoAdminCreator | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return state.creators
      .map(c => ({ creator: c, row: metrics.byCreator.find(r => r.creator.id === c.id) }))
      .filter(({ creator }) => {
        const matchQ = !q || creator.name.toLowerCase().includes(q) || creator.username.toLowerCase().includes(q) || creator.email.toLowerCase().includes(q);
        const matchS = status === 'all' || (status === 'active' ? creator.active : !creator.active);
        return matchQ && matchS;
      })
      .sort((a, b) => {
        let cmp = 0;
        switch (sortKey) {
          case 'name': cmp = a.creator.name.localeCompare(b.creator.name); break;
          case 'subs': cmp = a.creator.subs - b.creator.subs; break;
          case 'volume': cmp = (a.row?.volume ?? 0) - (b.row?.volume ?? 0); break;
          case 'fees': cmp = (a.row?.fees ?? 0) - (b.row?.fees ?? 0); break;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [state.creators, metrics.byCreator, search, status, sortKey, sortDir]);

  const counts = useMemo(() => ({
    all: state.creators.length,
    active: state.creators.filter(c => c.active).length,
    disabled: state.creators.filter(c => !c.active).length,
  }), [state.creators]);

  const detail = detailId ? state.creators.find(c => c.id === detailId) : null;
  const detailRow = detail ? metrics.byCreator.find(r => r.creator.id === detail.id) : null;
  const detailTx = useMemo(
    () => (detail ? store.rows.filter(r => r.creatorId === detail.id).sort((a, b) => a.daysAgo - b.daysAgo).slice(-8).reverse() : []),
    [detail, store.rows],
  );

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? <ArrowUpDown className="h-3 w-3 opacity-40" /> : sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;

  const exportCsv = () => {
    downloadCsv('wizzlet-creators.csv', [
      ['Creator', 'Username', 'Email', 'Subscribers', 'Volume', 'Fees', 'Fee %', 'Transactions', 'Status'],
      ...filtered.map(({ creator, row }) => [
        creator.name, creator.username, creator.email, creator.subs,
        (row?.volume ?? 0).toFixed(2), (row?.fees ?? 0).toFixed(2),
        `${row?.feePercent ?? 0}%`, row?.transactions ?? 0,
        creator.active ? 'Active' : 'Disabled',
      ]),
    ]);
    toast.success(`Exported ${filtered.length} creators`);
  };

  const feeTierLabel = (c: DemoAdminCreator) =>
    c.joinedDaysAgo < state.settings.introPeriodDays ? `Intro · ${state.settings.introFeePercent}%` : `Standard · ${state.settings.standardFeePercent}%`;

  const statCards = [
    { icon: Users, label: 'Creators', value: metrics.totalCreators, sub: `${metrics.activeCreators} active` },
    { icon: UserPlus, label: 'Pending', value: metrics.pendingApplications, sub: 'applications' },
    { icon: DollarSign, label: 'Creator volume', value: money(metrics.volume), sub: `${metrics.subscribers.toLocaleString()} subscribers` },
    { icon: Percent, label: 'Platform fees', value: money(metrics.fees), sub: `${metrics.effectiveFeeRate}% effective rate` },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Creators Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {metrics.totalCreators} creators · {metrics.activeCreators} active · {metrics.pendingApplications} pending
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search creators…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={exportCsv}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-3.5 w-3.5" /><span className="text-xs">{label}</span>
            </div>
            <p className="text-lg font-bold">{value}</p>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {state.applications.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-card p-5 mb-6">
          <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Pending Applications
            <Badge variant="outline" className="text-[10px]">{state.applications.length}</Badge>
          </h2>
          <div className="space-y-2">
            {state.applications.map(a => (
              <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{a.name} <span className="text-xs text-muted-foreground">@{a.username}</span></p>
                  <p className="text-xs text-muted-foreground">{a.pitch}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Applied {a.appliedDaysAgo}d ago · {a.email}</p>
                </div>
                <Button size="sm" className="h-7 text-xs" onClick={() => { store.approveApplication(a.id); toast.success(`${a.name} approved — now an active creator`); }}>Approve</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { store.rejectApplication(a.id); toast.info(`${a.name} rejected`); }}>Reject</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1.5 mb-4">
        {(['all', 'active', 'disabled'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
              status === s ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >{s} ({counts[s]})</button>
        ))}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground p-4">
                  <button className="inline-flex items-center gap-1 py-1.5 -my-1.5" onClick={() => toggleSort('name')}>Creator <SortIcon k="name" /></button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">
                  <button className="inline-flex items-center gap-1 py-1.5 -my-1.5" onClick={() => toggleSort('subs')}>Subscribers <SortIcon k="subs" /></button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">
                  <button className="inline-flex items-center gap-1 py-1.5 -my-1.5" onClick={() => toggleSort('volume')}>Volume <SortIcon k="volume" /></button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">
                  <button className="inline-flex items-center gap-1 py-1.5 -my-1.5" onClick={() => toggleSort('fees')}>Fees <SortIcon k="fees" /></button>
                </th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Fee tier</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No creators match this filter.</td></tr>
              )}
              {filtered.map(({ creator: c, row }) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <p className="font-medium flex items-center gap-1">
                      {c.name}
                      {c.featured && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{c.username} · {c.email}</p>
                  </td>
                  <td className="p-4 font-medium">{c.subs}</td>
                  <td className="p-4 font-medium">{money(row?.volume ?? 0)}</td>
                  <td className="p-4 font-medium">{money(row?.fees ?? 0)}</td>
                  <td className="p-4">
                    <Badge variant="outline" className="text-[10px]">{feeTierLabel(c)}</Badge>
                  </td>
                  <td className="p-4">
                    {c.active
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Active</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><XCircle className="h-3 w-3" /> Disabled</span>}
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{format(new Date(Date.now() - c.joinedDaysAgo * 86400000), 'MMM d, yyyy')}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="View details" onClick={() => setDetailId(c.id)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-7 px-2 text-xs"
                        title={c.featured ? 'Unfeature' : 'Feature'}
                        onClick={() => { store.toggleCreatorFeatured(c.id); toast.success(c.featured ? `${c.name} unfeatured` : `${c.name} featured`); }}
                      >
                        <Star className={`h-3 w-3 ${c.featured ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="h-7 px-2 text-xs"
                        title={c.active ? 'Disable' : 'Re-enable'}
                        onClick={() => setConfirmCreator(c)}
                      >
                        <Ban className={`h-3 w-3 ${c.active ? 'text-destructive' : 'text-emerald-500'}`} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creator detail dialog */}
      <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetailId(null); }}>
        <DialogContent className="sm:max-w-lg">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {detail.name}
                  {detail.featured && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                  {detail.active
                    ? <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">Active</Badge>
                    : <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Disabled</Badge>}
                </DialogTitle>
                <DialogDescription>@{detail.username} · {detail.email} · joined {format(new Date(Date.now() - detail.joinedDaysAgo * 86400000), 'MMM d, yyyy')}</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Subscribers', value: detail.subs.toLocaleString() },
                  { label: 'Volume', value: money(detailRow?.volume ?? 0) },
                  { label: 'Fees', value: money(detailRow?.fees ?? 0) },
                  { label: 'Fee tier', value: `${detailRow?.feePercent ?? 0}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border border-border p-3">
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                    <p className="text-sm font-semibold mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Recent transactions</p>
                {detailTx.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">No transactions yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {detailTx.map(t => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs">
                        <div>
                          <p className="font-medium">{t.customer}</p>
                          <p className="text-[10px] text-muted-foreground">{format(t.date, 'MMM d, yyyy')} · fee {money(t.fee)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{money(t.amount)}</p>
                          <p className={`text-[10px] capitalize ${t.status === 'active' ? 'text-emerald-500' : t.status === 'refunded' ? 'text-destructive' : 'text-muted-foreground'}`}>{t.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={() => { store.toggleCreatorFeatured(detail.id); toast.success(detail.featured ? 'Unfeatured' : 'Featured'); }}>
                  <Star className="mr-1.5 h-3.5 w-3.5" />{detail.featured ? 'Unfeature' : 'Feature'}
                </Button>
                <Button variant={detail.active ? 'destructive' : 'default'} size="sm" onClick={() => { setConfirmCreator(detail); setDetailId(null); }}>
                  <Ban className="mr-1.5 h-3.5 w-3.5" />{detail.active ? 'Disable' : 'Re-enable'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable/re-enable confirmation */}
      <AlertDialog open={!!confirmCreator} onOpenChange={open => { if (!open) setConfirmCreator(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCreator?.active ? 'Disable creator?' : 'Re-enable creator?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCreator?.active
                ? `${confirmCreator?.name} will lose access to posting, messaging and payouts. Their ${confirmCreator?.subs ?? 0} subscribers keep access until cancellation. This can be reversed at any time.`
                : `${confirmCreator?.name} will regain full creator access immediately.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!confirmCreator) return;
                store.toggleCreatorActive(confirmCreator.id);
                toast.success(confirmCreator.active ? `${confirmCreator.name} disabled` : `${confirmCreator.name} re-enabled`);
                setConfirmCreator(null);
              }}
            >{confirmCreator?.active ? 'Disable' : 'Re-enable'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DemoAdminCreators;
