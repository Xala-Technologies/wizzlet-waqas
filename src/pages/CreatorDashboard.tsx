import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Plus,
  Loader2,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Target,
  Compass,
} from 'lucide-react';
import { format } from 'date-fns';
import { computeWinRate } from '../../convex/lib/results';
import { Seo } from '@/components/Seo';
import { creatorProfilePath } from '@/lib/creatorProfilePath';
import { mapConvexSportEvent, todayBoundsMs } from '@/lib/events';
import {
  GameMatchupCard,
  countPicksForMatchup,
} from '@/components/discover/GameMatchupCard';
import { toast } from 'sonner';

interface PickEntry {
  id: string;
  result: string;
  units_won_lost: number | null;
  units_risked: number;
  sport: string;
  date: string;
  pick_event: string;
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
  const dayBounds = useMemo(() => todayBoundsMs(), []);
  const eventsRaw = useQuery(api.events.queries.listPublishedToday, dayBounds);
  const seedTodayDev = useMutation(api.events.queries.seedTodayDev);

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
        units_risked: p.unitsRisked,
        result: uiPickResult(p.result),
        units_won_lost: p.unitsWonLost ?? null,
      })) as PickEntry[],
    [picksRaw],
  );

  const todaysGames = useMemo(
    () => (eventsRaw ?? []).map(mapConvexSportEvent).slice(0, 6),
    [eventsRaw],
  );

  const subCount = (subs ?? []).filter((s) => s.status === 'active').length;
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
        <p className="text-base text-secondary-foreground">Creator profile not found.</p>
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

  const kpis = [
    { label: 'Subscribers', value: String(subCount) },
    { label: 'Active MRR net', value: `$${activeMrrNet.toFixed(0)}` },
    { label: 'Posts', value: String(postCount) },
    { label: 'Products', value: String(productCount) },
  ];

  const valColor = (v: number) =>
    v > 0 ? 'text-emerald-600 dark:text-emerald-400' : v < 0 ? 'text-destructive' : 'text-secondary-foreground';

  const handleSeedGames = async () => {
    try {
      const res = await seedTodayDev(dayBounds);
      if (res.skipped) {
        toast.message('Today’s slate already has games');
      } else {
        toast.success(`Seeded ${res.inserted} games for today (dev only)`);
      }
    } catch {
      toast.error('Dev seed unavailable — set ALLOW_DEV_ADMIN_GRANT=true on Convex');
    }
  };

  return (
    <DashboardLayout type="creator">
      <Seo
        title="Creator dashboard — Prizelet"
        description="Your Prizelet creator dashboard: games slate, publish tools, and performance."
      />

      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Dashboard
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            )}
          </h1>
          <p className="mt-2 text-base text-secondary-foreground">
            {creatorUsername ? `Welcome back, @${creatorUsername}` : 'Welcome back'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={creatorProfilePath(creator.username)}>View profile</Link>
          </Button>
          <Button asChild>
            <Link to="/creator/posts" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              Publish post
            </Link>
          </Button>
        </div>
      </header>

      {tasks.length > 0 && (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            Next up
          </h2>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.href + t.label}>
                <Link
                  to={t.href}
                  className="inline-flex items-center gap-1.5 text-base font-medium text-foreground hover:text-primary"
                >
                  {t.label}
                  <ArrowRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {kpis.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-sm font-medium text-secondary-foreground">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Today's Games */}
      <section className="mb-8 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Today’s Games</h2>
            <p className="mt-1 text-sm text-secondary-foreground">
              Live slate — your pick counts only (no invented market bars).
            </p>
          </div>
          <Link
            to="/discover#todays-games"
            className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
          >
            Browse games
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {eventsRaw === undefined ? (
          <div className="flex justify-center py-12" aria-busy="true">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : todaysGames.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
            <p className="text-base font-semibold text-foreground">No games published today</p>
            <p className="mt-1 text-sm text-secondary-foreground">
              When the slate is live, matchups appear here with your pick counts.
            </p>
            {import.meta.env.DEV ? (
              <Button type="button" variant="outline" className="mt-5" onClick={() => void handleSeedGames()}>
                Seed today’s slate (dev)
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {todaysGames.map((event) => {
              const yourPickCount = countPicksForMatchup(
                picks.map((p) => ({ pickEvent: p.pick_event, sport: p.sport })),
                event,
              );
              return (
                <li key={event.id} className="list-none">
                  <GameMatchupCard
                    event={event}
                    yourPickCount={yourPickCount}
                    actionHref="/creator/performance-tracker"
                    actionLabel={yourPickCount > 0 ? 'View' : 'Track pick'}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Discover / Publish strip */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-lg font-bold tracking-tight text-foreground">Discover</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-secondary-foreground">
            Browse the public creator directory and today’s full games slate.
          </p>
          <Button asChild variant="outline">
            <Link to="/discover">Open Discover</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="mb-2 flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-lg font-bold tracking-tight text-foreground">Publish</h2>
          </div>
          <p className="mb-4 text-sm leading-relaxed text-secondary-foreground">
            Ship a post or update products and pricing for subscribers.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/creator/posts">Create post</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/creator/products">Products & pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recent posts + performance */}
      <section className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
              Recent posts
            </h2>
            {posts.length > 0 && (
              <Link
                to="/creator/posts"
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
              >
                All posts <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-secondary-foreground" aria-hidden />
              <h3 className="mb-1 text-base font-semibold text-foreground">No posts yet</h3>
              <p className="mx-auto mb-4 max-w-xs text-sm text-secondary-foreground">
                Publish your first post to start engaging subscribers.
              </p>
              <Button asChild size="sm">
                <Link to="/creator/posts">
                  <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Publish
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link
                    to="/creator/posts"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/25"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          post.is_premium ? 'bg-primary' : 'bg-muted-foreground/40'
                        }`}
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{post.title}</p>
                        <p className="text-xs text-secondary-foreground">
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

        <div className="min-w-0">
          {picks.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-secondary-foreground">
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden /> Play performance
                </h2>
                <Link
                  to="/creator/performance-tracker"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
                >
                  Full tracker <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <p className="mb-4 text-xs text-secondary-foreground">
                Tracker picks only — settled Create Post results are separate.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-secondary-foreground">Net</p>
                  <p className={`text-lg font-bold tabular-nums ${valColor(perfStats.totalWonLost)}`}>
                    {perfStats.totalWonLost > 0 ? '+' : ''}
                    {perfStats.totalWonLost.toFixed(1)}u
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-secondary-foreground">Win rate</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{perfStats.winRate}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-secondary-foreground">Picks</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{perfStats.totalPicks}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-6 text-center">
              <Target className="mx-auto mb-3 h-8 w-8 text-secondary-foreground" aria-hidden />
              <h3 className="mb-1 text-base font-semibold text-foreground">Track your plays</h3>
              <p className="mx-auto mb-4 max-w-xs text-sm text-secondary-foreground">
                Log practice picks in Play performance to unlock win rate and ROI.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/creator/performance-tracker">Open tracker</Link>
              </Button>
            </div>
          )}

          {!isVerified && picks.length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Target className="h-4 w-4 shrink-0 text-secondary-foreground" aria-hidden />
                <p className="text-sm font-medium text-foreground">Tracker eligibility</p>
                <span className="text-xs text-secondary-foreground sm:ml-auto">
                  {verification.settled}/{verification.minPicks} settled
                </span>
              </div>
              <Progress value={verification.progress} className="mb-1.5 h-1.5" />
              <p className="text-xs text-secondary-foreground">
                Verified badge is granted by the platform, not automatically.
              </p>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
};

export default CreatorDashboard;
