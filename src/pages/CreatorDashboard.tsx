import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users, DollarSign, FileText, Plus, Loader2, TrendingUp, Package, ArrowRight, Activity,
  ShieldCheck, Lightbulb, BarChart3, Target, Zap, Flame,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

interface Post {
  id: string;
  title: string;
  is_premium: boolean;
  created_at: string;
}

interface PickEntry {
  id: string; result: string; units_won_lost: number | null; units_risked: number; sport: string; date: string;
}

const CreatorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subCount, setSubCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [creatorUsername, setCreatorUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: userData } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      if (!userData) { setLoading(false); return; }
      const { data: creator } = await supabase.from('creators').select('id, username, monthly_price').eq('user_id', userData.id).maybeSingle();
      if (!creator) { setLoading(false); return; }
      setCreatorUsername(creator.username);
      const [subsRes, postsRes, productsRes] = await Promise.all([
        supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('creator_id', creator.id).eq('status', 'active'),
        supabase.from('posts').select('id, title, is_premium, created_at').eq('creator_id', creator.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('creator_id', creator.id),
      ]);
      const subs = subsRes.count ?? 0;
      setSubCount(subs);
      setRevenue(subs * (creator.monthly_price ?? 9.99));
      setPosts(postsRes.data ?? []);
      setPostCount(postsRes.data?.length ?? 0);
      setProductCount(productsRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, [user]);

  // Fetch picks for performance summary
  const { data: picks = [] } = useQuery({
    queryKey: ['creator_dashboard_picks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pick_tracker').select('*').order('date', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PickEntry[];
    },
    enabled: !!user,
  });

  // Performance stats
  const perfStats = useMemo(() => {
    const settled = picks.filter(p => p.result !== 'pending');
    const wins = settled.filter(p => p.result === 'win').length;
    const totalWonLost = picks.reduce((s, p) => s + (p.units_won_lost || 0), 0);
    const totalRisked = settled.reduce((s, p) => s + (p.units_risked || 0), 0);
    const winRate = settled.length > 0 ? Math.round((wins / settled.length) * 100) : 0;
    const roi = totalRisked > 0 ? Math.round((totalWonLost / totalRisked) * 100) : 0;
    return { totalPicks: picks.length, wins, totalWonLost, winRate, roi, settled: settled.length };
  }, [picks]);

  // Verification
  const verification = useMemo(() => {
    const minPicks = 50;
    const minWinRate = 52;
    const isVerified = perfStats.settled >= minPicks && perfStats.winRate >= minWinRate;
    const progress = Math.min(100, Math.round((perfStats.settled / minPicks) * 100));
    return { isVerified, progress, settled: perfStats.settled, minPicks };
  }, [perfStats]);

  // Revenue insights
  const revenueInsights = useMemo(() => {
    const insightsList: string[] = [];
    if (picks.length === 0) return insightsList;

    // Best sport by profit
    const sportMap: Record<string, { profit: number; picks: number }> = {};
    picks.forEach(p => {
      if (!sportMap[p.sport]) sportMap[p.sport] = { profit: 0, picks: 0 };
      sportMap[p.sport].profit += (p.units_won_lost || 0);
      sportMap[p.sport].picks++;
    });
    const sportArr = Object.entries(sportMap).sort((a, b) => b[1].profit - a[1].profit);
    if (sportArr.length > 1) {
      insightsList.push(`${sportArr[0][0]} picks are your most profitable — focus content here for higher retention.`);
      if (sportArr[sportArr.length - 1][1].profit < 0) {
        insightsList.push(`${sportArr[sportArr.length - 1][0]} is losing money — consider reducing picks in this sport.`);
      }
    }

    // Premium vs free content correlation
    const premiumPosts = posts.filter(p => p.is_premium);
    const freePosts = posts.filter(p => !p.is_premium);
    if (premiumPosts.length > 0 && freePosts.length > 0) {
      insightsList.push('Mix premium and free content — free posts act as a funnel for new subscribers.');
    }

    if (subCount > 0 && perfStats.winRate > 55) {
      insightsList.push('Your high win rate is a selling point — highlight it in your profile to attract more subscribers.');
    }

    if (insightsList.length === 0) insightsList.push('Track more picks to unlock revenue insights.');
    return insightsList;
  }, [picks, posts, subCount, perfStats]);

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      </DashboardLayout>
    );
  }

  const stats = [
    { label: 'Subscribers', value: subCount.toString(), icon: Users, color: 'text-blue-400' },
    { label: 'Est. Revenue', value: `$${revenue.toFixed(0)}`, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Total Posts', value: postCount.toString(), icon: FileText, color: 'text-purple-400' },
    { label: 'Products', value: productCount.toString(), icon: Package, color: 'text-amber-400' },
  ];

  const valColor = (v: number) => v > 0 ? 'text-emerald-400' : v < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <DashboardLayout type="creator">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Overview
            {verification.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Welcome back{creatorUsername ? `, @${creatorUsername}` : ''}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <TrendingUp className="h-3 w-3 text-muted-foreground/40" />
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Performance Summary */}
      {picks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="h-3 w-3" /> Performance Summary</h2>
            <Link to="/creator/performance-tracker" className="text-xs text-primary hover:underline flex items-center gap-1">Full tracker <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[9px] text-muted-foreground uppercase">Net Profit</p>
              <p className={`text-lg font-bold ${valColor(perfStats.totalWonLost)}`}>{perfStats.totalWonLost > 0 ? '+' : ''}{perfStats.totalWonLost.toFixed(1)}u</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[9px] text-muted-foreground uppercase">Win Rate</p>
              <p className="text-lg font-bold">{perfStats.winRate}%</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[9px] text-muted-foreground uppercase">ROI</p>
              <p className={`text-lg font-bold ${valColor(perfStats.roi)}`}>{perfStats.roi >= 0 ? '+' : ''}{perfStats.roi}%</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[9px] text-muted-foreground uppercase">Total Picks</p>
              <p className="text-lg font-bold">{perfStats.totalPicks}</p>
            </div>
            <div className="rounded-lg bg-muted/30 p-2.5">
              <p className="text-[9px] text-muted-foreground uppercase">Wins</p>
              <p className="text-lg font-bold text-emerald-400">{perfStats.wins}</p>
            </div>
          </div>
        </div>
      )}

      {/* Verification Progress */}
      {!verification.isVerified && picks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium">Verified Performance Progress</p>
            <span className="text-[10px] text-muted-foreground ml-auto">{verification.settled}/{verification.minPicks} picks</span>
          </div>
          <Progress value={verification.progress} className="h-1.5 mb-1.5" />
          <p className="text-[10px] text-muted-foreground">Track {Math.max(0, verification.minPicks - verification.settled)} more picks with 52%+ win rate to earn your Verified badge.</p>
        </div>
      )}

      {/* Revenue Insights */}
      {revenueInsights.length > 0 && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Revenue Insights</h2>
          </div>
          <div className="space-y-2">
            {revenueInsights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-primary mt-0.5 shrink-0">→</span>
                <span className="text-muted-foreground">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/creator/posts">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Plus className="h-5 w-5 text-primary" />
              <span className="text-xs">Create Post</span>
            </Button>
          </Link>
          <Link to="/creator/performance-tracker">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-xs">Track Pick</span>
            </Button>
          </Link>

          <Link to="/creator/products">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-xs">New Product</span>
            </Button>
          </Link>
          <Link to="/creator/earnings">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-xs">Earnings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Recent Activity</h2>
      </div>


      {posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center">
          <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">No activity yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-5">
            Create your first post to start engaging your audience.
          </p>
          <Link to="/creator/posts">
            <Button variant="hero" size="sm"><Plus className="mr-1.5 h-3.5 w-3.5" /> Create Post</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <div key={post.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20">
              <div className="min-w-0 flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full shrink-0 ${post.is_premium ? 'bg-primary' : 'bg-muted-foreground/40'}`} />
                <div>
                  <p className="font-medium text-sm truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.is_premium ? 'Premium' : 'Free'} · {format(new Date(post.created_at), 'MMM d')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default CreatorDashboard;
