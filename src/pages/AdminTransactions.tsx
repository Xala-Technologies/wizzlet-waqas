import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { downloadCsv } from '@/lib/csv';

interface Transaction {
  id: string;
  status: string;
  created_at: string;
  userName: string;
  creatorName: string;
  amount: number;
  creatorEarnings: number;
  platformFee: number;
  feePercentage: number;
}

const AdminTransactions = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const load = async () => {
      const [subsRes, creatorsRes, usersRes] = await Promise.all([
        supabase.from('subscriptions').select('id, status, created_at, user_id, creator_id, amount, platform_fee, creator_earnings, fee_percentage').order('created_at', { ascending: false }),
        supabase.from('creators').select('id, display_name, username'),
        supabase.from('users').select('id, email, full_name'),
      ]);

      const creatorMap = new Map((creatorsRes.data ?? []).map(c => [c.id, c]));
      const userMap = new Map((usersRes.data ?? []).map(u => [u.id, u]));

      setTransactions((subsRes.data ?? []).map(s => {
        const creator = creatorMap.get(s.creator_id);
        const user = userMap.get(s.user_id);
        return {
          id: s.id,
          status: s.status,
          created_at: s.created_at,
          userName: user?.full_name ?? user?.email ?? 'Unknown',
          creatorName: creator?.display_name ?? `@${creator?.username ?? 'unknown'}`,
          amount: Number(s.amount),
          creatorEarnings: Number(s.creator_earnings),
          platformFee: Number(s.platform_fee),
          feePercentage: Number(s.fee_percentage),
        };
      }));
      setLoading(false);
    };
    load();
  }, []);

  const active = transactions.filter(t => t.status === 'active');
  const totalAmount = active.reduce((a, b) => a + b.amount, 0);
  const totalFees = active.reduce((a, b) => a + b.platformFee, 0);
  const totalCreatorEarnings = active.reduce((a, b) => a + b.creatorEarnings, 0);

  const filtered = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchesSearch = !q || t.userName.toLowerCase().includes(q) || t.creatorName.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    if (filtered.length === 0) { toast.error('Nothing to export'); return; }
    downloadCsv(
      `transactions-${new Date().toISOString().split('T')[0]}.csv`,
      ['Date', 'Customer', 'Creator', 'Amount', 'Platform Fee', 'Fee %', 'Creator Earnings', 'Status'],
      filtered.map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd'), t.userName, t.creatorName,
        t.amount.toFixed(2), t.platformFee.toFixed(2), t.feePercentage, t.creatorEarnings.toFixed(2), t.status,
      ]),
    );
    toast.success(`Exported ${filtered.length} transactions`);
  };

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{transactions.length} total transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-9 text-xs" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Volume</p>
          <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Platform Fees</p>
          <p className="text-2xl font-bold text-emerald-400">${totalFees.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Creator Payouts</p>
          <p className="text-2xl font-bold">${totalCreatorEarnings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Active Subs</p>
          <p className="text-2xl font-bold">{active.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{search ? 'No matching transactions' : 'No transactions yet'}</h3>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Customer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator Earnings</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Platform Fee</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Fee %</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4 text-xs text-muted-foreground">{format(new Date(t.created_at), 'MMM d, yyyy')}</td>
                    <td className="p-4 font-medium">{t.userName}</td>
                    <td className="p-4 text-muted-foreground">{t.creatorName}</td>
                    <td className="p-4 font-medium">${t.amount.toFixed(2)}</td>
                    <td className="p-4 font-medium">${t.creatorEarnings.toFixed(2)}</td>
                    <td className="p-4 text-emerald-400">${t.platformFee.toFixed(2)}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`text-[10px] ${t.feePercentage <= 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {t.feePercentage}%
                      </Badge>
                    </td>
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
      )}
    </DashboardLayout>
  );
};

export default AdminTransactions;
