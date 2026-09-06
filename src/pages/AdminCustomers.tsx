import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, CheckCircle2, XCircle, Search, Eye, Mail, Download, TrendingDown, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { downloadCsv } from '@/lib/csv';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Customer {
  id: string;
  email: string;
  full_name: string | null;
  created_at: number;
  subCount: number;
  activeCount: number;
  canceledCount: number;
  totalSpent: number;
  lastActivity: number;
}

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');

  const usersRaw = useQuery(api.admin.queries.listUsers);
  const subsRaw = useQuery(api.subscriptions.mutations.listAllAdmin);

  const loading = usersRaw === undefined || subsRaw === undefined;

  const customers = useMemo((): Customer[] => {
    if (!usersRaw || !subsRaw) return [];

    const subsByUser = new Map<string, typeof subsRaw>();
    subsRaw.forEach(s => {
      const arr = subsByUser.get(s.userId) ?? [];
      arr.push(s);
      subsByUser.set(s.userId, arr);
    });

    return usersRaw.map(u => {
      const userSubs = subsByUser.get(u._id) ?? [];
      const active = userSubs.filter(s => s.status === 'active');
      const canceled = userSubs.filter(s => s.status !== 'active');
      const totalSpent = userSubs.reduce((a, b) => a + b.amountCents / 100, 0);
      const lastSub = [...userSubs].sort((a, b) => b.createdAt - a.createdAt)[0];
      return {
        id: u._id,
        email: u.email,
        full_name: u.fullName ?? null,
        created_at: u.createdAt,
        subCount: userSubs.length,
        activeCount: active.length,
        canceledCount: canceled.length,
        totalSpent,
        lastActivity: lastSub?.createdAt ?? u.createdAt,
      };
    }).sort((a, b) => b.created_at - a.created_at);
  }, [usersRaw, subsRaw]);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.full_name?.toLowerCase().includes(q)) || c.email.toLowerCase().includes(q);
  });

  const atRisk = customers.filter(c => c.activeCount === 1 && c.canceledCount > 0).length;
  const recentlyChurned = customers.filter(c => c.canceledCount > 0 && c.activeCount === 0).length;

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('Nothing to export'); return; }
    downloadCsv(
      `customers-${new Date().toISOString().split('T')[0]}.csv`,
      ['Name', 'Email', 'Subscriptions', 'Active', 'Canceled', 'Total Spent', 'Joined', 'Last Activity'],
      filtered.map(c => [
        c.full_name ?? 'Unknown', c.email, c.subCount, c.activeCount, c.canceledCount,
        c.totalSpent.toFixed(2), format(new Date(c.created_at), 'yyyy-MM-dd'), format(new Date(c.lastActivity), 'yyyy-MM-dd'),
      ]),
    );
    toast.success(`Exported ${filtered.length} customers`);
  };

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{customers.length} total customers</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-bold">{customers.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Subs</p>
          <p className="text-xl font-bold text-emerald-400">{customers.reduce((a, c) => a + c.activeCount, 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Revenue</p>
          <p className="text-xl font-bold">${customers.reduce((a, c) => a + c.totalSpent, 0).toFixed(0)}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3 text-amber-400" /><p className="text-xs text-muted-foreground uppercase tracking-wider">At Risk</p></div>
          <p className="text-xl font-bold text-amber-400">{atRisk}</p>
        </div>
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-1 mb-1"><TrendingDown className="h-3 w-3 text-destructive" /><p className="text-xs text-muted-foreground uppercase tracking-wider">Churned</p></div>
          <p className="text-xl font-bold text-destructive">{recentlyChurned}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{search ? 'No matching customers' : 'No customers yet'}</h3>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Subs</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Total Spent</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Last Activity</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{c.full_name ?? 'Unknown'}</td>
                    <td className="p-4 text-muted-foreground text-xs">{c.email}</td>
                    <td className="p-4 font-medium">{c.subCount}</td>
                    <td className="p-4">
                      {c.activeCount > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><CheckCircle2 className="h-2.5 w-2.5 mr-1" />Active</Badge>
                      ) : c.canceledCount > 0 ? (
                        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20"><XCircle className="h-2.5 w-2.5 mr-1" />Canceled</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No subs</span>
                      )}
                    </td>
                    <td className="p-4 font-medium">${c.totalSpent.toFixed(2)}</td>
                    <td className="p-4 text-xs text-muted-foreground">{format(new Date(c.lastActivity), 'MMM d, yyyy')}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelected(c)} title="View details"><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate('/admin/customer-email')} title="Email customers"><Mail className="h-3 w-3" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{selected?.full_name ?? 'Customer'}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selected.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{format(new Date(selected.created_at), 'MMM d, yyyy')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Subscriptions</span><span>{selected.subCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Active</span><span className="text-emerald-400">{selected.activeCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Canceled</span><span className="text-destructive">{selected.canceledCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lifetime value</span><span className="font-medium">${selected.totalSpent.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Last activity</span><span>{format(new Date(selected.lastActivity), 'MMM d, yyyy')}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminCustomers;
