import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  DollarSign,
  FileText,
  Plus,
  Loader2,
  TrendingUp,
  Package,
  ArrowRight,
  ShieldCheck,
  Lightbulb,
  BarChart3,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import { computeWinRate } from '../../convex/lib/results';

interface PickEntry {
  id: string;
  result: string;
  units_won_lost: number | null;
  units_risked: number;
  sport: string;
  date: string;
}

function uiPickResult(result: string): string {
  if (result === 'won') return 'win';
  if (result === 'lost') return 'loss';
  return result;
}

const CreatorDashboard = () => {
  const creator = useQuery(api.creators.queries.myCreator);
  const subs = useQuery(api.subscriptions.mutations.listForMyCreator);
  const postsRaw = useQuery(api.posts.queries.listMine);
  const products = useQuery(
    api.products.mutations.listByCreator,
    creator ? { creatorId: creator._id } : 'skip',
  );
  const picksRaw = useQuery(api.picks.mutations.listMine);
  const earnings = useQuery(api.creators.earnings.myEarnings);

  const loading =
    creator === undefined ||
    subs === undefined ||
    postsRaw === undefined ||
    picksRaw === undefined ||
    earnings === undefined ||
    (creator !== null && products === undefined);

  const posts = useMemo(
    () =>
      (postsRaw ?? []).slice(0, 5).map((p) => ({
        id: p._id,
        title: p.title,
        is_premium: p.isPremium,
        created_at: new Date(p.createdAt).toISOString(),
      })),
    [postsRaw],
  );

  const picks = useMemo(
    () =>
      (picksRaw ?? []).map((p) => ({
        id: p._id,
        date: p.date,
        pick_event: p.pickEvent,
        sport: p.sport,
        eu_odds: p.euOdds ?? null,
        us_odds: p.usOdds ?? null,
        units_risked: p.unitsRisked,
        result: uiPickResult(p.result),
        units_won_lost: p.unitsWonLost ?? null,
        notes: p.notes ?? null,
      })) as PickEntry[],
    [picksRaw],
  );

  const subCount = (subs ?? []).filter((s) => s.status === 'active').length;
  // Do not invent a $9.99 list price when unset — keep KPI aligned with Next-up tasks.
  const listPriceMrr =
    creator?.monthlyPriceCents != null
      ? (creator.monthlyPriceCents / 100) * subCount
      : 0;
  const activeMrrNet = (earnings?.netCents ?? 0) / 100;
  const postCount = postsRaw?.length ?? 0;
  const productCount = products?.length ?? 0;
  const creatorUsername = creator?.username ?? null;
  const isVerified = creator?.verificationStatus === 'verified';

  const perfStats = useMemo(() => {
    const { wins, winRatePct, decided } = computeWinRate(picks.map((p) => p.result));
    const totalWonLost = picks.reduce((s, p) => s + (p.units_won_lost || 0), 0);
    const decidedPicks = picks.filter((p) => p.result === 'win' || p.result === 'loss');
    const totalRisked = decidedPicks.reduce((s, p) => s + (p.units_risked || 0), 0);
    const roi = totalRisked > 0 ? Math.round((totalWonLost / totalRisked) * 100) : 0;
    return { totalPicks: picks.length, wins, totalWonLost, winRate: winRatePct, roi, settled: decided };
  }, [picks]);

  const verification = useMemo(() => {
    const minPicks = 50;
    const progress = Math.min(100, Math.round((perfStats.settled / minPicks) * 100));
    return { progress, settled: perfStats.settled, minPicks };
  }, [perfStats]);

  const revenueInsights = useMemo(() => {
    const insightsList: string[] = [];
    if (picks.length === 0) return insightsList;

    const sportMap: Record<string, { profit: number; picks: number }> = {};
    picks.forEach((p) => {
      if (!sportMap[p.sport]) sportMap[p.sport] = { profit: 0, picks: 0 };
      sportMap[p.sport].profit += p.units_won_lost || 0;
      sportMap[p.sport].picks++;
    });
    const sportArr = Object.entries(sportMap).sort((a, b) => b[1].profit - a[1].profit);
    if (sportArr.length > 1) {
      insightsList.push(
        `${sportArr[0][0]} picks are your most profitable — focus content here for higher retention.`,
      );
      if (sportArr[sportArr.length - 1][1].profit < 0) {
        insightsList.push(
          `${sportArr[sportArr.length - 1][0]} is losing money — consider reducing picks in this sport.`,
        );
      }
    }

    // `posts` is the recent slice (max 5) — label insight honestly.
    const premiumPosts = posts.filter((p) => p.is_premium);
    const freePosts = posts.filter((p) => !p.is_premium);
    if (premiumPosts.length > 0 && freePosts.length > 0) {
      insightsList.push(
        'Among your recent posts, you mix premium and free — free posts can funnel new subscribers.',
      );
    }

    if (subCount > 0 && perfStats.winRate > 55) {
      insightsList.push(
        'Your high win rate is a selling point — highlight it in your profile to attract more subscribers.',
      );
    }

    if (insightsList.length === 0) insightsList.push('Track more picks to unlock revenue insights.');
    return insightsList;
  }, [picks, posts, subCount, perfStats]);

  if (loading) {
    return (
      <DashboardLayout type="creator">
        <div className="flex justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!creator) {
    return (
      <DashboardLayout type="creator">
        <p className="text-support text-muted-foreground">Creator profile not found.</p>
      </DashboardLayout>
    );
  }

  const pendingPosts = (postsRaw ?? []).filter((p) => !p.result || p.result === 'pending').length;
  const tasks: { href: string; label: string }[] = [];
  if (!creator.isPublished) {
    tasks.push({ href: '/creator/onboarding', label: 'Finish setup and publish your profile' });
  }
  if (!creator.monthlyPriceCents && productCount === 0) {
    tasks.push({ href: '/creator/products', label: 'Set a subscription price or product' });
  }
  if (pendingPosts > 0) {
    tasks.push({
      href: '/creator/posts',
      label: `${pendingPosts} published pick${pendingPosts === 1 ? '' : 's'} still pending settlement`,
    });
  }
  if (!creator.stripeAccountId) {
    tasks.push({ href: '/creator/payouts', label: 'Complete payout setup' });
  }

  const stats = [
    { label: 'Subscribers', value: subCount.toString(), icon: Users, color: 'text-blue-400' },
    {
      label: 'Active MRR net',
      value: `$${activeMrrNet.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-emerald-400',
    },
    {
      label: 'List-price MRR est.',
      value: `$${listPriceMrr.toFixed(0)}`,
      icon: TrendingUp,
      color: 'text-muted-foreground',
    },
    { label: 'Total Posts', value: postCount.toString(), icon: FileText, color: 'text-purple-400' },
    { label: 'Products', value: productCount.toString(), icon: Package, color: 'text-amber-400' },
  ];

  const valColor = (v: number) =>
    v > 0 ? 'text-emerald-400' : v < 0 ? 'text-destructive' : 'text-muted-foreground';

  const quickActions = [
    { href: '/creator/posts', label: 'Create Post', icon: Plus },
    { href: '/creator/performance-tracker', label: 'Track Pick', icon: Target },
    { href: '/creator/products', label: 'New Product', icon: Package },
    { href: '/creator/earnings', label: 'Earnings', icon: DollarSign },
  ] as const;

  return (
    <DashboardLayout type="creator">
      {/* 1. Page header */}
      <header className="mb-6">
        <h1 className="text-heading md:text-heading-lg font-bold text-foreground flex flex-wrap items-center gap-2">
          Overview
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-caption font-medium text-emerald-400 bg-emerald-500/10 rounded-full px-2.5 py-0.5 border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </h1>
        <p className="text-support text-muted-foreground mt-1">
          Welcome back{creatorUsername ? `, @${creatorUsername}` : ''}
          {' · '}
          <Link to="/creator/earnings" className="text-primary hover:underline">
            Earnings
          </Link>
          {' · '}
          <Link to="/creator/payouts" className="text-primary hover:underline">
            Payouts
          </Link>
        </p>
      </header>

      {/* 2. Next up */}
      {tasks.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 mb-6">
          <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Next up
          </h2>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.href + t.label}>
                <Link
                  to={t.href}
                  className="text-ui text-primary hover:underline inline-flex items-center gap-1"
                >
                  {t.label}
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. Summary strip */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/20 ${
              index === stats.length - 1 ? 'col-span-2 lg:col-span-1' : ''
            }`}
          >
            <stat.icon className={`h-4 w-4 mb-2 ${stat.color}`} aria-hidden />
            <p className="text-title-lg font-bold text-foreground tabular-nums">{stat.value}</p>
            <p className="text-caption text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* 4. Primary workspace: actions + recent activity */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="min-w-0">
          <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href} className="min-w-0">
                <Button
                  variant="outline"
                  className="w-full h-auto min-h-11 py-3 flex-col gap-1.5 text-ui"
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="text-support">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
              Recent activity
            </h2>
            {posts.length > 0 && (
              <Link
                to="/creator/posts"
                className="text-caption text-primary hover:underline inline-flex items-center gap-1"
              >
                All posts <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-title font-semibold text-foreground mb-1">No activity yet</h3>
              <p className="text-support text-muted-foreground max-w-xs mx-auto mb-4">
                Create your first post to start engaging your audience.
              </p>
              <Link to="/creator/posts">
                <Button variant="default" size="sm" className="min-h-11">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Post
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    to="/creator/posts"
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3 sm:p-4 transition-colors hover:border-primary/20"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          post.is_premium ? 'bg-primary' : 'bg-muted-foreground/40'
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-ui truncate text-foreground">{post.title}</p>
                        <p className="text-caption text-muted-foreground">
                          {post.is_premium ? 'Premium' : 'Free'} ·{' '}
                          {format(new Date(post.created_at), 'MMM d')}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 5. Secondary: tracker / verification / insights */}
      {picks.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" /> Tracker performance (practice picks)
            </h2>
            <Link
              to="/creator/performance-tracker"
              className="text-caption text-primary hover:underline inline-flex items-center gap-1"
            >
              Full tracker <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-caption text-muted-foreground mb-3">
            Win rate here uses Performance Tracker picks. Settled results on Create Post are tracked
            separately.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground uppercase tracking-wide">Net Profit</p>
              <p className={`text-title font-bold tabular-nums ${valColor(perfStats.totalWonLost)}`}>
                {perfStats.totalWonLost > 0 ? '+' : ''}
                {perfStats.totalWonLost.toFixed(1)}u
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground uppercase tracking-wide">Win Rate</p>
              <p className="text-title font-bold tabular-nums text-foreground">{perfStats.winRate}%</p>
            </div>
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground uppercase tracking-wide">ROI</p>
              <p className={`text-title font-bold tabular-nums ${valColor(perfStats.roi)}`}>
                {perfStats.roi >= 0 ? '+' : ''}
                {perfStats.roi}%
              </p>
            </div>
            <div className="min-w-0">
              <p className="text-caption text-muted-foreground uppercase tracking-wide">Total Picks</p>
              <p className="text-title font-bold tabular-nums text-foreground">{perfStats.totalPicks}</p>
            </div>
            <div className="min-w-0 col-span-2 sm:col-span-1">
              <p className="text-caption text-muted-foreground uppercase tracking-wide">Wins</p>
              <p className="text-title font-bold tabular-nums text-emerald-400">{perfStats.wins}</p>
            </div>
          </div>
        </section>
      )}

      {!isVerified && picks.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-ui font-medium text-foreground">Tracker eligibility progress</p>
            <span className="text-caption text-muted-foreground sm:ml-auto">
              {verification.settled}/{verification.minPicks} settled picks
            </span>
          </div>
          <Progress value={verification.progress} className="h-1.5 mb-1.5" />
          <p className="text-caption text-muted-foreground">
            Track more settled picks in Performance Tracker. The Verified badge is granted by the
            platform, not automatically.
          </p>
        </section>
      )}

      {revenueInsights.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 mb-2">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-4 w-4 text-primary shrink-0" />
            <h2 className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
              Revenue insights
            </h2>
          </div>
          <ul className="space-y-2">
            {revenueInsights.map((insight) => (
              <li key={insight} className="flex items-start gap-2 text-support text-muted-foreground">
                <span className="text-primary mt-0.5 shrink-0" aria-hidden>
                  →
                </span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </DashboardLayout>
  );
};

export default CreatorDashboard;
