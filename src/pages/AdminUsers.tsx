import { useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Loader2, Search, Eye, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { downloadCsv } from '@/lib/csv';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: number;
  subCount: number;
  role: string;
  totalSpend: number;
  creatorEarnings: number;
  paidOut: number;
}

const AdminUsers = () => {
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [search, setSearch] = useState('');

  const usersRaw = useQuery(api.admin.queries.listUsers);
  const subsRaw = useQuery(api.subscriptions.mutations.listAllAdmin);
  const payoutsRaw = useQuery(api.payouts.mutations.listAllAdmin);
  const creatorsRaw = useQuery(api.creators.queries.listAllAdmin);

  const loading = usersRaw === undefined || subsRaw === undefined || payoutsRaw === undefined || creatorsRaw === undefined;

  const users = useMemo((): UserRow[] => {
    if (!usersRaw || !subsRaw || !payoutsRaw || !creatorsRaw) return [];

    const subCounts = new Map<string, number>();
    subsRaw.filter(s => s.status === 'active').forEach(s => {
      subCounts.set(s.userId, (subCounts.get(s.userId) ?? 0) + 1);
    });

    const creatorsByUser = new Map<string, string[]>();
    creatorsRaw.forEach(c => {
      creatorsByUser.set(c.userId, [...(creatorsByUser.get(c.userId) ?? []), c._id]);
    });
    const creatorUserIds = new Set(creatorsByUser.keys());

    const spendBy = new Map<string, number>();
    const earningsByCreator = new Map<string, number>();
    subsRaw.forEach(s => {
      spendBy.set(s.userId, (spendBy.get(s.userId) ?? 0) + s.amountCents / 100);
      if (s.status === 'active') {
        earningsByCreator.set(s.creatorId, (earningsByCreator.get(s.creatorId) ?? 0) + s.creatorEarningsCents / 100);
      }
    });

    const paidByCreator = new Map<string, number>();
    payoutsRaw
      .filter(p => p.status === 'completed')
      .forEach(p => paidByCreator.set(p.creatorId, (paidByCreator.get(p.creatorId) ?? 0) + p.amountCents / 100));

    const sumFor = (userId: string, source: Map<string, number>) =>
      (creatorsByUser.get(userId) ?? []).reduce((a, id) => a + (source.get(id) ?? 0), 0);

    return usersRaw.map(u => {
      let role = 'user';
      if (creatorUserIds.has(u._id)) role = 'creator';
      else if ((subCounts.get(u._id) ?? 0) > 0) role = 'subscriber';
      return {
        id: u._id,
        email: u.email,
        full_name: u.fullName ?? null,
        created_at: u.createdAt,
        subCount: subCounts.get(u._id) ?? 0,
        role,
        totalSpend: spendBy.get(u._id) ?? 0,
        creatorEarnings: sumFor(u._id, earningsByCreator),
        paidOut: sumFor(u._id, paidByCreator),
      };
    }).sort((a, b) => b.created_at - a.created_at);
  }, [usersRaw, subsRaw, payoutsRaw, creatorsRaw]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.full_name?.toLowerCase().includes(q)) || u.email.toLowerCase().includes(q);
  });

  const roleLabel = (role: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      admin: { label: 'Admin', cls: 'bg-destructive/10 text-destructive' },
      creator: { label: 'Creator', cls: 'bg-purple-500/10 text-purple-400' },
      subscriber: { label: 'Subscriber', cls: 'bg-blue-500/10 text-blue-400' },
      user: { label: 'User', cls: 'bg-muted text-muted-foreground' },
      moderator: { label: 'Moderator', cls: 'bg-amber-500/10 text-amber-400' },
    };
    const r = map[role] ?? map.user;
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${r.cls}`}>{r.label}</span>;
  };

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('Nothing to export'); return; }
    downloadCsv(
      `users-${new Date().toISOString().split('T')[0]}.csv`,
      ['Name', 'Email', 'Role', 'Active subscriptions', 'Total spend', 'Creator earnings', 'Paid out', 'Joined'],
      filtered.map(u => [
        u.full_name ?? 'Unknown', u.email, u.role, u.subCount,
        u.totalSpend.toFixed(2), u.creatorEarnings.toFixed(2), u.paidOut.toFixed(2),
        format(new Date(u.created_at), 'yyyy-MM-dd'),
      ]),
    );
    toast.success(`Exported ${filtered.length} accounts`);
  };

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users & Subscribers</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} total users</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{search ? 'No matching users' : 'No users yet'}</h3>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">User</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Subscriptions</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Total Spend</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator Earnings</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Paid Out</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-medium">{u.full_name ?? 'Unknown'}</td>
                    <td className="p-4 text-muted-foreground text-xs">{u.email}</td>
                    <td className="p-4">{roleLabel(u.role)}</td>
                    <td className="p-4">
                      {u.subCount > 0 ? (
                        <span className="text-sm font-medium">{u.subCount} active</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-4 text-xs">{u.totalSpend > 0 ? `$${u.totalSpend.toFixed(2)}` : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-4 text-xs font-medium text-emerald-400">{u.creatorEarnings > 0 ? `$${u.creatorEarnings.toFixed(2)}` : <span className="text-muted-foreground font-normal">—</span>}</td>
                    <td className="p-4 text-xs">{u.paidOut > 0 ? `$${u.paidOut.toFixed(2)}` : <span className="text-muted-foreground">—</span>}</td>
                    <td className="p-4 text-xs text-muted-foreground">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSelected(u)} title="View account">
                          <Eye className="h-3 w-3" />
                        </Button>
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
          <DialogHeader><DialogTitle>{selected?.full_name ?? 'Account'}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selected.email}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Role</span>{roleLabel(selected.role)}</div>
              <div className="flex justify-between"><span className="text-muted-foreground">Joined</span><span>{format(new Date(selected.created_at), 'MMM d, yyyy')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Active subscriptions</span><span>{selected.subCount}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total spend</span><span>${selected.totalSpend.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Creator earnings</span><span className="text-emerald-400">${selected.creatorEarnings.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Paid out</span><span>${selected.paidOut.toFixed(2)}</span></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminUsers;
