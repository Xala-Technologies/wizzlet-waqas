import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
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
  created_at: string;
  subCount: number;
  role: string;
  totalSpend: number;
  creatorEarnings: number;
  paidOut: number;
}

const AdminUsers = () => {
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');

  const loadUsers = async () => {
    const [usersRes, subsRes, rolesRes, creatorsRes] = await Promise.all([
      supabase.from('users').select('id, email, full_name, created_at, auth_id').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('user_id, creator_id, amount, creator_earnings, status'),
      supabase.from('user_roles').select('user_id, role'),
      supabase.from('creators').select('id, user_id'),
    ]);

    if (usersRes.error) {
      toast.error(usersRes.error.message || 'Failed to load users');
      setLoading(false);
      return;
    }

    const payoutsRes = await supabase.from('payouts').select('creator_id, amount, status');
    if (payoutsRes.error) {
      toast.error(payoutsRes.error.message || 'Failed to load payouts');
    }
    const subs = subsRes.data ?? [];
    const subCounts = new Map<string, number>();
    subs.filter(s => s.status === 'active').forEach(s => {
      subCounts.set(s.user_id, (subCounts.get(s.user_id) ?? 0) + 1);
    });

    const roleMap = new Map<string, string>();
    (rolesRes.data ?? []).forEach(r => roleMap.set(r.user_id, r.role));

    const creatorsByUser = new Map<string, string[]>();
    (creatorsRes.data ?? []).forEach(c => {
      creatorsByUser.set(c.user_id, [...(creatorsByUser.get(c.user_id) ?? []), c.id]);
    });
    const creatorUserIds = new Set(creatorsByUser.keys());

    const spendBy = new Map<string, number>();
    const earningsByCreator = new Map<string, number>();
    subs.forEach(s => {
      spendBy.set(s.user_id, (spendBy.get(s.user_id) ?? 0) + Number(s.amount));
      if (s.status === 'active') {
        earningsByCreator.set(s.creator_id, (earningsByCreator.get(s.creator_id) ?? 0) + Number(s.creator_earnings));
      }
    });

    const paidByCreator = new Map<string, number>();
    (payoutsRes.data ?? [])
      .filter(p => p.status === 'completed')
      .forEach(p => paidByCreator.set(p.creator_id, (paidByCreator.get(p.creator_id) ?? 0) + Number(p.amount)));

    const sumFor = (userId: string, source: Map<string, number>) =>
      (creatorsByUser.get(userId) ?? []).reduce((a, id) => a + (source.get(id) ?? 0), 0);

    setUsers((usersRes.data ?? []).map(u => {
      // Determine role: check user_roles first (uses auth_id), then creator table
      let role = roleMap.get(u.auth_id) ?? 'user';
      if (creatorUserIds.has(u.id) && role === 'user') role = 'creator';
      return {
        ...u,
        subCount: subCounts.get(u.id) ?? 0,
        role,
        totalSpend: spendBy.get(u.id) ?? 0,
        creatorEarnings: sumFor(u.id, earningsByCreator),
        paidOut: sumFor(u.id, paidByCreator),
      };
    }));
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

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
