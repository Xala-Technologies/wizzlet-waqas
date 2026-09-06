import { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DesktopTableRegion, MobileRecordCards } from '@/components/dashboard/MobileRecordList';
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
  is_published: boolean;
  created_at: number;
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
  const [search, setSearch] = useState('');

  const creatorsRaw = useQuery(api.creators.queries.listAllAdmin);
  const subsRaw = useQuery(api.subscriptions.mutations.listAllAdmin);
  const usersRaw = useQuery(api.admin.queries.listUsers);
  const setPublished = useMutation(api.creators.queries.setPublished);

  const loading = creatorsRaw === undefined || subsRaw === undefined || usersRaw === undefined;

  const creators = useMemo((): Creator[] => {
    if (!creatorsRaw || !subsRaw || !usersRaw) return [];

    const subCounts = new Map<string, number>();
    subsRaw.filter(s => s.status === 'active').forEach(s => {
      subCounts.set(s.creatorId, (subCounts.get(s.creatorId) ?? 0) + 1);
    });

    const userMap = new Map(usersRaw.map(u => [u._id, u]));

    return creatorsRaw.map(c => {
      const days = Math.floor((Date.now() - c.createdAt) / (1000 * 60 * 60 * 24));
      const user = userMap.get(c.userId);
      const monthlyPrice = (c.monthlyPriceCents ?? 999) / 100;
      return {
        id: c._id,
        username: c.username,
        display_name: c.displayName ?? null,
        monthly_price: monthlyPrice,
        is_published: c.isPublished,
        created_at: c.createdAt,
        user_id: c.userId,
        email: user?.email ?? '—',
        subCount: subCounts.get(c._id) ?? 0,
        revenue: (subCounts.get(c._id) ?? 0) * monthlyPrice,
        feePercent: days < 30 ? 5 : 10,
        verified: c.verificationStatus === 'verified' || days > 14,
        daysSinceSignup: days,
      };
    }).sort((a, b) => b.created_at - a.created_at);
  }, [creatorsRaw, subsRaw, usersRaw]);

  const togglePublish = async (creator: Creator) => {
    try {
      await setPublished({
        creatorId: creator.id as Id<'creators'>,
        isPublished: !creator.is_published,
      });
      toast.success(creator.is_published ? 'Creator disabled' : 'Creator enabled');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update creator');
    }
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Creators Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{creators.length} total creators</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search creators…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-11 sm:h-9" />
        </div>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2"><Star className="h-3.5 w-3.5 text-amber-400" /><span className="text-xs font-medium text-muted-foreground">Top Creators</span></div>
            {topCreators.slice(0, 3).map((c) => (
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
        <>
          <MobileRecordCards>
            {filtered.map((c) => (
              <li key={c.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.display_name ?? 'Unnamed'}</p>
                    <p className="text-xs text-muted-foreground truncate">@{c.username ?? '—'} · {c.email}</p>
                  </div>
                  {c.is_published ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 shrink-0"><CheckCircle2 className="h-3.5 w-3.5" /> Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive shrink-0"><XCircle className="h-3.5 w-3.5" /> Disabled</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Subs</span><p className="font-medium mt-0.5">{c.subCount}</p></div>
                  <div><span className="text-muted-foreground">Revenue</span><p className="font-medium mt-0.5 text-emerald-400">${c.revenue.toFixed(0)}</p></div>
                  <div><span className="text-muted-foreground">Fee</span><p className="font-medium mt-0.5">{c.feePercent}%</p></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {c.username && (
                    <Link to={`/${c.username}`} className="flex-1 min-w-[7rem]">
                      <Button variant="outline" size="sm" className="h-11 w-full text-xs"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Profile</Button>
                    </Link>
                  )}
                  <Button variant="outline" size="sm" className="h-11 flex-1 min-w-[7rem] text-xs" onClick={() => navigate('/admin/creator-messaging')}>
                    <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Message
                  </Button>
                  <Button variant="outline" size="sm" className="h-11 flex-1 min-w-[7rem] text-xs" onClick={() => togglePublish(c)}>
                    {c.is_published ? <><Ban className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Disable</> : <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-primary" /> Enable</>}
                  </Button>
                </div>
              </li>
            ))}
          </MobileRecordCards>

          <DesktopTableRegion label="Creators table" className="overflow-hidden">
            <table className="w-full min-w-[720px] text-sm">
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
                            <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-xs" title="View profile" aria-label="View profile"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </Link>
                        )}
                        <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-xs" onClick={() => navigate('/admin/creator-messaging')} title="Message creator" aria-label="Message creator"><MessageSquare className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 px-0 text-xs" onClick={() => togglePublish(c)} title={c.is_published ? 'Disable' : 'Enable'} aria-label={c.is_published ? 'Disable' : 'Enable'}>
                          {c.is_published ? <Ban className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DesktopTableRegion>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminCreators;
