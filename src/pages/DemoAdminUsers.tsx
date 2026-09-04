import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, UserX, UserCheck, Search, Download, ArrowUpDown, Users, ShieldCheck, Wallet, ArrowUp, ArrowDown } from 'lucide-react';
import { useDemoAdminStore, downloadCsv, type DemoAdminUser } from '@/components/demo/demoAdminStore';

const roleStyle: Record<string, { label: string; cls: string }> = {
  admin: { label: 'Admin', cls: 'bg-destructive/10 text-destructive' },
  creator: { label: 'Creator', cls: 'bg-primary/10 text-primary' },
  subscriber: { label: 'Subscriber', cls: 'bg-accent/10 text-accent' },
};

type SortKey = 'name' | 'subs' | 'spend' | 'joined';

const joinedDate = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000);

const DemoAdminUsers = () => {
  const store = useDemoAdminStore();
  const { state, metrics, rows } = store;
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<'all' | 'subscriber' | 'creator' | 'admin'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('joined');
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<DemoAdminUser | null>(null);
  const [confirmUser, setConfirmUser] = useState<DemoAdminUser | null>(null);

  /** Subscriber spend derived from their transactions (demo matches on customer name).
   *  Transactions billed to names that belong to creator/admin accounts are excluded —
   *  those are different people who happen to share a name in the seed data. */
  const spendByUser = useMemo(() => {
    const nonSubscriberNames = new Set(state.users.filter(u => u.role !== 'subscriber').map(u => u.name));
    const map = new Map<string, { spend: number; txs: typeof rows }>();
    for (const r of rows) {
      if (nonSubscriberNames.has(r.customer)) continue;
      const entry = map.get(r.customer) ?? { spend: 0, txs: [] };
      if (r.status !== 'refunded') entry.spend += r.amount;
      entry.txs.push(r);
      map.set(r.customer, entry);
    }
    return map;
  }, [rows, state.users]);

  const spendOf = (u: DemoAdminUser) => +(spendByUser.get(u.name)?.spend ?? 0).toFixed(2);

  const counts = useMemo(() => ({
    all: state.users.length,
    subscriber: state.users.filter(u => u.role === 'subscriber').length,
    creator: state.users.filter(u => u.role === 'creator').length,
    admin: state.users.filter(u => u.role === 'admin').length,
  }), [state.users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = state.users.filter(u => {
      const matches = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matches && (role === 'all' || u.role === role);
    });
    const dir = sortAsc ? 1 : -1;
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'subs': return dir * (a.subs - b.subs);
        case 'spend': return dir * (spendOf(a) - spendOf(b));
        case 'joined': return dir * (a.joinedDaysAgo - b.joinedDaysAgo);
      }
    });
  }, [state.users, search, role, sortKey, sortAsc, spendByUser]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(key === 'name'); }
  };

  const exportCsv = () => {
    downloadCsv('wizzlet-users.csv', [
      ['Name', 'Email', 'Role', 'Subscriptions', 'Lifetime Spend', 'Status', 'Joined'],
      ...filtered.map(u => [
        u.name, u.email, u.role, u.subs, spendOf(u).toFixed(2),
        u.active ? 'Active' : 'Deactivated',
        format(joinedDate(u.joinedDaysAgo), 'yyyy-MM-dd'),
      ]),
    ]);
    toast.success(`Exported ${filtered.length} user${filtered.length === 1 ? '' : 's'}`);
  };

  const deactivate = () => {
    if (!confirmUser) return;
    store.toggleUserActive(confirmUser.id);
    toast.success(`${confirmUser.name} deactivated`);
    if (selected?.id === confirmUser.id) setSelected(null);
    setConfirmUser(null);
  };

  const reactivate = (u: DemoAdminUser) => {
    store.toggleUserActive(u.id);
    toast.success(`${u.name} reactivated`);
    if (selected?.id === u.id) setSelected({ ...u, active: true });
  };

  const totalSpend = +state.users.reduce((s, u) => s + spendOf(u), 0).toFixed(2);

  const SortHeader = ({ label, k, className = '' }: { label: string; k: SortKey; className?: string }) => (
    <th className={`text-left text-xs font-medium text-muted-foreground p-4 ${className}`}>
      <button type="button" className="inline-flex items-center gap-1 py-1.5 -my-1.5 hover:text-foreground transition-colors" onClick={() => toggleSort(k)}>
        {label}
        {sortKey === k
          ? (sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ArrowUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );

  const selectedTxs = selected ? (spendByUser.get(selected.name)?.txs ?? []).slice().reverse().slice(0, 8) : [];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users & Subscribers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{metrics.totalUsers} accounts · {metrics.activeUsers} active</p>
        </div>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={exportCsv}><Download className="mr-1.5 h-3.5 w-3.5" /> Export</Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { icon: Users, label: 'Total accounts', value: String(metrics.totalUsers), sub: `${metrics.activeUsers} active` },
          { icon: ShieldCheck, label: 'Creators & admins', value: String(counts.creator + counts.admin), sub: `${counts.creator} creators · ${counts.admin} admins` },
          { icon: Wallet, label: 'Subscriber spend', value: `$${totalSpend.toFixed(2)}`, sub: 'lifetime, excl. refunds' },
          { icon: CheckCircle2, label: 'Active subscriptions', value: String(state.users.reduce((s, u) => s + u.subs, 0)), sub: 'across all subscribers' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><s.icon className="h-3.5 w-3.5" />{s.label}</div>
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Role filter tabs with live counts */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {(['all', 'subscriber', 'creator', 'admin'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors inline-flex items-center gap-1.5 ${
              role === r ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {r}
            <span className="text-[10px] opacity-60">{counts[r]}</span>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <SortHeader label="User" k="name" />
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
                <SortHeader label="Subscriptions" k="subs" />
                <SortHeader label="Spend" k="spend" />
                <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                <SortHeader label="Joined" k="joined" />
                <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No accounts match this filter.</td></tr>
              )}
              {filtered.map(u => {
                const r = roleStyle[u.role] ?? roleStyle.subscriber;
                const spend = spendOf(u);
                return (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors cursor-pointer ${u.active ? '' : 'opacity-60'}`}
                  >
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-muted-foreground text-xs">{u.email}</td>
                    <td className="p-4"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${r.cls}`}>{r.label}</span></td>
                    <td className="p-4">{u.subs > 0 ? <span className="text-sm font-medium">{u.subs} active</span> : <span className="text-xs text-muted-foreground">None</span>}</td>
                    <td className="p-4 text-sm">{spend > 0 ? `$${spend.toFixed(2)}` : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="p-4">
                      {u.active
                        ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500"><CheckCircle2 className="h-3 w-3" /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><UserX className="h-3 w-3" /> Deactivated</span>}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{format(joinedDate(u.joinedDaysAgo), 'MMM d, yyyy')}</td>
                    <td className="p-4" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        {u.active ? (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            disabled={u.role === 'admin'}
                            title={u.role === 'admin' ? 'Admin accounts cannot be deactivated' : 'Deactivate'}
                            onClick={() => setConfirmUser(u)}
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 px-2 text-xs text-emerald-500"
                            title="Reactivate"
                            onClick={() => reactivate(u)}
                          >
                            <UserCheck className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User detail dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selected.name}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${(roleStyle[selected.role] ?? roleStyle.subscriber).cls}`}>
                    {(roleStyle[selected.role] ?? roleStyle.subscriber).label}
                  </span>
                  {!selected.active && <Badge variant="destructive" className="text-[10px]">Deactivated</Badge>}
                </DialogTitle>
                <DialogDescription>{selected.email} · joined {format(joinedDate(selected.joinedDaysAgo), 'MMM d, yyyy')}</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                <div className="rounded-lg border border-border p-3 text-center">
                  <div className="text-lg font-bold">{selected.subs}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Subscriptions</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <div className="text-lg font-bold">${spendOf(selected).toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Lifetime spend</div>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <div className="text-lg font-bold">{spendByUser.get(selected.name)?.txs.length ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Transactions</div>
                </div>
              </div>

              {selectedTxs.length > 0 ? (
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30 border-b border-border">Recent transactions</div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border">
                    {selectedTxs.map(t => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                        <div>
                          <div className="font-medium">{t.creatorName}</div>
                          <div className="text-muted-foreground">{format(t.date, 'MMM d, yyyy')}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${t.amount.toFixed(2)}</div>
                          <div className={`capitalize ${t.status === 'refunded' ? 'text-destructive' : t.status === 'cancelled' ? 'text-amber-500' : 'text-emerald-500'}`}>{t.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">No transactions recorded for this account.</p>
              )}

              <div className="flex justify-end gap-2 mt-2">
                {selected.role !== 'admin' && (
                  selected.active ? (
                    <Button variant="destructive" size="sm" className="text-xs" onClick={() => { setConfirmUser(selected); }}>
                      <UserX className="mr-1.5 h-3.5 w-3.5" /> Deactivate account
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs text-emerald-500" onClick={() => reactivate(selected)}>
                      <UserCheck className="mr-1.5 h-3.5 w-3.5" /> Reactivate account
                    </Button>
                  )
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm deactivation */}
      <AlertDialog open={!!confirmUser} onOpenChange={open => !open && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {confirmUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will immediately lose access to the platform and any gated content. Active subscriptions keep billing until cancelled — this does not refund payments. You can reactivate the account at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DemoAdminUsers;
