import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Crown, Loader2, ExternalLink, Ban, Star, CheckCircle2, XCircle, Search, MessageSquare, ShieldCheck, TrendingDown, UserX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';

interface Creator {
  id: string;
  username: string | null;
  display_name: string | null;
  monthly_price: number | null;
  is_published: boolean | null;
  created_at: string;
  user_id: string;
  email: string;
  subCount: number;
  revenue: number;
  feePercent: number;
  verified: boolean;
  daysSinceSignup: number;
}

const AdminCreators = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState('');

  const loadCreators = async () => {
    const [creatorsRes, subsRes, usersRes] = await Promise.all([
      supabase.from('creators').select('id, username, display_name, monthly_price, is_published, created_at, user_id').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('creator_id, status'),
      supabase.from('users').select('id, email'),
    ]);

    const subs = subsRes.data ?? [];
    const subCounts = new Map<string, number>();
    subs.filter(s => s.status === 'active').forEach(s => {
      subCounts.set(s.creator_id, (subCounts.get(s.creator_id) ?? 0) + 1);
    });

    const userMap = new Map((usersRes.data ?? []).map(u => [u.id, u]));

    setCreators((creatorsRes.data ?? []).map(c => {
      const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const user = userMap.get(c.user_id);
      return {
        ...c,
        email: user?.email ?? '—',
        subCount: subCounts.get(c.id) ?? 0,
        revenue: (subCounts.get(c.id) ?? 0) * (c.monthly_price ?? 9.99),
        feePercent: days < 30 ? 5 : 10,
        verified: days > 14,
        daysSinceSignup: days,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { loadCreators(); }, []);

  const togglePublish = async (creator: Creator) => {
    const { error } = await supabase.from('creators').update({ is_published: !creator.is_published }).eq('id', creator.id);
    if (error) toast.error(error.message);
    else { toast.success(creator.is_published ? 'Creator disabled' : 'Creator enabled'); loadCreators(); }
  };

  const filtered = creators.filter(c => {
    const q = search.toLowerCase();
    return !q || (c.display_name?.toLowerCase().includes(q)) || (c.username?.toLowerCase().includes(q)) || c.email.toLowerCase().includes(q);
  });

  const topCreators = [...creators].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const fastestGrowing = [...creators].sort((a, b) => b.subCount - a.subCount).filter(c => c.daysSinceSignup < 60).slice(0, 5);
  const atRisk = creators.filter(c => c.subCount > 0 && c.subCount < 3);
  const inactive = creators.filter(c => c.daysSinceSignup > 30 && c.subCount === 0);

  return (
    <DashboardLayout type="admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Creators Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{creators.length} total creators</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search creators…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* Insight Sections */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2"><Star className="h-3.5 w-3.5 text-amber-400" /><span className="text-xs font-medium text-muted-foreground">Top Creators</span></div>
            {topCreators.slice(0, 3).map((c, i) => (
              <div key={c.id} className="flex items-center justify-between py-1">
                <span className="text-xs font-medium truncate">{c.display_name ?? `@${c.username}`}</span>
                <span className="text-xs text-emerald-400">${c.revenue.toFixed(0)}</span>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="h-3.5 w-3.5 text-blue-400" /><span className="text-xs font-medium text-muted-foreground">Fastest Growing</span></div>
            {fastestGrowing.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center justify-between py-1">
                <span className="text-xs font-medium truncate">{c.display_name ?? `@${c.username}`}</span>
                <span className="text-xs text-blue-400">{c.subCount} subs</span>
              </div>
            ))}
            {fastestGrowing.length === 0 && <p className="text-xs text-muted-foreground py-2">No data</p>}
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-center gap-2 mb-2"><Crown className="h-3.5 w-3.5 text-amber-400" /><span className="text-xs font-medium text-muted-foreground">At Risk</span></div>
            <p className="text-xl font-bold text-amber-400">{atRisk.length}</p>
            <p className="text-[10px] text-muted-foreground">Creators with &lt;3 subscribers</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2"><UserX className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs font-medium text-muted-foreground">Inactive</span></div>
            <p className="text-xl font-bold">{inactive.length}</p>
            <p className="text-[10px] text-muted-foreground">30+ days, 0 subscribers</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <Crown className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">{search ? 'No matching creators' : 'No creators yet'}</h3>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Creator</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Email</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Subs</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Revenue</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Fee</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Verified</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground p-4">Joined</th>
                  <th className="text-right text-xs font-medium text-muted-foreground p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{c.display_name ?? 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">@{c.username ?? '—'}</p>
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{c.email}</td>
                    <td className="p-4 font-medium">{c.subCount}</td>
                    <td className="p-4 font-medium text-emerald-400">${c.revenue.toFixed(0)}</td>
                    <td className="p-4">
                      <Badge variant="outline" className={`text-[10px] ${c.feePercent <= 5 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {c.feePercent}%
                      </Badge>
                    </td>
                    <td className="p-4">
                      {c.verified ? (
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><ShieldCheck className="h-2.5 w-2.5 mr-1" />Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">Pending</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      {c.is_published ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Active</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive"><XCircle className="h-3 w-3" /> Disabled</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{format(new Date(c.created_at), 'MMM d, yyyy')}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        {c.username && (
                          <Link to={`/${c.username}`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" title="View profile"><ExternalLink className="h-3 w-3" /></Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => navigate('/admin/creator-messaging')} title="Message creator"><MessageSquare className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => togglePublish(c)} title={c.is_published ? 'Disable' : 'Enable'}>
                          {c.is_published ? <Ban className="h-3 w-3 text-destructive" /> : <CheckCircle2 className="h-3 w-3 text-primary" />}
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
    </DashboardLayout>
  );
};

export default AdminCreators;
